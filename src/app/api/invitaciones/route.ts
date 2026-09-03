import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { prisma } from '@/lib/prisma';
import { verifySessionToken, SESSION_COOKIE } from '@/lib/auth';
import { can } from '@/lib/roles';
import { sendInvitationEmail } from '@/lib/email';
import type { Role } from '@/lib/roles';

export async function POST(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = await verifySessionToken(token).catch(() => null);
  if (!session || !can(session.role, 'canManageUsers')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const { email, name, role } = await request.json();

  if (!email || !role) {
    return NextResponse.json({ error: 'Email y rol son obligatorios' }, { status: 400 });
  }

  const validRoles: Role[] = ['admin', 'vendedor', 'tecnico'];
  if (!validRoles.includes(role)) {
    return NextResponse.json({ error: 'Rol inválido' }, { status: 400 });
  }

  const existingUser = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existingUser) {
    return NextResponse.json({ error: 'Ya existe un usuario con ese email' }, { status: 409 });
  }

  // Invalidate previous pending invitations for the same email
  await prisma.invitation.updateMany({
    where: { email: email.toLowerCase(), usedAt: null },
    data: { expiresAt: new Date(0) },
  });

  const inviteToken = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 48); // 48 hours

  await prisma.invitation.create({
    data: {
      email: email.toLowerCase(),
      name: name || '',
      role,
      token: inviteToken,
      expiresAt,
    },
  });

  await sendInvitationEmail({
    to: email,
    name: name || email,
    role,
    token: inviteToken,
    invitedBy: session.username,
  });

  return NextResponse.json({ ok: true });
}
