// Parámetros de asistencia y cálculo de cada día trabajado. Funciones puras: sin base de datos, usables en cliente y servidor.

export interface DiaHorario { laboral: boolean; entrada: string; salida: string } // "HH:MM"
export type Dias = Record<string, DiaHorario>; // clave: 0 (domingo) … 6 (sábado)

export interface Parametros {
  dias: Dias;
  almuerzoMin: number;        // duración prevista del almuerzo
  almuerzoAuto: boolean;      // si no marcó almuerzo, se descuenta almuerzoMin
  toleranciaMin: number;      // minutos de gracia en entrada y salida
  extraDesdeMin: number;      // mínimo de minutos extra para contarlos
  vacacionesDias: number;     // días hábiles de vacaciones por año
  rolesMarcan: string[];      // roles que deben marcar asistencia
}

export const PARAMETROS_DEFAULT: Parametros = {
  dias: {
    '0': { laboral: false, entrada: '08:00', salida: '13:00' },
    '1': { laboral: true, entrada: '08:00', salida: '17:00' },
    '2': { laboral: true, entrada: '08:00', salida: '17:00' },
    '3': { laboral: true, entrada: '08:00', salida: '17:00' },
    '4': { laboral: true, entrada: '08:00', salida: '17:00' },
    '5': { laboral: true, entrada: '08:00', salida: '17:00' },
    '6': { laboral: true, entrada: '08:00', salida: '13:00' },
  },
  almuerzoMin: 60,
  almuerzoAuto: true,
  toleranciaMin: 10,
  extraDesdeMin: 30,
  vacacionesDias: 12,
  rolesMarcan: ['tecnico'],
};

export const DIAS_NOMBRE = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
export const TIPOS_AUSENCIA = ['VACACIONES', 'PERMISO', 'REPOSO_MEDICO', 'LICENCIA'] as const;
export type TipoAusencia = (typeof TIPOS_AUSENCIA)[number];
export const AUSENCIA_LABEL: Record<TipoAusencia, string> = { VACACIONES: 'Vacaciones', PERMISO: 'Permiso', REPOSO_MEDICO: 'Reposo médico', LICENCIA: 'Licencia' };

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
export const aMin = (hhmm: string) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };

/** Completa y sanea parámetros guardados (los que falten toman el valor por defecto). */
export function normalizarParametros(raw: unknown): Parametros {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Partial<Parametros>;
  const dias: Dias = {};
  for (let d = 0; d < 7; d++) {
    const base = PARAMETROS_DEFAULT.dias[String(d)];
    const x = r.dias?.[String(d)];
    dias[String(d)] = x && HHMM.test(x.entrada) && HHMM.test(x.salida) && aMin(x.salida) > aMin(x.entrada)
      ? { laboral: x.laboral === true, entrada: x.entrada, salida: x.salida } : base;
  }
  const n = (v: unknown, def: number, min: number, max: number) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, Math.round(v))) : def);
  return {
    dias,
    almuerzoMin: n(r.almuerzoMin, 60, 0, 240),
    almuerzoAuto: r.almuerzoAuto === undefined ? true : r.almuerzoAuto === true,
    toleranciaMin: n(r.toleranciaMin, 10, 0, 120),
    extraDesdeMin: n(r.extraDesdeMin, 30, 0, 240),
    vacacionesDias: n(r.vacacionesDias, 12, 0, 60),
    rolesMarcan: Array.isArray(r.rolesMarcan) ? r.rolesMarcan.filter(x => typeof x === 'string').slice(0, 30) : PARAMETROS_DEFAULT.rolesMarcan,
  };
}

/** Valida un horario por día enviado por el usuario; devuelve null si algún valor es inválido. */
export function validarDias(raw: unknown): Dias | null {
  if (!raw || typeof raw !== 'object') return null;
  const out: Dias = {};
  for (let d = 0; d < 7; d++) {
    const x = (raw as Dias)[String(d)];
    if (!x || !HHMM.test(x.entrada) || !HHMM.test(x.salida) || aMin(x.salida) <= aMin(x.entrada)) return null;
    out[String(d)] = { laboral: x.laboral === true, entrada: x.entrada, salida: x.salida };
  }
  return out;
}

export const diaSemana = (fecha: string) => new Date(`${fecha}T12:00:00Z`).getUTCDay();

export function diasEntre(desde: string, hasta: string): string[] {
  const out: string[] = [];
  for (let t = new Date(`${desde}T12:00:00Z`); t <= new Date(`${hasta}T12:00:00Z`); t.setUTCDate(t.getUTCDate() + 1)) out.push(t.toISOString().slice(0, 10));
  return out;
}

const FMT = new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Asuncion', hour: '2-digit', minute: '2-digit', hour12: false });
/** Minutos desde medianoche, hora de Asunción. */
export function minutosLocal(iso: string | Date): number {
  const [h, m] = FMT.format(new Date(iso)).split(':').map(Number);
  return (h % 24) * 60 + m;
}
export const hhmm = (min: number | null) => (min === null ? '' : `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`);
export const horasTxt = (min: number) => `${Math.floor(min / 60)}:${String(min % 60).padStart(2, '0')}`;

