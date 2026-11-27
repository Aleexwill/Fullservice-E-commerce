export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getParametros } from '@/lib/marcacion/config-server';
import { hoy, userKeyOf, userNameOf, getOficina, toSitio, toJornada, JORNADA_INCLUDE, puedeAprobar, puedeAdministrar, puedeVerReportes } from '@/lib/marcacion/server';
import type { EstadoResponse } from '@/lib/marcacion/shared';

export async function GET() {
  const session = await requireAuth();
  if (session instanceof NextResponse) return session;
  try {
    const [j, oficina, sitios, plantilla, params] = await Promise.all([
      prisma.jornada.findUnique({ where: { userKey_fecha: { userKey: userKeyOf(session), fecha: hoy() } }, include: JORNADA_INCLUDE }),
      getOficina(),
      prisma.sitio.findMany({ where: { tipo: 'OBRA', isActive: true }, orderBy: { nombre: 'asc' } }),
      prisma.rostroPlantilla.findUnique({ where: { userKey: userKeyOf(session) }, select: { id: true } }),
      getParametros(),
    ]);
    const destino = j?.sitioId ? await prisma.sitio.findUnique({ where: { id: j.sitioId } }) : null;
    const body: EstadoResponse = {
      jornada: j ? toJornada(j) : null,
      oficina,
      destino: destino ? toSitio(destino) : null,
      sitios: sitios.map(toSitio),
      user: { name: userNameOf(session), aprueba: puedeAprobar(session.role), administra: puedeAdministrar(session.role), reportes: puedeVerReportes(session.role), rostroEnrolado: !!plantilla, rostroObligatorio: params.rostroObligatorio },
    };
    return NextResponse.json(body);
  } catch (e) {
    console.error('GET /api/marcacion/estado:', e);
    return NextResponse.json({ error: 'Error al cargar la jornada' }, { status: 500 });
  }
}
