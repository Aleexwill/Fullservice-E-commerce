export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getAllLeads, createLead } from '@/lib/leads-store';
import type { LeadStatus, LeadPriority, LeadSource } from '@/lib/leads-store';
import { requireAuth, requireRole } from '@/lib/auth';
import { parseBody, CreateLeadSchema } from '@/lib/schemas';

export async function GET(request: NextRequest) {
  const auth = await requireRole('canManageLeads');
  if (auth instanceof NextResponse) return auth;
  try {
    const leads = await getAllLeads();
    const { searchParams } = new URL(request.url);
    let filtered = [...leads];

    const search = searchParams.get('search');
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (l) =>
          l.customer.name.toLowerCase().includes(q) ||
          l.customer.email.toLowerCase().includes(q) ||
          l.subject.toLowerCase().includes(q)
      );
    }

    const status = searchParams.get('status');
    if (status) filtered = filtered.filter((l) => l.status === status);

    const priority = searchParams.get('priority');
    if (priority) filtered = filtered.filter((l) => l.priority === priority);

    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ leads: filtered, total: filtered.length });
  } catch (error) {
    console.error('Error en GET /api/leads:', error);
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: `Error al obtener leads: ${message}` }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const parsed = await parseBody(request, CreateLeadSchema);
    if (parsed.error) return parsed.error;
    const body = parsed.data;

    const lead = await createLead({
      status: body.status as LeadStatus,
      priority: body.priority as LeadPriority,
      source: body.source as LeadSource,
      customer: body.customer as typeof body.customer & { email: string; phone: string; company: string; position: string; avatar: string },
      subject: body.subject,
      message: body.message ?? '',
      serviceInterest: body.serviceInterest ?? '',
      estimatedValue: body.estimatedValue ?? null,
      tags: [],
      activities: [],
      tasks: [],
      notes: [],
      assignedTo: body.assignedTo ?? '',
      lastContactedAt: '',
      nextFollowUp: '',
      lostReason: '',
      leadType: body.leadType ?? 'general',
    });

    return NextResponse.json(lead, { status: 201 });
  } catch (error) {
    console.error('Error en POST /api/leads:', error);
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: `Error al crear lead: ${message}` }, { status: 500 });
  }
}
