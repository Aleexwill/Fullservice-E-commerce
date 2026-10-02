import type { SeguimientoData } from './types';

export const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
export const ALERTA_OPTS = ['','FALTA RELEVAR','FALTA PRESUPUESTAR','FALTA VISTO BUENO','ENVIADO','APROBADO','DE BAJA'];
export const AVANCE_OPTS = ['Pendiente','En Proceso','En Espera / Bloqueado','Finalizado'];
export const CICLO_OS = ['NO','SI','NA'];
export const PLAN2_KEY = 'fsc-plan2-tareas-v1';
export const ESTADO_OPTS = ['SIN CARGAR','PENDIENTE RELEVO','EN PRESUPUESTO','FALTA VISTO BUENO','PENDIENTE APROBACION','EN EJECUCION','FINALIZADO','DE BAJA'];
export const PRIORIDAD_SEG_OPTS = ['','Normal','Alta','Urgente'];

export function estadoDe(alerta?: string, avance?: string): string {
  if (alerta === 'DE BAJA') return 'DE BAJA';
  if (alerta === 'APROBADO' && avance === 'Finalizado') return 'FINALIZADO';
  if (alerta === 'APROBADO') return 'EN EJECUCION';
  if (alerta === 'ENVIADO') return 'PENDIENTE APROBACION';
  if (alerta === 'FALTA VISTO BUENO') return 'FALTA VISTO BUENO';
  if (alerta === 'FALTA PRESUPUESTAR') return 'EN PRESUPUESTO';
  if (alerta === 'FALTA RELEVAR') return 'PENDIENTE RELEVO';
  return 'SIN CARGAR';
}

export function setEstadoFields(estado: string): Partial<SeguimientoData> {
  const map: Record<string, Partial<SeguimientoData>> = {
    'FINALIZADO':            { alerta: 'APROBADO',            avance: 'Finalizado' },
    'EN EJECUCION':          { alerta: 'APROBADO',            avance: 'En Proceso' },
    'PENDIENTE APROBACION':  { alerta: 'ENVIADO',             avance: 'Pendiente' },
    'EN PRESUPUESTO':        { alerta: 'FALTA PRESUPUESTAR',  avance: 'Pendiente' },
    'PENDIENTE RELEVO':      { alerta: 'FALTA RELEVAR',       avance: 'Pendiente' },
    'FALTA VISTO BUENO':     { alerta: 'FALTA VISTO BUENO',   avance: 'Pendiente' },
    'DE BAJA':               { alerta: 'DE BAJA',             avance: 'Pendiente' },
    'SIN CARGAR':            { alerta: '',                    avance: '' },
  };
  return map[estado] || { alerta: '', avance: '' };
}

export function chipEstado(estado: string): string {
  const map: Record<string, string> = {
    'FINALIZADO': 'bg-success-bright/15 text-success-bright border border-success-bright/30',
    'EN EJECUCION': 'bg-blue-bright/15 text-blue-bright border border-blue-bright/30',
    'PENDIENTE APROBACION': 'bg-yellow-bright/15 text-yellow-bright border border-yellow-bright/30',
    'EN PRESUPUESTO': 'bg-[#F97316]/15 text-[#F97316] border border-[#F97316]/30',
    'FALTA VISTO BUENO': 'bg-[#FB923C]/15 text-[#FB923C] border border-[#FB923C]/30',
    'PENDIENTE RELEVO': 'bg-purple-500/15 text-purple-300 border border-purple-500/30',
    'DE BAJA': 'bg-danger-bright/15 text-danger-bright border border-danger-bright/30',
    'SIN CARGAR': 'bg-steel-900 text-steel-500 border border-steel-800',
  };
  return map[estado] || map['SIN CARGAR'];
}

export function flagColor(alerta?: string): string {
  const map: Record<string, string> = {
    'APROBADO': '#48BB78', 'ENVIADO': '#F59E0B',
    'FALTA PRESUPUESTAR': '#F97316', 'FALTA RELEVAR': '#A78BFA',
    'DE BAJA': '#FC8181',
  };
  return alerta ? (map[alerta] || '#6B7280') : '#6B7280';
}

export const N = (v: unknown): number => Number(v) || 0;
export const money = (n: number) => 'Gs. ' + Math.round(n).toLocaleString('es-PY');
export const ciclo = (v: string) => CICLO_OS[(CICLO_OS.indexOf(v) + 1) % 3];
export const prevMonth = (ym: string) => { const [y,m] = ym.split('-').map(Number); return m === 1 ? `${y-1}-12` : `${y}-${String(m-1).padStart(2,'0')}`; };
export const nextMonthStr = (ym: string) => { const [y,m] = ym.split('-').map(Number); return m === 12 ? `${y+1}-01` : `${y}-${String(m+1).padStart(2,'0')}`; };
export const monthLabel = (ym: string) => { const [y,m] = ym.split('-').map(Number); return `${MONTH_NAMES[m-1]} ${y}`; };

export interface Plan2Tarea {
  id: string; nro?: string; cliente: string; local: string; descripcion: string; tecnico: string;
  avance: string; pct?: number; dias: number; obs: string; scheduledDate?: string;
}
