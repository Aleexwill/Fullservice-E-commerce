import { NextRequest, NextResponse } from 'next/server';
import { getOrderById, updateOrder, deleteOrder } from '@/lib/orders-store';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const order = await getOrderById(params.id);
    if (!order) return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
    return NextResponse.json(order);
  } catch (error) {
    console.error('Error en GET /api/pedidos/[id]:', error);
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: `Error: ${message}` }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const order = await updateOrder(params.id, body);
    if (!order) return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
    return NextResponse.json(order);
  } catch (error) {
    console.error('Error en PUT /api/pedidos/[id]:', error);
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: `Error al actualizar: ${message}` }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ok = await deleteOrder(params.id);
    if (!ok) return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error en DELETE /api/pedidos/[id]:', error);
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: `Error al eliminar: ${message}` }, { status: 500 });
  }
}
