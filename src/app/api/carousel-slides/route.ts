import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const slides = await prisma.carouselSlide.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    });
    return NextResponse.json(slides);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const count = await prisma.carouselSlide.count();
    const slide = await prisma.carouselSlide.create({
      data: {
        label: body.label || 'Nuevo slide',
        tag: body.tag || '',
        description: body.description || '',
        photoUrl: body.photoUrl || '',
        accent: body.accent || '#2D8FCC',
        gradient: body.gradient || 'from-[#0a1628] via-[#1a3a5c] to-[#0d2340]',
        overlayOpacity: body.overlayOpacity ?? 55,
        order: body.order ?? count,
        isActive: body.isActive ?? true,
      },
    });
    return NextResponse.json(slide, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
