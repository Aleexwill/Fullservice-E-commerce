import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { parseBody } from '@/lib/schemas';
import { ItemPatchSchema, toItemDTO } from '@/lib/depositos';

/** Edita los datos del artículo. La cantidad y el depósito cambian solo con movimientos y traslados. */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const a = await requireRole('canManageInventory');
  if (a instanceof NextResponse) return a;
  const p = await parseBody(request, ItemPatchSchema);
  if (p.error) return p.error;
  const it = await prisma.itemInventario.findUnique({ where: { id: params.id } });
  if (!it) return NextResponse.json({ error: 'Artículo no encontrado' }, { status: 404 });
  const d = p.data;
  if (d.codigo) {
    const dup = await prisma.itemInventario.findFirst({ where: { id: { not: it.id }, depositoId: it.depositoId, codigo: { equals: d.codigo, mode: 'insensitive' } } });
    if (dup) return NextResponse.json({ error: 'Ya hay un artículo con ese código en el depósito' }, { status: 409 });
  }
  const r = await prisma.itemInventario.update({ where: { id: it.id }, data: d, include: { deposito: { select: { nombre: true } } } });
  return NextResponse.json(toItemDTO(r));
}

/** Se borra el artículo pero su historial de movimientos se conserva. No se puede con un traslado en tránsito. */
export async function DELETE(_r: NextRequest, { params }: { params: { id: string } }) {
  const a = await requireRole('canManageInventory');
  if (a instanceof NextResponse) return a;
  const enTransito = await prisma.traslado.count({ where: { itemId: params.id, estado: 'EN_TRANSITO' } });
  if (enTransito) return NextResponse.json({ error: 'Tiene un traslado en tránsito: recibilo o cancelalo primero' }, { status: 409 });
  const r = await prisma.itemInventario.deleteMany({ where: { id: params.id } });
  if (!r.count) return NextResponse.json({ error: 'Artículo no encontrado' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
