import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { hoy } from '@/lib/marcacion/server';
import { generarReporte } from '@/lib/marcacion/reporte-server';
import { getRrhhConfig, normalizarReglas } from './config';
import { calcularAguinaldo, calcularRecibo, ultimoDiaMes } from './planilla';
import type { ConceptoManual, ReciboCalculado } from './planilla';
import type { ReglasPlanilla } from './shared';

type Tx = Prisma.TransactionClient;

const toJson = (v: unknown) => v as Prisma.InputJsonValue;

async function conceptosDe(periodo: string, tipo: string): Promise<Map<string, ConceptoManual[]>> {
  const rows = await prisma.conceptoPlanilla.findMany({ where: { periodo, planilla: tipo } });
  const m = new Map<string, ConceptoManual[]>();
  for (const c of rows) m.set(c.funcionarioId, [...(m.get(c.funcionarioId) ?? []), { tipo: c.tipo as 'HABER' | 'DESCUENTO', nombre: c.nombre, monto: c.monto, imponible: c.imponible }]);
  return m;
}

/** Funcionarios con vínculo vigente en algún momento del período. */
async function funcionariosDelPeriodo(periodo: string) {
  const primero = `${periodo}-01`, ultimo = ultimoDiaMes(periodo);
  return prisma.funcionario.findMany({
    where: { fechaIngreso: { lte: ultimo }, OR: [{ fechaEgreso: null }, { fechaEgreso: { gte: primero } }] },
    orderBy: { nombre: 'asc' },
  });
}

/** Recalcula todos los recibos de una planilla en BORRADOR con las reglas vigentes de RRHH. */
export async function calcularPlanilla(planillaId: string): Promise<{ error?: string }> {
  const pl = await prisma.planilla.findUnique({ where: { id: planillaId } });
  if (!pl) return { error: 'Planilla no encontrada' };
  if (pl.estado === 'CERRADA') return { error: 'La planilla está cerrada. Reabrila para recalcular.' };
  const cfg = await getRrhhConfig();
  const reglas = cfg.planilla;
  const conceptos = await conceptosDe(pl.periodo, pl.tipo);
  const funcionarios = await funcionariosDelPeriodo(pl.periodo);
  const primero = `${pl.periodo}-01`, ultimo = ultimoDiaMes(pl.periodo);
  const h = hoy();
  const parcial = h < ultimo; // el período todavía no terminó

  type Fila = { f: (typeof funcionarios)[number]; calc: ReciboCalculado };
  const filas: Fila[] = [];

  if (pl.tipo === 'MENSUAL') {
    const [salarios] = await Promise.all([prisma.salarioFuncionario.findMany({ where: { vigenteDesde: { lte: ultimo } }, orderBy: { vigenteDesde: 'desc' } })]);
    for (const f of funcionarios) {
      const s = salarios.find(x => x.funcionarioId === f.id);
      let asistencia = null;
      if (f.userId) {
        const rep = await generarReporte({ desde: primero, hasta: ultimo, userKey: f.userId, completo: true });
        asistencia = rep.filas.length > 0 ? rep.filas : null;
      }
      const calc = calcularRecibo({
        periodo: pl.periodo, reglas, funcionario: { fechaIngreso: f.fechaIngreso, fechaEgreso: f.fechaEgreso },
        salario: s ? { tipo: s.tipo as 'MENSUAL' | 'JORNAL', monto: s.monto } : null, filas: asistencia, conceptos: conceptos.get(f.id) ?? [],
      });
      if (parcial && asistencia) calc.advertencias.push(`El período no terminó: la asistencia se calculó hasta el ${h.split('-').reverse().join('/')}. Recalculá al cierre del mes.`);
      if (f.userId && !asistencia) { /* la advertencia de falta de asistencia ya la agrega el motor cuando filas es null */ }
      filas.push({ f, calc });
    }
  } else {
    // Aguinaldo: 1/12 de los haberes de las planillas mensuales CERRADAS del año
    const anio = Number(pl.periodo.slice(0, 4));
    const recibos = await prisma.recibo.findMany({ where: { planilla: { tipo: 'MENSUAL', estado: 'CERRADA', periodo: { startsWith: String(anio) } } }, include: { planilla: { select: { periodo: true } } } });
    const porFunc = new Map<string, Record<string, number>>();
    for (const r of recibos) porFunc.set(r.funcionarioId, { ...(porFunc.get(r.funcionarioId) ?? {}), [r.planilla.periodo]: r.totalHaberes });
    for (const f of funcionarios) {
      const meses = porFunc.get(f.id);
      if (!meses || Object.values(meses).every(v => v === 0)) continue; // sin remuneraciones en el año: no hay aguinaldo
      filas.push({ f, calc: calcularAguinaldo({ anio, haberesPorMes: meses, reglas, conceptos: conceptos.get(f.id) ?? [] }) });
    }
  }

  await prisma.$transaction(async (tx: Tx) => {
    await tx.recibo.deleteMany({ where: { planillaId: pl.id } });
    for (const { f, calc } of filas) {
      await tx.recibo.create({
        data: {
          planillaId: pl.id, funcionarioId: f.id, nombre: f.nombre, documento: f.documento ?? '', cargo: f.cargo,
          detalle: toJson(calc.lineas), asistencia: toJson(calc.asistencia), totalHaberes: calc.totalHaberes, totalDescuentos: calc.totalDescuentos,
          neto: calc.neto, aporteIpsPatronal: calc.aportePatronal, advertencias: toJson(calc.advertencias),
        },
      });
    }
    await tx.planilla.update({ where: { id: pl.id }, data: { reglas: toJson(reglas) } });
  });
  return {};
}

export async function reglasDe(planilla: { reglas: unknown }): Promise<ReglasPlanilla> {
  return normalizarReglas(planilla.reglas);
}
