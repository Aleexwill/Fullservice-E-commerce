'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, Database, LifeBuoy, Settings, Sparkles } from 'lucide-react';
import { EstadoChip, PrioChip, TipoChip, mb } from '@/components/admin/ti/chips';

interface Panel {
  tickets: { abiertos: number; criticos: number; sinAsignar: number; nuevos: number; recientes: { id: string; numero: number; titulo: string; tipo: string; prioridad: string; estado: string }[] };
  db: { totalBytes: number; limiteBytes: number; usoPct: number; alertas: { nivel: string; titulo: string; detalle: string }[]; diasHastaLimite: number | null } | null;
  ia: { llamadasMes: number } | null;
}

const Kpi = ({ t, v, sub, href, warn }: { t: string; v: string | number; sub?: string; href: string; warn?: boolean }) => (
  <Link href={href} className="card block p-4 transition-colors hover:border-blue-bright/50">
    <p className="font-body text-caption text-steel-400">{t}</p>
    <p className={`font-display text-h2 ${warn ? 'text-danger-bright' : 'text-arctic'}`}>{v}</p>
    {sub && <p className="font-body text-caption text-steel-500">{sub}</p>}
  </Link>
);

export default function TiPanel() {
  const [p, setP] = useState<Panel | null>(null);
  const [err, setErr] = useState('');
  useEffect(() => {
    fetch('/api/ti/panel').then(async r => { const j = await r.json(); if (!r.ok) throw new Error(j.error); setP(j); }).catch(e => setErr(e.message || 'Error al cargar'));
  }, []);

  return (
    <div className="p-4 sm:p-6">
      <h1 className="font-display text-h1 text-arctic">Panel TI</h1>
      <p className="mb-5 font-body text-body-sm text-steel-400">Estado de la base de datos, tickets de incidencias y mejoras, uso de IA y configuración del sistema.</p>
      {err && <p role="alert" className="mb-3 rounded-md bg-danger-light/10 px-3 py-2 text-caption text-danger-bright">{err}</p>}
      {!p && !err && <p className="text-steel-400">Cargando…</p>}
      {p && (<>
        {p.db && p.db.alertas.length > 0 && (
          <section className="mb-5 space-y-2" aria-label="Alertas">
            {p.db.alertas.map((a, i) => (
              <div key={i} className={`flex gap-3 rounded-lg border p-3 text-body-sm ${a.nivel === 'critica' ? 'border-danger/50 bg-danger-light/10 text-danger-bright' : 'border-orange-bright/40 bg-orange-muted text-orange-bright'}`}>
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-none" /><p><b>{a.titulo}.</b> <span className="text-steel-100">{a.detalle}</span></p>
              </div>))}
          </section>)}
        <section className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Resumen">
          <Kpi t="Tickets abiertos" v={p.tickets.abiertos} sub={`${p.tickets.nuevos} nuevos · ${p.tickets.sinAsignar} sin asignar`} href="/admin/ti/tickets?estado=abiertos" />
          <Kpi t="Tickets críticos" v={p.tickets.criticos} warn={p.tickets.criticos > 0} href="/admin/ti/tickets?estado=abiertos&prioridad=CRITICA" />
          <Kpi t="Base de datos" v={p.db ? `${p.db.usoPct}%` : '—'} sub={p.db ? `${mb(p.db.totalBytes)} de ${mb(p.db.limiteBytes)}${p.db.diasHastaLimite != null ? ` · ~${p.db.diasHastaLimite} días al límite` : ''}` : 'No disponible'} warn={!!p.db && p.db.alertas.some(a => a.nivel === 'critica')} href="/admin/ti/base-de-datos" />
          <Kpi t="Llamadas de IA este mes" v={p.ia ? p.ia.llamadasMes.toLocaleString('es-PY') : '—'} href="/admin/ia" />
        </section>
        <div className="grid gap-4 lg:grid-cols-3">
          <section className="card p-4 lg:col-span-2" aria-label="Tickets recientes">
            <div className="mb-2 flex items-center justify-between"><h2 className="font-display text-h3 text-arctic">Tickets con actividad reciente</h2><Link href="/admin/ti/tickets" className="text-caption text-blue-bright">Ver todos</Link></div>
            {p.tickets.recientes.length === 0 ? <p className="py-4 text-body-sm text-steel-400">No hay tickets abiertos.</p> : (
              <ul className="divide-y divide-steel-700/60">{p.tickets.recientes.map(t => (
                <li key={t.id}><Link href={`/admin/ti/tickets/${t.id}`} className="flex flex-wrap items-center gap-2 py-2 hover:bg-steel-900/40">
                  <span className="text-caption text-steel-500">#{t.numero}</span><span className="min-w-0 flex-1 truncate text-body-sm text-arctic">{t.titulo}</span>
                  <TipoChip v={t.tipo} /><PrioChip v={t.prioridad} /><EstadoChip v={t.estado} />
                </Link></li>))}</ul>)}
          </section>
          <section className="card p-4" aria-label="Accesos">
            <h2 className="mb-2 font-display text-h3 text-arctic">Accesos</h2>
            <ul className="space-y-1 text-body-sm">
              {[['/admin/ti/tickets/nuevo', LifeBuoy, 'Crear un ticket'], ['/admin/ti/base-de-datos', Database, 'Monitoreo de la base de datos'], ['/admin/ia', Sparkles, 'Uso de IA y límites'], ['/admin/config', Settings, 'Configuración del sistema']].map(([h, I, l]) => { const Ic = I as typeof Database; return <li key={h as string}><Link href={h as string} className="flex items-center gap-2 rounded px-2 py-2 text-steel-100 hover:bg-steel-900/60"><Ic className="h-4 w-4 text-steel-400" />{l as string}</Link></li>; })}
            </ul>
          </section>
        </div>
      </>)}
    </div>
  );
}
