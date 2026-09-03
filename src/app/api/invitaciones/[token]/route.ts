import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export async function GET(_req: NextRequest, { params }: { params: { token: string } }) {
  const invitation = await prisma.invitation.findUnique({ where: { token: params.token } });

  if (!invitation || invitation.usedAt || invitation.expiresAt < new Date()) {
    return NextResponse.json({ error: 'Invitación inválida o expirada' }, { status: 404 });
  }

  return NextResponse.json({
    email: invitation.email,
    name: invitation.name,
    role: invitation.role,
  });
}

export async function POST(request: NextRequest, { params }: { params: { token: string } }) {
  const invitation = await prisma.invitation.findUnique({ where: { token: params.token } });

  if (!invitation || invitation.usedAt || invitation.expiresAt < new Date()) {
    return NextResponse.json({ error: 'Invitación inválida o expirada' }, { status: 404 });
  }

  const { name, password } = await request.json();

  if (!password || password.length < 8) {
    return NextResponse.json({ error: 'La contraseña debe tener al menos 8 caracteres' }, { status: 400 });
  }

  const existingUser = await prisma.user.findUnique({ where: { email: invitation.email } });
  if (existingUser) {
    return NextResponse.json({ error: 'El usuario ya existe' }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.$transaction([
    prisma.user.create({
      data: {
        email: invitation.email,
        name: name || invitation.name || invitation.email,
        role: invitation.role,
        passwordHash,
        isActive: true,
      },
    }),
    prisma.invitation.update({
      where: { token: params.token },
      data: { usedAt: new Date() },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
