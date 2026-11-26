import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/** Usuarios activos a quienes se puede asignar un ticket (TI). */
export async function GET() {
  const a = await requireRole('canManageConfig');
  if (a instanceof NextResponse) return a;
  const u = await prisma.user.findMany({ where: { isActive: true, role: { in: ['admin', 'administracion'] } }, select: { id: true, name: true }, orderBy: { name: 'asc' } });
  return NextResponse.json(u);
}
