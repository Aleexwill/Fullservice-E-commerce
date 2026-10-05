import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth';
import { getProductById, updateProduct, deleteProduct } from '@/lib/products-store';
import { logChange, getIp } from '@/lib/audit';

async function getUser(req: NextRequest) {
  try {
    const res = await fetch(new URL('/api/auth/me', req.url), { headers: req.headers });
    if (res.ok) { const d = await res.json(); return { id: d.id ?? '', name: d.name ?? 'Admin' }; }
  } catch {}
  return { id: '', name: 'Admin' };
}

// GET /api/productos/[id]
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const product = await getProductById(params.id);
    if (!product) return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
    return NextResponse.json(product);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: `Error al obtener producto: ${message}` }, { status: 500 });
  }
}

// PUT /api/productos/[id]
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole('canManageProducts');
  if (auth instanceof NextResponse) return auth;
  try {
    const body = await request.json();
    const before = await getProductById(params.id);
    const product = await updateProduct(params.id, {
      ...body,
      price: body.price !== undefined ? Number(body.price) : undefined,
      costPrice: body.costPrice !== undefined ? (body.costPrice ? Number(body.costPrice) : null) : undefined,
      compareAtPrice: body.compareAtPrice !== undefined ? (body.compareAtPrice ? Number(body.compareAtPrice) : null) : undefined,
      stock: body.stock !== undefined ? Number(body.stock) : undefined,
    });
    if (!product) return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });

    const user = await getUser(request);
    await logChange({
      entity: 'Product', entityId: params.id, entityName: product.name, action: 'update',
      before: before as unknown as Record<string, unknown>,
      after: product as unknown as Record<string, unknown>,
      userId: user.id, userName: user.name, userIp: getIp(request),
    });

    return NextResponse.json(product);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: `Error al actualizar producto: ${message}` }, { status: 500 });
  }
}

// DELETE /api/productos/[id]
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole('canManageProducts');
  if (auth instanceof NextResponse) return auth;
  try {
    const before = await getProductById(params.id);
    const deleted = await deleteProduct(params.id);
    if (!deleted) return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });

    const user = await getUser(request);
    await logChange({
      entity: 'Product', entityId: params.id, entityName: before?.name ?? params.id, action: 'delete',
      userId: user.id, userName: user.name, userIp: getIp(request),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: `Error al eliminar producto: ${message}` }, { status: 500 });
  }
}