export type EstadoDia = 'PRESENTE' | 'TARDE' | 'INCOMPLETA' | 'AUSENTE' | 'VACACIONES' | 'PERMISO' | 'REPOSO_MEDICO' | 'LICENCIA' | 'FERIADO' | 'DESCANSO' | 'PENDIENTE';
export const ESTADO_DIA_LABEL: Record<EstadoDia, string> = {
  PRESENTE: 'Presente', TARDE: 'Tarde', INCOMPLETA: 'Sin salida', AUSENTE: 'Ausente', VACACIONES: 'Vacaciones', PERMISO: 'Permiso',
  REPOSO_MEDICO: 'Reposo médico', LICENCIA: 'Licencia', FERIADO: 'Feriado', DESCANSO: 'Descanso', PENDIENTE: 'En curso',
};

export interface MarcaCalc { tipo: string; createdAt: string | Date }
export interface FilaDia {
  fecha: string; userKey: string; userName: string; estado: EstadoDia; nota: string;
  esperadaEntrada: string; esperadaSalida: string;
  entrada: string; salida: string;
  almuerzoMin: number; trabajadoMin: number; tardanzaMin: number; anticipadaMin: number; extraMin: number;
  trasladoMin: number; enSitioMin: number; sitio: string;
}

/** Suma el tiempo entre pares de marcas (inicio → fin). */
function tiempoEntre(marcas: MarcaCalc[], inicio: string[], fin: string[]): number {
  let total = 0, abierto: number | null = null;
  for (const m of marcas) {
    const t = new Date(m.createdAt).getTime();
    if (inicio.includes(m.tipo)) abierto = t;
    else if (fin.includes(m.tipo) && abierto !== null) { total += Math.round((t - abierto) / 60000); abierto = null; }
  }
  return total;
}

export interface EntradaDia {
  fecha: string; hoy: string; userKey: string; userName: string; params: Parametros; dias: Dias;
  marcas: MarcaCalc[]; sitio: string; feriado?: string; ausencia?: TipoAusencia | null; trabaja: boolean;
}

/** Calcula el resultado de un día para una persona. Las marcas deben venir ordenadas por hora. */
export function calcularDia(e: EntradaDia): FilaDia | null {
  const { params: p } = e;
  const h = e.dias[String(diaSemana(e.fecha))];
  const ing = e.marcas.find(m => m.tipo === 'INGRESO');
  const sal = [...e.marcas].reverse().find(m => m.tipo === 'SALIDA');
  const base: FilaDia = {
    fecha: e.fecha, userKey: e.userKey, userName: e.userName, estado: 'PRESENTE', nota: '',
    esperadaEntrada: h.laboral ? h.entrada : '', esperadaSalida: h.laboral ? h.salida : '',
    entrada: '', salida: '', almuerzoMin: 0, trabajadoMin: 0, tardanzaMin: 0, anticipadaMin: 0, extraMin: 0, trasladoMin: 0, enSitioMin: 0, sitio: e.sitio,
  };

  if (!ing) {
    // Sin marcas: justificación, feriado, descanso o falta
    if (e.ausencia) return { ...base, estado: e.ausencia };
    if (e.feriado) return { ...base, estado: 'FERIADO', nota: e.feriado };
    if (!h.laboral) return { ...base, estado: 'DESCANSO' };
    if (!e.trabaja) return null;
    if (e.fecha > e.hoy) return null;
    return { ...base, estado: e.fecha === e.hoy ? 'PENDIENTE' : 'AUSENTE' };
  }

  const ent = minutosLocal(ing.createdAt);
  base.entrada = hhmm(ent);
  const cerrada = !!sal;
  const sl = sal ? minutosLocal(sal.createdAt) : null;
  if (sl !== null) base.salida = hhmm(sl);

  // Almuerzo marcado, o descuento automático si corresponde
  const almMarcado = tiempoEntre(e.marcas, ['INICIO_ALMUERZO'], ['FIN_ALMUERZO']);
  const hizoAlm = e.marcas.some(m => m.tipo === 'INICIO_ALMUERZO');
  // El descuento automático solo aplica a jornadas de 5 horas o más
  const largo = sl !== null && sl - ent >= 300;
  base.almuerzoMin = hizoAlm ? almMarcado : p.almuerzoAuto && cerrada && largo ? p.almuerzoMin : 0;

  base.trasladoMin = tiempoEntre(e.marcas, ['TRASLADO_IDA', 'SALIDA_LUGAR'], ['LLEGADA_LUGAR', 'LLEGADA_OFICINA']);
  base.enSitioMin = tiempoEntre(e.marcas, ['LLEGADA_LUGAR'], ['SALIDA_LUGAR']);

  if (h.laboral) {
    const tarde = ent - aMin(h.entrada);
    base.tardanzaMin = tarde > p.toleranciaMin ? tarde : 0;
  }
  if (sl !== null) {
    base.trabajadoMin = Math.max(0, sl - ent - base.almuerzoMin);
    if (h.laboral) {
      const ant = aMin(h.salida) - sl;
      base.anticipadaMin = ant > p.toleranciaMin ? ant : 0;
      const esperado = aMin(h.salida) - aMin(h.entrada) - p.almuerzoMin;
      const extra = base.trabajadoMin - esperado;
      base.extraMin = extra >= p.extraDesdeMin ? extra : 0;
    } else {
      base.extraMin = base.trabajadoMin; // trabajó en día no laboral: todo es extra
    }
  }
  if (e.feriado) base.nota = `Trabajó feriado: ${e.feriado}`;
  else if (!h.laboral) base.nota = 'Trabajó en día no laboral';

  base.estado = !cerrada ? (e.fecha < e.hoy ? 'INCOMPLETA' : 'PENDIENTE') : base.tardanzaMin > 0 ? 'TARDE' : 'PRESENTE';
  return base;
}
