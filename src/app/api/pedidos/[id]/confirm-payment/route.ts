import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole('canManageOrders');
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });

  const updated = await prisma.order.update({
    where: { id },
    data: {
      paymentStatus: 'paid',
      paymentConfirmedAt: new Date(),
      paymentConfirmedBy: auth.username,
      status: order.status === 'pending' ? 'processing' : order.status,
    },
  });

  return NextResponse.json({ ok: true, paymentStatus: updated.paymentStatus, status: updated.status });
}
