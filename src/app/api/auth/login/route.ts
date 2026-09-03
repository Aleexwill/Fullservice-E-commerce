import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createSessionToken, SESSION_COOKIE } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
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
  try {
    const { username, password } = await request.json();

    if (typeof username !== 'string' || typeof password !== 'string') {
      return NextResponse.json({ error: 'Usuario y contraseña son obligatorios' }, { status: 400 });
    }

    // 1 — Buscar usuario en BD (por email)
    const dbUser = await prisma.user.findUnique({ where: { email: username.toLowerCase() } }).catch(() => null);

    if (dbUser && dbUser.isActive) {
      const passOk = await bcrypt.compare(password, dbUser.passwordHash);
      if (passOk) {
        const token = await createSessionToken(dbUser.email, dbUser.role as Role, dbUser.id);
        const res = NextResponse.json({ ok: true, role: dbUser.role, name: dbUser.name });
        setCookie(res, token);
        return res;
      }
      // Usuario existe pero password incorrecto — no caer al fallback env
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
    }

    // 2 — Fallback: admin de .env.local (compatibilidad)
    const expectedUser = process.env.ADMIN_USERNAME;
    const expectedHash = process.env.ADMIN_PASSWORD_HASH;

    if (!expectedUser || !expectedHash) {
      return NextResponse.json({ error: 'Autenticación no configurada en el servidor' }, { status: 500 });
    }

    const userOk = username === expectedUser;
    const passOk = await bcrypt.compare(password, expectedHash);

    if (!userOk || !passOk) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
    }

    const token = await createSessionToken(username, 'admin');
    const res = NextResponse.json({ ok: true, role: 'admin', name: 'Administrador' });
    setCookie(res, token);
    return res;
  } catch (error) {
    console.error('Error en POST /api/auth/login:', error);
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: `Error al iniciar sesión: ${message}` }, { status: 500 });
  }
}
