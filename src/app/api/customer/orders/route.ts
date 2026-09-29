import { NextResponse } from 'next/server';
import { requireCustomerAuth } from '@/lib/customer-auth';
import { prisma } from '@/lib/prisma';

const ORDER_SELECT = {
  id: true, orderNumber: true, status: true, paymentStatus: true,
  total: true, subtotal: true, shipping: true, discount: true,
  paymentMethod: true, items: true, customer: true,
  transferReceiptUrl: true, transferReceiptAt: true,
  paymentConfirmedAt: true, createdAt: true,
} as const;

function mapOrder(o: any) {
  return {
    ...o,
    total: Number(o.total),
    subtotal: Number(o.subtotal),
    shipping: Number(o.shipping ?? 0),
    discount: Number(o.discount ?? 0),
  };
}

export async function GET() {
  const session = await requireCustomerAuth();
  if (session instanceof NextResponse) return session;

  // Primary: orders linked to this account
  const byAccount = await prisma.order.findMany({
    where: { customerAccountId: session.customerId },
    orderBy: { createdAt: 'desc' },
    select: ORDER_SELECT,
  });

  // Fallback: orders with matching email in the customer JSON field
  // (covers guest orders placed before the account was linked)
  const byEmail = await prisma.order.findMany({
    where: {
      customerAccountId: null,
      customer: { path: ['email'], equals: session.email },
    },
    orderBy: { createdAt: 'desc' },
    select: ORDER_SELECT,
  });

  // Deduplicate by id (byAccount takes priority)
  const seen = new Set(byAccount.map((o) => o.id));
  const combined = [
    ...byAccount,
    ...byEmail.filter((o) => !seen.has(o.id)),
  ];

  // Link unlinked orders to this account in the background
  const unlinkedIds = byEmail.filter((o) => !seen.has(o.id)).map((o) => o.id);
  if (unlinkedIds.length > 0) {
    prisma.order.updateMany({
      where: { id: { in: unlinkedIds } },
      data: { customerAccountId: session.customerId },
    }).catch(() => null);
  }

  return NextResponse.json({ orders: combined.map(mapOrder) });
}
