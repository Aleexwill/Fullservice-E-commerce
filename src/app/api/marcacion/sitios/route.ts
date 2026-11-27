export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { toSitio } from '@/lib/marcacion/server';

export async function GET() {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const sitios = await prisma.sitio.findMany({ where: { isActive: true }, orderBy: [{ tipo: 'asc' }, { nombre: 'asc' }] });
  return NextResponse.json(sitios.map(toSitio));
}

export async function POST(request: NextRequest) {
  const auth = await requireRole('canManageConfig');
  if (auth instanceof NextResponse) return auth;
  try {
    const b = await request.json();
    const nombre = typeof b.nombre === 'string' ? b.nombre.trim().slice(0, 80) : '';
    const lat = Number(b.lat), lng = Number(b.lng), radioM = Math.round(Number(b.radioM));
    const tipo = b.tipo === 'OFICINA' ? 'OFICINA' : 'OBRA';
    if (!nombre) return NextResponse.json({ error: 'Falta el nombre' }, { status: 400 });
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return NextResponse.json({ error: 'Coordenadas inválidas' }, { status: 400 });
    if (!Number.isFinite(radioM) || radioM < 30 || radioM > 1000) return NextResponse.json({ error: 'El radio debe estar entre 30 y 1000 m' }, { status: 400 });
    const s = await prisma.sitio.create({ data: { nombre, tipo, lat, lng, radioM } });
    return NextResponse.json(toSitio(s), { status: 201 });
  } catch (e) {
    console.error('POST /api/marcacion/sitios:', e);
    return NextResponse.json({ error: 'Error al crear el sitio' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireRole('canManageConfig');
  if (auth instanceof NextResponse) return auth;
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Falta id' }, { status: 400 });
  // Baja lógica: las jornadas históricas siguen referenciando el sitio
  await prisma.sitio.updateMany({ where: { id }, data: { isActive: false } });
  return NextResponse.json({ ok: true });
}
