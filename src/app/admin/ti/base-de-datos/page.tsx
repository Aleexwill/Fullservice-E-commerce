'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, RefreshCw, Save } from 'lucide-react';
import type { EstadoDb, PuntoCrecimiento, TiParams } from '@/lib/ti/db';
import { fechaCorta, mb } from '@/components/admin/ti/chips';

type Datos = EstadoDb & { crecimiento: { puntos: PuntoCrecimiento[]; bytesPorDia: number | null; diasHastaLimite: number | null } };
const nf = (n: number) => n.toLocaleString('es-PY');
const L = 'mb-1 block font-body text-caption text-steel-400';

function Crecimiento({ puntos, limite }: { puntos: PuntoCrecimiento[]; limite: number }) {
  if (puntos.length < 2) return <p className="text-body-sm text-steel-400">Todavía hay {puntos.length} punto(s). Se guarda uno por día cuando se abre esta pantalla; el gráfico aparece desde el segundo día.</p>;
  const max = Math.max(limite, ...puntos.map(p => p.bytes));
  return (
    <div role="img" aria-label={`Crecimiento de la base de datos, de ${mb(puntos[0].bytes)} a ${mb(puntos[puntos.length - 1].bytes)}`}>
      <div className="flex h-32 items-end gap-px">
        {puntos.map(p => <div key={p.fecha} title={`${p.fecha}: ${mb(p.bytes)}`} className="h-full flex-1 flex-col justify-end flex"><div className="w-full rounded-t bg-blue-bright/70" style={{ height: `${Math.max(2, (p.bytes / max) * 100)}%` }} /></div>)}
      </div>
      <div className="mt-1 flex justify-between text-caption text-steel-500"><span>{puntos[0].fecha}</span><span>{puntos[puntos.length - 1].fecha}</span></div>
    </div>
  );
}

