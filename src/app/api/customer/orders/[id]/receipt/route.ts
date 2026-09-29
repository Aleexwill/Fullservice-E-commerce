import { NextRequest, NextResponse } from 'next/server';
import { requireCustomerAuth } from '@/lib/customer-auth';
import { prisma } from '@/lib/prisma';

// Cliente sube URL de comprobante de transferencia
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireCustomerAuth();
  if (session instanceof NextResponse) return session;

  const { id } = await params;
  const { receiptUrl } = await req.json();
  if (!receiptUrl) return NextResponse.json({ error: 'URL requerida' }, { status: 400 });

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order || order.customerAccountId !== session.customerId) {
    return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
  }

  const updated = await prisma.order.update({
    where: { id },
    data: {
      transferReceiptUrl: receiptUrl,
      transferReceiptAt: new Date(),
      paymentStatus: 'receipt_submitted',
    },
  });

  return NextResponse.json({ ok: true, paymentStatus: updated.paymentStatus });
}
