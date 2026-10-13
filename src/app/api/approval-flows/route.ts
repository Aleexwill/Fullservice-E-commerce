import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { can } from '@/lib/roles';
import type { Role } from '@/lib/roles';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await requireAuth();
    if (session instanceof Response) return session;

    const flows = await prisma.approvalFlow.findMany({
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ flows });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    if (session instanceof Response) return session;
    if (!can(session.role as Role, 'canManageConfig')) {
      return NextResponse.json({ error: 'Sin permiso' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, isActive, steps } = body;

    const flow = await prisma.approvalFlow.create({
      data: {
        name: name || 'Flujo de Aprobacion',
        description: description || '',
        isActive: isActive ?? true,
        steps: steps || [],
      },
    });

    return NextResponse.json({ flow }, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
