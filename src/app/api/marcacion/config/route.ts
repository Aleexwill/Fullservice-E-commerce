export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getParametros, ROLES_DISPONIBLES } from '@/lib/marcacion/config-server';
import { normalizarParametros, validarDias } from '@/lib/marcacion/reglas';

export async function GET() {
  const a = await requireAuth();
  if (a instanceof NextResponse) return a;
  return NextResponse.json({ parametros: await getParametros(), roles: ROLES_DISPONIBLES });
}

export async function PUT(request: NextRequest) {
  const a = await requireRole('canManageConfig');
  if (a instanceof NextResponse) return a;
  try {
    const b = await request.json();
    if (!validarDias(b?.dias)) return NextResponse.json({ error: 'Horario inválido: la salida debe ser posterior a la entrada en todos los días' }, { status: 400 });
    const p = normalizarParametros(b);
    p.rolesMarcan = p.rolesMarcan.filter(r => ROLES_DISPONIBLES.includes(r));
    await prisma.marcacionConfig.upsert({ where: { id: 'default' }, create: { id: 'default', data: p as object }, update: { data: p as object } });
    return NextResponse.json({ parametros: p });
  } catch (e) {
    console.error('PUT /api/marcacion/config:', e);
    return NextResponse.json({ error: 'Error al guardar' }, { status: 500 });
  }
}
