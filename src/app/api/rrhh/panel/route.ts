export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hoy } from '@/lib/marcacion/server';
import { generarReporte } from '@/lib/marcacion/reporte-server';
import { listarFuncionarios } from '@/lib/funcionarios-store';
import { listarVencimientos } from '@/lib/rrhh/server';
import { diasEntre } from '@/lib/marcacion/reglas';

/** Indicadores del panel de RRHH. */
export async function GET() {
  const a = await requireRole('canManageRRHH');
  if (a instanceof NextResponse) return a;
  try {
    const h = hoy();
    const mes = h.slice(0, 7);
    const desdeMes = `${mes}-01`;
    const hace30 = new Date(`${h}T12:00:00Z`); hace30.setUTCDate(hace30.getUTCDate() - 30);
    const h30 = hace30.toISOString().slice(0, 10);

    const [{ funcionarios }, venc, salarios, pendientes, planillas, rep] = await Promise.all([
      listarFuncionarios(),
      listarVencimientos(),
      prisma.salarioFuncionario.findMany({ orderBy: { vigenteDesde: 'desc' } }),
      prisma.ausencia.count({ where: { estado: 'PENDIENTE' } }),
      prisma.planilla.findMany({ orderBy: [{ periodo: 'desc' }], take: 3, select: { id: true, periodo: true, tipo: true, estado: true } }),
      diasEntre(desdeMes, h).length > 0 ? generarReporte({ desde: desdeMes, hasta: h }) : null,
    ]);
    const activos = funcionarios.filter(f => f.isActive);
    // Salario vigente hoy de cada activo
    const vigente = new Map<string, { tipo: string; monto: number }>();
    for (const s of salarios) if (s.vigenteDesde <= h && !vigente.has(s.funcionarioId)) vigente.set(s.funcionarioId, { tipo: s.tipo, monto: s.monto });
    const masaMensual = activos.reduce((acc, f) => { const s = vigente.get(f.id); return s && s.tipo === 'MENSUAL' ? acc + s.monto : acc; }, 0);

    const cumples = activos
      .filter(f => f.fechaNacimiento)
      .map(f => { const [, m, d] = f.fechaNacimiento!.split('-'); const y = Number(h.slice(0, 4)); let prox = `${y}-${m}-${d}`; if (prox < h) prox = `${y + 1}-${m}-${d}`; return { id: f.id, nombre: f.nombre, fecha: prox, anios: Number(prox.slice(0, 4)) - Number(f.fechaNacimiento!.slice(0, 4)) }; })
      .filter(c => { const lim = new Date(`${h}T12:00:00Z`); lim.setUTCDate(lim.getUTCDate() + 30); return c.fecha <= lim.toISOString().slice(0, 10); })
      .sort((x, y) => x.fecha.localeCompare(y.fecha)).slice(0, 8);

    const tramos = activos
      .filter(f => f.antiguedad.proximoTramo)
      .map(f => ({ id: f.id, nombre: f.nombre, fecha: f.antiguedad.proximoTramo! }))
      .filter(t => { const lim = new Date(`${h}T12:00:00Z`); lim.setUTCDate(lim.getUTCDate() + 90); return t.fecha >= h && t.fecha <= lim.toISOString().slice(0, 10); })
      .sort((x, y) => x.fecha.localeCompare(y.fecha)).slice(0, 8);

    const res = rep?.resumen ?? [];
    return NextResponse.json({
      fecha: h,
      dotacion: {
        activos: activos.length,
        ingresos30: funcionarios.filter(f => f.fechaIngreso >= h30).length,
        egresos30: funcionarios.filter(f => f.fechaEgreso && f.fechaEgreso >= h30).length,
        sinUsuario: activos.filter(f => !f.userId).length,
        sinSalario: activos.filter(f => !vigente.has(f.id)).length,
        sinRostro: activos.filter(f => f.userId && !f.rostro.enrolado).length,
      },
      masaSalarialMensual: masaMensual,
      asistenciaMes: {
        mes, ausencias: res.reduce((x, r) => x + r.ausencias, 0), tardanzas: res.reduce((x, r) => x + r.tardanzas, 0),
        extraMin: res.reduce((x, r) => x + r.extraMin, 0), sinSalida: res.reduce((x, r) => x + r.sinSalida, 0), ausenciasPendientes: pendientes,
      },
      vencimientos: { total: venc.items.length, vencidos: venc.items.filter(v => v.estado === 'VENCIDO').length, proximos: venc.items.slice(0, 6), alertaDias: venc.alertaDias },
      cumples, tramos, planillas,
    });
  } catch (e) {
    console.error('GET /api/rrhh/panel:', e);
    return NextResponse.json({ error: 'Error al cargar el panel' }, { status: 500 });
  }
}
