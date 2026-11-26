import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { parseBody } from '@/lib/schemas';
import { idZ, funcionarioOr404 } from '@/lib/rrhh/server';
import { calcularPlanilla } from '@/lib/rrhh/planilla-server';

const Schema = z.object({
  funcionarioId: idZ, periodo: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/), planilla: z.enum(['MENSUAL', 'AGUINALDO']).default('MENSUAL'),
  tipo: z.enum(['HABER', 'DESCUENTO']), nombre: z.string().trim().min(1, 'El concepto es obligatorio').max(80),
  monto: z.number().int().min(1, 'El monto debe ser mayor a cero').max(1_000_000_000), imponible: z.boolean().default(false), notas: z.string().trim().max(200).default(''),
});

async function planillaAbierta(periodo: string, tipo: string) {
  const pl = await prisma.planilla.findUnique({ where: { periodo_tipo: { periodo, tipo } } });
  if (pl?.estado === 'CERRADA') return { error: 'La planilla de ese período está cerrada. Reabrila para modificar conceptos.', pl };
  return { pl };
}

/** Agrega un concepto manual (bonificación, anticipo, préstamo, descuento) y recalcula la planilla si está en borrador. */
export async function POST(request: NextRequest) {
  const a = await requireRole('canManageRRHH');
  if (a instanceof NextResponse) return a;
  const p = await parseBody(request, Schema);
  if (p.error) return p.error;
  const d = p.data;
  const f = await funcionarioOr404(d.funcionarioId);
  if (f instanceof NextResponse) return f;
  const planilla = d.planilla ?? 'MENSUAL';
  const periodo = planilla === 'AGUINALDO' ? `${d.periodo.slice(0, 4)}-12` : d.periodo;
  const { error, pl } = await planillaAbierta(periodo, planilla);
  if (error) return NextResponse.json({ error }, { status: 409 });
  await prisma.conceptoPlanilla.create({ data: { ...d, planilla, periodo, creadoPor: a.displayName ?? a.username } });
  if (pl) await calcularPlanilla(pl.id);
  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const a = await requireRole('canManageRRHH');
  if (a instanceof NextResponse) return a;
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Falta id' }, { status: 400 });
  const c = await prisma.conceptoPlanilla.findUnique({ where: { id } });
  if (!c) return NextResponse.json({ ok: true });
  const { error, pl } = await planillaAbierta(c.periodo, c.planilla);
  if (error) return NextResponse.json({ error }, { status: 409 });
  await prisma.conceptoPlanilla.delete({ where: { id } });
  if (pl) await calcularPlanilla(pl.id);
  return NextResponse.json({ ok: true });
}
