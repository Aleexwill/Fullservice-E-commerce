import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { parseBody } from '@/lib/schemas';
import { TrasladoSchema } from '@/lib/depositos';
import { crearTraslado, respuestaError } from '@/lib/depositos-mov';

export const dynamic = 'force-dynamic';

/** Traslados. Filtros: estado (EN_TRANSITO | RECIBIDO | CANCELADO), depositoId (origen o destino). */
export async function GET(request: NextRequest) {
  const a = await requireRole('canManageInventory');
  if (a instanceof NextResponse) return a;
  const sp = new URL(request.url).searchParams;
  const where: Prisma.TrasladoWhereInput = {};
  const estado = sp.get('estado'); if (estado && ['EN_TRANSITO', 'RECIBIDO', 'CANCELADO'].includes(estado)) where.estado = estado;
  const dep = sp.get('depositoId'); if (dep) where.OR = [{ origenId: dep }, { destinoId: dep }];
  const rows = await prisma.traslado.findMany({ where, include: { origen: { select: { nombre: true } }, destino: { select: { nombre: true } } }, orderBy: { createdAt: 'desc' }, take: 200 });
  return NextResponse.json(rows.map(t => ({
    id: t.id, numero: t.numero, itemId: t.itemId, itemNombre: t.itemNombre, codigo: t.codigo, unidad: t.unidad, cantidad: Number(t.cantidad),
    origenId: t.origenId, origen: t.origen.nombre, destinoId: t.destinoId, destino: t.destino.nombre, estado: t.estado, motivo: t.motivo, nota: t.nota,
    creadoPor: t.creadoPor, resueltoPor: t.resueltoPor, createdAt: t.createdAt.toISOString(), resueltoAt: t.resueltoAt?.toISOString() ?? null,
  })));
}

/** Crea un traslado: el stock sale del origen y queda en tránsito hasta que el destino confirme la recepción. */
export async function POST(request: NextRequest) {
  const a = await requireRole('canManageInventory');
  if (a instanceof NextResponse) return a;
  const p = await parseBody(request, TrasladoSchema);
  if (p.error) return p.error;
  try {
    const t = await crearTraslado(p.data, a.displayName ?? a.username);
    return NextResponse.json(t, { status: 201 });
  } catch (e) { const x = respuestaError(e); return NextResponse.json({ error: x.error }, { status: x.status }); }
}
