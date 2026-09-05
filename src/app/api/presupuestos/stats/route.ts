import { NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth';
import { getPresupuestoStats } from '@/lib/presupuestos-store';

export async function GET() {
  const auth = await requireRole('canManagePresupuestos');
  if (auth instanceof NextResponse) return auth;
  try { return NextResponse.json(await getPresupuestoStats()); }
  catch (error) {
    console.error('Error en GET /api/presupuestos/stats:', error);
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: `Error: ${message}` }, { status: 500 });
  }
}
