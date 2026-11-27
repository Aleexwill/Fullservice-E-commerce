import { ESTADO_LABEL, PRIORIDAD_LABEL, TIPO_LABEL } from '@/lib/ti/etiquetas';

const PRIO: Record<string, string> = { BAJA: 'bg-steel-700/60 text-steel-100', MEDIA: 'bg-blue-muted text-blue-bright', ALTA: 'bg-orange-muted text-orange-bright', CRITICA: 'bg-danger-light/20 text-danger-bright' };
const EST: Record<string, string> = { NUEVO: 'bg-blue-muted text-blue-bright', EN_ANALISIS: 'bg-steel-700/60 text-steel-100', ESPERANDO_INFO: 'bg-orange-muted text-orange-bright', EN_CURSO: 'bg-blue-muted text-blue-bright', EN_PRUEBA: 'bg-steel-700/60 text-steel-100', RESUELTO: 'bg-success-light/20 text-success-bright', CERRADO: 'bg-steel-700/60 text-steel-400', RECHAZADO: 'bg-steel-700/60 text-steel-400' };
const base = 'inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-caption font-medium';

export const PrioChip = ({ v }: { v: string }) => <span className={`${base} ${PRIO[v] ?? ''}`}>{PRIORIDAD_LABEL[v] ?? v}</span>;
export const EstadoChip = ({ v }: { v: string }) => <span className={`${base} ${EST[v] ?? ''}`}>{ESTADO_LABEL[v] ?? v}</span>;
export const TipoChip = ({ v }: { v: string }) => <span className={`${base} bg-steel-800 text-steel-100`}>{TIPO_LABEL[v] ?? v}</span>;
export const fechaCorta = (iso: string) => new Date(iso).toLocaleString('es-PY', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'America/Asuncion' });
export const mb = (b: number) => (b >= 1073741824 ? `${(b / 1073741824).toFixed(2)} GB` : b >= 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.round(b / 1024)} KB`);
