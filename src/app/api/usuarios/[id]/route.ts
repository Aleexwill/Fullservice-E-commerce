import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySessionToken, SESSION_COOKIE } from '@/lib/auth';
import { can } from '@/lib/roles';
import type { Role } from '@/lib/roles';

async function requireAdmin(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = await verifySessionToken(token).catch(() => null);
  if (!session || !can(session.role, 'canManageUsers')) return null;
  return session;
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAdmin(request);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const { name, role, isActive } = await request.json();

  const validRoles: Role[] = ['admin', 'vendedor', 'tecnico'];
  if (role && !validRoles.includes(role)) {
    return NextResponse.json({ error: 'Rol inválido' }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: params.id },
    data: { ...(name && { name }), ...(role && { role }), ...(isActive !== undefined && { isActive }) },
    select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true },
  });

  return NextResponse.json({ user });
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAdmin(request);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  // Can't delete yourself
  const target = await prisma.user.findUnique({ where: { id: params.id } });
  if (!target) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
  if (target.email === session.username) {
    return NextResponse.json({ error: 'No podés eliminar tu propio usuario' }, { status: 400 });
  }

  await prisma.user.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
