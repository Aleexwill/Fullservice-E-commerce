import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/** Usuarios activos que pueden ser encargados de un depósito. */
export async function GET() {
  const a = await requireRole('canManageInventory');
  if (a instanceof NextResponse) return a;
  const u = await prisma.user.findMany({ where: { isActive: true }, select: { id: true, name: true }, orderBy: { name: 'asc' } });
  return NextResponse.json(u);
}
