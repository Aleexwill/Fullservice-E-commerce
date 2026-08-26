import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { del } from '@vercel/blob';

export async function GET(_r: NextRequest, { params }: { params: { id: string } }) {
  try {
    const rows = await prisma.$queryRawUnsafe<any[]>(`
      SELECT id, label, tag, description, "photoUrl", accent, gradient,
             COALESCE("overlayOpacity", 55) AS "overlayOpacity",
             "order", "isActive", "createdAt", "updatedAt"
      FROM "CarouselSlide"
      WHERE id = $1
      LIMIT 1
    `, params.id);
    const slide = rows[0] ?? null;
    return slide ? NextResponse.json(slide) : NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const updateData: any = {};
    if (body.label !== undefined) updateData.label = body.label;
    if (body.tag !== undefined) updateData.tag = body.tag;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.photoUrl !== undefined) updateData.photoUrl = body.photoUrl;
    if (body.accent !== undefined) updateData.accent = body.accent;
    if (body.gradient !== undefined) updateData.gradient = body.gradient;
    if (body.order !== undefined) updateData.order = body.order;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    // overlayOpacity: try to include it, silently skip if column missing
    if (body.overlayOpacity !== undefined) {
      try {
        await prisma.$queryRawUnsafe(
          `UPDATE "CarouselSlide" SET "overlayOpacity" = $1 WHERE id = $2`,
          body.overlayOpacity,
          params.id
        );
      } catch (_) { /* column not yet migrated — skip */ }
    }

    const slide = await prisma.carouselSlide.update({
      where: { id: params.id },
      data: updateData,
    });

    // Return with overlayOpacity included (from body or default)
    return NextResponse.json({ ...slide, overlayOpacity: body.overlayOpacity ?? 55 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_r: NextRequest, { params }: { params: { id: string } }) {
  try {
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT "photoUrl" FROM "CarouselSlide" WHERE id = $1 LIMIT 1`, params.id
    );
    const slide = rows[0];
    if (!slide) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });

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
