import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const ID = 'v1';

export async function GET() {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  try {
    const row = await prisma.informeTecnico.findUnique({ where: { id: ID } });
    return NextResponse.json(row?.data ?? { informes: [], sel: '' });
  } catch (error) {
    console.error('GET /api/informes-tecnicos:', error);
    return NextResponse.json({ error: 'Error al obtener informes' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  try {
    const body = await request.json();
    const row = await prisma.informeTecnico.upsert({
      where:  { id: ID },
      update: { data: body },
      create: { id: ID, data: body },
    });
    return NextResponse.json(row.data);
  } catch (error) {
    console.error('PUT /api/informes-tecnicos:', error);
    return NextResponse.json({ error: 'Error al guardar informes' }, { status: 500 });
  }
}
