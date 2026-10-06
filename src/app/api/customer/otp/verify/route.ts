import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimit, getIp } from '@/lib/rate-limit';
import { createCustomerToken, setCustomerCookie } from '@/lib/customer-auth';

export async function POST(req: NextRequest) {
  const ip = getIp(req);
  const rl = rateLimit(`customer-otp-verify:${ip}`, 10, 10 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Demasiados intentos. Esperá unos minutos.' }, { status: 429 });
  }

  try {
    const { email, code } = await req.json();
    if (!email || !code) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const otpRecord = await prisma.otpCode.findFirst({
      where: {
        email: normalizedEmail,
        code,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      return NextResponse.json({ error: 'Código incorrecto o vencido' }, { status: 401 });
    }

    const account = await prisma.customerAccount.findUnique({ where: { email: normalizedEmail } });
    if (!account || !account.isActive) {
      return NextResponse.json({ error: 'Cuenta no encontrada' }, { status: 401 });
    }

    // Mark OTP as used and update last login
    await prisma.$transaction([
      prisma.otpCode.update({ where: { id: otpRecord.id }, data: { usedAt: new Date() } }),
      prisma.customerAccount.update({ where: { email: normalizedEmail }, data: { lastLoginAt: new Date() } }),
    ]);

    const token = await createCustomerToken(account.id, account.email, account.name);
    await setCustomerCookie(token);

    return NextResponse.json({ ok: true, name: account.name });
  } catch (e) {
    console.error('[customer/otp/verify]', e);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
