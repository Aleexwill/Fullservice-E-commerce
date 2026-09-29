import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole('canManageOrders');
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const { receiptUrl } = await req.json();
  if (!receiptUrl) return NextResponse.json({ error: 'URL requerida' }, { status: 400 });

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });

  await prisma.order.update({ where: { id }, data: { adminReceiptUrl: receiptUrl } });
  return NextResponse.json({ ok: true });
}
