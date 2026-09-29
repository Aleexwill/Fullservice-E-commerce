import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, generateToken, createCustomerToken, setCustomerCookie } from '@/lib/customer-auth';

export async function POST(req: NextRequest) {
  try {
    const { email, password, name, phone } = await req.json();
    if (!email || !password || !name) return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });
    if (password.length < 6) return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 });

    const existing = await prisma.customerAccount.findUnique({ where: { email } });
    if (existing) {
      // Si ya existe pero sin contraseña (creada en checkout), activar la cuenta
      if (!existing.passwordHash) {
        const passwordHash = await hashPassword(password);
        await prisma.customerAccount.update({
          where: { email },
          data: { passwordHash, name, phone: phone || existing.phone, activationToken: null, activationExpiresAt: null, lastLoginAt: new Date() },
        });
        const token = await createCustomerToken(existing.id, email, name);
        await setCustomerCookie(token);
        return NextResponse.json({ ok: true, name });
      }
      return NextResponse.json({ error: 'Ya existe una cuenta con ese email' }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const account = await prisma.customerAccount.create({
      data: { email, name, phone: phone || '', passwordHash, lastLoginAt: new Date() },
    });
    const token = await createCustomerToken(account.id, email, name);
    await setCustomerCookie(token);
    return NextResponse.json({ ok: true, name });
  } catch (e) {
    console.error('[customer/register]', e);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
