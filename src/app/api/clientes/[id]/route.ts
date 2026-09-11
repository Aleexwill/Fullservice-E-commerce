import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const auth = await requireRole('canManageClients');
  if (auth instanceof NextResponse) return auth;
  try {
    const cliente = await prisma.cliente.findUnique({ where: { id: params.id } });
    if (!cliente) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });

    const c = cliente as any;
    const emailFilter = c.email ? [{ customer: { path: ['email'], equals: c.email } }] : [];
    const phoneFilter = c.phone ? [{ customer: { path: ['phone'], equals: c.phone } }] : [];
    const nameFilter  = c.name  ? [{ customer: { path: ['name'],  equals: c.name  } }] : [];
    const orFilter = [...emailFilter, ...phoneFilter, ...nameFilter];

    const [presupuestos, pedidos] = await Promise.all([
      orFilter.length > 0
        ? prisma.presupuesto.findMany({
            where: { OR: orFilter },
            orderBy: { createdAt: 'desc' },
            select: {
              id: true, code: true, status: true, serviceTitle: true, serviceType: true,
              estimatedValue: true, finalValue: true, createdAt: true, scheduledDate: true,
              seguimientoData: true,
            },
          })
        : [],
      orFilter.length > 0
        ? prisma.order.findMany({
            where: { OR: orFilter },
            orderBy: { createdAt: 'desc' },
            select: {
              id: true, orderNumber: true, status: true, paymentStatus: true,
              total: true, subtotal: true, discount: true,
              items: true, createdAt: true,
            },
          })
        : [],
    ]);

    return NextResponse.json({ cliente, presupuestos, pedidos });
  } catch (error) {
    console.error('Error en GET /api/clientes/[id]:', error);
    return NextResponse.json({ error: 'Error al obtener cliente' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireRole('canManageClients');
  if (auth instanceof NextResponse) return auth;
  try {
    const body = await request.json();
    const cliente = await prisma.cliente.update({
      where: { id: params.id },
      data: {
        ...(body.name      !== undefined && { name: body.name }),
        ...(body.company   !== undefined && { company: body.company }),
        ...(body.email     !== undefined && { email: body.email }),
        ...(body.phone     !== undefined && { phone: body.phone }),
        ...(body.address   !== undefined && { address: body.address }),
        ...(body.ruc       !== undefined && { ruc: body.ruc }),
        ...(body.notes     !== undefined && { notes: body.notes }),
        ...(body.category  !== undefined && { category: body.category }),
        ...(body.isActive  !== undefined && { isActive: body.isActive }),
        ...(body.totalSpent !== undefined && { totalSpent: body.totalSpent }),
        ...(body.jobsCount !== undefined && { jobsCount: body.jobsCount }),
      },
    });
    return NextResponse.json(cliente);
  } catch (error) {
    console.error('Error en PUT /api/clientes/[id]:', error);
    return NextResponse.json({ error: 'Error al actualizar cliente' }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const auth = await requireRole('canManageClients');
  if (auth instanceof NextResponse) return auth;
  try {
    await prisma.cliente.update({ where: { id: params.id }, data: { isActive: false } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error en DELETE /api/clientes/[id]:', error);
    return NextResponse.json({ error: 'Error al eliminar cliente' }, { status: 500 });
  }
}
