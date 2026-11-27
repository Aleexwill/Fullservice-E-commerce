import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { parseBody } from '@/lib/schemas';
import { ItemPatchSchema, toItemDTO } from '@/lib/depositos';

/** Edita un artículo. Cambiar depositoId lo mueve a otro depósito. */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const a = await requireRole('canManageInventory');
  if (a instanceof NextResponse) return a;
  const p = await parseBody(request, ItemPatchSchema);
  if (p.error) return p.error;
  const it = await prisma.itemInventario.findUnique({ where: { id: params.id } });
  if (!it) return NextResponse.json({ error: 'Artículo no encontrado' }, { status: 404 });
  const d = p.data;
  if (d.depositoId && d.depositoId !== it.depositoId) {
    const dep = await prisma.deposito.findUnique({ where: { id: d.depositoId }, select: { activo: true } });
    if (!dep?.activo) return NextResponse.json({ error: 'El depósito no existe o está desactivado' }, { status: 400 });
  }
  const codigo = d.codigo ?? it.codigo, depId = d.depositoId ?? it.depositoId;
  if (codigo && (d.codigo !== undefined || d.depositoId)) {
    const dup = await prisma.itemInventario.findFirst({ where: { id: { not: it.id }, depositoId: depId, codigo: { equals: codigo, mode: 'insensitive' } } });
    if (dup) return NextResponse.json({ error: 'Ya hay un artículo con ese código en el depósito' }, { status: 409 });
  }
  const r = await prisma.itemInventario.update({ where: { id: it.id }, data: d, include: { deposito: { select: { nombre: true } } } });
  return NextResponse.json(toItemDTO(r));
}

export async function DELETE(_r: NextRequest, { params }: { params: { id: string } }) {
  const a = await requireRole('canManageInventory');
  if (a instanceof NextResponse) return a;
  const r = await prisma.itemInventario.deleteMany({ where: { id: params.id } });
  if (!r.count) return NextResponse.json({ error: 'Artículo no encontrado' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
