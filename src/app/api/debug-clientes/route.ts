import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const all = await prisma.clienteLogo.findMany({ orderBy: [{ order: 'asc' }, { createdAt: 'asc' }] });
    return NextResponse.json({ count: all.length, records: all });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
