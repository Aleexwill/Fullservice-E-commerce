export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hoy } from '@/lib/marcacion/server';
import { getParametros, getUsuariosMarca } from '@/lib/marcacion/config-server';
import { ESTADO_LABEL } from '@/lib/marcacion/shared';
import type { Estado } from '@/lib/marcacion/shared';
import { diaSemana, hhmm, minutosLocal } from '@/lib/marcacion/reglas';

/** Quién está dónde ahora: estado de cada persona que debe marcar hoy. */
export async function GET() {
  const a = await requireRole('canViewReports');
  if (a instanceof NextResponse) return a;
  try {
    const fecha = hoy();
    const params = await getParametros();
    const [usuarios, jornadas, feriado, ausencias] = await Promise.all([
      getUsuariosMarca(params),
      prisma.jornada.findMany({ where: { fecha }, include: { marcas: { orderBy: { createdAt: 'asc' } }, epps: { orderBy: { createdAt: 'desc' }, take: 1 } } }),
      prisma.feriado.findFirst({ where: { fecha } }),
      prisma.ausencia.findMany({ where: { estado: 'APROBADA', desde: { lte: fecha }, hasta: { gte: fecha } } }),
    ]);
    const jBy = new Map(jornadas.map(j => [j.userKey, j]));
    const filas = usuarios.filter(u => u.marca || jBy.has(u.userKey)).map(u => {
      const j = jBy.get(u.userKey);
      const au = ausencias.find(x => x.userKey === u.userKey);
      const h = (u.dias ?? params.dias)[String(diaSemana(fecha))];
      const ing = j?.marcas.find(m => m.tipo === 'INGRESO');
      let estado = 'Sin marcar';
      if (j) estado = j.enAlmuerzo ? 'En almuerzo' : ESTADO_LABEL[j.estado as Estado];
      else if (au) estado = 'Ausencia justificada';
      else if (feriado) estado = 'Feriado';
      else if (!h.laboral) estado = 'Descanso';
      const tarde = ing && h.laboral && minutosLocal(ing.createdAt) - (Number(h.entrada.slice(0, 2)) * 60 + Number(h.entrada.slice(3))) > params.toleranciaMin;
      return {
        userKey: u.userKey, nombre: u.nombre, estado, sitio: j?.sitioNombre ?? '', entrada: ing ? hhmm(minutosLocal(ing.createdAt)) : '',
        tarde: !!tarde, eppPendiente: j?.epps[0]?.estado === 'PENDIENTE', ausenciaTipo: au?.tipo ?? null,
      };
    });
    return NextResponse.json({ fecha, filas });
  } catch (e) {
    console.error('GET /api/marcacion/reportes/hoy:', e);
    return NextResponse.json({ error: 'Error al cargar' }, { status: 500 });
  }
}
