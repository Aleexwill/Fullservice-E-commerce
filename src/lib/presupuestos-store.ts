import { prisma } from './prisma';
import type { Presupuesto as PrismaPresupuesto } from '@prisma/client';
import { Prisma } from '@prisma/client';

export type PresupuestoStatus = 'nuevo' | 'en_revision' | 'cotizado' | 'aprobado' | 'en_ejecucion' | 'finalizado' | 'completado' | 'rechazado' | 'de_baja' | 'falta_presupuestar' | 'pendiente_relevo';
export type ServiceType = 'mantenimiento' | 'civil' | 'metalurgica' | 'otro';

export interface PresupuestoNote {
  id: string;
  text: string;
  createdAt: string;
}

export interface Presupuesto {
  id: string;
  code: string;
  status: PresupuestoStatus;
  serviceType: ServiceType;
  serviceTitle: string;
  customer: {
    name: string;
    email: string;
    phone: string;
    company: string;
    address: string;
  };
  description: string;
  details: string;
  estimatedValue: number | null;
  finalValue: number | null;
  estimatedDuration: string;
  priority: 'baja' | 'media' | 'alta' | 'urgente';
  source: string;
  notes: PresupuestoNote[];
  attachments: string[];
  assignedTo: string;
  scheduledDate: string;
  calculationData: any | null;
  costosData: any | null;
  seguimientoData: any | null;
  createdAt: string;
  updatedAt: string;
}

function toPresupuesto(p: PrismaPresupuesto): Presupuesto {
  return {
    id: p.id,
    code: p.code,
    status: p.status as PresupuestoStatus,
    serviceType: p.serviceType as ServiceType,
    serviceTitle: p.serviceTitle,
    customer: p.customer as Presupuesto['customer'],
    description: p.description,
    details: p.details,
    estimatedValue: p.estimatedValue === null ? null : Number(p.estimatedValue),
    finalValue: p.finalValue === null ? null : Number(p.finalValue),
    estimatedDuration: p.estimatedDuration,
    priority: p.priority as Presupuesto['priority'],
    source: p.source,
    notes: p.notes as unknown as PresupuestoNote[],
    attachments: p.attachments,
    assignedTo: p.assignedTo,
    scheduledDate: p.scheduledDate,
    calculationData: (p as any).calculationData ?? null,
    costosData: (p as any).costosData ?? null,
    seguimientoData: (p as any).seguimientoData ?? null,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

export async function getAllPresupuestos(): Promise<Presupuesto[]> {
  const all = await prisma.presupuesto.findMany({ orderBy: { createdAt: 'desc' } });
  return all.map(toPresupuesto);
}

export async function getPresupuestoById(id: string): Promise<Presupuesto | null> {
  const p = await prisma.presupuesto.findUnique({ where: { id } });
  return p ? toPresupuesto(p) : null;
}

export async function createPresupuesto(
  data: Omit<Presupuesto, 'id' | 'code' | 'createdAt' | 'updatedAt' | 'costosData' | 'seguimientoData'>
): Promise<Presupuesto> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const count = await prisma.presupuesto.count();
    const code = `PRES-${String(count + 1 + attempt).padStart(4, '0')}`;
    try {
      const p = await prisma.presupuesto.create({
        data: {
          ...data,
          code,
          estimatedValue: data.estimatedValue ?? undefined,
          finalValue: data.finalValue ?? undefined,
        } as unknown as Prisma.PresupuestoUncheckedCreateInput,
      });
      return toPresupuesto(p);
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') continue;
      throw e;
    }
  }
  throw new Error('No se pudo generar un código de presupuesto único');
}

export async function updatePresupuesto(id: string, data: Partial<Presupuesto>): Promise<Presupuesto | null> {
  const { id: _id, code: _code, createdAt: _createdAt, updatedAt: _updatedAt, ...rest } = data;
  // Build the update payload carefully:
  // - Decimal fields (estimatedValue, finalValue) must be explicitly set or omitted;
  //   passing undefined skips the field, passing null clears it.
  // - finalValue is written by costos.html on every save so the dashboard/reports
  //   always reflect the latest computed total.
  const decimalFields: Record<string, unknown> = {};
  if ('estimatedValue' in data) decimalFields.estimatedValue = rest.estimatedValue ?? null;
  if ('finalValue' in data) decimalFields.finalValue = rest.finalValue ?? null;
  const { estimatedValue: _ev, finalValue: _fv, ...scalarRest } = rest;
  try {
    const p = await prisma.presupuesto.update({
      where: { id },
      data: { ...scalarRest, ...decimalFields } as unknown as Prisma.PresupuestoUncheckedUpdateInput,
    });
    return toPresupuesto(p);
  } catch (e) {
    throw e;
  }
}

