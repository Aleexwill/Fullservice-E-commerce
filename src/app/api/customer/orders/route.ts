import { NextResponse } from 'next/server';
import { requireCustomerAuth } from '@/lib/customer-auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await requireCustomerAuth();
  if (session instanceof NextResponse) return session;

  const orders = await prisma.order.findMany({
    where: { customerAccountId: session.customerId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, orderNumber: true, status: true, paymentStatus: true,
      total: true, subtotal: true, items: true, customer: true,
      transferReceiptUrl: true, transferReceiptAt: true,
      paymentConfirmedAt: true, createdAt: true,
    },
  });

  return NextResponse.json({ orders: orders.map((o) => ({ ...o, total: Number(o.total), subtotal: Number(o.subtotal) })) });
}
