import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, createCustomerToken, setCustomerCookie } from '@/lib/customer-auth';

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();
    if (!token || !password) return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });
    if (password.length < 6) return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 });

    const account = await prisma.customerAccount.findUnique({ where: { activationToken: token } });
    if (!account) return NextResponse.json({ error: 'Token inválido o expirado' }, { status: 400 });
    if (account.activationExpiresAt && account.activationExpiresAt < new Date()) {
      return NextResponse.json({ error: 'El link de activación expiró. Solicitá uno nuevo.' }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);
    await prisma.customerAccount.update({
      where: { id: account.id },
      data: { passwordHash, activationToken: null, activationExpiresAt: null, lastLoginAt: new Date() },
    });

    const sessionToken = await createCustomerToken(account.id, account.email, account.name);
    await setCustomerCookie(sessionToken);
    return NextResponse.json({ ok: true, name: account.name });
  } catch (e) {
    console.error('[customer/activate]', e);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
