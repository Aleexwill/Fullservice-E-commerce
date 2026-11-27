import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { parseBody } from '@/lib/schemas';
import { fechaZ, idZ, funcionarioOr404, auditar } from '@/lib/rrhh/server';
import { fmtGs } from '@/lib/rrhh/shared';

const Schema = z.object({
  funcionarioId: idZ, vigenteDesde: fechaZ, tipo: z.enum(['MENSUAL', 'JORNAL']),
  monto: z.number().int().min(1, 'El monto debe ser mayor a cero').max(1_000_000_000, 'Monto demasiado alto'), notas: z.string().trim().max(300).default(''),
});

/** Agrega un registro al historial salarial. El vigente para un período es el último con fecha de inicio anterior o igual al fin del período. */
export async function POST(request: NextRequest) {
  const a = await requireRole('canManageRRHH');
  if (a instanceof NextResponse) return a;
  const p = await parseBody(request, Schema);
  if (p.error) return p.error;
  const d = p.data;
  const f = await funcionarioOr404(d.funcionarioId);
  if (f instanceof NextResponse) return f;
  if (await prisma.salarioFuncionario.findFirst({ where: { funcionarioId: f.id, vigenteDesde: d.vigenteDesde } })) return NextResponse.json({ error: 'Ya hay un salario con esa fecha de inicio' }, { status: 409 });
  const previo = await prisma.salarioFuncionario.findFirst({ where: { funcionarioId: f.id }, orderBy: { vigenteDesde: 'desc' } });
  await prisma.salarioFuncionario.create({ data: { ...d, creadoPor: a.displayName ?? a.username } });
  await auditar(request, a, f, 'salario', previo ? `${fmtGs(previo.monto)} (${previo.tipo})` : '—', `${fmtGs(d.monto)} (${d.tipo}) desde ${d.vigenteDesde}`);
  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const a = await requireRole('canManageRRHH');
  if (a instanceof NextResponse) return a;
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Falta id' }, { status: 400 });
  const s = await prisma.salarioFuncionario.findUnique({ where: { id }, include: { funcionario: true } });
  if (!s) return NextResponse.json({ ok: true });
  // No se puede borrar un salario con el que ya se cerró una planilla (rompería el respaldo del recibo)
  const cerrada = await prisma.recibo.findFirst({ where: { funcionarioId: s.funcionarioId, planilla: { estado: 'CERRADA' } } });
  if (cerrada) return NextResponse.json({ error: 'Hay planillas cerradas de este funcionario: no se puede borrar su historial salarial' }, { status: 409 });
  await prisma.salarioFuncionario.delete({ where: { id } });
  await auditar(request, a, s.funcionario, 'salario', `${fmtGs(s.monto)} (${s.tipo})`, 'registro eliminado');
  return NextResponse.json({ ok: true });
}
