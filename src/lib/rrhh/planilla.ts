// Motor de cálculo de la planilla de sueldos. Funciones puras (sin base de datos), con las reglas recibidas como parámetro.
// Las reglas por defecto son de REFERENCIA y deben validarse con contabilidad o un asesor laboral antes de liquidar sueldos reales.
import { aMin, diasEntre } from '@/lib/marcacion/reglas';
import type { FilaDia } from '@/lib/marcacion/reglas';
import type { ReglasPlanilla } from './shared';

export interface SalarioVigente { tipo: 'MENSUAL' | 'JORNAL'; monto: number }
export interface ConceptoManual { tipo: 'HABER' | 'DESCUENTO'; nombre: string; monto: number; imponible: boolean }
export interface LineaRecibo { tipo: 'HABER' | 'DESCUENTO'; concepto: string; detalle: string; monto: number; imponible: boolean }

export interface EntradaRecibo {
  periodo: string; // YYYY-MM
  reglas: ReglasPlanilla;
  funcionario: { fechaIngreso: string; fechaEgreso: string | null };
  salario: SalarioVigente | null;
  filas: FilaDia[] | null; // null: el funcionario no tiene asistencia calculable (sin usuario enlazado)
  conceptos: ConceptoManual[];
}

export interface ResumenAsistencia {
  diasVinculo: number; diasLiquidados: number; diasTrabajados: number; ausenciasSinAviso: number;
  justificadosPagados: number; justificadosNoPagados: number; feriadosPagados: number;
  tardanzaMin: number; anticipadaMin: number; extraDiurnaMin: number; extraNocturnaMin: number; feriadoDomingoMin: number;
}

export interface ReciboCalculado {
  lineas: LineaRecibo[]; totalHaberes: number; totalDescuentos: number; neto: number; baseIps: number; aporteIps: number; aportePatronal: number;
  asistencia: ResumenAsistencia; advertencias: string[];
}

const r = Math.round;
const gs = (n: number) => `Gs. ${r(n).toLocaleString('es-PY').replace(/,/g, '.')}`;
const hh = (min: number) => `${Math.floor(min / 60)}:${String(min % 60).padStart(2, '0')}`;
/** Desde cuántas ausencias sin aviso en un mes se pide revisar y confirmar antes de cerrar la planilla. */
export const UMBRAL_AUSENCIAS_REVISAR = 5;
const JUSTIFICADOS = ['VACACIONES', 'PERMISO', 'REPOSO_MEDICO', 'LICENCIA'] as const;

export function ultimoDiaMes(periodo: string): string {
  const [y, m] = periodo.split('-').map(Number);
  return `${periodo}-${String(new Date(Date.UTC(y, m, 0)).getUTCDate()).padStart(2, '0')}`;
}

