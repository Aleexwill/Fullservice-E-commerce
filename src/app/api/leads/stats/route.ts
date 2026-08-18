import { NextResponse } from 'next/server';
import { getLeadStats } from '@/lib/leads-store';

export async function GET() {
  try {
    return NextResponse.json(await getLeadStats());
  } catch (error) {
    console.error('Error en GET /api/leads/stats:', error);
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: `Error: ${message}` }, { status: 500 });
  }
}
