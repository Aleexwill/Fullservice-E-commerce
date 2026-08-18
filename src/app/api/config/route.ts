import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { getSettings, updateSettings, SETTINGS_CACHE_TAG } from '@/lib/settings-store';

export async function GET() {
  try {
    return NextResponse.json(await getSettings());
  } catch (error) {
    console.error('Error en GET /api/config:', error);
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: `Error al obtener configuracion: ${message}` }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const settings = await updateSettings(body);
    revalidateTag(SETTINGS_CACHE_TAG);
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error en PUT /api/config:', error);
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: `Error al guardar configuracion: ${message}` }, { status: 500 });
  }
}
