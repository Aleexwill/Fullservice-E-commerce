import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { parseBody } from '@/lib/schemas';
import { ItemSchema, toItemDTO } from '@/lib/depositos';

export const dynamic = 'force-dynamic';

/** Artículos. Filtros: depositoId, q (nombre/código/categoría), bajoStock=1, inactivos=1. */
export async function GET(request: NextRequest) {
  const a = await requireRole('canManageInventory');
  if (a instanceof NextResponse) return a;
  const sp = new URL(request.url).searchParams;
  const where: Prisma.ItemInventarioWhereInput = {};
  if (sp.get('inactivos') !== '1') where.activo = true;
  const dep = sp.get('depositoId'); if (dep) where.depositoId = dep;
  const unico = sp.get('id'); if (unico) { where.id = unico; delete where.activo; }
  const q = sp.get('q')?.trim().slice(0, 80);
  if (q) where.OR = [{ nombre: { contains: q, mode: 'insensitive' } }, { codigo: { contains: q, mode: 'insensitive' } }, { categoria: { contains: q, mode: 'insensitive' } }, { ubicacion: { contains: q, mode: 'insensitive' } }];
  const items = await prisma.itemInventario.findMany({ where, include: { deposito: { select: { nombre: true } } }, orderBy: [{ nombre: 'asc' }], take: 500 });
  let dtos = items.map(toItemDTO);
  if (sp.get('bajoStock') === '1') dtos = dtos.filter(i => i.bajoStock);
  return NextResponse.json(dtos);
}

export async function POST(request: NextRequest) {
  const a = await requireRole('canManageInventory');
  if (a instanceof NextResponse) return a;
  const p = await parseBody(request, ItemSchema);
  if (p.error) return p.error;
  const d = p.data;
  const dep = await prisma.deposito.findUnique({ where: { id: d.depositoId }, select: { activo: true } });
  if (!dep) return NextResponse.json({ error: 'El depósito no existe' }, { status: 400 });
  if (!dep.activo) return NextResponse.json({ error: 'El depósito está desactivado' }, { status: 400 });
  if (d.codigo) {
    const dup = await prisma.itemInventario.findFirst({ where: { depositoId: d.depositoId, codigo: { equals: d.codigo, mode: 'insensitive' } } });
    if (dup) return NextResponse.json({ error: 'Ya hay un artículo con ese código en el depósito' }, { status: 409 });
  }
  const usuario = a.displayName ?? a.username;
  const i = await prisma.$transaction(async tx => {
    const creado = await tx.itemInventario.create({
    data: { depositoId: d.depositoId, nombre: d.nombre, codigo: d.codigo ?? '', descripcion: d.descripcion ?? '', categoria: d.categoria ?? '', unidad: d.unidad ?? 'un', cantidad: d.cantidad ?? 0, stockMinimo: d.stockMinimo ?? 0, ubicacion: d.ubicacion ?? '', fotos: d.fotos ?? [], notas: d.notas ?? '', creadoPor: usuario },
    include: { deposito: { select: { nombre: true } } },
    });
    if ((d.cantidad ?? 0) > 0) {
      await tx.movimientoInventario.create({ data: { itemId: creado.id, itemNombre: creado.nombre, codigo: creado.codigo, unidad: creado.unidad, depositoId: creado.depositoId, depositoNombre: creado.deposito.nombre, tipo: 'ENTRADA', delta: d.cantidad!, saldo: d.cantidad!, motivo: 'Carga inicial', usuario } });
    }
    return creado;
  });
  return NextResponse.json(toItemDTO(i), { status: 201 });
}
