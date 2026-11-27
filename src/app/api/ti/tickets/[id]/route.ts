import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { parseBody } from '@/lib/schemas';
import { ActualizarTicketSchema, ESTADO_LABEL, PRIORIDAD_LABEL, esTI, quienEs, transicionSolicitante } from '@/lib/ti/tickets';

export const dynamic = 'force-dynamic';
type Ctx = { params: { id: string } };

async function cargar(id: string, ti: boolean, yoId: string) {
  const t = await prisma.ticket.findUnique({
    where: { id },
    include: { comentarios: { orderBy: { createdAt: 'asc' } }, eventos: { orderBy: { createdAt: 'asc' } } },
  });
  if (!t || (!ti && t.solicitanteId !== yoId)) return null; // quien no es TI no distingue "no existe" de "no es suyo"
  if (!ti) {
    t.comentarios = t.comentarios.filter(c => !c.interno);
    t.eventos = t.eventos.filter(e => e.tipo !== 'COMENTARIO_INTERNO');
  }
  return t;
}

export async function GET(_r: NextRequest, { params }: Ctx) {
  const a = await requireRole('canUseTickets');
  if (a instanceof NextResponse) return a;
  const t = await cargar(params.id, await esTI(a), quienEs(a).id);
  if (!t) return NextResponse.json({ error: 'Ticket no encontrado' }, { status: 404 });
  return NextResponse.json({ ...t, esTI: await esTI(a), esMio: t.solicitanteId === quienEs(a).id });
}

/** TI cambia estado, prioridad, asignación y resolución. El solicitante solo confirma, reabre o cancela (si nadie lo tomó). */
export async function PATCH(request: NextRequest, { params }: Ctx) {
  const a = await requireRole('canUseTickets');
  if (a instanceof NextResponse) return a;
  const ti = await esTI(a);
  const yo = quienEs(a);
  const p = await parseBody(request, ActualizarTicketSchema);
  if (p.error) return p.error;
  const d = p.data;
  const t = await prisma.ticket.findUnique({ where: { id: params.id } });
  if (!t || (!ti && t.solicitanteId !== yo.id)) return NextResponse.json({ error: 'Ticket no encontrado' }, { status: 404 });

  if (!ti) {
    if (d.prioridad !== undefined || d.asignadoId !== undefined || d.resolucion !== undefined) return NextResponse.json({ error: 'Sin permiso para cambiar eso' }, { status: 403 });
    if (!d.estado || !transicionSolicitante(t.estado, d.estado)) return NextResponse.json({ error: 'Ese cambio de estado no está permitido' }, { status: 403 });
  }

  const data: Record<string, unknown> = {};
  const eventos: { tipo: string; detalle: string }[] = [];
  if (d.estado && d.estado !== t.estado) {
    data.estado = d.estado;
    if (d.estado === 'RESUELTO') data.resueltoAt = new Date();
    if (d.estado === 'CERRADO') data.cerradoAt = new Date();
    if (['EN_CURSO', 'NUEVO'].includes(d.estado)) { data.cerradoAt = null; if (t.estado === 'RESUELTO' || t.estado === 'CERRADO') data.resueltoAt = null; }
    const tipoEv = !ti ? (t.estado === 'NUEVO' ? 'CANCELADO' : d.estado === 'CERRADO' ? 'CONFIRMADO' : 'REABIERTO') : 'ESTADO';
    eventos.push({ tipo: tipoEv, detalle: `${ESTADO_LABEL[t.estado]} → ${ESTADO_LABEL[d.estado]}` });
  }
  if (ti) {
    if (d.prioridad && d.prioridad !== t.prioridad) { data.prioridad = d.prioridad; eventos.push({ tipo: 'PRIORIDAD', detalle: `${PRIORIDAD_LABEL[t.prioridad]} → ${PRIORIDAD_LABEL[d.prioridad]}` }); }
    if (d.resolucion !== undefined && d.resolucion !== t.resolucion) data.resolucion = d.resolucion;
    if (d.asignadoId !== undefined && d.asignadoId !== t.asignadoId) {
      if (d.asignadoId === null || d.asignadoId === '') { data.asignadoId = null; data.asignado = ''; eventos.push({ tipo: 'ASIGNADO', detalle: 'Sin asignar' }); }
      else {
        const u = await prisma.user.findFirst({ where: { id: d.asignadoId, isActive: true }, select: { id: true, name: true } });
        if (!u) return NextResponse.json({ error: 'Usuario no válido' }, { status: 400 });
        data.asignadoId = u.id; data.asignado = u.name; eventos.push({ tipo: 'ASIGNADO', detalle: `Asignado a ${u.name}` });
      }
    }
  }
  if (!Object.keys(data).length) return NextResponse.json({ ok: true, sinCambios: true });
  await prisma.ticket.update({ where: { id: t.id }, data: { ...data, eventos: { create: eventos.map(e => ({ ...e, autorId: yo.id, autor: yo.nombre })) } } });
  return NextResponse.json({ ok: true });
}
