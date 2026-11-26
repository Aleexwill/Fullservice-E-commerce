// Tipos, constantes y utilidades de RRHH compartidas entre cliente y servidor.
import type { TipoAusencia } from '@/lib/marcacion/reglas';

export const TIPOS_CONTRATO = ['INDEFINIDO', 'PLAZO_FIJO', 'PRUEBA', 'JORNAL'] as const;
export const TIPO_CONTRATO_LABEL: Record<(typeof TIPOS_CONTRATO)[number], string> = {
  INDEFINIDO: 'Indefinido', PLAZO_FIJO: 'Plazo fijo', PRUEBA: 'Período de prueba', JORNAL: 'Jornalero',
};
export const ESTADOS_CIVILES = ['', 'Soltero/a', 'Casado/a', 'Unión de hecho', 'Divorciado/a', 'Viudo/a'];

export const TIPOS_DOCUMENTO = ['CONTRATO', 'CI', 'CERTIFICADO', 'SALUD', 'ANTECEDENTES', 'OTRO'] as const;
export const TIPO_DOCUMENTO_LABEL: Record<(typeof TIPOS_DOCUMENTO)[number], string> = {
  CONTRATO: 'Contrato', CI: 'Cédula de identidad', CERTIFICADO: 'Certificado', SALUD: 'Aptitud médica / salud', ANTECEDENTES: 'Antecedentes', OTRO: 'Otro',
};

export interface EppCatalogoItem { key: string; label: string; vidaUtilMeses: number }
export interface ReglasPlanilla {
  ipsEmpleado: number;          // % de aporte del trabajador
  ipsPatronal: number;          // % de aporte de la empresa (informativo)
  aplicarIps: boolean;
  ipsSobreAguinaldo: boolean;
  divisorJornal: number;        // días para el jornal: sueldo mensual / divisor
  horasJornada: number;         // horas de la jornada para el valor hora
  recargoExtraDiurno: number;   // % de recargo
  recargoExtraNocturno: number; // % de recargo
  recargoFeriadoDomingo: number;// % de recargo
  nocturnoDesde: string;        // HH:MM: horas extra posteriores se consideran nocturnas
  descontarAusencias: boolean;  // ausencia injustificada = se descuenta un jornal
  descontarTardanza: boolean;   // se descuentan los minutos de tardanza y salida anticipada
  ausenciaPagada: Record<TipoAusencia, boolean>;
}
export interface RrhhConfig {
  alertaDias: number;
  eppCatalogo: EppCatalogoItem[];
  planilla: ReglasPlanilla;
}

export const fmtGs = (n: number) => `Gs. ${Math.round(n).toLocaleString('es-PY').replace(/,/g, '.')}`;
export const fmtFecha = (f: string | null | undefined) => (f ? f.split('-').reverse().join('/') : '');
export const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
export const periodoLabel = (p: string) => { const [y, m] = p.split('-').map(Number); return `${MESES[m - 1]} de ${y}`; };

/** Suma meses a una fecha YYYY-MM-DD (fija el día al último del mes si no existe). */
export function sumarMeses(fecha: string, meses: number): string {
  const [y, m, d] = fecha.split('-').map(Number);
  const total = y * 12 + (m - 1) + meses;
  const ny = Math.floor(total / 12), nm = (total % 12) + 1;
  const ultimo = new Date(Date.UTC(ny, nm, 0)).getUTCDate();
  return `${ny}-${String(nm).padStart(2, '0')}-${String(Math.min(d, ultimo)).padStart(2, '0')}`;
}

export type EstadoVencimiento = 'VENCIDO' | 'POR_VENCER' | 'VIGENTE';
export function estadoVencimiento(vence: string | null | undefined, hoy: string, alertaDias: number): EstadoVencimiento | null {
  if (!vence) return null;
  if (vence < hoy) return 'VENCIDO';
  const limite = new Date(`${hoy}T12:00:00Z`); limite.setUTCDate(limite.getUTCDate() + alertaDias);
  return vence <= limite.toISOString().slice(0, 10) ? 'POR_VENCER' : 'VIGENTE';
}