/** Calcula el recibo mensual de un funcionario. */
export function calcularRecibo(e: EntradaRecibo): ReciboCalculado {
  const { reglas: R, periodo } = e;
  const advertencias: string[] = [];
  const lineas: LineaRecibo[] = [];
  const primero = `${periodo}-01`, ultimo = ultimoDiaMes(periodo);
  const inicio = e.funcionario.fechaIngreso > primero ? e.funcionario.fechaIngreso : primero;
  const fin = e.funcionario.fechaEgreso && e.funcionario.fechaEgreso < ultimo ? e.funcionario.fechaEgreso : ultimo;
  const vacio = (): ReciboCalculado => ({ lineas, totalHaberes: 0, totalDescuentos: 0, neto: 0, baseIps: 0, aporteIps: 0, aportePatronal: 0, asistencia: asist0(), advertencias });
  const asist0 = (): ResumenAsistencia => ({ diasVinculo: 0, diasLiquidados: 0, diasTrabajados: 0, ausenciasSinAviso: 0, justificadosPagados: 0, justificadosNoPagados: 0, feriadosPagados: 0, tardanzaMin: 0, anticipadaMin: 0, extraDiurnaMin: 0, extraNocturnaMin: 0, feriadoDomingoMin: 0 });

  if (inicio > fin) { advertencias.push('El funcionario no tenía vínculo vigente en este período.'); return vacio(); }
  if (!e.salario) { advertencias.push('Sin salario cargado: no se puede liquidar. Cargalo en el legajo.'); return vacio(); }

  const a = asist0();
  const diasVinculo = diasEntre(inicio, fin).length;
  a.diasVinculo = diasVinculo;
  const periodoCompleto = inicio === primero && fin === ultimo;
  a.diasLiquidados = periodoCompleto ? R.divisorJornal : Math.min(R.divisorJornal, diasVinculo);

  const { tipo, monto } = e.salario;
  const jornal = tipo === 'MENSUAL' ? monto / R.divisorJornal : monto;
  const valorHora = jornal / R.horasJornada;

  const filas = e.filas ? e.filas.filter(f => f.fecha >= inicio && f.fecha <= fin) : null;
  if (!filas) advertencias.push('Sin usuario enlazado o sin asistencia: no se calcularon ausencias, tardanzas ni horas extra. Cargalos como conceptos manuales si corresponde.');

  const noct = aMin(R.nocturnoDesde);
  const sinSalida: string[] = [];
  let ausDesc = 0, noPagDesc = 0;
  if (filas) {
    for (const f of filas) {
      const descontable = f.laboral && !f.feriado; // día en que se esperaba trabajo
      if (f.entrada) a.diasTrabajados++;
      if (f.estado === 'AUSENTE' && descontable) a.ausenciasSinAviso++;
      if ((JUSTIFICADOS as readonly string[]).includes(f.estado) && descontable) { if (R.ausenciaPagada[f.estado as (typeof JUSTIFICADOS)[number]]) a.justificadosPagados++; else a.justificadosNoPagados++; }
      if (f.laboral && f.feriado && !f.entrada) a.feriadosPagados++;
      if (f.estado === 'INCOMPLETA') sinSalida.push(f.fecha.slice(8) + '/' + f.fecha.slice(5, 7));
      a.tardanzaMin += f.tardanzaMin; a.anticipadaMin += f.anticipadaMin;
      if (f.trabajadoMin > 0) {
        if (f.feriado || !f.laboral) a.feriadoDomingoMin += f.trabajadoMin;
        else if (f.extraMin > 0) {
          const nocturnos = f.salida ? Math.min(f.extraMin, Math.max(0, aMin(f.salida) - noct)) : 0;
          a.extraNocturnaMin += nocturnos; a.extraDiurnaMin += f.extraMin - nocturnos;
        }
      }
    }
    if (sinSalida.length) advertencias.push(`Jornadas sin salida (${sinSalida.join(', ')}): no se calcularon sus horas. Revisalas en Asistencia.`);
    ausDesc = a.ausenciasSinAviso; noPagDesc = a.justificadosNoPagados;
    if (a.ausenciasSinAviso >= UMBRAL_AUSENCIAS_REVISAR) advertencias.push(`${a.ausenciasSinAviso} ausencias sin aviso: verificá que se haya marcado asistencia en el período. Si esta persona no marca asistencia, excluila en Marcación > Parámetros > Personas para que no se le descuente.`);
  }

  // ---- Haberes ----
  if (tipo === 'MENSUAL') {
    lineas.push({ tipo: 'HABER', concepto: 'Sueldo básico', detalle: a.diasLiquidados === R.divisorJornal ? 'Mes completo' : `${a.diasLiquidados} de ${R.divisorJornal} días`, monto: r(monto * a.diasLiquidados / R.divisorJornal), imponible: true });
  } else if (filas) {
    const dias = a.diasTrabajados + a.feriadosPagados + a.justificadosPagados;
    lineas.push({ tipo: 'HABER', concepto: 'Jornales', detalle: `${dias} día${dias === 1 ? '' : 's'} × ${gs(jornal)} (${a.diasTrabajados} trabajados, ${a.feriadosPagados} feriados, ${a.justificadosPagados} ausencias pagadas)`, monto: r(jornal * dias), imponible: true });
  } else {
    lineas.push({ tipo: 'HABER', concepto: 'Jornales', detalle: 'Sin asistencia para calcular', monto: 0, imponible: true });
  }
  const extra = (min: number, recargo: number, concepto: string) => {
    if (min <= 0) return;
    lineas.push({ tipo: 'HABER', concepto, detalle: `${hh(min)} h × ${gs(valorHora)} + ${recargo}%`, monto: r(min / 60 * valorHora * (1 + recargo / 100)), imponible: true });
  };
  extra(a.extraDiurnaMin, R.recargoExtraDiurno, 'Horas extra diurnas');
  extra(a.extraNocturnaMin, R.recargoExtraNocturno, 'Horas extra nocturnas');
  extra(a.feriadoDomingoMin, R.recargoFeriadoDomingo, 'Trabajo en domingo o feriado');
  for (const c of e.conceptos.filter(c => c.tipo === 'HABER')) lineas.push({ tipo: 'HABER', concepto: c.nombre, detalle: 'Concepto manual', monto: c.monto, imponible: c.imponible });

  // ---- Descuentos por tiempo (reducen la remuneración imponible) ----
  const descTiempo: LineaRecibo[] = [];
  if (tipo === 'MENSUAL') {
    if (R.descontarAusencias && ausDesc > 0) descTiempo.push({ tipo: 'DESCUENTO', concepto: 'Ausencias sin aviso', detalle: `${ausDesc} día${ausDesc === 1 ? '' : 's'} × ${gs(jornal)}`, monto: r(jornal * ausDesc), imponible: false });
    if (noPagDesc > 0) descTiempo.push({ tipo: 'DESCUENTO', concepto: 'Ausencias justificadas no pagadas', detalle: `${noPagDesc} día${noPagDesc === 1 ? '' : 's'} × ${gs(jornal)}`, monto: r(jornal * noPagDesc), imponible: false });
  }
  if (R.descontarTardanza && (a.tardanzaMin > 0 || a.anticipadaMin > 0)) {
    const min = a.tardanzaMin + a.anticipadaMin;
    descTiempo.push({ tipo: 'DESCUENTO', concepto: 'Tardanzas y salidas anticipadas', detalle: `${min} min × ${gs(valorHora / 60)}`, monto: r(min * valorHora / 60), imponible: false });
  }
  lineas.push(...descTiempo);

  // ---- Aporte IPS y descuentos manuales ----
  const imponibles = lineas.filter(l => l.tipo === 'HABER' && l.imponible).reduce((s, l) => s + l.monto, 0);
  const baseIps = Math.max(0, imponibles - descTiempo.reduce((s, l) => s + l.monto, 0));
  const aporteIps = R.aplicarIps ? r(baseIps * R.ipsEmpleado / 100) : 0;
  if (R.aplicarIps) lineas.push({ tipo: 'DESCUENTO', concepto: `Aporte IPS ${R.ipsEmpleado}%`, detalle: `Base imponible ${gs(baseIps)}`, monto: aporteIps, imponible: false });
  for (const c of e.conceptos.filter(c => c.tipo === 'DESCUENTO')) lineas.push({ tipo: 'DESCUENTO', concepto: c.nombre, detalle: 'Concepto manual', monto: c.monto, imponible: false });

  if (e.funcionario.fechaEgreso && e.funcionario.fechaEgreso >= primero && e.funcionario.fechaEgreso <= ultimo) advertencias.push('Baja en el período: este recibo no incluye vacaciones no gozadas, preaviso ni indemnización. Cargalos como conceptos manuales.');
  if (e.funcionario.fechaIngreso > primero && e.funcionario.fechaIngreso <= ultimo) advertencias.push('Ingreso en el período: el sueldo se calculó proporcional a los días de vínculo.');

  const totalHaberes = lineas.filter(l => l.tipo === 'HABER').reduce((s, l) => s + l.monto, 0);
  const totalDescuentos = lineas.filter(l => l.tipo === 'DESCUENTO').reduce((s, l) => s + l.monto, 0);
  const neto = totalHaberes - totalDescuentos;
  if (neto < 0) advertencias.push('El neto es negativo: revisá los descuentos.');
  return { lineas, totalHaberes, totalDescuentos, neto, baseIps, aporteIps, aportePatronal: R.aplicarIps ? r(baseIps * R.ipsPatronal / 100) : 0, asistencia: a, advertencias };
}

