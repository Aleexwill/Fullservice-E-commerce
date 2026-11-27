import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { hoy } from '@/lib/marcacion/server';

const fecha = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida (AAAA-MM-DD)').refine(f => !Number.isNaN(Date.parse(f)), 'Fecha inválida');
export const FuncionarioSchema = z.object({
  nombre: z.string().trim().min(1, 'El nombre es obligatorio').max(120),
  documento: z.string().trim().max(30).optional().nullable(),
  cargo: z.string().trim().max(80).default(''),
  telefono: z.string().trim().max(40).default(''),
  email: z.string().trim().max(254).default(''),
  fechaIngreso: fecha,
  fechaEgreso: fecha.optional().nullable(),
  userId: z.string().max(60).optional().nullable(),
  notas: z.string().trim().max(500).default(''),
  isActive: z.boolean().default(true),
  // Legajo
  area: z.string().trim().max(80).default(''),
  tipoContrato: z.enum(['INDEFINIDO', 'PLAZO_FIJO', 'PRUEBA', 'JORNAL']).default('INDEFINIDO'),
  fechaNacimiento: fecha.optional().nullable(),
  estadoCivil: z.string().trim().max(30).default(''),
  hijosMenores: z.number().int().min(0).max(30).default(0),
  direccion: z.string().trim().max(200).default(''),
  ciudad: z.string().trim().max(80).default(''),
  ipsNumero: z.string().trim().max(30).default(''),
  banco: z.string().trim().max(60).default(''),
  cuentaBancaria: z.string().trim().max(40).default(''),
  emergenciaNombre: z.string().trim().max(120).default(''),
  emergenciaParentesco: z.string().trim().max(40).default(''),
  emergenciaTelefono: z.string().trim().max(40).default(''),
});

/** Valida reglas que dependen de la base. Devuelve un mensaje de error o null. */
export async function validarFuncionario(d: z.input<typeof FuncionarioSchema>, idActual?: string): Promise<string | null> {
  if (d.fechaIngreso > hoy()) return 'La fecha de ingreso no puede ser futura';
  if (d.fechaNacimiento && (d.fechaNacimiento >= d.fechaIngreso || d.fechaNacimiento < '1900-01-01')) return 'La fecha de nacimiento no es válida';
  if (d.fechaEgreso && d.fechaEgreso < d.fechaIngreso) return 'La fecha de egreso no puede ser anterior al ingreso';
  if (d.userId) {
    if (!(await prisma.user.findUnique({ where: { id: d.userId } }))) return 'El usuario del sistema no existe';
    const otro = await prisma.funcionario.findFirst({ where: { userId: d.userId, ...(idActual ? { id: { not: idActual } } : {}) } });
    if (otro) return `Ese usuario ya está enlazado a ${otro.nombre}`;
  }
  return null;
}

