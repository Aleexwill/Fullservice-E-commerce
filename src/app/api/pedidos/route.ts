import { NextRequest, NextResponse } from 'next/server';
import { getAllOrders, createOrder } from '@/lib/orders-store';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
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
  } catch {
    return NextResponse.json({ error: 'Error al obtener pedidos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.customer?.name) {
      return NextResponse.json({ error: 'Nombre del cliente es obligatorio' }, { status: 400 });
    }

    const rawItems: { productId: string; quantity: number }[] = (body.items || []).map((item: any) => ({
      productId: String(item.productId || ''),
      quantity: Math.max(1, Number(item.quantity) || 1),
    }));

    // El precio SIEMPRE se toma de la base de datos, nunca del cliente,
    // para que no se pueda manipular el monto del pedido desde el navegador.
    const productIds = rawItems.map((i) => i.productId).filter(Boolean);
    const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
    const productById = new Map(products.map((p) => [p.id, p]));

    const items = rawItems
      .map((item) => {
        const product = productById.get(item.productId);
        if (!product) return null;
        const unitPrice = Number(product.price);
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

    const order = await createOrder({
      status: body.status || 'pending',
      paymentStatus: body.paymentStatus || 'pending',
      customer: {
        name: body.customer.name,
        email: body.customer.email || '',
        phone: body.customer.phone || '',
        address: body.customer.address || '',
        city: body.customer.city || '',
        notes: body.customer.notes || '',
      },
      items,
      subtotal,
      shipping: Number(body.shipping) || 0,
      discount: Number(body.discount) || 0,
      total: subtotal + (Number(body.shipping) || 0) - (Number(body.discount) || 0),
      paymentMethod: body.paymentMethod || 'pending',
      adminNotes: body.adminNotes || '',
    });

    return NextResponse.json(order, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Error al crear pedido' }, { status: 500 });
  }
}
