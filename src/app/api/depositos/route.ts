import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { parseBody } from '@/lib/schemas';
import { DepositoSchema } from '@/lib/depositos';
import { resolverEncargado } from '@/lib/depositos-mov';

export const dynamic = 'force-dynamic';

/** Lista de depósitos con la cantidad de artículos y cuántos están bajo el mínimo. */
export async function GET() {
  const a = await requireRole('canManageInventory');
  if (a instanceof NextResponse) return a;
  const [deps, items] = await Promise.all([
    prisma.deposito.findMany({ orderBy: [{ activo: 'desc' }, { nombre: 'asc' }] }),
    prisma.itemInventario.findMany({ where: { activo: true }, select: { depositoId: true, cantidad: true, stockMinimo: true } }),
  ]);
  const res = deps.map(d => {
    const its = items.filter(i => i.depositoId === d.id);
    return { ...d, createdAt: d.createdAt.toISOString(), updatedAt: d.updatedAt.toISOString(), articulos: its.length, bajoStock: its.filter(i => Number(i.stockMinimo) > 0 && Number(i.cantidad) <= Number(i.stockMinimo)).length };
  });
  return NextResponse.json(res);
}

export async function POST(request: NextRequest) {
  const a = await requireRole('canManageInventory');
  if (a instanceof NextResponse) return a;
  const p = await parseBody(request, DepositoSchema);
  if (p.error) return p.error;
  const dup = await prisma.deposito.findFirst({ where: { nombre: { equals: p.data.nombre, mode: 'insensitive' } } });
  if (dup) return NextResponse.json({ error: 'Ya existe un depósito con ese nombre' }, { status: 409 });
  const enc = await resolverEncargado(p.data.responsableId);
  if ('error' in enc) return NextResponse.json({ error: enc.error }, { status: 400 });
  const d = await prisma.deposito.create({ data: { nombre: p.data.nombre, direccion: p.data.direccion ?? '', ...enc, notas: p.data.notas ?? '' } });
  return NextResponse.json(d, { status: 201 });
}
