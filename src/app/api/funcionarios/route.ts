export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { parseBody } from '@/lib/schemas';
import { FuncionarioSchema, validarFuncionario } from '@/lib/funcionarios-schema';
import { logChange } from '@/lib/audit';
import { getIp } from '@/lib/rate-limit';
import { listarFuncionarios } from '@/lib/funcionarios-store';

export async function GET() {
  const a = await requireRole('canManageUsers');
  if (a instanceof NextResponse) return a;
  try { return NextResponse.json(await listarFuncionarios()); }
  catch (e) { console.error('GET /api/funcionarios:', e); return NextResponse.json({ error: 'Error al cargar' }, { status: 500 }); }
}

export async function POST(request: NextRequest) {
  const a = await requireRole('canManageUsers');
  if (a instanceof NextResponse) return a;
  const parsed = await parseBody(request, FuncionarioSchema);
  if (parsed.error) return parsed.error;
  const d = parsed.data;
  const err = await validarFuncionario(d);
  if (err) return NextResponse.json({ error: err }, { status: 400 });
  try {
    const f = await prisma.funcionario.create({ data: { ...d, documento: d.documento || null, fechaEgreso: d.fechaEgreso || null, userId: d.userId || null } });
    await logChange({ entity: 'Funcionario', entityId: f.id, entityName: f.nombre, action: 'create', userId: a.userId, userName: a.displayName, userIp: getIp(request), after: { fechaIngreso: f.fechaIngreso, cargo: f.cargo, userId: f.userId } });
    return NextResponse.json({ id: f.id }, { status: 201 });
  } catch (e) {
    if ((e as { code?: string })?.code === 'P2002') return NextResponse.json({ error: 'Ya existe un funcionario con ese documento' }, { status: 409 });
    console.error('POST /api/funcionarios:', e);
    return NextResponse.json({ error: 'Error al guardar' }, { status: 500 });
  }
}
