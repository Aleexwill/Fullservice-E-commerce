import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createSessionToken, SESSION_COOKIE } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    const expectedUser = process.env.ADMIN_USERNAME;
    const expectedHash = process.env.ADMIN_PASSWORD_HASH;

    if (!expectedUser || !expectedHash) {
      return NextResponse.json({ error: 'Autenticación no configurada en el servidor' }, { status: 500 });
    }

    if (typeof username !== 'string' || typeof password !== 'string') {
      return NextResponse.json({ error: 'Usuario y contraseña son obligatorios' }, { status: 400 });
    }

    const userOk = username === expectedUser;
    const passOk = await bcrypt.compare(password, expectedHash);

    if (!userOk || !passOk) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
    }

    const token = await createSessionToken(username);
    const res = NextResponse.json({ ok: true });
    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 12,
    });
    return res;
  } catch {
    return NextResponse.json({ error: 'Error al iniciar sesión' }, { status: 500 });
  }
}
