import { NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const auth = await requireRole('canManageClients');
  if (auth instanceof NextResponse) return auth;
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';
    const limit = Math.min(Number(searchParams.get('limit') || '20'), 100);

    const where: any = { isActive: true };
    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { company: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q, mode: 'insensitive' } },
      ];
    }

    const clientes = await prisma.cliente.findMany({
      where, take: limit,
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ clientes });
  } catch (error) {
    console.error('Error en GET /api/clientes:', error);
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: `Error al obtener clientes: ${message}` }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireRole('canManageClients');
  if (auth instanceof NextResponse) return auth;
  try {
    const body = await request.json();
    // Check if client with same email or phone already exists
    if (body.email || body.phone) {
      const existing = await prisma.cliente.findFirst({
        where: {
          OR: [
            body.email ? { email: body.email } : undefined,
            body.phone ? { phone: body.phone } : undefined,
          ].filter(Boolean) as any,
        },
      });
      if (existing) {
        // Update jobsCount and lastServiceAt instead of creating duplicate
        const updated = await prisma.cliente.update({
          where: { id: existing.id },
          data: {
            jobsCount: { increment: 1 },
            lastServiceAt: new Date().toISOString().split('T')[0],
            ...(body.leadId && { leadId: body.leadId }),
          },
        });
        return NextResponse.json({ cliente: updated, created: false });
      }
    }

    const cliente = await prisma.cliente.create({
      data: {
        name: body.name,
        company: body.company || '',
        email: body.email || '',
        phone: body.phone || '',
        address: body.address || '',
        ruc: body.ruc || '',
        category: body.category || 'servicios',
        notes: body.notes || '',
        leadId: body.leadId || '',
        jobsCount: 1,
        lastServiceAt: new Date().toISOString().split('T')[0],
      },
    });
    return NextResponse.json({ cliente, created: true }, { status: 201 });
  } catch (error) {
    console.error('Error en POST /api/clientes:', error);
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: `Error al crear cliente: ${message}` }, { status: 500 });
  }
}
