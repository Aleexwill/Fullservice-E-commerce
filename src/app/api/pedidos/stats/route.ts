import { NextResponse } from 'next/server';
import { getOrderStats } from '@/lib/orders-store';

export async function GET() {
  try {
    return NextResponse.json(await getOrderStats());
  } catch (error) {
    console.error('Error en GET /api/pedidos/stats:', error);
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: `Error: ${message}` }, { status: 500 });
  }
}
