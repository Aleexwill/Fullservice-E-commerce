import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { getSettings, updateSettings, SETTINGS_CACHE_TAG } from '@/lib/settings-store';

export async function GET() {
  try {
    return NextResponse.json(await getSettings());
  } catch {
    return NextResponse.json({ error: 'Error al obtener configuracion' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const settings = await updateSettings(body);
    revalidateTag(SETTINGS_CACHE_TAG);
    return NextResponse.json(settings);
  } catch {
    return NextResponse.json({ error: 'Error al guardar configuracion' }, { status: 500 });
  }
}
