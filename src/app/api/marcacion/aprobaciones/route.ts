export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hoy, toEpp } from '@/lib/marcacion/server';

/** Cola del encargado: fotos pendientes + revisadas hoy. */
export async function GET() {
  const auth = await requireRole('canAprobarPresupuestos');
  if (auth instanceof NextResponse) return auth;
  try {
    const include = { jornada: { select: { userName: true, sitioNombre: true, otRef: true, marcas: { where: { tipo: 'LLEGADA_LUGAR' }, select: { createdAt: true, distanciaM: true }, take: 1 } } } };
    const [pendientes, revisadas] = await Promise.all([
      prisma.verificacionEpp.findMany({ where: { estado: 'PENDIENTE' }, orderBy: { createdAt: 'asc' }, take: 50, include }),
      prisma.verificacionEpp.findMany({ where: { estado: { not: 'PENDIENTE' }, jornada: { fecha: hoy() } }, orderBy: { revisadoAt: 'desc' }, take: 30, include }),
    ]);
    const map = (e: (typeof pendientes)[number]) => ({
      ...toEpp(e),
      trabajador: e.jornada.userName,
      sitio: e.jornada.sitioNombre,
      otRef: e.jornada.otRef,
      llegada: e.jornada.marcas[0]?.createdAt.toISOString() ?? null,
      distanciaM: e.jornada.marcas[0]?.distanciaM ?? null,
      revisadoAt: e.revisadoAt?.toISOString() ?? null,
    });
    return NextResponse.json({ pendientes: pendientes.map(map), revisadas: revisadas.map(map) });
  } catch (e) {
    console.error('GET /api/marcacion/aprobaciones:', e);
    return NextResponse.json({ error: 'Error al cargar solicitudes' }, { status: 500 });
  }
}
