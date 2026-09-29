import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { getProductStats } from '@/lib/products-store';

export async function GET() {
  const auth = await requireRole('canManageOrders');
  if (auth instanceof NextResponse) return auth;
  try {
    const stats = await getProductStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error en GET /api/productos/stats:', error);
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: `Error al obtener estadisticas: ${message}` }, { status: 500 });
  }
}
