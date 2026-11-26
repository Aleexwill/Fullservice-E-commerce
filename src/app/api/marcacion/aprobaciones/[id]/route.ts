import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { userKeyOf, userNameOf } from '@/lib/marcacion/server';
import { EPP_ITEMS } from '@/lib/marcacion/shared';

/** El encargado aprueba o rechaza la foto de EPP. Aprobar exige todos los elementos confirmados. */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole('canAprobarPresupuestos');
  if (auth instanceof NextResponse) return auth;
  try {
    const body = await request.json();
    const accion = body?.accion;
    if (accion !== 'aprobar' && accion !== 'rechazar') return NextResponse.json({ error: 'Acción inválida' }, { status: 400 });

    const revisado: Record<string, boolean> = {};
    for (const it of EPP_ITEMS) revisado[it.key] = body.revisado?.[it.key] === true;
    const faltan = EPP_ITEMS.filter(it => !revisado[it.key]).map(it => it.label.toLowerCase());

    let motivo = '';
    if (accion === 'aprobar') {
      if (faltan.length) return NextResponse.json({ error: `No se puede aprobar: falta ${faltan.join(', ')}` }, { status: 422 });
    } else {
      motivo = (typeof body.motivo === 'string' ? body.motivo.trim().slice(0, 140) : '') || (faltan.length ? `Falta: ${faltan.join(', ')}` : '');
      if (!motivo) return NextResponse.json({ error: 'Indicá el motivo del rechazo' }, { status: 400 });
    }

    const estado = accion === 'aprobar' ? 'APROBADA' : 'RECHAZADA';
    // Decisión atómica: solo si sigue PENDIENTE y la jornada sigue esperando en el lugar
    const ok = await prisma.$transaction(async tx => {
      const epp = await tx.verificacionEpp.findUnique({ where: { id: params.id }, include: { jornada: true } });
      if (!epp || epp.estado !== 'PENDIENTE' || epp.jornada.estado !== 'EN_LUGAR') return false;
      if (epp.jornada.userKey === userKeyOf(auth)) throw new Error('PROPIO'); // nadie aprueba su propia foto
      const upd = await tx.verificacionEpp.updateMany({
        where: { id: epp.id, estado: 'PENDIENTE' },
        data: { estado, motivo, revisado, revisorId: auth.userId ?? null, revisorName: userNameOf(auth), revisadoAt: new Date() },
      });
      if (upd.count === 0) return false;
      if (accion === 'aprobar') {
        await tx.jornada.update({ where: { id: epp.jornadaId }, data: { estado: 'TRABAJANDO' } });
      }
      return true;
    });
    if (!ok) return NextResponse.json({ error: 'La solicitud ya fue resuelta' }, { status: 409 });
    return NextResponse.json({ ok: true, estado });
  } catch (e) {
    if (e instanceof Error && e.message === 'PROPIO') return NextResponse.json({ error: 'No podés aprobar tu propia foto' }, { status: 403 });
    console.error('POST /api/marcacion/aprobaciones/[id]:', e);
    return NextResponse.json({ error: 'Error al resolver la solicitud' }, { status: 500 });
  }
}
