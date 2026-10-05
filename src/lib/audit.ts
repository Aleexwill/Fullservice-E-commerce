import { Prisma } from '@prisma/client';
import { prisma } from './prisma';
import type { NextRequest } from 'next/server';

export type AuditAction = 'create' | 'update' | 'delete';

export interface FieldChange {
  field: string;
  label: string;
  from: unknown;
  to: unknown;
}

export interface AuditField {
  key: string;
  label: string;
  tracked: boolean;
}

// Default field configs per entity — seeded on first access
export const AUDIT_DEFAULTS: Record<string, AuditField[]> = {
  Product: [
    { key: 'name',                label: 'Nombre',            tracked: true  },
    { key: 'sku',                 label: 'SKU',               tracked: true  },
    { key: 'price',               label: 'Precio venta',      tracked: true  },
    { key: 'costPrice',           label: 'Costo',             tracked: true  },
    { key: 'compareAtPrice',      label: 'Precio anterior',   tracked: true  },
    { key: 'stock',               label: 'Stock',             tracked: true  },
    { key: 'category',            label: 'Categoría',         tracked: true  },
    { key: 'brand',               label: 'Marca',             tracked: false },
    { key: 'isActive',            label: 'Activo',            tracked: true  },
    { key: 'isFeatured',          label: 'Destacado',         tracked: false },
    { key: 'promoDiscountPercent',label: 'Descuento promo %', tracked: true  },
    { key: 'promoStartsAt',       label: 'Promo inicio',      tracked: false },
    { key: 'promoEndsAt',         label: 'Promo fin',         tracked: false },
    { key: 'description',         label: 'Descripción',       tracked: false },
    { key: 'shortDescription',    label: 'Desc. corta',       tracked: false },
    { key: 'images',              label: 'Imágenes',          tracked: false },
    { key: 'tags',                label: 'Tags',              tracked: false },
    { key: 'specifications',      label: 'Especificaciones',  tracked: false },
  ],
  Pedido: [
    { key: 'status',        label: 'Estado',          tracked: true  },
    { key: 'paymentStatus', label: 'Estado de pago',  tracked: true  },
    { key: 'total',         label: 'Total',           tracked: true  },
    { key: 'notes',         label: 'Notas',           tracked: false },
  ],
  Presupuesto: [
    { key: 'estado',        label: 'Estado',          tracked: true  },
    { key: 'total',         label: 'Total',           tracked: true  },
    { key: 'titulo',        label: 'Título',          tracked: false },
    { key: 'notas',         label: 'Notas',           tracked: false },
  ],
  Cliente: [
    { key: 'name',    label: 'Nombre',  tracked: true  },
    { key: 'email',   label: 'Email',   tracked: true  },
    { key: 'phone',   label: 'Teléfono',tracked: false },
    { key: 'address', label: 'Dirección',tracked: false },
  ],
  Lead: [
    { key: 'status',         label: 'Etapa',           tracked: true  },
    { key: 'priority',       label: 'Prioridad',       tracked: true  },
    { key: 'estimatedValue', label: 'Valor estimado',  tracked: true  },
    { key: 'assignedTo',     label: 'Asignado a',      tracked: true  },
    { key: 'source',         label: 'Fuente',          tracked: false },
    { key: 'subject',        label: 'Asunto',          tracked: false },
    { key: 'lostReason',     label: 'Motivo pérdida',  tracked: true  },
    { key: 'nextFollowUp',   label: 'Próx. seguimiento',tracked: false },
    { key: 'tags',           label: 'Tags',            tracked: false },
  ],
};

async function getTrackedFields(entity: string): Promise<Set<string>> {
  try {
    let config = await prisma.auditConfig.findUnique({ where: { entity } });
    if (!config) {
      const defaults = AUDIT_DEFAULTS[entity] ?? [];
      config = await prisma.auditConfig.upsert({
        where: { entity },
        create: { entity, fields: defaults as unknown as Prisma.InputJsonValue },
        update: {},
      });
    }
    const fields = config.fields as unknown as AuditField[];
    return new Set(fields.filter((f) => f.tracked).map((f) => f.key));
  } catch {
    // fallback: track all known defaults
    return new Set((AUDIT_DEFAULTS[entity] ?? []).filter((f) => f.tracked).map((f) => f.key));
  }
}

function fieldLabel(entity: string, key: string): string {
  return AUDIT_DEFAULTS[entity]?.find((f) => f.key === key)?.label ?? key;
}

function serialize(v: unknown): string {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'boolean') return v ? 'Sí' : 'No';
  if (Array.isArray(v)) return v.join(', ') || '—';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

export async function logChange(opts: {
  entity: string;
  entityId: string;
  entityName?: string;
  action: AuditAction;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  userId?: string;
  userName?: string;
  userIp?: string;
}) {
  try {
    const { entity, entityId, entityName = '', action, before, after, userId, userName = 'Sistema', userIp = '' } = opts;

    let changes: FieldChange[] = [];

    if (action === 'update' && before && after) {
      const tracked = await getTrackedFields(entity);
      const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);
      for (const key of allKeys) {
        if (!tracked.has(key)) continue;
        const oldVal = before[key];
        const newVal = after[key];
        // Skip unchanged
        if (JSON.stringify(oldVal) === JSON.stringify(newVal)) continue;
        changes.push({ field: key, label: fieldLabel(entity, key), from: serialize(oldVal), to: serialize(newVal) });
      }
      if (changes.length === 0) return; // nothing tracked changed
    } else if (action === 'create' && after) {
      const tracked = await getTrackedFields(entity);
      for (const key of Object.keys(after)) {
        if (!tracked.has(key)) continue;
        const val = after[key];
        if (val === null || val === undefined || val === '' || (Array.isArray(val) && val.length === 0)) continue;
        changes.push({ field: key, label: fieldLabel(entity, key), from: '—', to: serialize(val) });
      }
    } else if (action === 'delete') {
      changes = [];
    }

    await prisma.auditLog.create({
      data: { entity, entityId, entityName, action, userId, userName, userIp, changes: changes as unknown as Prisma.InputJsonValue },
    });
  } catch (e) {
    // Never crash the main request because of audit failure
    console.error('[audit] logChange failed:', e);
  }
}

export function getIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? req.headers.get('x-real-ip') ?? '';
}
