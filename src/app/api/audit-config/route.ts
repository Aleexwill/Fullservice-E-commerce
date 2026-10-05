export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AUDIT_DEFAULTS, type AuditField } from '@/lib/audit';

function toJson(v: unknown): Prisma.InputJsonValue {
  return v as Prisma.InputJsonValue;
}

export async function GET(req: NextRequest) {
  const auth = await requireRole('canManageConfig');
  if (auth instanceof NextResponse) return auth;

  const entity = new URL(req.url).searchParams.get('entity');
  if (!entity) {
    const configs = await prisma.auditConfig.findMany();
    const result: Record<string, AuditField[]> = {};
    for (const [ent, defaults] of Object.entries(AUDIT_DEFAULTS)) {
      const found = configs.find((c) => c.entity === ent);
      result[ent] = found ? (found.fields as unknown as AuditField[]) : defaults;
    }
    return NextResponse.json(result);
  }

  let config = await prisma.auditConfig.findUnique({ where: { entity } });
  if (!config) {
    config = await prisma.auditConfig.upsert({
      where: { entity },
      create: { entity, fields: toJson(AUDIT_DEFAULTS[entity] ?? []) },
      update: {},
    });
  }
  return NextResponse.json(config.fields);
}

export async function PUT(req: NextRequest) {
  const auth = await requireRole('canManageConfig');
  if (auth instanceof NextResponse) return auth;

  const body = await req.json();
  const { entity, fields }: { entity: string; fields: AuditField[] } = body;
  if (!entity || !Array.isArray(fields)) {
    return NextResponse.json({ error: 'entity y fields requeridos' }, { status: 400 });
  }

  const config = await prisma.auditConfig.upsert({
    where: { entity },
    create: { entity, fields: toJson(fields) },
    update: { fields: toJson(fields) },
  });
  return NextResponse.json(config.fields);
}
