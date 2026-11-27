import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { parseBody } from '@/lib/schemas';
import { fechaZ, idZ, funcionarioOr404 } from '@/lib/rrhh/server';
import { TIPOS_DOCUMENTO } from '@/lib/rrhh/shared';

const Schema = z.object({
  funcionarioId: idZ, tipo: z.enum(TIPOS_DOCUMENTO), nombre: z.string().trim().min(1, 'El nombre es obligatorio').max(120),
  url: z.string().max(3_000_000).refine(u => u.startsWith('https://') || u.startsWith('data:application/pdf') || u.startsWith('data:image/'), 'Archivo inválido'),
  vence: fechaZ.optional().nullable(), notas: z.string().trim().max(300).default(''),
});

export async function POST(request: NextRequest) {
  const a = await requireRole('canManageRRHH');
  if (a instanceof NextResponse) return a;
  const p = await parseBody(request, Schema);
  if (p.error) return p.error;
  const f = await funcionarioOr404(p.data.funcionarioId);
  if (f instanceof NextResponse) return f;
  await prisma.documentoFuncionario.create({ data: { ...p.data, vence: p.data.vence || null, subidoPor: a.displayName ?? a.username } });
  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const a = await requireRole('canManageRRHH');
  if (a instanceof NextResponse) return a;
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Falta id' }, { status: 400 });
  await prisma.documentoFuncionario.deleteMany({ where: { id } });
  return NextResponse.json({ ok: true });
}
