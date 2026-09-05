import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getLeadStats } from '@/lib/leads-store';

export async function GET() {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  try {
    return NextResponse.json(await getLeadStats());
  } catch (error) {
    console.error('Error en GET /api/leads/stats:', error);
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: `Error: ${message}` }, { status: 500 });
  }
}
