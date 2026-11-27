import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { ROLE_PERMISSIONS } from '@/lib/roles';
import { ESTADO_LABEL, esTI, quienEs } from '@/lib/ti/tickets';

export const dynamic = 'force-dynamic';

interface NotificationItem {
  id: string;
  type: 'pedido' | 'presupuesto' | 'lead' | 'aprobacion' | 'ticket' | 'traslado';
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
    if (session instanceof Response) return session;
    // La ruta ya no la restringe el middleware: cada sección se entrega según el permiso (leads/pedidos como antes, tickets nuevo).
    const tiene = async (perm: 'canManageLeads' | 'canUseTickets' | 'canManageInventory' | 'canManageConfig'): Promise<boolean> => {
      if (session.role in ROLE_PERMISSIONS) return ROLE_PERMISSIONS[session.role as keyof typeof ROLE_PERMISSIONS][perm];
      const r = await prisma.customRole.findUnique({ where: { name: session.role } }).catch(() => null);
      return !!(r?.permissions as Record<string, boolean> | undefined)?.[perm];
    };
    const [verComercial, verTickets] = await Promise.all([tiene('canManageLeads'), tiene('canUseTickets')]);
    const isAdmin = !(session instanceof Response) &&
      (ROLE_PERMISSIONS[session.role as keyof typeof ROLE_PERMISSIONS]?.canAprobarPresupuestos ?? false);

    const { searchParams } = new URL(request.url);
    const since = searchParams.get('since');
    const sinceDate = since ? new Date(since) : null;

    // Tickets de TI: TI recibe los nuevos, reabiertos y las respuestas de quien los pidió; el solicitante, los cambios y comentarios de TI.
    let ticketItems: NotificationItem[] = [];
    if (verTickets) {
      try {
        const yo = quienEs(session);
        const ti = await esTI(session);
        const desde = new Date(Date.now() - 14 * 86_400_000);
        const evs = await prisma.ticketEvento.findMany({
          where: {
            createdAt: { gte: desde },
            autorId: { not: yo.id },
            tipo: { in: ['CREADO', 'ESTADO', 'COMENTARIO', 'REABIERTO', 'CONFIRMADO', 'CANCELADO'] },
            ticket: ti ? { OR: [{ solicitanteId: yo.id }, { estado: { notIn: ['CERRADO', 'RECHAZADO'] } }] } : { solicitanteId: yo.id },
          },
          orderBy: { createdAt: 'desc' }, take: LIMIT,
          include: { ticket: { select: { id: true, numero: true, titulo: true, prioridad: true, solicitanteId: true } } },
        });
        ticketItems = evs
          .filter((e) => (e.ticket.solicitanteId === yo.id ? true : ['CREADO', 'COMENTARIO', 'REABIERTO'].includes(e.tipo)))
          .map((e) => {
            const base = `Ticket #${e.ticket.numero}`;
            const titulo = e.tipo === 'CREADO' ? `Nuevo ticket #${e.ticket.numero}` : e.tipo === 'COMENTARIO' ? `${base}: comentario de ${e.autor}` : e.tipo === 'REABIERTO' ? `${base} reabierto` : e.tipo === 'CONFIRMADO' ? `${base} confirmado` : e.tipo === 'CANCELADO' ? `${base} cancelado` : `${base}: ${e.detalle.split('→').pop()?.trim() || ESTADO_LABEL.NUEVO}`;
            return {
              id: `ticket-${e.id}`, type: 'ticket' as const, title: titulo, subtitle: e.ticket.titulo,
              href: ti && e.ticket.solicitanteId !== yo.id ? `/admin/ti/tickets/${e.ticket.id}` : `/admin/ti/tickets/${e.ticket.id}`,
              createdAt: e.createdAt.toISOString(), urgent: ti && e.tipo === 'CREADO' && e.ticket.prioridad === 'CRITICA',
            };
          });
      } catch (err) { console.error('notificaciones de tickets:', err); }
    }

    // Traslados entre depósitos: el encargado del depósito de destino recibe los pendientes (si no hay encargado, quienes administran la
    // configuración); quien envió el traslado recibe el aviso cuando se recibe o se cancela.
    let trasladoItems: NotificationItem[] = [];
    if (await tiene('canManageInventory')) {
      try {
        const yoId = session.userId ?? session.username;
        const admin = await tiene('canManageConfig');
        const desde = new Date(Date.now() - 7 * 86_400_000);
        const ts = await prisma.traslado.findMany({
          where: { OR: [
            { estado: 'EN_TRANSITO', destino: admin ? { OR: [{ responsableId: yoId }, { responsableId: null }] } : { responsableId: yoId } },
            { estado: { in: ['RECIBIDO', 'CANCELADO'] }, creadoPorId: yoId, resueltoAt: { gte: desde } },
          ] },
          orderBy: { createdAt: 'desc' }, take: LIMIT,
          include: { origen: { select: { nombre: true } }, destino: { select: { nombre: true } } },
        });
        trasladoItems = ts.map((t) => t.estado === 'EN_TRANSITO'
          ? { id: `traslado-${t.id}`, type: 'traslado' as const, title: `Traslado #${t.numero} por recibir`, subtitle: `${Number(t.cantidad)} ${t.unidad} de ${t.itemNombre} · ${t.origen.nombre} → ${t.destino.nombre}`, href: '/admin/depositos?tab=traslados', createdAt: t.createdAt.toISOString(), urgent: true }
          : { id: `traslado-res-${t.id}`, type: 'traslado' as const, title: `Traslado #${t.numero} ${t.estado === 'RECIBIDO' ? 'recibido' : 'cancelado'}`, subtitle: `${t.itemNombre} · ${t.destino.nombre}${t.resueltoPor ? ` · ${t.resueltoPor}` : ''}`, href: '/admin/depositos?tab=traslados', createdAt: (t.resueltoAt ?? t.createdAt).toISOString(), urgent: false });
      } catch (err) { console.error('notificaciones de traslados:', err); }
    }

    const [orders, presupuestos, leads, pendingApproval] = await Promise.all([
      verComercial ? prisma.order.findMany({ orderBy: { createdAt: 'desc' }, take: LIMIT }) : Promise.resolve([]),
      verComercial ? prisma.presupuesto.findMany({ orderBy: { createdAt: 'desc' }, take: LIMIT }) : Promise.resolve([]),
      verComercial ? prisma.lead.findMany({ orderBy: { createdAt: 'desc' }, take: LIMIT }) : Promise.resolve([]),
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
      ...ticketItems,
      ...trasladoItems,
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
