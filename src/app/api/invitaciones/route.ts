import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { prisma } from '@/lib/prisma';
import { verifySessionToken, SESSION_COOKIE } from '@/lib/auth';
import { can } from '@/lib/roles';
import { sendInvitationEmail } from '@/lib/email';
import type { Role } from '@/lib/roles';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    const session = await verifySessionToken(token).catch(() => null);
    if (!session || !can(session.role, 'canManageUsers')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const invitations = await prisma.invitation.findMany({
      where: { usedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
      select: { id: true, email: true, name: true, role: true, expiresAt: true, createdAt: true },
    });

    return NextResponse.json({ invitations });
  } catch (error) {
    console.error('Error GET /api/invitaciones:', error);
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    const session = await verifySessionToken(token).catch(() => null);
    if (!session || !can(session.role, 'canManageUsers')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });

    await prisma.invitation.update({ where: { id }, data: { expiresAt: new Date(0) } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error DELETE /api/invitaciones:', error);
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
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

    try {
      await sendInvitationEmail({
        to: email,
        name: name || email,
        role,
        token: inviteToken,
        invitedBy: session.username,
      });
    } catch (emailError) {
      console.error('Error enviando email de invitación:', emailError);
      // Continuar: la invitación se creó, solo el email falló
    }

    return NextResponse.json({ ok: true, inviteToken });
  } catch (error) {
    console.error('Error POST /api/invitaciones:', error);
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
