'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BarChart2, Wrench, CheckCircle2, Clock, RefreshCw, Download, Printer,
  FileText, TrendingUp, AlertCircle,
} from 'lucide-react';
import { fetchJson } from '@/lib/utils';

interface Stats {
  total: number;
  nuevos: number;
  enEjecucion: number;
  completedCount: number;
  approvedCount: number;
  conversionRate: number;
  totalEstimated: number;
  totalFinal: number;
  totalAprobado: number;
  totalFacturado: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
  byPriority: Record<string, number>;
}

const formatGs = (n: number) => 'Gs. ' + Math.round(n).toLocaleString('es-PY');

const STATUS_LABELS: Record<string, string> = {
  falta_presupuestar:   'Falta presupuestar',
  pendiente_relevo:     'Pendiente relevo',
  nuevo:                'Nuevo',
  en_revision:          'En revisión',
  enviado:              'Enviado',
  pendiente_aprobacion: 'Pendiente aprobación',
  aprobado:             'Aprobado',
  en_ejecucion:         'En ejecución',
  finalizado:           'Finalizado',
  de_baja:              'De baja',
};

const STATUS_COLORS: Record<string, string> = {
  falta_presupuestar:   '#A78BFA',
  pendiente_relevo:     '#F97316',
  nuevo:                '#3B82F6',
  en_revision:          '#F59E0B',
  enviado:              '#EAB308',
  pendiente_aprobacion: '#F59E0B',
  aprobado:             '#48BB78',
  en_ejecucion:         '#22C55E',
  finalizado:           '#16A34A',
  de_baja:              '#FC8181',
};

const TYPE_LABELS: Record<string, string> = {
  limpieza:     'Limpieza',
  mantenimiento:'Mantenimiento',
  instalacion:  'Instalación',
  reparacion:   'Reparación',
  consultoria:  'Consultoría',
  inspeccion:   'Inspección',
  otro:         'Otro',
};

const PIPELINE_ORDER = [
  'falta_presupuestar', 'pendiente_relevo', 'nuevo', 'en_revision',
  'enviado', 'pendiente_aprobacion', 'aprobado', 'en_ejecucion', 'finalizado',
];

