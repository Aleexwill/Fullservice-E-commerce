import { prisma } from '@/lib/prisma';

/** Puntos del sistema que usan IA. La clave identifica la funcionalidad en el registro y en los límites. */
export const FUNCIONES_IA = {
  'corregir-texto': { label: 'Corregir texto de presupuestos', ruta: '/api/ai/corregir' },
  'mejorar-titulo': { label: 'Mejorar título y alcance de secciones', ruta: '/api/ai/mejorar-titulo' },
  'mejorar-descripcion': { label: 'Descripciones de productos', ruta: '/api/ai/mejorar-descripcion' },
  'presupuesto-analizar': { label: 'Borrador de presupuesto (texto o imagen)', ruta: '/api/presupuestos/analizar' },
  'presupuesto-ajustar': { label: 'Ajustes de presupuesto por chat', ruta: '/api/presupuestos/[id]/ajustar' },
} as const;
export type FuncionIA = keyof typeof FUNCIONES_IA;
export type FuncionRegistro = FuncionIA | 'prueba';
export const PROVEEDORES = { gemini: 'Google Gemini', anthropic: 'Anthropic Claude', openai: 'OpenAI' } as const;
export type ProveedorIA = keyof typeof PROVEEDORES;

export interface LimiteFuncion { activo: boolean; limiteMensualLlamadas: number | null; limiteDiarioPorUsuario: number | null }
export interface Tarifa { entradaUsdPorMillon: number; salidaUsdPorMillon: number }
export interface IaConfig {
  global: { activo: boolean; limiteMensualLlamadas: number | null; limiteMensualUsd: number | null };
  funciones: Record<FuncionIA, LimiteFuncion>;
  /** USD por millón de tokens, por nombre de modelo. Sin tarifa no se estima el costo de ese modelo. */
  tarifas: Record<string, Tarifa>;
  retencionDias: number;
  /** Lo mantiene el servidor (no se edita): cuándo se depuró por última vez y cuántos registros se borraron. */
  depuracion: { ultima: string | null; borrados: number };
}

export const CONFIG_IA_DEFAULT: IaConfig = {
  global: { activo: true, limiteMensualLlamadas: null, limiteMensualUsd: null },
  funciones: Object.fromEntries(Object.keys(FUNCIONES_IA).map(k => [k, { activo: true, limiteMensualLlamadas: null, limiteDiarioPorUsuario: null }])) as Record<FuncionIA, LimiteFuncion>,
  tarifas: {},
  retencionDias: 180,
  depuracion: { ultima: null, borrados: 0 },
};

const lim = (v: unknown, max: number) => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? Math.min(max, Math.round(v)) : null);
const usd = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.min(100000, v) : null);

export function normalizarConfigIa(raw: unknown): IaConfig {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Partial<IaConfig>;
  const g = (r.global ?? {}) as Partial<IaConfig['global']>;
  const funciones = {} as Record<FuncionIA, LimiteFuncion>;
  for (const k of Object.keys(FUNCIONES_IA) as FuncionIA[]) {
    const f = (r.funciones?.[k] ?? {}) as Partial<LimiteFuncion>;
    funciones[k] = { activo: f.activo !== false, limiteMensualLlamadas: lim(f.limiteMensualLlamadas, 10_000_000), limiteDiarioPorUsuario: lim(f.limiteDiarioPorUsuario, 100_000) };
  }
  const tarifas: Record<string, Tarifa> = {};
  for (const [m, t] of Object.entries(r.tarifas ?? {}).slice(0, 50)) {
    const e = usd((t as Tarifa)?.entradaUsdPorMillon), s = usd((t as Tarifa)?.salidaUsdPorMillon);
    if (/^[\w.\-:/]{1,80}$/.test(m) && e !== null && s !== null) tarifas[m] = { entradaUsdPorMillon: e, salidaUsdPorMillon: s };
  }
  return {
    global: { activo: g.activo !== false, limiteMensualLlamadas: lim(g.limiteMensualLlamadas, 100_000_000), limiteMensualUsd: usd(g.limiteMensualUsd) || null },
    funciones, tarifas,
    retencionDias: typeof r.retencionDias === 'number' && r.retencionDias >= 7 ? Math.min(3650, Math.round(r.retencionDias)) : 180,
    depuracion: { ultima: typeof r.depuracion?.ultima === 'string' ? r.depuracion.ultima : null, borrados: typeof r.depuracion?.borrados === 'number' ? Math.max(0, Math.round(r.depuracion.borrados)) : 0 },
  };
}

export async function getConfigIa(): Promise<IaConfig> {
  const row = await prisma.iaConfig.findUnique({ where: { id: 'default' } }).catch(() => null);
  return normalizarConfigIa(row?.data ?? CONFIG_IA_DEFAULT);
}

/** Costo estimado en USD, o null si el modelo no tiene tarifa cargada. */
export function costoUsd(tarifas: IaConfig['tarifas'], modelo: string, tokensEntrada: number, tokensSalida: number): number | null {
  const t = tarifas[modelo];
  return t ? (tokensEntrada * t.entradaUsdPorMillon + tokensSalida * t.salidaUsdPorMillon) / 1_000_000 : null;
}
