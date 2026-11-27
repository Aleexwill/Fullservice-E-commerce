import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { parseBody } from '@/lib/schemas';
import { MovimientoSchema } from '@/lib/depositos';
import { moverStock, respuestaError } from '@/lib/depositos-mov';

export const dynamic = 'force-dynamic';
const TIPOS = ['ENTRADA', 'SALIDA', 'AJUSTE', 'TRASLADO_SALIDA', 'TRASLADO_ENTRADA', 'TRASLADO_ANULADO'];

/** Historial. Filtros: itemId, depositoId, tipo, desde/hasta (YYYY-MM-DD), q (artículo, motivo, referencia, usuario). Más recientes primero; `antes` (ISO) para paginar. */
export async function GET(request: NextRequest) {
  const a = await requireRole('canManageInventory');
  if (a instanceof NextResponse) return a;
  const sp = new URL(request.url).searchParams;
  const where: Prisma.MovimientoInventarioWhereInput = {};
  const itemId = sp.get('itemId'); if (itemId) where.itemId = itemId;
  const dep = sp.get('depositoId'); if (dep) where.depositoId = dep;
  const tipo = sp.get('tipo'); if (tipo && TIPOS.includes(tipo)) where.tipo = tipo;
  const rango: Prisma.DateTimeFilter = {};
  const desde = sp.get('desde'), hasta = sp.get('hasta'), antes = sp.get('antes');
  if (desde && /^\d{4}-\d{2}-\d{2}$/.test(desde)) rango.gte = new Date(`${desde}T00:00:00-03:00`);
  if (hasta && /^\d{4}-\d{2}-\d{2}$/.test(hasta)) rango.lt = new Date(new Date(`${hasta}T00:00:00-03:00`).getTime() + 86_400_000);
  if (antes && !Number.isNaN(Date.parse(antes))) rango.lt = new Date(Math.min(rango.lt ? (rango.lt as Date).getTime() : Infinity, Date.parse(antes)));
  if (Object.keys(rango).length) where.createdAt = rango;
  const q = sp.get('q')?.trim().slice(0, 80);
  if (q) where.OR = ['itemNombre', 'motivo', 'referencia', 'usuario', 'destinatario', 'codigo'].map(k => ({ [k]: { contains: q, mode: 'insensitive' } })) as Prisma.MovimientoInventarioWhereInput[];
  const rows = await prisma.movimientoInventario.findMany({ where, orderBy: { createdAt: 'desc' }, take: 101 });
  const hayMas = rows.length > 100;
  const items = rows.slice(0, 100).map(m => ({ ...m, delta: Number(m.delta), saldo: Number(m.saldo), createdAt: m.createdAt.toISOString() }));
  return NextResponse.json({ items, hayMas, siguiente: hayMas ? items[items.length - 1].createdAt : null });
}

/** Registra una entrada, salida o ajuste de conteo. Nunca deja el stock negativo. */
export async function POST(request: NextRequest) {
  const a = await requireRole('canManageInventory');
  if (a instanceof NextResponse) return a;
  const p = await parseBody(request, MovimientoSchema);
  if (p.error) return p.error;
  try {
    const r = await moverStock(p.data, a.displayName ?? a.username);
    return NextResponse.json(r, { status: 201 });
  } catch (e) { const x = respuestaError(e); return NextResponse.json({ error: x.error }, { status: x.status }); }
}
