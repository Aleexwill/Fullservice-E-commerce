import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { del } from '@vercel/blob';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole('canManageContent');
  if (auth instanceof NextResponse) return auth;
  try {
    const body = await req.json();
    const banner = await prisma.promoBanner.update({
      where: { id: params.id },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.subtitle !== undefined && { subtitle: body.subtitle }),
        ...(body.ctaLabel !== undefined && { ctaLabel: body.ctaLabel }),
        ...(body.ctaUrl !== undefined && { ctaUrl: body.ctaUrl }),
        ...(body.imageUrl !== undefined && { imageUrl: body.imageUrl }),
        ...(body.bgColor !== undefined && { bgColor: body.bgColor }),
        ...(body.accentColor !== undefined && { accentColor: body.accentColor }),
        ...(body.badge !== undefined && { badge: body.badge }),
        ...(body.order !== undefined && { order: body.order }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
      },
    });
    return NextResponse.json(banner);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Error' }, { status: 500 });
  }
}

export async function DELETE(_r: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole('canManageContent');
  if (auth instanceof NextResponse) return auth;
  try {
    const banner = await prisma.promoBanner.findUnique({ where: { id: params.id } });
    if (!banner) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    if (banner.imageUrl?.includes('vercel-storage.com')) {
      try { await del(banner.imageUrl); } catch (_) {}
    }
    await prisma.promoBanner.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Error' }, { status: 500 });
  }
}
