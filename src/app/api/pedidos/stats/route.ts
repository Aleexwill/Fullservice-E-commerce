import { NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth';
import { getOrderStats } from '@/lib/orders-store';

export async function GET() {
  const auth = await requireRole('canManageOrders');
  if (auth instanceof NextResponse) return auth;
  try {
    return NextResponse.json(await getOrderStats());
  } catch (error) {
    console.error('Error en GET /api/pedidos/stats:', error);
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: `Error: ${message}` }, { status: 500 });
  }
}
