import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { del } from '@vercel/blob';

export async function GET(_r: NextRequest, { params }: { params: { id: string } }) {
  try {
    const slide = await prisma.carouselSlide.findUnique({ where: { id: params.id } });
    return slide ? NextResponse.json(slide) : NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const slide = await prisma.carouselSlide.update({
      where: { id: params.id },
      data: {
        ...(body.label !== undefined && { label: body.label }),
        ...(body.tag !== undefined && { tag: body.tag }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.photoUrl !== undefined && { photoUrl: body.photoUrl }),
        ...(body.accent !== undefined && { accent: body.accent }),
        ...(body.gradient !== undefined && { gradient: body.gradient }),
        ...(body.overlayOpacity !== undefined && { overlayOpacity: body.overlayOpacity }),
        ...(body.order !== undefined && { order: body.order }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
      },
    });
    return NextResponse.json(slide);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_r: NextRequest, { params }: { params: { id: string } }) {
  try {
    const slide = await prisma.carouselSlide.findUnique({ where: { id: params.id } });
    if (!slide) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    // Delete blob if it came from Vercel Blob
    if (slide.photoUrl && slide.photoUrl.includes('vercel-storage.com')) {
      try { await del(slide.photoUrl); } catch (_) { /* non-blocking */ }
    }
    await prisma.carouselSlide.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
