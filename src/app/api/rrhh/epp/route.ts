import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { parseBody } from '@/lib/schemas';
import { fechaZ, idZ, funcionarioOr404 } from '@/lib/rrhh/server';
import { getRrhhConfig } from '@/lib/rrhh/config';
import { sumarMeses } from '@/lib/rrhh/shared';

const Schema = z.object({
  funcionarioId: idZ, item: z.string().regex(/^[a-z0-9_]{1,30}$/), cantidad: z.number().int().min(1).max(100).default(1),
  talle: z.string().trim().max(20).default(''), fechaEntrega: fechaZ, observacion: z.string().trim().max(200).default(''),
});

/** Registra la entrega de un EPP. La fecha de reposición sale de la vida útil del ítem en el catálogo. */
export async function POST(request: NextRequest) {
  const a = await requireRole('canManageRRHH');
  if (a instanceof NextResponse) return a;
  const p = await parseBody(request, Schema);
  if (p.error) return p.error;
  const d = p.data;
  const f = await funcionarioOr404(d.funcionarioId);
  if (f instanceof NextResponse) return f;
  const cfg = await getRrhhConfig();
  const it = cfg.eppCatalogo.find(i => i.key === d.item);
  if (!it) return NextResponse.json({ error: 'Ese ítem no está en el catálogo de EPP' }, { status: 400 });
  await prisma.entregaEpp.create({ data: { ...d, vence: it.vidaUtilMeses > 0 ? sumarMeses(d.fechaEntrega, it.vidaUtilMeses) : null, entregadoPor: a.displayName ?? a.username } });
  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const a = await requireRole('canManageRRHH');
  if (a instanceof NextResponse) return a;
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Falta id' }, { status: 400 });
  await prisma.entregaEpp.deleteMany({ where: { id } });
  return NextResponse.json({ ok: true });
}
