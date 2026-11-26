import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { parseBody } from '@/lib/schemas';
import { fechaZ, idZ, funcionarioOr404, auditar } from '@/lib/rrhh/server';

const Schema = z.object({ funcionarioId: idZ, cargo: z.string().trim().min(1, 'El cargo es obligatorio').max(80), area: z.string().trim().max(80).default(''), desde: fechaZ, notas: z.string().trim().max(300).default('') });

/** Registra un cambio de cargo: cierra el cargo anterior y actualiza el cargo y área vigentes del funcionario. */
export async function POST(request: NextRequest) {
  const a = await requireRole('canManageRRHH');
  if (a instanceof NextResponse) return a;
  const p = await parseBody(request, Schema);
  if (p.error) return p.error;
  const d = p.data;
  const f = await funcionarioOr404(d.funcionarioId);
  if (f instanceof NextResponse) return f;
  if (d.desde < f.fechaIngreso) return NextResponse.json({ error: 'El cargo no puede empezar antes del ingreso' }, { status: 400 });
  const abierto = await prisma.cargoHistorial.findFirst({ where: { funcionarioId: f.id, hasta: null }, orderBy: { desde: 'desc' } });
  if (abierto && d.desde <= abierto.desde) return NextResponse.json({ error: 'La fecha debe ser posterior al inicio del cargo actual' }, { status: 400 });
  await prisma.$transaction(async tx => {
    if (abierto) {
      const dia = new Date(`${d.desde}T12:00:00Z`); dia.setUTCDate(dia.getUTCDate() - 1);
      await tx.cargoHistorial.update({ where: { id: abierto.id }, data: { hasta: dia.toISOString().slice(0, 10) } });
    }
    await tx.cargoHistorial.create({ data: d });
    await tx.funcionario.update({ where: { id: f.id }, data: { cargo: d.cargo, area: d.area } });
  });
  await auditar(request, a, f, 'cargo', f.cargo || '—', d.cargo);
  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const a = await requireRole('canManageRRHH');
  if (a instanceof NextResponse) return a;
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Falta id' }, { status: 400 });
  await prisma.cargoHistorial.deleteMany({ where: { id } });
  return NextResponse.json({ ok: true });
}
