import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { can } from '@/lib/roles';
import type { Role } from '@/lib/roles';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await requireAuth();
    if (session instanceof Response) return session;
    if (!can(session.role as Role, 'canAprobarPresupuestos')) {
      return NextResponse.json({ error: 'Sin permiso' }, { status: 403 });
    }

    const items = await prisma.presupuesto.findMany({
      where: { status: 'pendiente_aprobacion' },
      orderBy: { updatedAt: 'desc' },
      take: 10,
      select: {
        id: true,
        code: true,
        serviceTitle: true,
        customer: true,
        estimatedValue: true,
        assignedTo: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ items, total: items.length });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
