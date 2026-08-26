import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const banners = await prisma.promoBanner.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    });
    return NextResponse.json(banners);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const count = await prisma.promoBanner.count();
    const banner = await prisma.promoBanner.create({
      data: {
        title: body.title || '',
        subtitle: body.subtitle || '',
        ctaLabel: body.ctaLabel || '',
        ctaUrl: body.ctaUrl || '',
        imageUrl: body.imageUrl || '',
        bgColor: body.bgColor || '#0a1628',
        accentColor: body.accentColor || '#2D8FCC',
        badge: body.badge || '',
        order: body.order ?? count,
        isActive: body.isActive ?? true,
      },
    });
    return NextResponse.json(banner, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Error' }, { status: 500 });
  }
}
