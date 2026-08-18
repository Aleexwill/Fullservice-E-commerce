import { NextResponse } from 'next/server';
import { getPresupuestoStats } from '@/lib/presupuestos-store';

export async function GET() {
  try { return NextResponse.json(await getPresupuestoStats()); }
  catch (error) {
    console.error('Error en GET /api/presupuestos/stats:', error);
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: `Error: ${message}` }, { status: 500 });
  }
}
