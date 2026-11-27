export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { hoy, userNameOf } from '@/lib/marcacion/server';
import { generarReporte } from '@/lib/marcacion/reporte-server';
import { obtenerFechasIngreso } from '@/lib/marcacion/funcionarios';
import { generarPdfMensual } from '@/lib/marcacion/pdf-mensual';

/** PDF mensual de asistencia. ?mes=YYYY-MM (por defecto el actual) &userKey (opcional: una sola persona; sin él, una sección por persona). */
export async function GET(request: NextRequest) {
  const a = await requireRole('canViewReports');
  if (a instanceof NextResponse) return a;
  const q = new URL(request.url).searchParams;
  const mes = q.get('mes') ?? hoy().slice(0, 7);
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(mes)) return NextResponse.json({ error: 'Mes inválido (YYYY-MM)' }, { status: 400 });
  const userKey = q.get('userKey');
  try {
    const [y, m] = mes.split('-').map(Number);
    const ultimo = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const desde = `${mes}-01`, hasta = `${mes}-${String(ultimo).padStart(2, '0')}`;

    const rep = await generarReporte({ desde, hasta, userKey, completo: true });
    const ingresos = await obtenerFechasIngreso(rep.resumen.map(r => r.userKey));
    const personas = rep.resumen.map(r => ({ resumen: r, filas: rep.filas.filter(f => f.userKey === r.userKey), ingreso: ingresos.get(r.userKey) ?? null }));
    const generadoEn = new Intl.DateTimeFormat('es-PY', { timeZone: 'America/Asuncion', dateStyle: 'short', timeStyle: 'short' }).format(new Date());
    const pdf = await generarPdfMensual(personas, { mes, params: rep.params, generadoPor: userNameOf(a), generadoEn });

    const nombre = userKey && personas[0] ? `asistencia-${mes}-${personas[0].resumen.userName.normalize('NFD').replace(/[^\w]+/g, '-').toLowerCase()}` : `asistencia-${mes}`;
    return new NextResponse(Buffer.from(pdf), {
      headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `inline; filename="${nombre}.pdf"`, 'Cache-Control': 'no-store' },
    });
  } catch (e) {
    console.error('GET /api/marcacion/reportes/pdf:', e);
    return NextResponse.json({ error: 'Error al generar el PDF' }, { status: 500 });
  }
}
