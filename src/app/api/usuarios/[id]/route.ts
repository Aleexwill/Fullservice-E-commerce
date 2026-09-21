import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { verifySessionToken, SESSION_COOKIE } from '@/lib/auth';
import { can } from '@/lib/roles';
import { parseBody, UpdateUserSchema } from '@/lib/schemas';

async function requireAdmin(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = await verifySessionToken(token).catch(() => null);
  if (!session || !can(session.role, 'canManageUsers')) return null;
  return session;
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAdmin(request);
  if (!session || session instanceof NextResponse) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const parsed = await parseBody(request, UpdateUserSchema);
  if (parsed.error) return parsed.error;
  const { name, role, isActive } = parsed.data;

  const user = await prisma.user.update({
    where: { id: params.id },
    data: { ...(name && { name }), ...(role && { role }), ...(isActive !== undefined && { isActive }) },
    select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true },
  });

  return NextResponse.json({ user });
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAdmin(request);
  if (!session || session instanceof NextResponse) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  // Can't delete yourself
  const target = await prisma.user.findUnique({ where: { id: params.id } });
  if (!target) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
  if (target.email === session.username) {
    return NextResponse.json({ error: 'No podés eliminar tu propio usuario' }, { status: 400 });
  }

  await prisma.user.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
