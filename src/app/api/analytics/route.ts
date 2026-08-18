import { NextRequest, NextResponse } from 'next/server';
import { trackPageView, getAnalytics } from '@/lib/analytics-store';

export async function GET() {
  try { return NextResponse.json(await getAnalytics()); }
  catch (error) {
    console.error('Error en GET /api/analytics:', error);
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: `Error: ${message}` }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    await trackPageView(body.path || '/', body.referrer || '', body.userAgent || '');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error en POST /api/analytics:', error);
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: `Error: ${message}` }, { status: 500 });
  }
}
