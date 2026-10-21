import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { getAllInnovaciones, createInnovacion } from '@/lib/innovacion-store';

export async function GET(req: NextRequest) {
  try {
    const onlyActive = req.nextUrl.searchParams.get('active') === 'true';
    const items = await getAllInnovaciones(onlyActive);
    return NextResponse.json({ items });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireRole('canManageContent');
  if (auth instanceof NextResponse) return auth;
  try {
    const body = await req.json();
    if (!body.title) return NextResponse.json({ error: 'Título obligatorio' }, { status: 400 });
    const item = await createInnovacion({
      title: body.title,
      description: body.description || '',
      mediaUrl: body.mediaUrl || '',
      mediaType: body.mediaType || 'image',
      thumbnail: body.thumbnail || '',
      isActive: body.isActive !== false,
      order: body.order ?? 0,
    });
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
