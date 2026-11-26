export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { userNameOf } from '@/lib/marcacion/server';
import { validarEnrolamiento } from '@/lib/marcacion/face';
import { logChange } from '@/lib/audit';
import { getIp } from '@/lib/rate-limit';

/** Enrola (o reemplaza) la huella facial de un usuario. Recibe solo números: { userId, vectores: number[3-5][128] }. */
export async function POST(request: NextRequest) {
  const a = await requireRole('canManageUsers');
  if (a instanceof NextResponse) return a;
  const b = await request.json().catch(() => ({}));
  if (typeof b.userId !== 'string') return NextResponse.json({ error: 'Falta el usuario' }, { status: 400 });
  const user = await prisma.user.findUnique({ where: { id: b.userId } });
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
  const v = validarEnrolamiento(b.vectores);
  if ('error' in v) return NextResponse.json({ error: v.error }, { status: 422 });
  const enroladoPor = userNameOf(a);
  await prisma.rostroPlantilla.upsert({
    where: { userKey: user.id },
    create: { userKey: user.id, vectores: v.vectores, enroladoPor },
    update: { vectores: v.vectores, enroladoPor },
  });
  await logChange({ entity: 'Funcionario', entityId: user.id, entityName: user.name, action: 'update', before: { rostro: 'sin enrolar' }, after: { rostro: 'enrolado' }, userId: a.userId, userName: a.displayName, userIp: getIp(request) });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const a = await requireRole('canManageUsers');
  if (a instanceof NextResponse) return a;
  const userId = new URL(request.url).searchParams.get('userId');
  if (!userId) return NextResponse.json({ error: 'Falta el usuario' }, { status: 400 });
  await prisma.rostroPlantilla.deleteMany({ where: { userKey: userId } });
  return NextResponse.json({ ok: true });
}
