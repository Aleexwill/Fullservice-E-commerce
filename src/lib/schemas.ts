import { z } from 'zod';
import { NextResponse } from 'next/server';

// Helper: parse + validate a request body, return typed data or a 400 response
export async function parseBody<T>(
  request: Request,
  schema: z.ZodType<T>,
): Promise<{ data: T; error: null } | { data: null; error: NextResponse }> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return { data: null, error: NextResponse.json({ error: 'JSON inválido' }, { status: 400 }) };
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    const message = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
    return { data: null, error: NextResponse.json({ error: message }, { status: 400 }) };
  }
  return { data: result.data, error: null };
}

const VALID_ROLES = ['admin', 'vendedor', 'tecnico'] as const;

// ── Usuarios ──────────────────────────────────────────────────────────────────

export const CreateUserSchema = z.object({
  email: z.string().email('Email inválido').max(254),
  name: z.string().min(1, 'El nombre es obligatorio').max(120),
  role: z.enum(VALID_ROLES, { errorMap: () => ({ message: 'Rol inválido' }) }),
  password: z.string().min(6, 'La contraseña temporal debe tener al menos 6 caracteres').max(128),
});

export const UpdateUserSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  role: z.enum(VALID_ROLES).optional(),
  isActive: z.boolean().optional(),
}).refine(d => Object.keys(d).length > 0, { message: 'Se requiere al menos un campo' });

// ── Clientes ──────────────────────────────────────────────────────────────────

export const CreateClienteSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio').max(200),
  company: z.string().max(200).optional().default(''),
  email: z.string().email('Email inválido').max(254).optional().or(z.literal('')).default(''),
  phone: z.string().max(30).optional().default(''),
  address: z.string().max(300).optional().default(''),
  ruc: z.string().max(30).optional().default(''),
  category: z.string().max(60).optional().default('servicios'),
  notes: z.string().max(2000).optional().default(''),
  leadId: z.string().max(100).optional().default(''),
});

// ── Leads ─────────────────────────────────────────────────────────────────────

const CustomerSchema = z.object({
  name: z.string().min(1, 'El nombre del cliente es obligatorio').max(200),
  email: z.union([z.string().email().max(254), z.literal('')]).default(''),
  phone: z.string().max(30).default(''),
  company: z.string().max(200).default(''),
  position: z.string().max(100).default(''),
  avatar: z.string().max(500).default(''),
});

export const CreateLeadSchema = z.object({
  customer: CustomerSchema,
  subject: z.string().min(1, 'El asunto es obligatorio').max(300),
  message: z.string().max(5000).default(''),
  status: z.string().max(50).default('new'),
  priority: z.string().max(20).default('medium'),
  source: z.string().max(50).default('contact_form'),
  serviceInterest: z.string().max(200).default(''),
  estimatedValue: z.number().min(0).nullable().default(null),
  assignedTo: z.string().max(100).default(''),
  leadType: z.string().max(50).default('general'),
});

// ── Pedidos ───────────────────────────────────────────────────────────────────

export const CreatePedidoSchema = z.object({
  customer: z.object({
    name: z.string().min(1, 'El nombre del cliente es obligatorio').max(200),
    email: z.string().max(254).default(''),
    phone: z.string().max(30).default(''),
    address: z.string().max(300).default(''),
    city: z.string().max(100).default(''),
    notes: z.string().max(2000).default(''),
  }),
  items: z.array(z.object({
    productId: z.string().min(1).max(100),
    quantity: z.number().int().min(1).max(9999),
  })).min(1, 'El carrito no puede estar vacío'),
  status: z.string().max(50).default('pending'),
  paymentStatus: z.string().max(50).default('pending'),
  paymentMethod: z.string().max(50).default('pending'),
  shipping: z.number().min(0).default(0),
  discount: z.number().min(0).default(0),
  adminNotes: z.string().max(2000).default(''),
});

// ── Productos ─────────────────────────────────────────────────────────────────

export const CreateProductoSchema = z.object({
  sku: z.string().min(1).max(100),
  name: z.string().min(1, 'El nombre es obligatorio').max(300),
  slug: z.string().max(300).default(''),
  description: z.string().max(10000).default(''),
  shortDescription: z.string().max(500).default(''),
  category: z.string().max(100).default('general'),
  brand: z.string().max(100).default(''),
  price: z.number().min(0, 'El precio debe ser mayor o igual a cero'),
  compareAtPrice: z.number().min(0).nullable().default(null),
  stock: z.number().int().min(0).default(0),
  images: z.array(z.string().url()).default([]),
  specifications: z.record(z.string()).default({}),
  tags: z.array(z.string().max(100)).default([]),
  isFeatured: z.boolean().default(false),
  isActive: z.boolean().default(true),
  promoDiscountPercent: z.number().min(0).max(100).nullable().default(null),
  promoStartsAt: z.string().datetime().nullable().default(null),
  promoEndsAt: z.string().datetime().nullable().default(null),
});

// ── Materiales ────────────────────────────────────────────────────────────────

export const CreateMaterialSchema = z.object({
  description: z.string().min(1, 'La descripción es obligatoria').max(300),
  unit: z.string().max(20).default('un'),
  unitPrice: z.number().min(0, 'El precio debe ser mayor o igual a cero'),
  provider: z.string().max(200).default(''),
  category: z.string().max(100).default('general'),
  code: z.string().max(100).default(''),
  notes: z.string().max(2000).default(''),
});
