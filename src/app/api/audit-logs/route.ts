export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const auth = await requireRole('canManageConfig');
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  const entity  = searchParams.get('entity') ?? undefined;
  const action  = searchParams.get('action') ?? undefined;
  const userId  = searchParams.get('userId') ?? undefined;
  const from    = searchParams.get('from');
  const to      = searchParams.get('to');
  const page    = Math.max(1, Number(searchParams.get('page') ?? 1));
  const limit   = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? 50)));

  const where: Record<string, unknown> = {};
  if (entity) where.entity = entity;
  if (action) where.action = action;
  if (userId) where.userId = userId;
  if (from || to) {
    where.createdAt = {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to   ? { lte: new Date(to)   } : {}),
    };
  }

  const [total, logs] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return NextResponse.json({ total, page, limit, logs });
}
