export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const FECHA = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(request: NextRequest) {
  const a = await requireAuth();
  if (a instanceof NextResponse) return a;
  const anio = new URL(request.url).searchParams.get('anio');
  const where = anio && /^\d{4}$/.test(anio) ? { fecha: { startsWith: anio } } : {};
  const f = await prisma.feriado.findMany({ where, orderBy: { fecha: 'asc' } });
  return NextResponse.json(f.map(x => ({ id: x.id, fecha: x.fecha, nombre: x.nombre })));
}

export async function POST(request: NextRequest) {
  const a = await requireRole('canManageConfig');
  if (a instanceof NextResponse) return a;
  const b = await request.json().catch(() => ({}));
  const nombre = typeof b.nombre === 'string' ? b.nombre.trim().slice(0, 80) : '';
  if (!FECHA.test(b.fecha ?? '') || Number.isNaN(Date.parse(b.fecha)) || !nombre) return NextResponse.json({ error: 'Fecha y nombre son obligatorios' }, { status: 400 });
  try {
    const f = await prisma.feriado.create({ data: { fecha: b.fecha, nombre } });
    return NextResponse.json({ id: f.id, fecha: f.fecha, nombre: f.nombre }, { status: 201 });
  } catch (e) {
    if ((e as { code?: string })?.code === 'P2002') return NextResponse.json({ error: 'Ya hay un feriado en esa fecha' }, { status: 409 });
    throw e;
  }
}

export async function DELETE(request: NextRequest) {
  const a = await requireRole('canManageConfig');
  if (a instanceof NextResponse) return a;
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Falta id' }, { status: 400 });
  await prisma.feriado.deleteMany({ where: { id } });
  return NextResponse.json({ ok: true });
}
