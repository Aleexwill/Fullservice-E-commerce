import { prisma } from '@/lib/prisma';
import type { EppCatalogoItem, ReglasPlanilla, RrhhConfig } from './shared';

/**
 * Valores de referencia. Las reglas de planilla (porcentajes de IPS, recargos, divisor del jornal, etc.) son un PUNTO DE PARTIDA
 * y deben ser validadas con contabilidad o un asesor laboral antes de liquidar sueldos reales. Se editan en RRHH > Parámetros.
 */
export const REGLAS_PLANILLA_DEFAULT: ReglasPlanilla = {
  ipsEmpleado: 9,
  ipsPatronal: 16.5,
  aplicarIps: true,
  ipsSobreAguinaldo: false,
  divisorJornal: 30,
  horasJornada: 8,
  recargoExtraDiurno: 50,
  recargoExtraNocturno: 100,
  recargoFeriadoDomingo: 100,
  nocturnoDesde: '20:00',
  descontarAusencias: true,
  descontarTardanza: false,
  ausenciaPagada: { VACACIONES: true, LICENCIA: true, PERMISO: false, REPOSO_MEDICO: false },
};

export const EPP_CATALOGO_DEFAULT: EppCatalogoItem[] = [
  { key: 'casco', label: 'Casco', vidaUtilMeses: 36 },
  { key: 'chaleco', label: 'Chaleco reflectivo', vidaUtilMeses: 12 },
  { key: 'botas', label: 'Botas de seguridad', vidaUtilMeses: 12 },
  { key: 'guantes', label: 'Guantes', vidaUtilMeses: 3 },
  { key: 'lentes', label: 'Lentes de protección', vidaUtilMeses: 12 },
  { key: 'uniforme', label: 'Uniforme', vidaUtilMeses: 12 },
];

export const CONFIG_DEFAULT: RrhhConfig = { alertaDias: 30, eppCatalogo: EPP_CATALOGO_DEFAULT, planilla: REGLAS_PLANILLA_DEFAULT };

const num = (v: unknown, def: number, min: number, max: number) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : def);
const bool = (v: unknown, def: boolean) => (typeof v === 'boolean' ? v : def);
const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

export function normalizarReglas(raw: unknown): ReglasPlanilla {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Partial<ReglasPlanilla>;
  const d = REGLAS_PLANILLA_DEFAULT;
  const ap = (r.ausenciaPagada ?? {}) as Partial<ReglasPlanilla['ausenciaPagada']>;
  return {
    ipsEmpleado: num(r.ipsEmpleado, d.ipsEmpleado, 0, 50), ipsPatronal: num(r.ipsPatronal, d.ipsPatronal, 0, 50),
    aplicarIps: bool(r.aplicarIps, d.aplicarIps), ipsSobreAguinaldo: bool(r.ipsSobreAguinaldo, d.ipsSobreAguinaldo),
    divisorJornal: num(r.divisorJornal, d.divisorJornal, 20, 31), horasJornada: num(r.horasJornada, d.horasJornada, 1, 12),
    recargoExtraDiurno: num(r.recargoExtraDiurno, d.recargoExtraDiurno, 0, 300), recargoExtraNocturno: num(r.recargoExtraNocturno, d.recargoExtraNocturno, 0, 300),
    recargoFeriadoDomingo: num(r.recargoFeriadoDomingo, d.recargoFeriadoDomingo, 0, 300),
    nocturnoDesde: typeof r.nocturnoDesde === 'string' && HHMM.test(r.nocturnoDesde) ? r.nocturnoDesde : d.nocturnoDesde,
    descontarAusencias: bool(r.descontarAusencias, d.descontarAusencias), descontarTardanza: bool(r.descontarTardanza, d.descontarTardanza),
    ausenciaPagada: {
      VACACIONES: bool(ap.VACACIONES, d.ausenciaPagada.VACACIONES), LICENCIA: bool(ap.LICENCIA, d.ausenciaPagada.LICENCIA),
      PERMISO: bool(ap.PERMISO, d.ausenciaPagada.PERMISO), REPOSO_MEDICO: bool(ap.REPOSO_MEDICO, d.ausenciaPagada.REPOSO_MEDICO),
    },
  };
}

export function normalizarConfig(raw: unknown): RrhhConfig {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Partial<RrhhConfig>;
  const cat = Array.isArray(r.eppCatalogo)
    ? r.eppCatalogo
        .filter(i => i && typeof i.key === 'string' && /^[a-z0-9_]{1,30}$/.test(i.key) && typeof i.label === 'string' && i.label.trim())
        .map(i => ({ key: i.key, label: i.label.trim().slice(0, 60), vidaUtilMeses: Math.round(num(i.vidaUtilMeses, 12, 0, 240)) }))
        .slice(0, 40)
    : EPP_CATALOGO_DEFAULT;
  return { alertaDias: Math.round(num(r.alertaDias, 30, 1, 365)), eppCatalogo: cat.length ? cat : EPP_CATALOGO_DEFAULT, planilla: normalizarReglas(r.planilla) };
}

export async function getRrhhConfig(): Promise<RrhhConfig> {
  const row = await prisma.rrhhConfig.findUnique({ where: { id: 'default' } }).catch(() => null);
  return normalizarConfig(row?.data ?? CONFIG_DEFAULT);
}
