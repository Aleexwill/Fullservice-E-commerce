import { NextResponse } from 'next/server';
import { getCustomerSession } from '@/lib/customer-auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ customer: null });

  const account = await prisma.customerAccount.findUnique({
    where: { id: session.customerId },
    select: { id: true, email: true, name: true, phone: true, address: true, createdAt: true },
  });
  if (!account) return NextResponse.json({ customer: null });
  return NextResponse.json({ customer: account });
}
