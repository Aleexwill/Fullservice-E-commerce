import { prisma } from './prisma';
import type { Presupuesto as PrismaPresupuesto } from '@prisma/client';
import { Prisma } from '@prisma/client';

export type PresupuestoStatus = 'nuevo' | 'en_revision' | 'cotizado' | 'aprobado' | 'en_ejecucion' | 'completado' | 'rechazado';
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
  data: Omit<Presupuesto, 'id' | 'code' | 'createdAt' | 'updatedAt'>
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
  try {
    const p = await prisma.presupuesto.update({
      where: { id },
      data: {
        ...rest,
        estimatedValue: rest.estimatedValue ?? undefined,
        finalValue: rest.finalValue ?? undefined,
      } as unknown as Prisma.PresupuestoUncheckedUpdateInput,
    });
    return toPresupuesto(p);
  } catch {
    return null;
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

export async function getPresupuestoStats() {
  const all = await prisma.presupuesto.findMany();
  const byStatus: Record<string, number> = {};
  const byType: Record<string, number> = {};
  const byPriority: Record<string, number> = {};
  let totalEstimated = 0, totalFinal = 0, completedCount = 0, approvedCount = 0;

  all.forEach((p) => {
    byStatus[p.status] = (byStatus[p.status] || 0) + 1;
    byType[p.serviceType] = (byType[p.serviceType] || 0) + 1;
    byPriority[p.priority] = (byPriority[p.priority] || 0) + 1;
    if (p.estimatedValue) totalEstimated += Number(p.estimatedValue);
    if (p.finalValue) totalFinal += Number(p.finalValue);
    if (p.status === 'completado') completedCount++;
    if (p.status === 'aprobado' || p.status === 'en_ejecucion' || p.status === 'completado') approvedCount++;
  });

  const nuevos = all.filter((p) => p.status === 'nuevo').length;
  const enEjecucion = all.filter((p) => p.status === 'en_ejecucion').length;
  const conversionRate = all.length > 0 ? Math.round((approvedCount / all.length) * 100) : 0;

  return { total: all.length, nuevos, enEjecucion, completedCount, approvedCount, conversionRate, totalEstimated, totalFinal, byStatus, byType, byPriority };
}
