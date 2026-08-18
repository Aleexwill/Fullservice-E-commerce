import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface NotificationItem {
  id: string;
  type: 'pedido' | 'presupuesto' | 'lead';
  title: string;
  subtitle: string;
  href: string;
  createdAt: string;
}

const LIMIT = 8;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const since = searchParams.get('since');
    const sinceDate = since ? new Date(since) : null;

    const [orders, presupuestos, leads] = await Promise.all([
      prisma.order.findMany({ orderBy: { createdAt: 'desc' }, take: LIMIT }),
      prisma.presupuesto.findMany({ orderBy: { createdAt: 'desc' }, take: LIMIT }),
      prisma.lead.findMany({ orderBy: { createdAt: 'desc' }, take: LIMIT }),
    ]);

    const items: NotificationItem[] = [
      ...orders.map((o) => {
        const customer = o.customer as { name?: string } | null;
        return {
          id: o.id,
          type: 'pedido' as const,
          title: `Pedido ${o.orderNumber}`,
          subtitle: customer?.name || 'Cliente sin nombre',
          href: '/admin/pedidos',
          createdAt: o.createdAt.toISOString(),
        };
      }),
      ...presupuestos.map((p) => {
        const customer = p.customer as { name?: string } | null;
        return {
          id: p.id,
          type: 'presupuesto' as const,
          title: `Presupuesto ${p.code}`,
          subtitle: customer?.name || p.serviceTitle || 'Solicitud de servicio',
          href: '/admin/presupuestos',
          createdAt: p.createdAt.toISOString(),
        };
      }),
      ...leads.map((l) => {
        const customer = l.customer as { name?: string } | null;
        return {
          id: l.id,
          type: 'lead' as const,
          title: l.subject || 'Nueva consulta',
          subtitle: customer?.name || 'Lead sin nombre',
          href: '/admin/leads',
          createdAt: l.createdAt.toISOString(),
        };
      }),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const recent = items.slice(0, LIMIT);
    const unreadCount = sinceDate
      ? items.filter((i) => new Date(i.createdAt) > sinceDate).length
      : recent.length;

    return NextResponse.json({ items: recent, unreadCount });
  } catch (error) {
    console.error('Error en GET /api/notifications:', error);
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: `Error al obtener notificaciones: ${message}` }, { status: 500 });
  }
}
