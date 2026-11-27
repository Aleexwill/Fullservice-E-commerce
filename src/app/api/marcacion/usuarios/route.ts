export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getParametros, getUsuariosMarca } from '@/lib/marcacion/config-server';
import { validarDias } from '@/lib/marcacion/reglas';

export async function GET() {
  const a = await requireRole('canManageConfig');
  if (a instanceof NextResponse) return a;
  return NextResponse.json(await getUsuariosMarca(await getParametros()));
}

/** Override por persona: { userKey, marca: true|false|null, dias: {...}|null } */
export async function PUT(request: NextRequest) {
  const a = await requireRole('canManageConfig');
  if (a instanceof NextResponse) return a;
  try {
    const b = await request.json();
    if (typeof b.userKey !== 'string') return NextResponse.json({ error: 'Falta userKey' }, { status: 400 });
    if (!(await prisma.user.findUnique({ where: { id: b.userKey } }))) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    const marca = b.marca === true ? true : b.marca === false ? false : null;
    let dias = null;
    if (b.dias) { dias = validarDias(b.dias); if (!dias) return NextResponse.json({ error: 'Horario inválido' }, { status: 400 }); }
    const diasJson = dias ? (dias as object) : Prisma.DbNull;
    await prisma.horarioUsuario.upsert({
      where: { userKey: b.userKey },
      create: { userKey: b.userKey, marca, dias: diasJson },
      update: { marca, dias: diasJson },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('PUT /api/marcacion/usuarios:', e);
    return NextResponse.json({ error: 'Error al guardar' }, { status: 500 });
  }
}
