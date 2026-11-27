import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getIp } from '@/lib/rate-limit';
import { logChange } from '@/lib/audit';
import { hoy } from '@/lib/marcacion/server';
import { getRrhhConfig } from './config';
import { estadoVencimiento, fmtFecha } from './shared';
import type { EstadoVencimiento } from './shared';
import type { SessionPayload } from '@/lib/auth';

export const fechaZ = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida (AAAA-MM-DD)').refine(f => !Number.isNaN(Date.parse(f)), 'Fecha inválida');
export const idZ = z.string().min(1).max(60);

/** Verifica que el funcionario exista. Devuelve el funcionario o una respuesta 404. */
export async function funcionarioOr404(id: string) {
  const f = await prisma.funcionario.findUnique({ where: { id } });
  return f ?? NextResponse.json({ error: 'Funcionario no encontrado' }, { status: 404 });
}

export function auditar(request: NextRequest, a: SessionPayload, f: { id: string; nombre: string }, campo: string, antes: string, despues: string) {
  return logChange({
    entity: 'Funcionario', entityId: f.id, entityName: f.nombre, action: 'update', before: { [campo]: antes }, after: { [campo]: despues },
    userId: a.userId, userName: a.displayName, userIp: getIp(request),
  });
}

export interface Vencimiento {
  id: string; origen: 'DOCUMENTO' | 'EPP' | 'CAPACITACION'; funcionarioId: string; funcionario: string; detalle: string; vence: string; estado: EstadoVencimiento;
}

/** Documentos, EPP y capacitaciones vencidos o por vencer (según los días de alerta) de funcionarios activos. */
export async function listarVencimientos(): Promise<{ items: Vencimiento[]; alertaDias: number }> {
  const [cfg, docs, epps, caps] = await Promise.all([
    getRrhhConfig(),
    prisma.documentoFuncionario.findMany({ where: { vence: { not: null }, funcionario: { isActive: true } }, include: { funcionario: { select: { nombre: true } } } }),
    prisma.entregaEpp.findMany({ where: { vence: { not: null }, funcionario: { isActive: true } }, include: { funcionario: { select: { nombre: true } } } }),
    prisma.capacitacion.findMany({ where: { vence: { not: null }, funcionario: { isActive: true } }, include: { funcionario: { select: { nombre: true } } } }),
  ]);
  const h = hoy();
  const labelEpp = new Map(cfg.eppCatalogo.map(i => [i.key, i.label]));
  // De cada EPP solo cuenta la entrega más reciente por funcionario e ítem (las anteriores ya fueron repuestas)
  const ultimoEpp = new Map<string, (typeof epps)[number]>();
  for (const e of epps) { const k = `${e.funcionarioId}|${e.item}`; const p = ultimoEpp.get(k); if (!p || e.fechaEntrega > p.fechaEntrega) ultimoEpp.set(k, e); }
  const items: Vencimiento[] = [];
  const push = (v: Omit<Vencimiento, 'estado'>) => { const est = estadoVencimiento(v.vence, h, cfg.alertaDias); if (est && est !== 'VIGENTE') items.push({ ...v, estado: est }); };
  for (const d of docs) push({ id: d.id, origen: 'DOCUMENTO', funcionarioId: d.funcionarioId, funcionario: d.funcionario.nombre, detalle: `${d.nombre}`, vence: d.vence! });
  for (const e of ultimoEpp.values()) push({ id: e.id, origen: 'EPP', funcionarioId: e.funcionarioId, funcionario: e.funcionario.nombre, detalle: `Reponer ${labelEpp.get(e.item) ?? e.item} (entregado el ${fmtFecha(e.fechaEntrega)})`, vence: e.vence! });
  for (const c of caps) push({ id: c.id, origen: 'CAPACITACION', funcionarioId: c.funcionarioId, funcionario: c.funcionario.nombre, detalle: c.nombre, vence: c.vence! });
  items.sort((a, b) => a.vence.localeCompare(b.vence));
  return { items, alertaDias: cfg.alertaDias };
}
