export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logChange } from '@/lib/audit';
import { getIp } from '@/lib/rate-limit';
import { calcularPlanilla } from '@/lib/rrhh/planilla-server';
import { normalizarReglas } from '@/lib/rrhh/config';
import { UMBRAL_AUSENCIAS_REVISAR } from '@/lib/rrhh/planilla';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const a = await requireRole('canManageRRHH');
  if (a instanceof NextResponse) return a;
  const pl = await prisma.planilla.findUnique({ where: { id: params.id }, include: { recibos: { orderBy: { nombre: 'asc' } } } });
  if (!pl) return NextResponse.json({ error: 'No encontrada' }, { status: 404 });
  const conceptos = await prisma.conceptoPlanilla.findMany({ where: { periodo: pl.periodo, planilla: pl.tipo }, orderBy: { createdAt: 'asc' } });
  const funcionarios = await prisma.funcionario.findMany({ where: { isActive: true }, select: { id: true, nombre: true }, orderBy: { nombre: 'asc' } });
  return NextResponse.json({
    planilla: { id: pl.id, periodo: pl.periodo, tipo: pl.tipo, estado: pl.estado, cerradaPor: pl.cerradaPor, cerradaAt: pl.cerradaAt?.toISOString() ?? null, reglas: normalizarReglas(pl.reglas) },
    recibos: pl.recibos.map(r => ({ id: r.id, funcionarioId: r.funcionarioId, nombre: r.nombre, documento: r.documento, cargo: r.cargo, detalle: r.detalle, asistencia: r.asistencia, advertencias: r.advertencias, totalHaberes: r.totalHaberes, totalDescuentos: r.totalDescuentos, neto: r.neto, aportePatronal: r.aporteIpsPatronal })),
    conceptos, funcionarios,
  });
}

/** accion: calcular (recalcula con las reglas actuales) | cerrar (congela) | reabrir. */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const a = await requireRole('canManageRRHH');
  if (a instanceof NextResponse) return a;
  const { accion, confirmar } = await request.json().catch(() => ({ accion: '', confirmar: false }));
  const pl = await prisma.planilla.findUnique({ where: { id: params.id }, include: { recibos: { select: { nombre: true, neto: true, asistencia: true } } } });
  if (!pl) return NextResponse.json({ error: 'No encontrada' }, { status: 404 });
  const nombre = `${pl.tipo === 'AGUINALDO' ? 'Aguinaldo' : 'Sueldos'} ${pl.periodo}`;
  const log = (antes: string, despues: string) => logChange({ entity: 'Planilla', entityId: pl.id, entityName: nombre, action: 'update', before: { estado: antes }, after: { estado: despues }, userId: a.userId, userName: a.displayName, userIp: getIp(request) });

  if (accion === 'calcular') {
    const r = await calcularPlanilla(pl.id);
    return r.error ? NextResponse.json({ error: r.error }, { status: 409 }) : NextResponse.json({ ok: true });
  }
  if (accion === 'cerrar') {
    if (pl.estado === 'CERRADA') return NextResponse.json({ error: 'Ya está cerrada' }, { status: 409 });
    if (pl.recibos.length === 0) return NextResponse.json({ error: 'La planilla no tiene recibos' }, { status: 409 });
    if (pl.recibos.some(r => r.neto < 0)) return NextResponse.json({ error: 'Hay recibos con neto negativo: corregilos antes de cerrar' }, { status: 409 });
    // Antes de congelar se recalcula con lo último cargado, para no cerrar con datos viejos
    const rc = await calcularPlanilla(pl.id);
    if (rc.error) return NextResponse.json({ error: rc.error }, { status: 409 });
    // Salvaguarda: muchas ausencias sin aviso suelen indicar que no se marcó asistencia; hay que confirmarlo expresamente
    const actualizados = await prisma.recibo.findMany({ where: { planillaId: pl.id }, select: { nombre: true, neto: true, asistencia: true } });
    const sospechosos = actualizados.filter(r => ((r.asistencia as { ausenciasSinAviso?: number })?.ausenciasSinAviso ?? 0) >= UMBRAL_AUSENCIAS_REVISAR);
    if (sospechosos.length > 0 && confirmar !== true) {
      return NextResponse.json({
        error: `${sospechosos.length} recibo${sospechosos.length > 1 ? 's tienen' : ' tiene'} muchas ausencias sin aviso (${sospechosos.map(r => r.nombre).join(', ')}). Verificá que se haya marcado asistencia antes de cerrar.`,
        requiereConfirmacion: true,
      }, { status: 409 });
    }
    if (actualizados.some(r => r.neto < 0)) return NextResponse.json({ error: 'Hay recibos con neto negativo: corregilos antes de cerrar' }, { status: 409 });
    await prisma.planilla.update({ where: { id: pl.id }, data: { estado: 'CERRADA', cerradaPor: a.displayName ?? a.username, cerradaAt: new Date() } });
    await log('BORRADOR', 'CERRADA');
    return NextResponse.json({ ok: true });
  }
  if (accion === 'reabrir') {
    if (pl.estado !== 'CERRADA') return NextResponse.json({ error: 'No está cerrada' }, { status: 409 });
    if (pl.tipo === 'MENSUAL') {
      const aguinaldoCerrado = await prisma.planilla.findFirst({ where: { tipo: 'AGUINALDO', estado: 'CERRADA', periodo: { startsWith: pl.periodo.slice(0, 4) } } });
      if (aguinaldoCerrado) return NextResponse.json({ error: 'Hay un aguinaldo cerrado de ese año que se calculó con esta planilla. Reabrí primero el aguinaldo.' }, { status: 409 });
    }
    await prisma.planilla.update({ where: { id: pl.id }, data: { estado: 'BORRADOR', cerradaPor: '', cerradaAt: null } });
    await log('CERRADA', 'BORRADOR');
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: 'Acción inválida' }, { status: 400 });
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const a = await requireRole('canManageRRHH');
  if (a instanceof NextResponse) return a;
  const pl = await prisma.planilla.findUnique({ where: { id: params.id } });
  if (!pl) return NextResponse.json({ ok: true });
  if (pl.estado === 'CERRADA') return NextResponse.json({ error: 'No se puede borrar una planilla cerrada. Reabrila primero.' }, { status: 409 });
  await prisma.planilla.delete({ where: { id: pl.id } });
  await logChange({ entity: 'Planilla', entityId: pl.id, entityName: `${pl.tipo === 'AGUINALDO' ? 'Aguinaldo' : 'Sueldos'} ${pl.periodo}`, action: 'delete', userId: a.userId, userName: a.displayName, userIp: getIp(request) });
  return NextResponse.json({ ok: true });
}
