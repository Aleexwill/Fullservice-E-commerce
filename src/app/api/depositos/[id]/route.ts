import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { parseBody } from '@/lib/schemas';
import { DepositoSchema } from '@/lib/depositos';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const a = await requireRole('canManageInventory');
  if (a instanceof NextResponse) return a;
  const p = await parseBody(request, DepositoSchema.partial());
  if (p.error) return p.error;
  const d = await prisma.deposito.findUnique({ where: { id: params.id } });
  if (!d) return NextResponse.json({ error: 'Depósito no encontrado' }, { status: 404 });
  if (p.data.nombre) {
    const dup = await prisma.deposito.findFirst({ where: { id: { not: d.id }, nombre: { equals: p.data.nombre, mode: 'insensitive' } } });
    if (dup) return NextResponse.json({ error: 'Ya existe un depósito con ese nombre' }, { status: 409 });
  }
  const r = await prisma.deposito.update({ where: { id: d.id }, data: p.data });
  return NextResponse.json(r);
}

/** Solo se elimina un depósito vacío; si tiene artículos hay que moverlos o desactivarlo. */
export async function DELETE(_r: NextRequest, { params }: { params: { id: string } }) {
  const a = await requireRole('canManageInventory');
  if (a instanceof NextResponse) return a;
  const traslados = await prisma.traslado.count({ where: { OR: [{ origenId: params.id }, { destinoId: params.id }] } });
  if (traslados) return NextResponse.json({ error: 'El depósito tiene traslados registrados: no se puede eliminar, desactivalo' }, { status: 409 });
  const n = await prisma.itemInventario.count({ where: { depositoId: params.id } });
  if (n > 0) return NextResponse.json({ error: `El depósito tiene ${n} artículo(s). Movelos a otro depósito o desactivalo.` }, { status: 409 });
  const r = await prisma.deposito.deleteMany({ where: { id: params.id } });
  if (!r.count) return NextResponse.json({ error: 'Depósito no encontrado' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