/** Aguinaldo: 1/12 de las remuneraciones (haberes) del año según las planillas mensuales cerradas. */
export function calcularAguinaldo(o: { anio: number; haberesPorMes: Record<string, number>; reglas: ReglasPlanilla; conceptos: ConceptoManual[] }): ReciboCalculado {
  const { reglas: R } = o;
  const meses = Object.keys(o.haberesPorMes).filter(p => p.startsWith(String(o.anio))).sort();
  const total = meses.reduce((s, p) => s + o.haberesPorMes[p], 0);
  const advertencias: string[] = [];
  const aguinaldo = r(total / 12);
  const lineas: LineaRecibo[] = [{ tipo: 'HABER', concepto: `Aguinaldo ${o.anio}`, detalle: `${gs(total)} de remuneraciones (${meses.length} mes${meses.length === 1 ? '' : 'es'} liquidado${meses.length === 1 ? '' : 's'}) ÷ 12`, monto: aguinaldo, imponible: R.ipsSobreAguinaldo }];
  if (meses.length < 12) advertencias.push(`Solo hay ${meses.length} planilla${meses.length === 1 ? '' : 's'} mensual${meses.length === 1 ? '' : 'es'} cerrada${meses.length === 1 ? '' : 's'} en ${o.anio}. Si faltan meses, cerralas antes de liquidar el aguinaldo.`);
  for (const c of o.conceptos.filter(c => c.tipo === 'HABER')) lineas.push({ tipo: 'HABER', concepto: c.nombre, detalle: 'Concepto manual', monto: c.monto, imponible: c.imponible });
  const base = lineas.filter(l => l.tipo === 'HABER' && l.imponible).reduce((s, l) => s + l.monto, 0);
  const aporteIps = R.aplicarIps && R.ipsSobreAguinaldo ? r(base * R.ipsEmpleado / 100) : 0;
  if (aporteIps > 0) lineas.push({ tipo: 'DESCUENTO', concepto: `Aporte IPS ${R.ipsEmpleado}%`, detalle: `Base ${gs(base)}`, monto: aporteIps, imponible: false });
  for (const c of o.conceptos.filter(c => c.tipo === 'DESCUENTO')) lineas.push({ tipo: 'DESCUENTO', concepto: c.nombre, detalle: 'Concepto manual', monto: c.monto, imponible: false });
  const totalHaberes = lineas.filter(l => l.tipo === 'HABER').reduce((s, l) => s + l.monto, 0);
  const totalDescuentos = lineas.filter(l => l.tipo === 'DESCUENTO').reduce((s, l) => s + l.monto, 0);
  const a: ResumenAsistencia = { diasVinculo: 0, diasLiquidados: 0, diasTrabajados: 0, ausenciasSinAviso: 0, justificadosPagados: 0, justificadosNoPagados: 0, feriadosPagados: 0, tardanzaMin: 0, anticipadaMin: 0, extraDiurnaMin: 0, extraNocturnaMin: 0, feriadoDomingoMin: 0 };
  return { lineas, totalHaberes, totalDescuentos, neto: totalHaberes - totalDescuentos, baseIps: base, aporteIps, aportePatronal: R.aplicarIps && R.ipsSobreAguinaldo ? r(base * R.ipsPatronal / 100) : 0, asistencia: a, advertencias };
}
