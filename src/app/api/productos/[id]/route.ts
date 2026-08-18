import { NextRequest, NextResponse } from 'next/server';
import { getProductById, updateProduct, deleteProduct } from '@/lib/products-store';

// GET /api/productos/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const product = await getProductById(params.id);
    if (!product) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
    }
    return NextResponse.json(product);
  } catch (error) {
    console.error('Error en GET /api/productos/[id]:', error);
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: `Error al obtener producto: ${message}` }, { status: 500 });
  }
}

// PUT /api/productos/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const product = await updateProduct(params.id, {
      ...body,
      price: body.price !== undefined ? Number(body.price) : undefined,
      compareAtPrice: body.compareAtPrice !== undefined
        ? (body.compareAtPrice ? Number(body.compareAtPrice) : null)
        : undefined,
      stock: body.stock !== undefined ? Number(body.stock) : undefined,
    });

    if (!product) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error en PUT /api/productos/[id]:', error);
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: `Error al actualizar producto: ${message}` }, { status: 500 });
  }
}

// DELETE /api/productos/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const deleted = await deleteProduct(params.id);
    if (!deleted) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error en DELETE /api/productos/[id]:', error);
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: `Error al eliminar producto: ${message}` }, { status: 500 });
  }
}
