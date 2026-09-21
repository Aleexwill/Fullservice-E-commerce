export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth';
import { getAllOrders, createOrder } from '@/lib/orders-store';
import type { OrderStatus, PaymentStatus } from '@/lib/orders-store';
import { getEffectivePrice } from '@/lib/products-store';
import { prisma } from '@/lib/prisma';
import { parseBody, CreatePedidoSchema } from '@/lib/schemas';

export async function GET(request: NextRequest) {
  const auth = await requireRole('canManageOrders');
  if (auth instanceof NextResponse) return auth;
  try {
    const orders = await getAllOrders();
    const { searchParams } = new URL(request.url);
    let filtered = [...orders];

    const search = searchParams.get('search');
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.customer.name.toLowerCase().includes(q) ||
          o.customer.email.toLowerCase().includes(q)
      );
    }

    const status = searchParams.get('status');
    if (status) filtered = filtered.filter((o) => o.status === status);

    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ orders: filtered, total: filtered.length });
  } catch (error) {
    console.error('Error en GET /api/pedidos:', error);
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: `Error al obtener pedidos: ${message}` }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const parsed = await parseBody(request, CreatePedidoSchema);
    if (parsed.error) return parsed.error;
    const body = parsed.data;

    const rawItems = body.items;

    // El precio SIEMPRE se toma de la base de datos, nunca del cliente,
    // para que no se pueda manipular el monto del pedido desde el navegador.
    const productIds = rawItems.map((i) => i.productId).filter(Boolean);
    const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
    const productById = new Map(products.map((p) => [p.id, p]));

    const items = rawItems
      .map((item) => {
        const product = productById.get(item.productId);
        if (!product) return null;
        const unitPrice = getEffectivePrice({
          price: Number(product.price),
          promoDiscountPercent: product.promoDiscountPercent,
          promoStartsAt: product.promoStartsAt ? product.promoStartsAt.toISOString() : null,
          promoEndsAt: product.promoEndsAt ? product.promoEndsAt.toISOString() : null,
        }).price;
        return {
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          quantity: item.quantity,
          unitPrice,
          total: unitPrice * item.quantity,
        };
      })
      .filter((i): i is NonNullable<typeof i> => i !== null);

    if (items.length === 0) {
      return NextResponse.json({ error: 'El carrito no tiene productos válidos' }, { status: 400 });
    }

    const subtotal = items.reduce((s, i) => s + i.total, 0);

    // Contador de "mas vendidos" — se suma en el momento del pedido.
    await Promise.all(
      items.map((i) =>
        prisma.product.update({ where: { id: i.productId }, data: { salesCount: { increment: i.quantity } } }).catch(() => null)
      )
    );

    const shipping = body.shipping ?? 0;
    const discount = body.discount ?? 0;
    const order = await createOrder({
      status: (body.status ?? 'pending') as OrderStatus,
      paymentStatus: (body.paymentStatus ?? 'pending') as PaymentStatus,
      customer: {
        name: body.customer.name,
        email: body.customer.email ?? '',
        phone: body.customer.phone ?? '',
        address: body.customer.address ?? '',
        city: body.customer.city ?? '',
        notes: body.customer.notes ?? '',
      },
      items,
      subtotal,
      shipping,
      discount,
      total: subtotal + shipping - discount,
      paymentMethod: body.paymentMethod ?? 'pending',
      adminNotes: body.adminNotes ?? '',
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error('Error en POST /api/pedidos:', error);
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: `Error al crear pedido: ${message}` }, { status: 500 });
  }
}
