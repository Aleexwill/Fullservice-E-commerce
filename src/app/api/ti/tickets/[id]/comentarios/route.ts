import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { parseBody } from '@/lib/schemas';
import { rateLimit } from '@/lib/rate-limit';
import { ComentarSchema, esTI, quienEs } from '@/lib/ti/tickets';

export const dynamic = 'force-dynamic';

/** Agrega un comentario. Las notas internas solo las crea y las ve TI. */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const a = await requireRole('canUseTickets');
  if (a instanceof NextResponse) return a;
  const ti = await esTI(a);
  const yo = quienEs(a);
  if (!rateLimit(`ticket-com:${yo.id}`, 60, 3_600_000).allowed) return NextResponse.json({ error: 'Demasiados comentarios en poco tiempo' }, { status: 429 });
  const p = await parseBody(request, ComentarSchema);
  if (p.error) return p.error;
  const t = await prisma.ticket.findUnique({ where: { id: params.id }, select: { id: true, solicitanteId: true, estado: true } });
  if (!t || (!ti && t.solicitanteId !== yo.id)) return NextResponse.json({ error: 'Ticket no encontrado' }, { status: 404 });
  const interno = ti && p.data.interno === true;
  // Un comentario del solicitante en un ticket esperando información lo devuelve a TI.
  const vuelve = !ti && t.estado === 'ESPERANDO_INFO';
  await prisma.ticket.update({
    where: { id: t.id },
    data: {
      ...(vuelve ? { estado: 'EN_ANALISIS' } : {}),
      comentarios: { create: { autorId: yo.id, autor: yo.nombre, texto: p.data.texto, interno, adjuntos: p.data.adjuntos ?? [] } },
      eventos: { create: [{ tipo: interno ? 'COMENTARIO_INTERNO' : 'COMENTARIO', detalle: p.data.texto.slice(0, 140), autorId: yo.id, autor: yo.nombre }, ...(vuelve ? [{ tipo: 'ESTADO', detalle: 'Esperando información → En análisis', autorId: yo.id, autor: yo.nombre }] : [])] },
    },
  });
  return NextResponse.json({ ok: true }, { status: 201 });
}
