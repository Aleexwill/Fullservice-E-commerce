export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

const SINGLETON_ID = 'seguimiento';

export async function GET(request: NextRequest) {
  const auth = await requireRole('canManagePresupuestos');
  if (auth instanceof NextResponse) return auth;
  try {
    const row = await prisma.siteSettings.findUnique({ where: { id: SINGLETON_ID } });
    const data = (row?.data as { seg?: unknown[] } | null) ?? {};
    return NextResponse.json({ seg: Array.isArray(data?.seg) ? data.seg : [] });
  } catch (error) {
    console.error('Error en GET /api/seguimiento:', error);
    return NextResponse.json({ error: 'Error al obtener seguimiento' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requireRole('canManagePresupuestos');
  if (auth instanceof NextResponse) return auth;
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
    }
    if (!body || typeof body !== 'object' || !Array.isArray((body as { seg?: unknown }).seg)) {
      return NextResponse.json({ error: 'Se requiere un array "seg"' }, { status: 400 });
    }
    const data = body as { seg: unknown[] };
    await prisma.siteSettings.upsert({
      where: { id: SINGLETON_ID },
      create: { id: SINGLETON_ID, data: data as unknown as Prisma.InputJsonValue },
      update: { data: data as unknown as Prisma.InputJsonValue },
    });
    return NextResponse.json({ seg: data.seg });
  } catch (error) {
    console.error('Error en PUT /api/seguimiento:', error);
    return NextResponse.json({ error: 'Error al guardar seguimiento' }, { status: 500 });
  }
}
