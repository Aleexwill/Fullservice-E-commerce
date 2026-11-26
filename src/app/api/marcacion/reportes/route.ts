export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { hoy } from '@/lib/marcacion/server';
import { generarReporte } from '@/lib/marcacion/reporte-server';
import { diasEntre } from '@/lib/marcacion/reglas';

const FECHA = /^\d{4}-\d{2}-\d{2}$/;

/** Reporte de asistencia por día y por persona. ?desde&hasta (máx. 93 días) &userKey (opcional) */
export async function GET(request: NextRequest) {
  const a = await requireRole('canViewReports');
  if (a instanceof NextResponse) return a;
  const q = new URL(request.url).searchParams;
  const h = hoy();
  const desde = q.get('desde') ?? `${h.slice(0, 7)}-01`;
  const hasta = q.get('hasta') ?? h;
  if (!FECHA.test(desde) || !FECHA.test(hasta) || hasta < desde) return NextResponse.json({ error: 'Rango de fechas inválido' }, { status: 400 });
  if (diasEntre(desde, hasta).length > 93) return NextResponse.json({ error: 'El rango no puede superar 93 días' }, { status: 400 });
  try {
    const { params: _p, ...rep } = await generarReporte({ desde, hasta, userKey: q.get('userKey') });
    void _p;
    return NextResponse.json(rep);
  } catch (e) {
    console.error('GET /api/marcacion/reportes:', e);
    return NextResponse.json({ error: 'Error al generar el reporte' }, { status: 500 });
  }
}
