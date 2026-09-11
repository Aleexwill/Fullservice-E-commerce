import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySessionToken, SESSION_COOKIE } from '@/lib/auth';
import { can } from '@/lib/roles';

async function checkAdmin(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = await verifySessionToken(token).catch(() => null);
  if (!session || !can(session.role as any, 'canManageUsers')) return null;
  return session;
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await checkAdmin(request);
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const existing = await prisma.customRole.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });

    const { label, permissions } = await request.json();

    const role = await prisma.customRole.update({
      where: { id: params.id },
      data: {
        ...(label !== undefined && { label }),
        ...(permissions !== undefined && { permissions }),
      },
    });
    return NextResponse.json({ role });
  } catch (error) {
    console.error('Error PUT /api/roles/[id]:', error);
    return NextResponse.json({ error: 'Error al actualizar rol' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await checkAdmin(request);
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const existing = await prisma.customRole.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    if (existing.isSystem) return NextResponse.json({ error: 'No se pueden eliminar roles del sistema' }, { status: 400 });

    // Reassign users with this role to 'vendedor'
    await prisma.user.updateMany({ where: { role: existing.name }, data: { role: 'vendedor' } });
    await prisma.customRole.delete({ where: { id: params.id } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error DELETE /api/roles/[id]:', error);
    return NextResponse.json({ error: 'Error al eliminar rol' }, { status: 500 });
  }
}
