// Tickets de TI: constantes, validación y reglas de quién puede qué. Sin dependencias de Next.
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { ROLE_PERMISSIONS } from '@/lib/roles';
import type { SessionPayload } from '@/lib/auth';

import { TIPOS, PRIORIDADES, ESTADOS, ESTADOS_ABIERTOS, MAX_ADJUNTOS } from './etiquetas';
export * from './etiquetas';

const urlAdjunto = z.string().max(3_000_000).refine(u => /^https:\/\//.test(u) || /^data:(image\/(jpeg|png|webp)|application\/pdf);base64,/.test(u), 'Adjunto inválido');
const adjuntos = z.array(z.object({ url: urlAdjunto, nombre: z.string().max(120).default('adjunto') })).max(MAX_ADJUNTOS);

export const CrearTicketSchema = z.object({
  tipo: z.enum(TIPOS),
  titulo: z.string().trim().min(5, 'El título es muy corto').max(140),
  descripcion: z.string().trim().min(10, 'Describí el problema o la mejora con un poco más de detalle').max(5000),
  modulo: z.string().trim().max(60).optional(),
  pantalla: z.string().trim().max(300).optional(),
  pasos: z.string().trim().max(3000).optional(),
  esperado: z.string().trim().max(2000).optional(),
  prioridad: z.enum(PRIORIDADES).optional(),
  navegador: z.string().trim().max(300).optional(),
  adjuntos: adjuntos.optional(),
});

export const ComentarSchema = z.object({
  texto: z.string().trim().min(1, 'Escribí un comentario').max(3000),
  interno: z.boolean().optional(),
  adjuntos: adjuntos.optional(),
});

export const ActualizarTicketSchema = z.object({
  estado: z.enum(ESTADOS).optional(),
  prioridad: z.enum(PRIORIDADES).optional(),
  asignadoId: z.string().max(60).nullable().optional(),
  resolucion: z.string().trim().max(3000).optional(),
});

/** ¿La sesión puede gestionar los tickets de todos? (TI = permiso de configuración del sistema.) */
export async function esTI(s: SessionPayload): Promise<boolean> {
  if (s.role in ROLE_PERMISSIONS) return ROLE_PERMISSIONS[s.role as keyof typeof ROLE_PERMISSIONS].canManageConfig;
  const r = await prisma.customRole.findUnique({ where: { name: s.role } });
  return !!(r?.permissions as Record<string, boolean> | undefined)?.canManageConfig;
}

export const quienEs = (s: SessionPayload) => ({ id: s.userId ?? s.username, nombre: s.displayName ?? s.username });

/** Transiciones que puede hacer quien pidió el ticket (el resto es de TI). */
export function transicionSolicitante(actual: string, nuevo: string): boolean {
  if (actual === 'RESUELTO' && (nuevo === 'CERRADO' || nuevo === 'EN_CURSO')) return true; // confirma o reabre
  if (actual === 'CERRADO' && nuevo === 'EN_CURSO') return true;                            // reabre
  if (nuevo === 'RECHAZADO' && ESTADOS_ABIERTOS.includes(actual as never)) return actual === 'NUEVO'; // cancela mientras nadie lo tomó
  return false;
}

