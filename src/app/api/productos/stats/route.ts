import { NextResponse } from 'next/server';
import { getProductStats } from '@/lib/products-store';

export async function GET() {
  try {
    const stats = await getProductStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error en GET /api/productos/stats:', error);
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: `Error al obtener estadisticas: ${message}` }, { status: 500 });
  }
}
