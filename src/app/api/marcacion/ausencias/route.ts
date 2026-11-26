export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { puedeAprobar, userKeyOf, userNameOf, hoy } from '@/lib/marcacion/server';
import { getParametros } from '@/lib/marcacion/config-server';
import { TIPOS_AUSENCIA, diasEntre, diaSemana } from '@/lib/marcacion/reglas';
import type { TipoAusencia } from '@/lib/marcacion/reglas';

const FECHA = /^\d{4}-\d{2}-\d{2}$/;
const dto = (a: { id: string; userKey: string; userName: string; tipo: string; desde: string; hasta: string; motivo: string; estado: string; creadaPor: string; revisorName: string; revisorMotivo: string; createdAt: Date }) =>
  ({ id: a.id, userKey: a.userKey, userName: a.userName, tipo: a.tipo as TipoAusencia, desde: a.desde, hasta: a.hasta, motivo: a.motivo, estado: a.estado, creadaPor: a.creadaPor, revisorName: a.revisorName, revisorMotivo: a.revisorMotivo, createdAt: a.createdAt.toISOString() });

/** ?scope=mias (por defecto) | pendientes | todas (estas dos, solo encargados). Incluye días de vacaciones usados en el año. */
export async function GET(request: NextRequest) {
  const s = await requireAuth();
  if (s instanceof NextResponse) return s;
  const scope = new URL(request.url).searchParams.get('scope') ?? 'mias';
  const aprueba = puedeAprobar(s.role);
  if (scope !== 'mias' && !aprueba) return NextResponse.json({ error: 'Sin permiso' }, { status: 403 });

  const where = scope === 'pendientes' ? { estado: 'PENDIENTE' } : scope === 'todas' ? { hasta: { gte: `${hoy().slice(0, 4)}-01-01` } } : { userKey: userKeyOf(s) };
  const rows = await prisma.ausencia.findMany({ where, orderBy: [{ desde: 'desc' }], take: 200 });

  // Vacaciones aprobadas del año en curso (días hábiles según el horario general, sin feriados)
  const [params, feriados] = await Promise.all([getParametros(), prisma.feriado.findMany({ where: { fecha: { startsWith: hoy().slice(0, 4) } } })]);
  const fer = new Set(feriados.map(f => f.fecha));
  const anio = hoy().slice(0, 4);
  const usados = (userKey: string) => {
    let n = 0;
    for (const a of rows.filter(r => r.userKey === userKey && r.tipo === 'VACACIONES' && r.estado === 'APROBADA')) {
      for (const d of diasEntre(a.desde, a.hasta)) if (d.startsWith(anio) && params.dias[String(diaSemana(d))].laboral && !fer.has(d)) n++;
    }
    return n;
  };
  const vac = scope === 'mias'
    ? { usados: usados(userKeyOf(s)), total: params.vacacionesDias }
    : { usados: 0, total: params.vacacionesDias };
  return NextResponse.json({ ausencias: rows.map(dto), vacaciones: vac, aprueba });
}

/** El trabajador solicita (queda PENDIENTE). Un encargado puede registrar para otra persona y queda APROBADA. */
export async function POST(request: NextRequest) {
  const s = await requireAuth();
  if (s instanceof NextResponse) return s;
  try {
    const b = await request.json();
    if (!TIPOS_AUSENCIA.includes(b.tipo)) return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 });
    if (!FECHA.test(b.desde ?? '') || !FECHA.test(b.hasta ?? '') || Number.isNaN(Date.parse(b.desde)) || Number.isNaN(Date.parse(b.hasta))) return NextResponse.json({ error: 'Fechas inválidas' }, { status: 400 });
    if (b.hasta < b.desde) return NextResponse.json({ error: 'La fecha final no puede ser anterior a la inicial' }, { status: 400 });
    if (diasEntre(b.desde, b.hasta).length > 60) return NextResponse.json({ error: 'El período no puede superar 60 días' }, { status: 400 });
    const motivo = typeof b.motivo === 'string' ? b.motivo.trim().slice(0, 200) : '';

    let userKey = userKeyOf(s), userName = userNameOf(s), estado = 'PENDIENTE';
    if (typeof b.userKey === 'string' && b.userKey !== userKey) {
      if (!puedeAprobar(s.role)) return NextResponse.json({ error: 'Sin permiso para registrar por otra persona' }, { status: 403 });
      const u = await prisma.user.findUnique({ where: { id: b.userKey } });
      if (!u) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
      userKey = u.id; userName = u.name; estado = 'APROBADA';
    }
    const solapa = await prisma.ausencia.findFirst({ where: { userKey, estado: { in: ['PENDIENTE', 'APROBADA'] }, desde: { lte: b.hasta }, hasta: { gte: b.desde } } });
    if (solapa) return NextResponse.json({ error: `Se superpone con otra solicitud (${solapa.desde} a ${solapa.hasta})` }, { status: 409 });

    const a = await prisma.ausencia.create({
      data: { userKey, userName, tipo: b.tipo, desde: b.desde, hasta: b.hasta, motivo, estado, creadaPor: userNameOf(s), ...(estado === 'APROBADA' ? { revisorName: userNameOf(s), revisadoAt: new Date() } : {}) },
    });
    return NextResponse.json(dto(a), { status: 201 });
  } catch (e) {
    console.error('POST /api/marcacion/ausencias:', e);
    return NextResponse.json({ error: 'Error al guardar' }, { status: 500 });
  }
}
