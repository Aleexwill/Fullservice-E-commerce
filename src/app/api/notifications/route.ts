import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { ROLE_PERMISSIONS } from '@/lib/roles';

export const dynamic = 'force-dynamic';

interface NotificationItem {
  id: string;
  type: 'pedido' | 'presupuesto' | 'lead' | 'aprobacion';
  title: string;
  subtitle: string;
  href: string;
  createdAt: string;
  urgent?: boolean;
}

const LIMIT = 8;

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    const isAdmin = !(session instanceof Response) &&
      (ROLE_PERMISSIONS[session.role as keyof typeof ROLE_PERMISSIONS]?.canAprobarPresupuestos ?? false);

    const { searchParams } = new URL(request.url);
    const since = searchParams.get('since');
    const sinceDate = since ? new Date(since) : null;

    const [orders, presupuestos, leads, pendingApproval] = await Promise.all([
      prisma.order.findMany({ orderBy: { createdAt: 'desc' }, take: LIMIT }),
      prisma.presupuesto.findMany({ orderBy: { createdAt: 'desc' }, take: LIMIT }),
      prisma.lead.findMany({ orderBy: { createdAt: 'desc' }, take: LIMIT }),
      isAdmin
        ? prisma.presupuesto.findMany({
            where: { status: 'pendiente_aprobacion' },
            orderBy: { updatedAt: 'desc' },
            select: { id: true, code: true, serviceTitle: true, customer: true, updatedAt: true },
          })
        : Promise.resolve([]),
    ]);

    // Approval notifications go first (urgent, pinned to top for admins)
    const approvalItems: NotificationItem[] = pendingApproval.map((p) => {
      const customer = p.customer as { name?: string } | null;
      return {
        id: `approval-${p.id}`,
        type: 'aprobacion' as const,
        title: `Pendiente aprobación: ${p.code}`,
        subtitle: customer?.name || (p.serviceTitle as string) || 'Presupuesto',
        href: '/admin/presupuestos?tab=aprobacion',
        createdAt: (p.updatedAt as Date).toISOString(),
        urgent: true,
      };
    });

    const items: NotificationItem[] = [
      ...approvalItems,
      ...orders.map((o) => {
        const customer = o.customer as { name?: string } | null;
        return {
          id: o.id,
          type: 'pedido' as const,
          title: `Pedido ${o.orderNumber}`,
          subtitle: customer?.name || 'Cliente sin nombre',
          href: '/admin/pedidos',
          createdAt: o.createdAt.toISOString(),
          urgent: false,
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
          urgent: false,
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
          urgent: false,
        };
      }),
    ].sort((a, b) => {
      // Urgent items always first, then by date
      if (a.urgent && !b.urgent) return -1;
      if (!a.urgent && b.urgent) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

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
