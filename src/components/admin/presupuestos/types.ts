import { Wrench, HardHat, Factory, FileText } from 'lucide-react';
import type { CalculationData } from '@/lib/presupuesto-types';

export interface SeguimientoData {
  mes?: string;
  mesHistorial?: string[];
  alerta?: string;
  vendido?: number;
  avance?: string;
  os?: string;
  informe?: string;
  facturado?: string;
  nroFactura?: string;
  tecnico?: string;
  prioridad?: string;
  obs?: string;
  pct?: number;
  dias?: number;
  local?: string;
}

export interface Presupuesto {
  id: string; code: string; status: string; serviceType: string; serviceTitle: string;
  customer: { name: string; email: string; phone: string; company: string; address: string };
  description: string; details: string; estimatedValue: number | null; finalValue: number | null;
  estimatedDuration: string; priority: string; source: string; assignedTo: string;
  scheduledDate: string; calculationData: CalculationData | null; costosData?: any | null; createdBy: string;
  notes: { id: string; text: string; createdAt: string }[];
  createdAt: string; updatedAt: string;
  seguimientoData?: SeguimientoData;
}

export const STATUS_MAP: Record<string, { label: string; badge: string; color: string }> = {
  falta_presupuestar:  { label: 'Sin presupuestar',   badge: 'badge-neutral',color: '#9B7FE8' },
  pendiente_relevo:    { label: 'Pendiente relevo',   badge: 'badge-neutral',color: '#C2813A' },
  nuevo:               { label: 'Nuevo',              badge: 'badge-blue',   color: '#4A90D9' },
  en_revision:         { label: 'En revisión',        badge: 'badge-yellow', color: '#C9922A' },
  enviado:             { label: 'Enviado',             badge: 'badge-yellow', color: '#C9A020' },
  pendiente_aprobacion:{ label: 'Pendiente aprobación',badge: 'badge-yellow',color: '#D4802A' },
  aprobado:            { label: 'Aprobado',            badge: 'badge-green',  color: '#48BB78' },
  en_ejecucion:        { label: 'En ejecución',        badge: 'badge-green',  color: '#3B8FCC' },
  finalizado:          { label: 'Finalizado',          badge: 'badge-green',  color: '#3A8C62' },
  de_baja:             { label: 'De baja',             badge: 'badge-red',    color: '#A09A92' },
};

export const TYPE_MAP: Record<string, { label: string; icon: any; color: string }> = {
  mantenimiento: { label: 'Mantenimiento',     icon: Wrench,   color: 'text-blue-bright' },
  civil:         { label: 'Construcción civil', icon: HardHat,  color: 'text-yellow-bright' },
  metalurgica:   { label: 'Metalúrgica',        icon: Factory,  color: 'text-success-bright' },
  otro:          { label: 'Otro',               icon: FileText, color: 'text-steel-300' },
};

export const PRIORITY_MAP: Record<string, { label: string; color: string }> = {
  baja:    { label: 'Baja',    color: 'text-steel-500' },
  media:   { label: 'Media',   color: 'text-yellow-bright' },
  alta:    { label: 'Alta',    color: 'text-danger-bright' },
  urgente: { label: 'Urgente', color: 'text-danger-bright' },
};

export const ACTIVE_STATUSES = ['nuevo', 'en_revision', 'pendiente_relevo', 'falta_presupuestar'];
export const ARCHIVE_STATUSES = ['enviado', 'pendiente_aprobacion', 'aprobado', 'en_ejecucion', 'finalizado', 'de_baja'];

export const formatGs = (n: number) => 'Gs. ' + Math.round(n).toLocaleString('es-PY');
export const formatDate = (d: string) => new Date(d).toLocaleDateString('es-PY', { day: '2-digit', month: 'short', year: 'numeric' });
export const formatDateFull = (d: string) => new Date(d).toLocaleDateString('es-PY', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
export const formatScheduledDate = (d: string) => {
  if (!d) return null;
  const [y, m, day] = d.split('-').map(Number);
  if (!y || !m || !day) return d;
  return new Date(y, m - 1, day).toLocaleDateString('es-PY', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const PRES_PAGE_SIZE = 20;
