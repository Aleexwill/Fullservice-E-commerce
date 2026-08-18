import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { getContent, updateContent, CONTENT_CACHE_TAG } from '@/lib/content-store';

export async function GET() {
  try { return NextResponse.json(await getContent()); }
  catch (error) {
    console.error('Error en GET /api/contenido:', error);
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: `Error: ${message}` }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const content = await updateContent(body);
    revalidateTag(CONTENT_CACHE_TAG);
    return NextResponse.json(content);
  } catch (error) {
    console.error('Error en PUT /api/contenido:', error);
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: `Error al guardar: ${message}` }, { status: 500 });
  }
}
