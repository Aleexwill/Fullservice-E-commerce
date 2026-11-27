import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { parseBody } from '@/lib/schemas';
import { fechaZ, idZ, funcionarioOr404 } from '@/lib/rrhh/server';

const Schema = z.object({
  funcionarioId: idZ, nombre: z.string().trim().min(1, 'El nombre es obligatorio').max(120), fecha: fechaZ, horas: z.number().int().min(0).max(2000).default(0),
  entidad: z.string().trim().max(120).default(''), vence: fechaZ.optional().nullable(),
  certificadoUrl: z.string().max(3_000_000).refine(u => u.startsWith('https://') || u.startsWith('data:application/pdf') || u.startsWith('data:image/'), 'Archivo inválido').optional().nullable(),
  notas: z.string().trim().max(300).default(''),
});

export async function POST(request: NextRequest) {
  const a = await requireRole('canManageRRHH');
  if (a instanceof NextResponse) return a;
  const p = await parseBody(request, Schema);
  if (p.error) return p.error;
  const d = p.data;
  const f = await funcionarioOr404(d.funcionarioId);
  if (f instanceof NextResponse) return f;
  if (d.vence && d.vence < d.fecha) return NextResponse.json({ error: 'El vencimiento no puede ser anterior a la fecha' }, { status: 400 });
  await prisma.capacitacion.create({ data: { ...d, vence: d.vence || null, certificadoUrl: d.certificadoUrl || null } });
  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const a = await requireRole('canManageRRHH');
  if (a instanceof NextResponse) return a;
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Falta id' }, { status: 400 });
  await prisma.capacitacion.deleteMany({ where: { id } });
  return NextResponse.json({ ok: true });
}
