import { prisma } from '@/lib/prisma';
import { hoy } from './server';
import { getParametros, getUsuariosMarca } from './config-server';
import { calcularDia, diasEntre } from './reglas';
import type { FilaDia, Parametros, TipoAusencia } from './reglas';

export interface ResumenPersona {
  userKey: string; userName: string; diasTrabajados: number; trabajadoMin: number; tardanzas: number; tardanzaMin: number; ausencias: number;
  justificados: number; extraMin: number; anticipadas: number; trasladoMin: number; enSitioMin: number; sinSalida: number;
}
export interface Reporte {
  desde: string; hasta: string; filas: FilaDia[]; resumen: ResumenPersona[]; personas: { userKey: string; nombre: string }[]; params: Parametros;
}

const JUSTIFICADOS = ['VACACIONES', 'PERMISO', 'REPOSO_MEDICO', 'LICENCIA'];

/**
 * Calcula la asistencia por día y persona. Con `completo` se incluyen también descansos y feriados sin actividad
 * (el PDF mensual muestra el calendario entero); sin él, solo los días con actividad o que exigían marcar.
 */
export async function generarReporte(o: { desde: string; hasta: string; userKey?: string | null; completo?: boolean }): Promise<Reporte> {
  const { desde, hasta, completo } = o;
  const filtro = o.userKey || null;
  const h = hoy();
  const fechas = diasEntre(desde, hasta);
  const params = await getParametros();
  const [usuarios, jornadas, feriados, ausencias] = await Promise.all([
    getUsuariosMarca(params),
    prisma.jornada.findMany({ where: { fecha: { gte: desde, lte: hasta }, ...(filtro ? { userKey: filtro } : {}) }, include: { marcas: { orderBy: { createdAt: 'asc' } } } }),
    prisma.feriado.findMany({ where: { fecha: { gte: desde, lte: hasta } } }),
    prisma.ausencia.findMany({ where: { estado: 'APROBADA', desde: { lte: hasta }, hasta: { gte: desde }, ...(filtro ? { userKey: filtro } : {}) } }),
  ]);
  const fer = new Map(feriados.map(f => [f.fecha, f.nombre]));
  const jBy = new Map(jornadas.map(j => [`${j.userKey}|${j.fecha}`, j]));

  // Personas del reporte: las que marcan asistencia + cualquiera con jornadas en el rango
  const personas = new Map<string, { userName: string; trabaja: boolean; dias: Parametros['dias'] }>();
  for (const u of usuarios) if (!filtro || u.userKey === filtro) personas.set(u.userKey, { userName: u.nombre, trabaja: u.marca, dias: u.dias ?? params.dias });
  for (const j of jornadas) if (!personas.has(j.userKey)) personas.set(j.userKey, { userName: j.userName, trabaja: false, dias: params.dias });

  const filas: FilaDia[] = [];
  for (const [userKey, p] of personas) {
    if (!p.trabaja && !jornadas.some(j => j.userKey === userKey)) continue;
    const aus = ausencias.filter(x => x.userKey === userKey);
    for (const fecha of fechas) {
      const j = jBy.get(`${userKey}|${fecha}`);
      const au = aus.find(x => x.desde <= fecha && x.hasta >= fecha);
      const fila = calcularDia({
        fecha, hoy: h, userKey, userName: p.userName, params, dias: p.dias,
        marcas: j?.marcas ?? [], sitio: j?.sitioNombre ?? '', feriado: fer.get(fecha), ausencia: (au?.tipo as TipoAusencia) ?? null, trabaja: p.trabaja,
      });
      if (!fila) continue;
      if (!completo && !j && (fila.estado === 'DESCANSO' || (fila.estado === 'FERIADO' && !p.trabaja))) continue;
      filas.push(fila);
    }
  }
  filas.sort((x, y) => x.userName.localeCompare(y.userName) || x.fecha.localeCompare(y.fecha));

  const resumen = new Map<string, ResumenPersona>();
  for (const f of filas) {
    const r = resumen.get(f.userKey) ?? { userKey: f.userKey, userName: f.userName, diasTrabajados: 0, trabajadoMin: 0, tardanzas: 0, tardanzaMin: 0, ausencias: 0, justificados: 0, extraMin: 0, anticipadas: 0, trasladoMin: 0, enSitioMin: 0, sinSalida: 0 };
    if (f.entrada) r.diasTrabajados++;
    r.trabajadoMin += f.trabajadoMin; r.extraMin += f.extraMin; r.trasladoMin += f.trasladoMin; r.enSitioMin += f.enSitioMin; r.tardanzaMin += f.tardanzaMin;
    if (f.tardanzaMin > 0) r.tardanzas++;
    if (f.anticipadaMin > 0) r.anticipadas++;
    if (f.estado === 'AUSENTE') r.ausencias++;
    if (JUSTIFICADOS.includes(f.estado)) r.justificados++;
    if (f.estado === 'INCOMPLETA') r.sinSalida++;
    resumen.set(f.userKey, r);
  }
  return { desde, hasta, filas, resumen: [...resumen.values()], personas: usuarios.filter(u => u.marca).map(u => ({ userKey: u.userKey, nombre: u.nombre })), params };
}
