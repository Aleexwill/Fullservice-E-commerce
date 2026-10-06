import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendOtpEmail } from '@/lib/email';
import { rateLimit, getIp } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  const rl = rateLimit(`otp:${getIp(request)}`, 5, 10 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Demasiados intentos. Esperá unos minutos.' }, { status: 429 });
  }

  try {
    const { email } = await request.json();
    if (typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user || !user.isActive) {
      // Respuesta genérica para no revelar si el email existe
      return NextResponse.json({ ok: true });
    }

    // Generar código de 6 dígitos
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Invalidar códigos anteriores del mismo email
    await prisma.otpCode.deleteMany({ where: { email: user.email, usedAt: null } });

    await prisma.otpCode.create({ data: { email: user.email, code, expiresAt } });

    await sendOtpEmail({ to: user.email, name: user.name, code });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error en POST /api/auth/otp/request:', error);
    return NextResponse.json({ error: 'Error al enviar el código' }, { status: 500 });
  }
}
