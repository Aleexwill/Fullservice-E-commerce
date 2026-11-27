export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getRrhhConfig, normalizarConfig, CONFIG_DEFAULT } from '@/lib/rrhh/config';

export async function GET() {
  const a = await requireRole('canManageRRHH');
  if (a instanceof NextResponse) return a;
  return NextResponse.json({ config: await getRrhhConfig(), porDefecto: CONFIG_DEFAULT });
}

export async function PUT(request: NextRequest) {
  const a = await requireRole('canManageRRHH');
  if (a instanceof NextResponse) return a;
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  const cfg = normalizarConfig(body);
  await prisma.rrhhConfig.upsert({ where: { id: 'default' }, create: { id: 'default', data: cfg as object }, update: { data: cfg as object } });
  return NextResponse.json({ config: cfg });
}
