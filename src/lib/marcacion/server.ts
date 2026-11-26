import { put } from '@vercel/blob';
import { prisma } from '@/lib/prisma';
import type { SessionPayload } from '@/lib/auth';
import { can, ROLE_PERMISSIONS } from '@/lib/roles';
import type { Role } from '@/lib/roles';
import type { JornadaDTO, SitioDTO, EppDTO, EppMap, MarcaDTO, TipoMarca } from './shared';

/** 'strict' rechaza marcas fuera del radio; 'warn' las guarda marcadas como fuera de rango. */
export const GEOFENCE_MODE: 'strict' | 'warn' = process.env.MARCACION_GEOFENCE === 'warn' ? 'warn' : 'strict';
/** Precisión de GPS peor que esto (metros) se rechaza: no es confiable para validar el radio. */
export const MAX_PRECISION_M = 150;

export function hoy(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Asuncion', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}

export const userKeyOf = (s: SessionPayload) => s.userId ?? s.username;
export const userNameOf = (s: SessionPayload) => s.displayName ?? s.username;

/** Aprueban las fotos de EPP los roles con permiso de aprobar (reusa canAprobarPresupuestos). */
export function puedeAprobar(role: string): boolean {
  return role in ROLE_PERMISSIONS && can(role as Role, 'canAprobarPresupuestos');
}
export function puedeAdministrar(role: string): boolean {
  return role in ROLE_PERMISSIONS && can(role as Role, 'canManageConfig');
}

export function puedeVerReportes(role: string): boolean {
  return role in ROLE_PERMISSIONS && can(role as Role, 'canViewReports');
}

export const toSitio = (s: { id: string; nombre: string; tipo: string; lat: number; lng: number; radioM: number }): SitioDTO =>
  ({ id: s.id, nombre: s.nombre, tipo: s.tipo, lat: s.lat, lng: s.lng, radioM: s.radioM });

export async function getOficina(): Promise<SitioDTO | null> {
  const o = await prisma.sitio.findFirst({ where: { tipo: 'OFICINA', isActive: true }, orderBy: { createdAt: 'asc' } });
  return o ? toSitio(o) : null;
}

export function toEpp(e: { id: string; fotoUrl: string; declarado: unknown; estado: string; motivo: string; revisorName: string; createdAt: Date }): EppDTO {
  return { id: e.id, fotoUrl: e.fotoUrl, declarado: (e.declarado ?? {}) as EppMap, estado: e.estado as EppDTO['estado'], motivo: e.motivo, revisorName: e.revisorName, createdAt: e.createdAt.toISOString() };
}

export function toJornada(j: {
  id: string; fecha: string; estado: string; enAlmuerzo: boolean; sitioId: string | null; sitioNombre: string; otRef: string;
  marcas: { id: string; tipo: string; metodo: string; distanciaM: number | null; fueraDeRango: boolean; sitioNombre: string; createdAt: Date }[];
  epps: { id: string; fotoUrl: string; declarado: unknown; estado: string; motivo: string; revisorName: string; createdAt: Date }[];
}): JornadaDTO {
  const marcas: MarcaDTO[] = j.marcas.map(m => ({ id: m.id, tipo: m.tipo as TipoMarca, metodo: m.metodo, distanciaM: m.distanciaM, fueraDeRango: m.fueraDeRango, sitioNombre: m.sitioNombre, createdAt: m.createdAt.toISOString() }));
  const last = j.epps[0];
  return { id: j.id, fecha: j.fecha, estado: j.estado as JornadaDTO['estado'], enAlmuerzo: j.enAlmuerzo, sitioId: j.sitioId, sitioNombre: j.sitioNombre, otRef: j.otRef, marcas, epp: last ? toEpp(last) : null };
}

export const JORNADA_INCLUDE = {
  marcas: { orderBy: { createdAt: 'asc' as const } },
  epps: { orderBy: { createdAt: 'desc' as const }, take: 1 },
};

const MAGIC: { mime: string; bytes: number[] }[] = [
  { mime: 'image/jpeg', bytes: [0xff, 0xd8, 0xff] },
  { mime: 'image/png', bytes: [0x89, 0x50, 0x4e, 0x47] },
];

/**
 * Valida una imagen enviada como data URL (JPEG/PNG, máx. 1,5 MB) y la guarda.
 * Con BLOB_READ_WRITE_TOKEN sube a Vercel Blob; sin token (desarrollo local) devuelve el data URL.
 */
export async function guardarFoto(dataUrl: unknown, carpeta: string): Promise<string> {
  if (typeof dataUrl !== 'string') throw new Error('Falta la foto');
  const m = /^data:(image\/(?:jpeg|png));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!m) throw new Error('Formato de foto no permitido (JPEG o PNG)');
  const buf = Buffer.from(m[2], 'base64');
  if (buf.length > 1.5 * 1024 * 1024) throw new Error('La foto supera 1,5 MB');
  const sig = MAGIC.find(s => s.mime === m[1]);
  if (!sig || !sig.bytes.every((b, i) => buf[i] === b)) throw new Error('El contenido de la foto no coincide con su tipo');
  if (!process.env.BLOB_READ_WRITE_TOKEN) return dataUrl;
  const ext = m[1] === 'image/png' ? 'png' : 'jpg';
  const blob = await put(`marcacion/${carpeta}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`, buf, { access: 'public', contentType: m[1] });
  return blob.url;
}
