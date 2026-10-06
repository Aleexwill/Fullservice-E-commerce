import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSessionToken, SESSION_COOKIE } from '@/lib/auth';
import { rateLimit, getIp } from '@/lib/rate-limit';
import type { Role } from '@/lib/roles';

function setCookie(res: NextResponse, token: string) {
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 12,
  });
}

export async function POST(request: NextRequest) {
  const rl = rateLimit(`otp-verify:${getIp(request)}`, 10, 10 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Demasiados intentos.' }, { status: 429 });
  }

  try {
    const { email, code } = await request.json();
    if (typeof email !== 'string' || typeof code !== 'string') {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }

    const otp = await prisma.otpCode.findFirst({
      where: { email: email.toLowerCase(), usedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp || otp.code !== code.trim()) {
      return NextResponse.json({ error: 'Código incorrecto o vencido' }, { status: 401 });
    }

    // Marcar como usado
    await prisma.otpCode.update({ where: { id: otp.id }, data: { usedAt: new Date() } });

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user || !user.isActive) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 401 });
    }

    const token = await createSessionToken(user.email, user.role as Role, user.id, user.mustChangePassword ?? false, user.name);
    const res = NextResponse.json({
      ok: true,
      role: user.role,
      name: user.name,
      mustChangePassword: user.mustChangePassword ?? false,
    });
    setCookie(res, token);
    return res;
  } catch (error) {
    console.error('Error en POST /api/auth/otp/verify:', error);
    return NextResponse.json({ error: 'Error al verificar el código' }, { status: 500 });
  }
}
