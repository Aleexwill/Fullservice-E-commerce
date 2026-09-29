import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, createCustomerToken, setCustomerCookie } from '@/lib/customer-auth';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });

    const account = await prisma.customerAccount.findUnique({ where: { email } });
    if (!account || !account.isActive) return NextResponse.json({ error: 'Email o contraseña incorrectos' }, { status: 401 });
    if (!account.passwordHash) return NextResponse.json({ error: 'Cuenta no activada. Revisá tu email para activarla.' }, { status: 401 });

    const valid = await verifyPassword(password, account.passwordHash);
    if (!valid) return NextResponse.json({ error: 'Email o contraseña incorrectos' }, { status: 401 });

    await prisma.customerAccount.update({ where: { email }, data: { lastLoginAt: new Date() } });

    const token = await createCustomerToken(account.id, email, account.name);
    await setCustomerCookie(token);
    return NextResponse.json({ ok: true, name: account.name });
  } catch (e) {
    console.error('[customer/login]', e);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
