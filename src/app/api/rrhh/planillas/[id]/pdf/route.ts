export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { userNameOf } from '@/lib/marcacion/server';
import { generarPdfRecibos, generarPdfResumen } from '@/lib/rrhh/pdf-planilla';
import type { ReciboPdf } from '@/lib/rrhh/pdf-planilla';
import type { LineaRecibo, ResumenAsistencia } from '@/lib/rrhh/planilla';

/** ?tipo=recibos (todos o uno con &funcionarioId=) | ?tipo=resumen */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const a = await requireRole('canManageRRHH');
  if (a instanceof NextResponse) return a;
  const q = new URL(request.url).searchParams;
  const tipo = q.get('tipo') === 'resumen' ? 'resumen' : 'recibos';
  const solo = q.get('funcionarioId');
  try {
    const pl = await prisma.planilla.findUnique({ where: { id: params.id }, include: { recibos: { where: solo ? { funcionarioId: solo } : {}, orderBy: { nombre: 'asc' } } } });
    if (!pl) return NextResponse.json({ error: 'No encontrada' }, { status: 404 });
    const fs = await prisma.funcionario.findMany({ where: { id: { in: pl.recibos.map(r => r.funcionarioId) } }, select: { id: true, fechaIngreso: true, ipsNumero: true, banco: true, cuentaBancaria: true } });
    const fBy = new Map(fs.map(f => [f.id, f]));
    const recibos: ReciboPdf[] = pl.recibos.map(r => {
      const f = fBy.get(r.funcionarioId);
      return {
        nombre: r.nombre, documento: r.documento, cargo: r.cargo, fechaIngreso: f?.fechaIngreso ?? '', ipsNumero: f?.ipsNumero ?? '', banco: f?.banco ?? '', cuentaBancaria: f?.cuentaBancaria ?? '',
        lineas: r.detalle as unknown as LineaRecibo[], asistencia: r.asistencia as unknown as ResumenAsistencia, totalHaberes: r.totalHaberes, totalDescuentos: r.totalDescuentos, neto: r.neto, aportePatronal: r.aporteIpsPatronal,
      };
    }).filter(r => r.totalHaberes > 0 || r.lineas.length > 0);
    const meta = { periodo: pl.periodo, tipo: pl.tipo as 'MENSUAL' | 'AGUINALDO', estado: pl.estado as 'BORRADOR' | 'CERRADA', generadoPor: userNameOf(a), generadoEn: new Intl.DateTimeFormat('es-PY', { timeZone: 'America/Asuncion', dateStyle: 'short', timeStyle: 'short' }).format(new Date()) };
    const pdf = tipo === 'resumen' ? await generarPdfResumen(recibos, meta) : await generarPdfRecibos(recibos, meta);
    const nombre = `${tipo === 'resumen' ? 'planilla' : 'recibos'}-${pl.tipo === 'AGUINALDO' ? 'aguinaldo-' + pl.periodo.slice(0, 4) : pl.periodo}`;
    return new NextResponse(Buffer.from(pdf), { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `inline; filename="${nombre}.pdf"`, 'Cache-Control': 'no-store' } });
  } catch (e) {
    console.error('GET /api/rrhh/planillas/[id]/pdf:', e);
    return NextResponse.json({ error: 'Error al generar el PDF' }, { status: 500 });
  }
}