export async function addNoteToPresupuesto(id: string, text: string): Promise<Presupuesto | null> {
  const old = await prisma.presupuesto.findUnique({ where: { id } });
  if (!old) return null;
  const notes = [...(old.notes as unknown as PresupuestoNote[]), { id: Date.now().toString(36), text, createdAt: new Date().toISOString() }];
  const p = await prisma.presupuesto.update({
    where: { id },
    data: { notes: notes as unknown as Prisma.InputJsonValue },
  });
  return toPresupuesto(p);
}

export async function deletePresupuesto(id: string): Promise<boolean> {
  try {
    await prisma.presupuesto.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}

// Statuses that represent active or completed work (exclude de_baja and pre-sale stages from revenue KPIs)
const ACTIVE_STATUSES = ['aprobado', 'en_ejecucion', 'finalizado'];

export async function getPresupuestoStats() {
  const [all, segRow] = await Promise.all([
    prisma.presupuesto.findMany(),
    prisma.siteSettings.findUnique({ where: { id: 'seguimiento' } }),
  ]);

  const byStatus: Record<string, number> = {};
  const byType: Record<string, number> = {};
  const byPriority: Record<string, number> = {};
  let totalEstimated = 0;
  let totalCotizado = 0;
  let totalAprobado = 0;
  let totalFacturado = 0;
  let completedCount = 0, approvedCount = 0;

  all.forEach((p) => {
    byStatus[p.status] = (byStatus[p.status] || 0) + 1;
    byType[p.serviceType] = (byType[p.serviceType] || 0) + 1;
    byPriority[p.priority] = (byPriority[p.priority] || 0) + 1;
    if (p.estimatedValue !== null) totalEstimated += Number(p.estimatedValue);
    if (p.status !== 'de_baja' && p.finalValue !== null) totalCotizado += Number(p.finalValue);
    if (ACTIVE_STATUSES.includes(p.status) && p.finalValue !== null) totalAprobado += Number(p.finalValue);
    if (p.status === 'finalizado' && p.finalValue !== null) totalFacturado += Number(p.finalValue);
    if (p.status === 'finalizado') completedCount++;
    if (ACTIVE_STATUSES.includes(p.status)) approvedCount++;
  });

  const nuevos = all.filter((p) => ['nuevo', 'falta_presupuestar', 'pendiente_relevo'].includes(p.status)).length;
  const enEjecucion = all.filter((p) => p.status === 'en_ejecucion').length;
  const conversionRate = all.length > 0 ? Math.round((approvedCount / all.length) * 100) : 0;

  // Seguimiento pipeline stats — sourced from the dedicated seguimiento store
  interface SegEntry { id: string; cerrado: '' | 'aprobado' | 'perdido' | 'pausado'; envio: string; }
  const segData = segRow?.data as { seg?: SegEntry[] } | null;
  const seg: SegEntry[] = Array.isArray(segData?.seg) ? (segData!.seg as SegEntry[]) : [];
  const segTotal = seg.length;
  const segActivos = seg.filter((e) => e.cerrado === '').length;
  const segAprobados = seg.filter((e) => e.cerrado === 'aprobado').length;
  const segPerdidos = seg.filter((e) => e.cerrado === 'perdido').length;
  const segPausados = seg.filter((e) => e.cerrado === 'pausado').length;
  const segConversionRate = segTotal > 0 ? Math.round((segAprobados / segTotal) * 100) : 0;

  return {
    total: all.length, nuevos, enEjecucion, completedCount, approvedCount, conversionRate,
    totalEstimated, totalCotizado, totalAprobado, totalFacturado,
    totalFinal: totalAprobado,
    byStatus, byType, byPriority,
    seguimiento: { total: segTotal, activos: segActivos, aprobados: segAprobados, perdidos: segPerdidos, pausados: segPausados, conversionRate: segConversionRate },
  };
}
