import { prisma } from '@/lib/prisma';
import { UMBRALES_ROSTRO } from './reglas';
import type { Parametros } from './reglas';

/**
 * Verificación facial por huella numérica (128 valores). NO se guarda ninguna imagen: el teléfono calcula la huella
 * de la cara y solo ese vector llega al servidor, que lo compara con el enrolado (RostroPlantilla).
 * Para pasar a un proveedor externo (AWS Rekognition, etc.), cambiar solo `verificarRostro`.
 */
export const DIM = 128;

export type EstadoRostro = 'VERIFICADO' | 'DUDOSO' | 'RECHAZADO' | 'SIN_PLANTILLA';
export interface ResultadoRostro { estado: EstadoRostro; distancia: number | null }

/** Devuelve el vector si es de 128 números finitos; si no, null. */
export function validarVector(v: unknown): number[] | null {
  if (!Array.isArray(v) || v.length !== DIM) return null;
  for (const x of v) if (typeof x !== 'number' || !Number.isFinite(x) || Math.abs(x) > 10) return null;
  return v as number[];
}

export function distancia(a: number[], b: number[]): number {
  let s = 0;
  for (let i = 0; i < DIM; i++) { const d = a[i] - b[i]; s += d * d; }
  return Math.sqrt(s);
}

/** Convierte las capturas guardadas a vectores válidos (ignora basura). */
function leerPlantilla(json: unknown): number[][] {
  return Array.isArray(json) ? json.map(validarVector).filter((v): v is number[] => v !== null) : [];
}

export async function verificarRostro(userKey: string, vector: number[], params: Parametros): Promise<ResultadoRostro> {
  const p = await prisma.rostroPlantilla.findUnique({ where: { userKey } });
  const plantilla = p ? leerPlantilla(p.vectores) : [];
  if (plantilla.length === 0) return { estado: 'SIN_PLANTILLA', distancia: null };
  const d = Math.min(...plantilla.map(t => distancia(vector, t)));
  const u = UMBRALES_ROSTRO[params.rostroExigencia];
  return { estado: d <= u.ok ? 'VERIFICADO' : d <= u.rechazo ? 'DUDOSO' : 'RECHAZADO', distancia: Math.round(d * 1000) / 1000 };
}

/** Valida las capturas del enrolamiento: 3 a 5 vectores válidos y de la misma persona entre sí. Devuelve error o null. */
export function validarEnrolamiento(vectores: unknown): { vectores: number[][] } | { error: string } {
  if (!Array.isArray(vectores) || vectores.length < 3 || vectores.length > 5) return { error: 'Se necesitan entre 3 y 5 capturas' };
  const vs = vectores.map(validarVector);
  if (vs.some(v => v === null)) return { error: 'Captura inválida' };
  const ok = vs as number[][];
  for (let i = 0; i < ok.length; i++) for (let j = i + 1; j < ok.length; j++) {
    if (distancia(ok[i], ok[j]) > 0.45) return { error: 'Las capturas no parecen de la misma persona o la luz es mala. Repetí el enrolamiento.' };
  }
  return { vectores: ok };
}
