import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { puedeAprobar, userKeyOf, userNameOf } from '@/lib/marcacion/server';

/** accion: aprobar | rechazar (encargado, solo PENDIENTE; no sobre lo propio) | cancelar (dueño si está pendiente; encargado siempre) */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const s = await requireAuth();
  if (s instanceof NextResponse) return s;
  const b = await request.json().catch(() => ({}));
  const a = await prisma.ausencia.findUnique({ where: { id: params.id } });
  if (!a) return NextResponse.json({ error: 'No encontrada' }, { status: 404 });
  const aprueba = puedeAprobar(s.role);
  const dueno = a.userKey === userKeyOf(s);

  if (b.accion === 'cancelar') {
    if (!(aprueba || (dueno && a.estado === 'PENDIENTE'))) return NextResponse.json({ error: 'Sin permiso' }, { status: 403 });
    if (a.estado === 'RECHAZADA' || a.estado === 'CANCELADA') return NextResponse.json({ error: 'Ya está cerrada' }, { status: 409 });
    await prisma.ausencia.update({ where: { id: a.id }, data: { estado: 'CANCELADA', revisorName: userNameOf(s), revisadoAt: new Date() } });
    return NextResponse.json({ ok: true });
  }
  if (b.accion !== 'aprobar' && b.accion !== 'rechazar') return NextResponse.json({ error: 'Acción inválida' }, { status: 400 });
  if (!aprueba) return NextResponse.json({ error: 'Sin permiso' }, { status: 403 });
  if (dueno) return NextResponse.json({ error: 'No podés resolver tu propia solicitud' }, { status: 403 });
  const motivo = typeof b.motivo === 'string' ? b.motivo.trim().slice(0, 200) : '';
  if (b.accion === 'rechazar' && !motivo) return NextResponse.json({ error: 'Indicá el motivo del rechazo' }, { status: 400 });
  const upd = await prisma.ausencia.updateMany({
    where: { id: a.id, estado: 'PENDIENTE' },
    data: { estado: b.accion === 'aprobar' ? 'APROBADA' : 'RECHAZADA', revisorName: userNameOf(s), revisorMotivo: motivo, revisadoAt: new Date() },
  });
  if (upd.count === 0) return NextResponse.json({ error: 'La solicitud ya fue resuelta' }, { status: 409 });
  return NextResponse.json({ ok: true });
}
