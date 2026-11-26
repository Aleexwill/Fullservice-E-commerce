export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hoy } from '@/lib/marcacion/server';
import { getParametros, getUsuariosMarca } from '@/lib/marcacion/config-server';
import { calcularDia, diasEntre } from '@/lib/marcacion/reglas';
import type { FilaDia, TipoAusencia } from '@/lib/marcacion/reglas';

const FECHA = /^\d{4}-\d{2}-\d{2}$/;

export interface ResumenPersona {
  userKey: string; userName: string; diasTrabajados: number; trabajadoMin: number; tardanzas: number; tardanzaMin: number; ausencias: number;
  justificados: number; extraMin: number; anticipadas: number; trasladoMin: number; enSitioMin: number; sinSalida: number;
}

/** Reporte de asistencia por día y por persona. ?desde&hasta (máx. 93 días) &userKey (opcional) */
export async function GET(request: NextRequest) {
  const a = await requireRole('canViewReports');
  if (a instanceof NextResponse) return a;
  const q = new URL(request.url).searchParams;
  const h = hoy();
  const desde = q.get('desde') ?? `${h.slice(0, 7)}-01`;
  const hasta = q.get('hasta') ?? h;
  if (!FECHA.test(desde) || !FECHA.test(hasta) || hasta < desde) return NextResponse.json({ error: 'Rango de fechas inválido' }, { status: 400 });
  const fechas = diasEntre(desde, hasta);
  if (fechas.length > 93) return NextResponse.json({ error: 'El rango no puede superar 93 días' }, { status: 400 });
  const filtro = q.get('userKey');

  try {
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
    const personas = new Map<string, { userName: string; trabaja: boolean; dias: typeof params.dias }>();
    for (const u of usuarios) if (!filtro || u.userKey === filtro) personas.set(u.userKey, { userName: u.nombre, trabaja: u.marca, dias: u.dias ?? params.dias });
    for (const j of jornadas) if (!personas.has(j.userKey)) personas.set(j.userKey, { userName: j.userName, trabaja: false, dias: params.dias });
    const diasDe = new Map(usuarios.map(u => [u.userKey, u.dias ?? params.dias]));

    const filas: FilaDia[] = [];
    for (const [userKey, p] of personas) {
      // Solo se muestran personas que deben marcar o que tienen actividad
      if (!p.trabaja && !jornadas.some(j => j.userKey === userKey)) continue;
      const aus = ausencias.filter(x => x.userKey === userKey);
      for (const fecha of fechas) {
        const j = jBy.get(`${userKey}|${fecha}`);
        const au = aus.find(x => x.desde <= fecha && x.hasta >= fecha);
        const fila = calcularDia({
          fecha, hoy: h, userKey, userName: p.userName, params, dias: diasDe.get(userKey) ?? p.dias,
          marcas: j?.marcas ?? [], sitio: j?.sitioNombre ?? '', feriado: fer.get(fecha), ausencia: (au?.tipo as TipoAusencia) ?? null, trabaja: p.trabaja,
        });
        if (fila && !(fila.estado === 'DESCANSO' && !j) && !(fila.estado === 'FERIADO' && !j && !p.trabaja)) filas.push(fila);
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
      if (['VACACIONES', 'PERMISO', 'REPOSO_MEDICO', 'LICENCIA'].includes(f.estado)) r.justificados++;
      if (f.estado === 'INCOMPLETA') r.sinSalida++;
      resumen.set(f.userKey, r);
    }
    return NextResponse.json({ desde, hasta, filas, resumen: [...resumen.values()], personas: usuarios.filter(u => u.marca).map(u => ({ userKey: u.userKey, nombre: u.nombre })) });
  } catch (e) {
    console.error('GET /api/marcacion/reportes:', e);
    return NextResponse.json({ error: 'Error al generar el reporte' }, { status: 500 });
  }
}
