import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { can } from '@/lib/roles';
import type { Role } from '@/lib/roles';

export const dynamic = 'force-dynamic';

// Maps each action to the resulting presupuesto status
const STATUS_MAP = {
  aprobar: 'aprobado',
  rechazar: 'de_baja',
  solicitar_cambios: 'en_revision',
} as const;

type ApprovalAction = keyof typeof STATUS_MAP;

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireAuth();
    if (session instanceof Response) return session;
    if (!can(session.role as Role, 'canAprobarPresupuestos')) {
      return NextResponse.json({ error: 'Sin permiso para aprobar presupuestos' }, { status: 403 });
    }

    const body = await req.json();
    const action: ApprovalAction = body.action;
    const comment: string = body.comment || '';

    if (!action || !STATUS_MAP[action]) {
      return NextResponse.json({ error: 'Acción inválida. Use: aprobar, rechazar, solicitar_cambios' }, { status: 400 });
    }

    // Verify presupuesto exists and is in the right status
    const presupuesto = await prisma.presupuesto.findUnique({ where: { id: params.id } });
    if (!presupuesto) {
      return NextResponse.json({ error: 'Presupuesto no encontrado' }, { status: 404 });
    }
    if (presupuesto.status !== 'pendiente_aprobacion') {
      return NextResponse.json(
        { error: `El presupuesto no está pendiente de aprobación (estado actual: ${presupuesto.status})` },
        { status: 409 }
      );
    }

    const newStatus = STATUS_MAP[action];
    const now = new Date();

    // Record in ApprovalRequest history
    const approverName = session.displayName ?? session.username ?? 'Usuario';

    const historyEntry = {
      action,
      approverId: session.userId ?? '',
      approverName,
      approverRole: session.role,
      comment,
      decidedAt: now.toISOString(),
      fromStatus: presupuesto.status,
      toStatus: newStatus,
    };

    // Upsert ApprovalRequest for this presupuesto
    const existing = await prisma.approvalRequest.findFirst({
      where: { presupuestoId: params.id, status: 'pending' },
    });

    if (existing) {
      const prevHistory = Array.isArray(existing.history) ? existing.history : [];
      await prisma.approvalRequest.update({
        where: { id: existing.id },
        data: {
          status: action === 'aprobar' ? 'approved' : action === 'rechazar' ? 'rejected' : 'pending',
          history: [...prevHistory, historyEntry],
          updatedAt: now,
        },
      });
    } else {
      await prisma.approvalRequest.create({
        data: {
          presupuestoId: params.id,
          status: action === 'aprobar' ? 'approved' : action === 'rechazar' ? 'rejected' : 'pending',
          history: [historyEntry],
        },
      });
    }

    // Add a note to the presupuesto with the decision
    const actionLabels: Record<ApprovalAction, string> = {
      aprobar: '✓ Aprobado',
      rechazar: '✗ Rechazado',
      solicitar_cambios: '↩ Cambios solicitados',
    };
    const noteText = `${actionLabels[action]} por ${approverName}${comment ? `: "${comment}"` : ''}`;

    const currentNotes = Array.isArray(presupuesto.notes) ? presupuesto.notes : [];
    const newNote = {
      id: Math.random().toString(36).slice(2),
      text: noteText,
      author: approverName,
      createdAt: now.toISOString(),
      type: 'aprobacion',
    };

    // Update presupuesto status + add note atomically
    const updated = await prisma.presupuesto.update({
      where: { id: params.id },
      data: {
        status: newStatus,
        notes: [...currentNotes, newNote],
        updatedAt: now,
      },
    });

    // If approved: trigger the same client-creation logic as the PUT route
    if (newStatus === 'aprobado') {
      try {
        const c = updated.customer as { name: string; email?: string; phone?: string; company?: string; address?: string };
        const existing = (c.email || c.phone)
          ? await prisma.cliente.findFirst({
              where: { OR: [c.email ? { email: c.email } : undefined, c.phone ? { phone: c.phone } : undefined].filter(Boolean) as any },
            })
          : null;
        if (existing) {
          await prisma.cliente.update({
            where: { id: existing.id },
            data: { jobsCount: { increment: 1 }, lastServiceAt: now.toISOString().split('T')[0] },
          });
        } else if (c.name) {
          await prisma.cliente.create({
            data: {
              name: c.name, email: c.email || '', phone: c.phone || '',
              company: c.company || '', address: c.address || '',
              category: 'servicios', jobsCount: 1,
              lastServiceAt: now.toISOString().split('T')[0],
            },
          });
        }
        if (c.email) {
          await prisma.lead.updateMany({
            where: { status: { notIn: ['converted', 'lost'] }, customer: { path: ['email'], equals: c.email } },
            data: { status: 'converted' },
          });
        }
      } catch (_) { /* non-blocking */ }
    }

    return NextResponse.json({ ok: true, status: newStatus, presupuesto: updated });
  } catch (error) {
    console.error('Error en POST /api/presupuestos/[id]/aprobar:', error);
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
