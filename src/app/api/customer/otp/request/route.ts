import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimit, getIp } from '@/lib/rate-limit';
import { sendOtpEmail } from '@/lib/email';

function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function POST(req: NextRequest) {
  const ip = getIp(req);
  const rl = rateLimit(`customer-otp:${ip}`, 5, 10 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Demasiados intentos. Esperá unos minutos.' }, { status: 429 });
  }

  try {
    const { email } = await req.json();
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email requerido' }, { status: 400 });
    }

    const account = await prisma.customerAccount.findUnique({ where: { email: email.toLowerCase().trim() } });

    // Always return ok to avoid email enumeration
    if (!account || !account.isActive) {
      return NextResponse.json({ ok: true });
    }

    const code = generateCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Delete previous unused codes for this email
    await prisma.otpCode.deleteMany({
      where: { email: account.email, usedAt: null },
    });

    await prisma.otpCode.create({
      data: { email: account.email, code, expiresAt },
    });

    // Fire email — don't let a Resend failure block the response
    sendOtpEmail({ to: account.email, name: account.name, code }).catch((err) =>
      console.error('[customer/otp/request] sendOtpEmail failed:', err)
    );

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[customer/otp/request]', msg);
    return NextResponse.json({ error: 'Error interno', detail: msg }, { status: 500 });
  }
}
