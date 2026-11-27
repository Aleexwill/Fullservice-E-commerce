import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { parseBody } from '@/lib/schemas';
import { rateLimit } from '@/lib/rate-limit';
import { CrearTicketSchema, ESTADOS, ESTADOS_ABIERTOS, PRIORIDADES, TIPOS, esTI, quienEs } from '@/lib/ti/tickets';

export const dynamic = 'force-dynamic';

const LISTA = { id: true, numero: true, tipo: true, titulo: true, modulo: true, prioridad: true, estado: true, solicitante: true, solicitanteId: true, asignado: true, createdAt: true, updatedAt: true } as const;

/** Lista de tickets. TI ve todos; el resto, solo los que pidió. Filtros: estado (o "abiertos"), tipo, prioridad, q, mios, sinAsignar. */
export async function GET(request: NextRequest) {
  const a = await requireRole('canUseTickets');
  if (a instanceof NextResponse) return a;
  const ti = await esTI(a);
  const yo = quienEs(a);
  const sp = new URL(request.url).searchParams;
  const where: Prisma.TicketWhereInput = {};
  if (!ti || sp.get('mios') === '1') where.solicitanteId = yo.id;
  const estado = sp.get('estado');
  if (estado === 'abiertos') where.estado = { in: [...ESTADOS_ABIERTOS] };
  else if (estado && (ESTADOS as readonly string[]).includes(estado)) where.estado = estado;
  const tipo = sp.get('tipo'); if (tipo && (TIPOS as readonly string[]).includes(tipo)) where.tipo = tipo;
  const prio = sp.get('prioridad'); if (prio && (PRIORIDADES as readonly string[]).includes(prio)) where.prioridad = prio;
  if (ti && sp.get('sinAsignar') === '1') where.asignadoId = null;
  const q = sp.get('q')?.trim().slice(0, 80);
  if (q) {
    const n = /^#?\d+$/.test(q) ? Number(q.replace('#', '')) : null;
    where.OR = [{ titulo: { contains: q, mode: 'insensitive' } }, { descripcion: { contains: q, mode: 'insensitive' } }, ...(n !== null && n < 2_000_000_000 ? [{ numero: n }] : [])];
  }
  const [items, conteo] = await Promise.all([
    prisma.ticket.findMany({ where, select: LISTA, orderBy: [{ updatedAt: 'desc' }], take: 200 }),
    prisma.ticket.groupBy({ by: ['estado'], where: ti ? {} : { solicitanteId: yo.id }, _count: { _all: true } }),
  ]);
  return NextResponse.json({ items, conteo: Object.fromEntries(conteo.map(c => [c.estado, c._count._all])), esTI: ti });
}

/** Crea un ticket. Solo roles con el permiso de tickets. */
export async function POST(request: NextRequest) {
  const a = await requireRole('canUseTickets');
  if (a instanceof NextResponse) return a;
  const yo = quienEs(a);
  if (!rateLimit(`ticket:${yo.id}`, 15, 3_600_000).allowed) return NextResponse.json({ error: 'Creaste muchos tickets en poco tiempo. Probá más tarde.' }, { status: 429 });
  const p = await parseBody(request, CrearTicketSchema);
  if (p.error) return p.error;
  const d = p.data;
  const t = await prisma.ticket.create({
    data: {
      tipo: d.tipo, titulo: d.titulo, descripcion: d.descripcion, modulo: d.modulo ?? '', pantalla: d.pantalla ?? '', pasos: d.pasos ?? '', esperado: d.esperado ?? '',
      prioridad: d.prioridad ?? 'MEDIA', navegador: d.navegador ?? '', adjuntos: d.adjuntos ?? [], solicitanteId: yo.id, solicitante: yo.nombre,
      eventos: { create: { tipo: 'CREADO', detalle: d.titulo, autorId: yo.id, autor: yo.nombre } },
    },
    select: { id: true, numero: true },
  });
  return NextResponse.json(t, { status: 201 });
}
