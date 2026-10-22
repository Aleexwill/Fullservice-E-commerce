import { NextRequest, NextResponse } from 'next/server';
import { updateCategoria, deleteCategoria } from '@/lib/categorias-store';
import { requireAuth } from '@/lib/auth';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const body = await request.json();
  try {
    const item = await updateCategoria(params.id, body);
    return NextResponse.json(item);
  } catch (e: any) {
    if (e?.code === 'P2025') return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    if (e?.code === 'P2002') return NextResponse.json({ error: 'Slug duplicado en este scope' }, { status: 409 });
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    await deleteCategoria(params.id);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e?.code === 'P2025') return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
