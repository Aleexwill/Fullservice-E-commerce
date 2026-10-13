import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { can } from '@/lib/roles';
import type { Role } from '@/lib/roles';

export const dynamic = 'force-dynamic';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireAuth();
    if (session instanceof Response) return session;
    if (!can(session.role as Role, 'canManageConfig')) {
      return NextResponse.json({ error: 'Sin permiso' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, isActive, steps } = body;

    const flow = await prisma.approvalFlow.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(isActive !== undefined && { isActive }),
        ...(steps !== undefined && { steps }),
      },
    });

    return NextResponse.json({ flow });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireAuth();
    if (session instanceof Response) return session;
    if (!can(session.role as Role, 'canManageConfig')) {
      return NextResponse.json({ error: 'Sin permiso' }, { status: 403 });
    }

    await prisma.approvalFlow.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
