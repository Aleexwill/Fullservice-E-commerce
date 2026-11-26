export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logChange } from '@/lib/audit';
import { getIp } from '@/lib/rate-limit';
import { getConfigIa, normalizarConfigIa } from '@/lib/ia/config';

export async function GET() {
  const a = await requireRole('canManageConfig');
  if (a instanceof NextResponse) return a;
  return NextResponse.json(await getConfigIa());
}

/** Guarda interruptores, límites y tarifas. Los cambios quedan en el Log de cambios. */
export async function PUT(request: NextRequest) {
  const a = await requireRole('canManageConfig');
  if (a instanceof NextResponse) return a;
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  const antes = await getConfigIa();
  const cfg = normalizarConfigIa({ ...body, depuracion: antes.depuracion });
  await prisma.iaConfig.upsert({ where: { id: 'default' }, create: { id: 'default', data: cfg as object }, update: { data: cfg as object } });
  const resumen = (c: typeof cfg) => `${c.global.activo ? 'activa' : 'DESACTIVADA'}; límite mensual ${c.global.limiteMensualLlamadas ?? 'sin límite'} llamadas / ${c.global.limiteMensualUsd ?? 'sin límite'} USD; funciones apagadas: ${Object.entries(c.funciones).filter(([, f]) => !f.activo).map(([k]) => k).join(', ') || 'ninguna'}`;
  if (resumen(antes) !== resumen(cfg)) {
    await logChange({ entity: 'ConfigIA', entityId: 'default', entityName: 'Configuración de IA', action: 'update', before: { config: resumen(antes) }, after: { config: resumen(cfg) }, userId: a.userId, userName: a.displayName, userIp: getIp(request) });
  }
  return NextResponse.json(cfg);
}
