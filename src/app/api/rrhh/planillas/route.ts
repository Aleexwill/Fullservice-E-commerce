export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { parseBody } from '@/lib/schemas';
import { logChange } from '@/lib/audit';
import { getIp } from '@/lib/rate-limit';
import { calcularPlanilla } from '@/lib/rrhh/planilla-server';

export async function GET() {
  const a = await requireRole('canManageRRHH');
  if (a instanceof NextResponse) return a;
  const pls = await prisma.planilla.findMany({ orderBy: [{ periodo: 'desc' }, { tipo: 'asc' }], include: { recibos: { select: { totalHaberes: true, totalDescuentos: true, neto: true, aporteIpsPatronal: true } } } });
  return NextResponse.json(pls.map(p => ({
    id: p.id, periodo: p.periodo, tipo: p.tipo, estado: p.estado, cerradaPor: p.cerradaPor, cerradaAt: p.cerradaAt?.toISOString() ?? null,
    recibos: p.recibos.length, totalHaberes: p.recibos.reduce((s, r) => s + r.totalHaberes, 0), totalDescuentos: p.recibos.reduce((s, r) => s + r.totalDescuentos, 0),
    neto: p.recibos.reduce((s, r) => s + r.neto, 0), aportePatronal: p.recibos.reduce((s, r) => s + r.aporteIpsPatronal, 0),
  })));
}

const Schema = z.object({ periodo: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Período inválido (AAAA-MM)'), tipo: z.enum(['MENSUAL', 'AGUINALDO']).default('MENSUAL') });

/** Crea una planilla en borrador y calcula sus recibos. El aguinaldo se identifica con el año (se guarda como AAAA-12). */
export async function POST(request: NextRequest) {
  const a = await requireRole('canManageRRHH');
  if (a instanceof NextResponse) return a;
  const p = await parseBody(request, Schema);
  if (p.error) return p.error;
  const tipo = p.data.tipo ?? 'MENSUAL';
  const periodo = tipo === 'AGUINALDO' ? `${p.data.periodo.slice(0, 4)}-12` : p.data.periodo;
  if (await prisma.planilla.findUnique({ where: { periodo_tipo: { periodo, tipo: tipo } } })) return NextResponse.json({ error: 'Ya existe una planilla para ese período' }, { status: 409 });
  const pl = await prisma.planilla.create({ data: { periodo, tipo: tipo, creadaPor: a.displayName ?? a.username } });
  const r = await calcularPlanilla(pl.id);
  if (r.error) return NextResponse.json({ error: r.error }, { status: 500 });
  await logChange({ entity: 'Planilla', entityId: pl.id, entityName: `${tipo === 'AGUINALDO' ? 'Aguinaldo' : 'Sueldos'} ${periodo}`, action: 'create', after: { estado: 'BORRADOR' }, userId: a.userId, userName: a.displayName, userIp: getIp(request) });
  return NextResponse.json({ id: pl.id }, { status: 201 });
}
