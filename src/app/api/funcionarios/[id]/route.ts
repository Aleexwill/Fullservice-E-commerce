import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { parseBody } from '@/lib/schemas';
import { logChange } from '@/lib/audit';
import { getIp } from '@/lib/rate-limit';
import { hoy } from '@/lib/marcacion/server';
import { FuncionarioSchema, validarFuncionario } from '@/lib/funcionarios-schema';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const a = await requireRole('canManageUsers');
  if (a instanceof NextResponse) return a;
  const before = await prisma.funcionario.findUnique({ where: { id: params.id } });
  if (!before) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  const parsed = await parseBody(request, FuncionarioSchema);
  if (parsed.error) return parsed.error;
  const d = parsed.data;
  const err = await validarFuncionario(d, params.id);
  if (err) return NextResponse.json({ error: err }, { status: 400 });
  try {
    const f = await prisma.funcionario.update({ where: { id: params.id }, data: { ...d, documento: d.documento || null, fechaEgreso: d.fechaEgreso || null, userId: d.userId || null } });
    const pick = (x: typeof f) => ({ nombre: x.nombre, documento: x.documento, cargo: x.cargo, userId: x.userId, fechaIngreso: x.fechaIngreso, fechaEgreso: x.fechaEgreso, isActive: x.isActive });
    await logChange({ entity: 'Funcionario', entityId: f.id, entityName: f.nombre, action: 'update', before: pick(before), after: pick(f), userId: a.userId, userName: a.displayName, userIp: getIp(request) });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if ((e as { code?: string })?.code === 'P2002') return NextResponse.json({ error: 'Ya existe un funcionario con ese documento' }, { status: 409 });
    console.error('PUT /api/funcionarios/[id]:', e);
    return NextResponse.json({ error: 'Error al guardar' }, { status: 500 });
  }
}

/** Baja lógica: se conserva el historial (jornadas, reportes). Fija el egreso a hoy si no tiene. */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const a = await requireRole('canManageUsers');
  if (a instanceof NextResponse) return a;
  const f = await prisma.funcionario.findUnique({ where: { id: params.id } });
  if (!f) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  await prisma.funcionario.update({ where: { id: f.id }, data: { isActive: false, fechaEgreso: f.fechaEgreso ?? hoy() } });
  await logChange({ entity: 'Funcionario', entityId: f.id, entityName: f.nombre, action: 'delete', userId: a.userId, userName: a.displayName, userIp: getIp(request) });
  return NextResponse.json({ ok: true });
}
