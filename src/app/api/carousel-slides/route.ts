import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Resilient GET: uses raw SQL with COALESCE so it works even if overlayOpacity
// column hasn't been migrated yet in the target DB.
export async function GET() {
  try {
    const rows = await prisma.$queryRawUnsafe<any[]>(`
      SELECT id, label, tag, description, "photoUrl", accent, gradient,
             COALESCE("overlayOpacity", 55) AS "overlayOpacity",
             "order", "isActive", "createdAt", "updatedAt"
      FROM "CarouselSlide"
      WHERE "isActive" = true
      ORDER BY "order" ASC
    `);
    return NextResponse.json(rows);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  try {
    const body = await req.json();
    const count = await prisma.carouselSlide.count();
    // Try with overlayOpacity first; if column missing, retry without it
    try {
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
    } catch (innerErr: any) {
      // Column doesn't exist yet — insert without it
      if (innerErr?.message?.includes('overlayOpacity')) {
        const slide = await prisma.carouselSlide.create({
          data: {
            label: body.label || 'Nuevo slide',
            tag: body.tag || '',
            description: body.description || '',
            photoUrl: body.photoUrl || '',
            accent: body.accent || '#2D8FCC',
            gradient: body.gradient || 'from-[#0a1628] via-[#1a3a5c] to-[#0d2340]',
            order: body.order ?? count,
            isActive: body.isActive ?? true,
          } as any,
        });
        return NextResponse.json(slide, { status: 201 });
      }
      throw innerErr;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
