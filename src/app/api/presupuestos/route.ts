import { NextRequest, NextResponse } from 'next/server';
import { getAllPresupuestos, createPresupuesto } from '@/lib/presupuestos-store';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    let data = await getAllPresupuestos();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    if (search) { const q = search.toLowerCase(); data = data.filter((p) => p.customer.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q) || p.serviceTitle.toLowerCase().includes(q)); }
    const status = searchParams.get('status');
    if (status) data = data.filter((p) => p.status === status);
    const type = searchParams.get('type');
    if (type) data = data.filter((p) => p.serviceType === type);
    data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return NextResponse.json({ presupuestos: data, total: data.length });
  } catch (error) {
    console.error('Error en GET /api/presupuestos:', error);
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: `Error: ${message}` }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.customer?.name || !body.serviceTitle) return NextResponse.json({ error: 'Nombre y servicio obligatorios' }, { status: 400 });
    const p = await createPresupuesto({
      status: body.status || 'nuevo', serviceType: body.serviceType || 'otro', serviceTitle: body.serviceTitle,
      customer: { name: body.customer.name, email: body.customer.email || '', phone: body.customer.phone || '', company: body.customer.company || '', address: body.customer.address || '' },
      description: body.description || '', details: body.details || '',
      estimatedValue: body.estimatedValue ? Number(body.estimatedValue) : null, finalValue: body.finalValue ? Number(body.finalValue) : null,
      estimatedDuration: body.estimatedDuration || '', priority: body.priority || 'media', source: body.source || 'admin',
      notes: [], attachments: body.attachments || [], assignedTo: body.assignedTo || '', scheduledDate: body.scheduledDate || '', calculationData: null,
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
