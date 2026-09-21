import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { createPresupuesto, toPresupuesto } from '@/lib/presupuestos-store';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const auth = await requireRole('canManagePresupuestos');
  if (auth instanceof NextResponse) return auth;
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const type = searchParams.get('type') || '';
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (type) where.serviceType = type;
    if (dateFrom || dateTo) {
      const range: Record<string, string> = {};
      if (dateFrom) range.gte = dateFrom;
      if (dateTo) range.lte = dateTo;
      where.scheduledDate = range;
    }
    if (search) {
      const q = search.toLowerCase();
      where.OR = [
        { code: { contains: q, mode: 'insensitive' } },
        { serviceTitle: { contains: q, mode: 'insensitive' } },
        // customer is a JSON field — filter in memory after fetch (Prisma can't query inside JSON)
      ];
    }

    const raw = await prisma.presupuesto.findMany({
      where: where as any,
      orderBy: { createdAt: 'desc' },
    });

    // customer is a JSON column — apply customer-name filter in memory after the DB query.
    // All other filters (status, type, date, code, serviceTitle) are already applied above.
    const q = search.toLowerCase();
    const rows = search
      ? raw.filter((p) => {
          const cust = p.customer as { name?: string } | null;
          if (cust?.name?.toLowerCase().includes(q)) return true;
          // code / serviceTitle already matched via OR in `where`
          const code = p.code.toLowerCase();
          const title = p.serviceTitle.toLowerCase();
          return code.includes(q) || title.includes(q);
        })
      : raw;

    const data = rows.map((p) => toPresupuesto(p as Parameters<typeof toPresupuesto>[0]));
    return NextResponse.json({ presupuestos: data, total: data.length }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Error en GET /api/presupuestos:', error);
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: `Error: ${message}` }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireRole('canManagePresupuestos');
  if (auth instanceof NextResponse) return auth;
  try {
    const body = await req.json();
    if (!body.customer?.name || !body.serviceTitle) return NextResponse.json({ error: 'Nombre y servicio obligatorios' }, { status: 400 });
    const p = await createPresupuesto({
      status: body.status || 'nuevo', serviceType: body.serviceType || 'otro', serviceTitle: body.serviceTitle,
      customer: { name: body.customer.name, email: body.customer.email || '', phone: body.customer.phone || '', company: body.customer.company || '', address: body.customer.address || '' },
      description: body.description || '', details: body.details || '',
      estimatedValue: body.estimatedValue ? Number(body.estimatedValue) : null, finalValue: body.finalValue ? Number(body.finalValue) : null,
      estimatedDuration: body.estimatedDuration || '', priority: body.priority || 'media', source: body.source || 'admin',
      notes: [], attachments: body.attachments || [], assignedTo: body.assignedTo || '', scheduledDate: body.scheduledDate || '', calculationData: body.calculationData ?? null,
    });

    // Auto-create Lead for this potential client
    try {
      const cuid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
      const leadCode = `L-${Date.now().toString(36).toUpperCase()}`;
      await prisma.lead.create({
        data: {
          status: 'new', priority: body.priority === 'urgente' ? 'high' : body.priority === 'alta' ? 'high' : 'medium',
          source: body.source || 'website',
          customer: { name: body.customer.name, email: body.customer.email || '', phone: body.customer.phone || '', company: body.customer.company || '', address: body.customer.address || '' },
          subject: `Presupuesto: ${body.serviceTitle}`,
          message: body.description || '',
          serviceInterest: body.serviceType || '',
          estimatedValue: body.estimatedValue ? Number(body.estimatedValue) : null,
          notes: [{ id: cuid(), text: `Presupuesto ${p.code} creado automáticamente`, createdAt: new Date().toISOString() }],
        },
      });
    } catch (_) { /* Lead creation is non-blocking */ }

    return NextResponse.json(p, { status: 201 });
  } catch (error) {
    console.error('Error en POST /api/presupuestos:', error);
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: `Error al crear: ${message}` }, { status: 500 });
  }
}
