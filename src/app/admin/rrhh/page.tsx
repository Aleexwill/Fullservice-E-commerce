'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AlertTriangle, Cake, CalendarClock, FileText, Users, Banknote, ClipboardCheck, TrendingUp } from 'lucide-react';
import { fmtFecha, fmtGs, periodoLabel } from '@/lib/rrhh/shared';
import { horasTxt } from '@/lib/marcacion/reglas';

interface Panel {
  fecha: string;
  dotacion: { activos: number; ingresos30: number; egresos30: number; sinUsuario: number; sinSalario: number; sinRostro: number };
  masaSalarialMensual: number;
  asistenciaMes: { mes: string; ausencias: number; tardanzas: number; extraMin: number; sinSalida: number; ausenciasPendientes: number };
  vencimientos: { total: number; vencidos: number; alertaDias: number; proximos: { id: string; origen: string; funcionarioId: string; funcionario: string; detalle: string; vence: string; estado: string }[] };
  cumples: { id: string; nombre: string; fecha: string; anios: number }[];
  tramos: { id: string; nombre: string; fecha: string }[];
  planillas: { id: string; periodo: string; tipo: string; estado: string }[];
}

export default function RrhhPanelPage() {
  const [d, setD] = useState<Panel | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    fetch('/api/rrhh/panel', { cache: 'no-store' }).then(async r => { const j = await r.json(); if (!r.ok) throw new Error(j.error ?? 'Error'); setD(j); }).catch(e => setError(e.message));
  }, []);

  const avisos = d ? [
    d.vencimientos.vencidos > 0 && { t: `${d.vencimientos.vencidos} vencimiento${d.vencimientos.vencidos > 1 ? 's' : ''} sin renovar`, href: '/admin/rrhh/vencimientos' },
    d.asistenciaMes.ausenciasPendientes > 0 && { t: `${d.asistenciaMes.ausenciasPendientes} solicitud${d.asistenciaMes.ausenciasPendientes > 1 ? 'es' : ''} de ausencia por resolver`, href: '/marcacion/ausencias' },
    d.dotacion.sinSalario > 0 && { t: `${d.dotacion.sinSalario} funcionario${d.dotacion.sinSalario > 1 ? 's' : ''} sin salario cargado`, href: '/admin/funcionarios' },
    d.dotacion.sinUsuario > 0 && { t: `${d.dotacion.sinUsuario} sin usuario enlazado (no se calcula su asistencia)`, href: '/admin/funcionarios' },
    d.dotacion.sinRostro > 0 && { t: `${d.dotacion.sinRostro} sin rostro enrolado`, href: '/admin/funcionarios' },
  ].filter(Boolean) as { t: string; href: string }[] : [];

  return (
    <div className="p-4 sm:p-6">
      <h1 className="font-display text-h1 text-arctic">Panel RRHH</h1>
      <p className="mb-5 font-body text-body-sm text-steel-400">Personal, asistencia, vencimientos y planilla en un solo lugar.</p>
      {error && <p role="alert" className="mb-4 rounded-md bg-danger-light/10 px-3 py-2 text-caption text-danger-bright">{error}</p>}
      {!d && !error && <p className="text-steel-400">Cargando…</p>}
      {d && (<>
        {avisos.length > 0 && (
          <div className="mb-5 grid gap-2 sm:grid-cols-2">
            {avisos.map(a => (
              <Link key={a.t} href={a.href} className="flex items-center gap-2 rounded-lg border border-orange/40 bg-orange-muted/40 px-3 py-2 font-body text-body-sm text-orange-bright hover:border-orange">
                <AlertTriangle className="h-4 w-4 flex-none" />{a.t}
              </Link>
            ))}
          </div>
        )}
        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            [d.dotacion.activos, 'Funcionarios activos', `${d.dotacion.ingresos30} ingresos y ${d.dotacion.egresos30} bajas en 30 días`],
            [fmtGs(d.masaSalarialMensual), 'Masa salarial mensual', 'Solo sueldos mensuales vigentes'],
            [d.asistenciaMes.ausencias, 'Ausencias sin aviso', `${d.asistenciaMes.tardanzas} tardanzas en ${periodoLabel(d.asistenciaMes.mes)}`],
            [horasTxt(d.asistenciaMes.extraMin), 'Horas extra del mes', `${d.asistenciaMes.sinSalida} jornadas sin salida`],
          ].map(([n, l, sub]) => (
            <div key={String(l)} className="card p-4"><div className="font-display text-h2 text-arctic">{n}</div><div className="font-body text-body-sm text-steel-100">{l}</div><div className="font-body text-caption text-steel-500">{sub}</div></div>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <section className="card p-5">
            <div className="mb-3 flex items-center justify-between"><h2 className="flex items-center gap-2 font-display text-h3 text-arctic"><CalendarClock className="h-5 w-5 text-orange" />Vencimientos</h2><Link href="/admin/rrhh/vencimientos" className="text-caption text-blue-bright hover:underline">Ver todos</Link></div>
            {d.vencimientos.proximos.length === 0 ? <p className="text-body-sm text-steel-400">Nada vence en los próximos {d.vencimientos.alertaDias} días.</p> : (
              <ul className="space-y-2">{d.vencimientos.proximos.map(v => (
                <li key={v.id} className="flex items-start justify-between gap-3 text-body-sm"><div><Link href={`/admin/funcionarios/${v.funcionarioId}`} className="text-arctic hover:underline">{v.funcionario}</Link><div className="text-caption text-steel-400">{v.detalle}</div></div>
                  <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-caption ${v.estado === 'VENCIDO' ? 'bg-danger-light/20 text-danger-bright' : 'bg-orange-muted text-orange-bright'}`}>{fmtFecha(v.vence)}</span></li>
              ))}</ul>)}
          </section>
          <section className="card p-5">
            <h2 className="mb-3 flex items-center gap-2 font-display text-h3 text-arctic"><Cake className="h-5 w-5 text-blue" />Cumpleaños (30 días)</h2>
            {d.cumples.length === 0 ? <p className="text-body-sm text-steel-400">Sin cumpleaños próximos o sin fechas de nacimiento cargadas.</p> : (
              <ul className="space-y-1.5">{d.cumples.map(c => <li key={c.id} className="flex justify-between text-body-sm"><Link href={`/admin/funcionarios/${c.id}`} className="text-arctic hover:underline">{c.nombre} <span className="text-steel-400">({c.anios})</span></Link><span className="text-steel-300">{fmtFecha(c.fecha).slice(0, 5)}</span></li>)}</ul>)}
          </section>
          <section className="card p-5">
            <h2 className="mb-3 flex items-center gap-2 font-display text-h3 text-arctic"><TrendingUp className="h-5 w-5 text-success-bright" />Cambios de tramo de vacaciones (90 días)</h2>
            {d.tramos.length === 0 ? <p className="text-body-sm text-steel-400">Ningún funcionario cambia de tramo pronto.</p> : (
              <ul className="space-y-1.5">{d.tramos.map(t => <li key={t.id} className="flex justify-between text-body-sm"><Link href={`/admin/funcionarios/${t.id}`} className="text-arctic hover:underline">{t.nombre}</Link><span className="text-steel-300">{fmtFecha(t.fecha)}</span></li>)}</ul>)}
          </section>
          <section className="card p-5">
            <div className="mb-3 flex items-center justify-between"><h2 className="flex items-center gap-2 font-display text-h3 text-arctic"><Banknote className="h-5 w-5 text-blue" />Planillas</h2><Link href="/admin/rrhh/planilla" className="text-caption text-blue-bright hover:underline">Abrir</Link></div>
            {d.planillas.length === 0 ? <p className="text-body-sm text-steel-400">Todavía no hay planillas. Creá la del mes desde Planilla de sueldos.</p> : (
              <ul className="space-y-1.5">{d.planillas.map(p => <li key={p.id} className="flex justify-between text-body-sm"><Link href={`/admin/rrhh/planilla/${p.id}`} className="text-arctic hover:underline">{p.tipo === 'AGUINALDO' ? 'Aguinaldo' : 'Sueldos'} {periodoLabel(p.periodo)}</Link><span className={p.estado === 'CERRADA' ? 'text-success-bright' : 'text-orange-bright'}>{p.estado === 'CERRADA' ? 'Cerrada' : 'Borrador'}</span></li>)}</ul>)}
          </section>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {[[Users, 'Funcionarios y legajos', '/admin/funcionarios'], [ClipboardCheck, 'Asistencia y reportes', '/marcacion/reportes'], [FileText, 'Parámetros de RRHH', '/admin/rrhh/parametros']].map(([Icon, l, href]) => {
            const I = Icon as typeof Users; return <Link key={String(l)} href={String(href)} className="card flex items-center gap-3 p-4 hover:border-blue/50"><I className="h-5 w-5 text-blue" /><span className="font-body text-body text-arctic">{String(l)}</span></Link>;
          })}
        </div>
      </>)}
    </div>
  );
}
