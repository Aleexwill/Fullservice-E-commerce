import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth';
import { getLeadById, updateLead, addNoteToLead, addActivityToLead, addTaskToLead, toggleTask, deleteLead } from '@/lib/leads-store';
import { logChange, getIp } from '@/lib/audit';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole('canManageLeads');
  if (auth instanceof NextResponse) return auth;
  try {
    const lead = await getLeadById(params.id);
    if (!lead) return NextResponse.json({ error: 'Lead no encontrado' }, { status: 404 });
    return NextResponse.json(lead);
  } catch (error) {
    console.error('Error en GET /api/leads/[id]:', error);
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: `Error: ${message}` }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole('canManageLeads');
  if (auth instanceof NextResponse) return auth;
  try {
    const body = await request.json();

    if (body._addNote) {
      const lead = await addNoteToLead(params.id, body._addNote);
      if (!lead) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
      return NextResponse.json(lead);
    }

    if (body._addActivity) {
      const lead = await addActivityToLead(params.id, body._addActivity.type, body._addActivity.text, body._addActivity.metadata);
      if (!lead) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
      return NextResponse.json(lead);
    }

    if (body._addTask) {
      const lead = await addTaskToLead(params.id, body._addTask.text, body._addTask.dueDate || '');
      if (!lead) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
      return NextResponse.json(lead);
    }

    if (body._toggleTask) {
      const lead = await toggleTask(params.id, body._toggleTask);
      if (!lead) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
      return NextResponse.json(lead);
    }

    const before = await getLeadById(params.id);
    const lead = await updateLead(params.id, body);
    if (!lead) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    if (before) {
      await logChange({
        entity: 'Lead', entityId: lead.id, entityName: lead.customer.name,
        action: 'update',
        before: { status: before.status, priority: before.priority, estimatedValue: before.estimatedValue, assignedTo: before.assignedTo, lostReason: before.lostReason, nextFollowUp: before.nextFollowUp, tags: before.tags },
        after:  { status: lead.status,   priority: lead.priority,   estimatedValue: lead.estimatedValue,   assignedTo: lead.assignedTo,   lostReason: lead.lostReason,   nextFollowUp: lead.nextFollowUp,   tags: lead.tags  },
        userId: auth.userId, userName: auth.displayName ?? auth.username,
        userIp: getIp(request),
      });
    }
    return NextResponse.json(lead);
  } catch (error) {
    console.error('Error en PUT /api/leads/[id]:', error);
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: `Error al actualizar: ${message}` }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole('canManageLeads');
  if (auth instanceof NextResponse) return auth;
  try {
    const before = await getLeadById(params.id);
    const ok = await deleteLead(params.id);
    if (!ok) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    await logChange({
      entity: 'Lead', entityId: params.id, entityName: before?.customer.name ?? params.id,
      action: 'delete', userId: auth.userId, userName: auth.displayName ?? auth.username, userIp: getIp(req),
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error en DELETE /api/leads/[id]:', error);
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: `Error al eliminar: ${message}` }, { status: 500 });
  }
}
