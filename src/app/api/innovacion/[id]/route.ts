import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { getInnovacionById, updateInnovacion, deleteInnovacion } from '@/lib/innovacion-store';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const item = await getInnovacionById(params.id);
    if (!item) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    return NextResponse.json(item);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole('canManageContent');
  if (auth instanceof NextResponse) return auth;
  try {
    const body = await req.json();
    const item = await updateInnovacion(params.id, {
      title: body.title,
      description: body.description,
      mediaUrl: body.mediaUrl,
      mediaType: body.mediaType,
      thumbnail: body.thumbnail,
      isActive: body.isActive,
      order: body.order,
    });
    if (!item) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    return NextResponse.json(item);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole('canManageContent');
  if (auth instanceof NextResponse) return auth;
  try {
    const ok = await deleteInnovacion(params.id);
    if (!ok) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