export default function BaseDeDatosPage() {
  const [d, setD] = useState<Datos | null>(null);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const [cargando, setCargando] = useState(false);
  const [pr, setPr] = useState<TiParams | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true); setErr('');
    try { const r = await fetch('/api/ti/db'); const j = await r.json(); if (!r.ok) throw new Error(j.error); setD(j); setPr(j.params); }
    catch (e) { setErr(e instanceof Error ? e.message : 'Error al cargar'); } finally { setCargando(false); }
  }, []);
  useEffect(() => { cargar(); }, [cargar]);

  async function guardar() {
    setErr(''); setMsg('');
    const r = await fetch('/api/ti/db', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(pr) });
    const j = await r.json();
    if (!r.ok) return setErr(j.error || 'No se pudo guardar');
    setMsg('Umbrales guardados'); cargar();
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-h1 text-arctic">Base de datos</h1>
          <p className="font-body text-body-sm text-steel-400">Monitoreo de solo lectura: tamaño, tablas, conexiones, índices y migraciones. No se puede modificar ni consultar datos desde aquí.</p>
        </div>
        <button onClick={cargar} disabled={cargando} className="btn-secondary" aria-label="Actualizar"><RefreshCw className={`h-4 w-4 ${cargando ? 'animate-spin' : ''}`} /></button>
      </div>
      {err && <p role="alert" className="mb-3 rounded-md bg-danger-light/10 px-3 py-2 text-caption text-danger-bright">{err}</p>}
      {msg && <p role="status" className="mb-3 rounded-md bg-success-light/10 px-3 py-2 text-caption text-success-bright">{msg}</p>}
      {!d && !err && <p className="text-steel-400">Cargando…</p>}
      {d && (<>
        {d.alertas.length === 0
          ? <div className="mb-5 flex items-center gap-2 rounded-lg border border-success/40 bg-success-light/10 p-3 text-body-sm text-success-bright"><CheckCircle2 className="h-4 w-4" />Sin alertas: la base está dentro de los umbrales.</div>
          : <section className="mb-5 space-y-2" aria-label="Alertas">{d.alertas.map((a, i) => (
              <div key={i} className={`flex gap-3 rounded-lg border p-3 text-body-sm ${a.nivel === 'critica' ? 'border-danger/50 bg-danger-light/10 text-danger-bright' : 'border-orange-bright/40 bg-orange-muted text-orange-bright'}`}><AlertTriangle className="mt-0.5 h-4 w-4 flex-none" /><p><b>{a.titulo}.</b> <span className="text-steel-100">{a.detalle}</span></p></div>))}</section>}

        <section className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Resumen">
          <div className="card p-4"><p className="text-caption text-steel-400">Tamaño total</p><p className="font-display text-h2 text-arctic">{mb(d.totalBytes)}</p><p className="text-caption text-steel-500">{d.version}</p></div>
          <div className="card p-4"><p className="text-caption text-steel-400">Uso del límite ({d.params.limiteMb} MB)</p><p className="font-display text-h2 text-arctic">{d.usoPct}%</p>
            <div className="mt-2 h-2 overflow-hidden rounded bg-steel-800" role="progressbar" aria-valuenow={Math.min(100, d.usoPct)} aria-valuemin={0} aria-valuemax={100} aria-label="Uso del límite"><div className={`h-full ${d.usoPct >= d.params.criticoPct ? 'bg-danger-bright' : d.usoPct >= d.params.alertaPct ? 'bg-orange-bright' : 'bg-blue-bright'}`} style={{ width: `${Math.min(100, d.usoPct)}%` }} /></div></div>
          <div className="card p-4"><p className="text-caption text-steel-400">Conexiones</p><p className="font-display text-h2 text-arctic">{d.conexiones.total} <span className="text-body-sm text-steel-500">/ {d.conexiones.max}</span></p><p className="text-caption text-steel-500">{d.conexiones.activas} activas · {d.conexiones.inactivas} inactivas</p></div>
          <div className="card p-4"><p className="text-caption text-steel-400">Acierto de caché</p><p className="font-display text-h2 text-arctic">{d.cacheHitPct == null ? '—' : `${d.cacheHitPct}%`}</p><p className="text-caption text-steel-500">Lo normal es más de 95%</p></div>
        </section>

        <section className="card mb-6 p-4" aria-label="Crecimiento">
          <h2 className="mb-1 font-display text-h3 text-arctic">Crecimiento</h2>
          <p className="mb-3 text-body-sm text-steel-400">{d.crecimiento.bytesPorDia != null ? `Ritmo: ${d.crecimiento.bytesPorDia >= 0 ? '+' : ''}${mb(d.crecimiento.bytesPorDia)} por día${d.crecimiento.diasHastaLimite != null ? ` · al ritmo actual llegaría al límite en unos ${nf(d.crecimiento.diasHastaLimite)} días` : ''}.` : 'Sin datos suficientes para proyectar.'}</p>
          <Crecimiento puntos={d.crecimiento.puntos} limite={d.limiteBytes} />
        </section>

        <section className="card mb-6 overflow-x-auto" aria-label="Tablas">
          <h2 className="p-4 pb-2 font-display text-h3 text-arctic">Tablas</h2>
          <table className="w-full text-left text-body-sm text-steel-100">
            <thead className="text-caption text-steel-400"><tr><th className="px-4 py-2">Tabla</th><th className="px-4 py-2 text-right">Filas</th><th className="px-4 py-2 text-right">Datos</th><th className="px-4 py-2 text-right">Índices</th><th className="px-4 py-2 text-right">Total</th><th className="px-4 py-2 text-right">Filas muertas</th><th className="px-4 py-2">Última limpieza</th></tr></thead>
            <tbody>{d.tablas.map(t => (
              <tr key={t.tabla} className="border-t border-steel-700/60"><td className="px-4 py-2 text-arctic">{t.tabla}</td><td className="px-4 py-2 text-right">{nf(t.filas)}</td><td className="px-4 py-2 text-right">{mb(t.tablaBytes)}</td><td className="px-4 py-2 text-right">{mb(t.indiceBytes)}</td><td className="px-4 py-2 text-right font-medium">{mb(t.bytes)}</td><td className="px-4 py-2 text-right">{nf(t.muertas)}</td><td className="px-4 py-2 text-steel-400">{t.ultimaLimpieza ? fechaCorta(t.ultimaLimpieza) : '—'}</td></tr>))}</tbody>
          </table>
        </section>

        <div className="mb-6 grid gap-4 lg:grid-cols-2">
          <section className="card p-4" aria-label="Migraciones">
            <h2 className="mb-2 font-display text-h3 text-arctic">Migraciones</h2>
            <p className="text-body-sm text-steel-100">{d.migraciones.total} aplicadas. {d.migraciones.fallidas.length === 0 ? <span className="text-success-bright">Ninguna fallida.</span> : <span className="text-danger-bright">{d.migraciones.fallidas.length} fallida(s): {d.migraciones.fallidas.map(f => f.nombre).join(', ')}</span>}</p>
            {d.migraciones.ultima && <p className="mt-1 text-caption text-steel-400">Última: {d.migraciones.ultima.nombre} ({fechaCorta(d.migraciones.ultima.fecha!)})</p>}
          </section>
          <section className="card p-4" aria-label="Índices sin uso">
            <h2 className="mb-2 font-display text-h3 text-arctic">Índices sin uso</h2>
            {d.indicesSinUso.length === 0 ? <p className="text-body-sm text-steel-400">No se detectaron.</p> : <ul className="space-y-1 text-body-sm text-steel-100">{d.indicesSinUso.map(i => <li key={i.indice}>{i.tabla} · <span className="text-steel-400">{i.indice}</span> ({mb(i.bytes)})</li>)}</ul>}
            <p className="mt-2 text-caption text-steel-500">Solo informativo: un índice sin uso reciente puede ser útil para reportes poco frecuentes. No se elimina nada desde aquí.</p>
          </section>
        </div>

        {pr && (
          <section className="card p-4" aria-label="Umbrales">
            <h2 className="mb-3 font-display text-h3 text-arctic">Umbrales de alerta</h2>
            <div className="grid gap-3 sm:grid-cols-4">
              {([['limiteMb', 'Límite del plan (MB)'], ['alertaPct', 'Aviso (% del límite)'], ['criticoPct', 'Crítico (% del límite)'], ['maxConexiones', 'Máx. de conexiones']] as const).map(([k, l]) => (
                <div key={k}><label className={L} htmlFor={`pr-${k}`}>{l}</label><input id={`pr-${k}`} type="number" min={1} value={pr[k]} onChange={e => setPr({ ...pr, [k]: Number(e.target.value) })} className="input w-full" /></div>))}
            </div>
            <button onClick={guardar} className="btn-primary mt-3 inline-flex items-center gap-2"><Save className="h-4 w-4" />Guardar umbrales</button>
          </section>)}
      </>)}
    </div>
  );
}
