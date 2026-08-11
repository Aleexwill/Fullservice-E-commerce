import { prisma } from './prisma';
import type { Order as PrismaOrder } from '@prisma/client';
import { Prisma } from '@prisma/client';

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'refunded' | 'failed';

export interface OrderItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  customer: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    notes: string;
  };
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  paymentMethod: string;
  adminNotes: string;
  createdAt: string;
  updatedAt: string;
}

function toOrder(o: PrismaOrder): Order {
  return {
    id: o.id,
    orderNumber: o.orderNumber,
    status: o.status as OrderStatus,
    paymentStatus: o.paymentStatus as PaymentStatus,
    customer: o.customer as Order['customer'],
    items: o.items as unknown as OrderItem[],
    subtotal: Number(o.subtotal),
    shipping: Number(o.shipping),
    discount: Number(o.discount),
    total: Number(o.total),
    paymentMethod: o.paymentMethod,
    adminNotes: o.adminNotes,
    createdAt: o.createdAt.toISOString(),
    updatedAt: o.updatedAt.toISOString(),
  };
}

export async function getAllOrders(): Promise<Order[]> {
  const orders = await prisma.order.findMany({ orderBy: { createdAt: 'desc' } });
  return orders.map(toOrder);
}

export async function getOrderById(id: string): Promise<Order | null> {
  const o = await prisma.order.findUnique({ where: { id } });
  return o ? toOrder(o) : null;
}

export async function createOrder(
  data: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>
): Promise<Order> {
  // Reintenta ante colisión del orderNumber único (carrera entre creaciones concurrentes).
  for (let attempt = 0; attempt < 5; attempt++) {
    const count = await prisma.order.count();
    const orderNumber = `SP-${String(count + 1 + attempt).padStart(5, '0')}`;
    try {
      const o = await prisma.order.create({
        data: { ...data, orderNumber } as unknown as Prisma.OrderUncheckedCreateInput,
      });
      return toOrder(o);
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') continue;
      throw e;
    }
  }
  throw new Error('No se pudo generar un número de pedido único');
}

export async function updateOrder(id: string, data: Partial<Order>): Promise<Order | null> {
  const { id: _id, orderNumber: _orderNumber, createdAt: _createdAt, ...rest } = data;
  try {
    const o = await prisma.order.update({
      where: { id },
      data: rest as unknown as Prisma.OrderUncheckedUpdateInput,
    });
    return toOrder(o);
  } catch {
    return null;
  }
}

export async function deleteOrder(id: string): Promise<boolean> {
  try {
    await prisma.order.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}

export async function getOrderStats() {
  const orders = await prisma.order.findMany({ orderBy: { createdAt: 'asc' } });
  const byStatus: Record<string, number> = {};
  const byPayment: Record<string, number> = {};
  let totalRevenue = 0;
  let paidRevenue = 0;

  orders.forEach((o) => {
    byStatus[o.status] = (byStatus[o.status] || 0) + 1;
    byPayment[o.paymentStatus] = (byPayment[o.paymentStatus] || 0) + 1;
    totalRevenue += Number(o.total);
    if (o.paymentStatus === 'paid') paidRevenue += Number(o.total);
  });

  return {
    total: orders.length,
    byStatus,
    byPayment,
    totalRevenue,
    paidRevenue,
    recentOrders: orders.slice(-5).reverse().map(toOrder),
  };
}