export default function PresupuestosDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const data = await fetchJson<Stats>('/api/presupuestos/stats');
    if (data) setStats(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function handlePrint() { window.print(); }

  function handleExcel() {
    if (!stats) return;
    const rows = PIPELINE_ORDER
      .filter((s) => (stats.byStatus[s] || 0) > 0)
      .map((s) => `${STATUS_LABELS[s] || s}\t${stats.byStatus[s] || 0}`)
      .join('\n');
    const blob = new Blob([`Estado\tCantidad\n${rows}`], { type: 'text/tab-separated-values' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'presupuestos-pipeline.tsv';
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="mb-6 h-8 w-64 animate-pulse rounded bg-steel-900/40" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card animate-pulse p-5">
              <div className="h-4 w-20 rounded bg-steel-900/40" />
              <div className="mt-3 h-8 w-28 rounded bg-steel-900/40" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-6 lg:p-8">
        <p className="text-center font-body text-body-sm text-steel-500">Error al cargar estadísticas.</p>
      </div>
    );
  }

  const bajasCount = stats.byStatus['de_baja'] || 0;
  const pendienteAprobacion = stats.byStatus['pendiente_aprobacion'] || 0;

  const pipelineData = PIPELINE_ORDER
    .map((s) => ({ status: s, count: stats.byStatus[s] || 0 }))
    .filter((d) => d.count > 0);

  const maxPipeline = Math.max(...pipelineData.map((d) => d.count), 1);

  const typeData = Object.entries(stats.byType)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);

  const maxType = Math.max(...typeData.map((d) => d.count), 1);

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-h1 uppercase text-arctic">Tablero de control</h1>
          <p className="mt-0.5 font-body text-body-sm text-steel-400">Pipeline de presupuestos · resumen ejecutivo</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Aprobado total */}
          <div className="flex items-baseline gap-2 rounded-lg bg-steel-900/60 px-4 py-2">
            <span className="font-body text-caption uppercase tracking-widest text-steel-500">Aprobado</span>
            <span className="font-mono text-[1.05rem] font-semibold text-success-bright">
              {formatGs(stats.totalAprobado || stats.totalFinal)}
            </span>
          </div>

          <button type="button" onClick={handleExcel} className="btn-secondary gap-2">
            <Download className="h-4 w-4" /> Excel
          </button>
          <button type="button" onClick={handlePrint} className="btn-secondary gap-2">
            <Printer className="h-4 w-4" /> PDF
          </button>
          <button type="button" onClick={load} className="btn-secondary gap-2">
            <RefreshCw className="h-4 w-4" /> Actualizar
          </button>
        </div>
      </div>

      {/* Tab nav */}
      <div className="mb-6 flex gap-1 rounded-lg bg-steel-900/40 p-1 w-fit">
        <span className="rounded-md bg-steel-800 px-4 py-2 font-body text-body-sm font-semibold text-arctic">
          Dashboard
        </span>
        <Link href="/admin/presupuestos" className="rounded-md px-4 py-2 font-body text-body-sm text-steel-400 hover:text-arctic">
          Presupuestos
        </Link>
        <Link href="/admin/presupuestos/seguimiento" className="rounded-md px-4 py-2 font-body text-body-sm text-steel-400 hover:text-arctic">
          Seguimiento
        </Link>
      </div>

      {/* KPI Strip — matches reference: cargados, pendiente aprobación, en ejecución, finalizados */}
      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-4">
        {[
          { label: 'Presupuestos cargados', value: stats.total.toString(),            icon: FileText,      color: 'text-steel-300',    bg: 'bg-steel-900/60' },
          { label: 'Pendiente aprobación',  value: pendienteAprobacion.toString(),    icon: AlertCircle,   color: 'text-yellow-bright', bg: 'bg-yellow-muted' },
          { label: 'En ejecución',          value: stats.enEjecucion.toString(),      icon: Wrench,        color: 'text-blue-bright',   bg: 'bg-blue-muted' },
          { label: 'Finalizados',           value: stats.completedCount.toString(),   icon: CheckCircle2,  color: 'text-success-bright',bg: 'bg-success-light' },
        ].map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="card p-5">
              <div className="flex items-center gap-2">
                <div className={`flex h-7 w-7 items-center justify-center rounded-md ${k.bg}`}>
                  <Icon className={`h-3.5 w-3.5 ${k.color}`} />
                </div>
                <span className="font-body text-caption uppercase tracking-[0.06em] text-steel-500">{k.label}</span>
              </div>
              <p className="mt-2 font-display text-h2 text-arctic">{k.value}</p>
            </div>
          );
        })}
      </div>

      {/* Valores */}
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="card p-5">
          <span className="font-body text-caption uppercase tracking-wider text-steel-400">Valor estimado total</span>
          <p className="mt-2 font-display text-h1 text-arctic">{formatGs(stats.totalEstimated)}</p>
          <p className="mt-1 font-body text-caption text-steel-500">Todos los presupuestos activos</p>
        </div>
        <div className="card p-5">
          <span className="font-body text-caption uppercase tracking-wider text-success-bright">Valor aprobado</span>
          <p className="mt-2 font-display text-h1 text-arctic">{formatGs(stats.totalAprobado || stats.totalFinal)}</p>
          <p className="mt-1 font-body text-caption text-steel-500">Presupuestos aprobados y en ejecución</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-success-bright" />
            <span className="font-body text-caption uppercase tracking-wider text-steel-400">Tasa de cierre</span>
          </div>
          <p className="mt-2 font-display text-h1 text-arctic">{stats.conversionRate}%</p>
          <p className="mt-1 font-body text-caption text-steel-500">Facturado: {formatGs(stats.totalFacturado || 0)}</p>
        </div>
      </div>

      {/* Two columns: Pipeline + Tipos */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Pipeline por estado */}
        <div className="card p-5">
          <div className="mb-4 flex items-center gap-2">
            <BarChart2 className="h-4 w-4 text-blue-bright" />
            <h2 className="font-display text-h3 uppercase text-arctic">Pipeline por estado</h2>
          </div>
          {pipelineData.length === 0 ? (
            <p className="py-8 text-center font-body text-body-sm text-steel-500">Sin presupuestos</p>
          ) : (
            <div className="space-y-3">
              {pipelineData.map(({ status, count }) => {
                const pct = Math.round((count / maxPipeline) * 100);
                const color = STATUS_COLORS[status] || '#6B7280';
                return (
                  <div key={status}>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="font-body text-body-sm text-steel-300">{STATUS_LABELS[status] || status}</span>
                      <span className="font-mono text-caption text-steel-500">{count}</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-steel-900/60">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
                    </div>
                  </div>
                );
              })}
              {bajasCount > 0 && (
                <>
                  <div className="my-2 border-t border-steel-900/40" />
                  <div>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="font-body text-body-sm text-steel-500">De baja</span>
                      <span className="font-mono text-caption text-steel-500">{bajasCount}</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-steel-900/60">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.round((bajasCount / maxPipeline) * 100)}%`, backgroundColor: STATUS_COLORS['de_baja'] }} />
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Por tipo de servicio */}
        <div className="card p-5">
          <div className="mb-4 flex items-center gap-2">
            <Wrench className="h-4 w-4 text-yellow-bright" />
            <h2 className="font-display text-h3 uppercase text-arctic">Por tipo de servicio</h2>
          </div>
          {typeData.length === 0 ? (
            <p className="py-8 text-center font-body text-body-sm text-steel-500">Sin datos</p>
          ) : (
            <div className="space-y-3">
              {typeData.map(({ type, count }) => {
                const pct = Math.round((count / maxType) * 100);
                return (
                  <div key={type}>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="font-body text-body-sm text-steel-300">{TYPE_LABELS[type] || type}</span>
                      <span className="font-mono text-caption text-steel-500">{count} ({Math.round((count / stats.total) * 100)}%)</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-steel-900/60">
                      <div className="h-full rounded-full bg-yellow-bright/70 transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/admin/presupuestos" className="btn-primary">
          <FileText className="h-4 w-4" /> Ver todos los presupuestos
        </Link>
        <Link href="/admin/presupuestos/seguimiento" className="btn-secondary">
          <Clock className="h-4 w-4" /> Seguimiento 1·2·3·5·7
        </Link>
      </div>
    </div>
  );
}
