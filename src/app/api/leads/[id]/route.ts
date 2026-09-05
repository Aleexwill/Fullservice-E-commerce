import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth';
import { getLeadById, updateLead, addNoteToLead, addActivityToLead, addTaskToLead, toggleTask, deleteLead } from '@/lib/leads-store';

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

    const lead = await updateLead(params.id, body);
    if (!lead) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    return NextResponse.json(lead);
  } catch (error) {
    console.error('Error en PUT /api/leads/[id]:', error);
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: `Error al actualizar: ${message}` }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole('canManageLeads');
  if (auth instanceof NextResponse) return auth;
  try {
    const ok = await deleteLead(params.id);
    if (!ok) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error en DELETE /api/leads/[id]:', error);
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: `Error al eliminar: ${message}` }, { status: 500 });
  }
}
