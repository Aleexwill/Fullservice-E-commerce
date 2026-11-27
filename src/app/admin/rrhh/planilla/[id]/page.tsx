'use client';

import Link from 'next/link';
import { Fragment, useCallback, useEffect, useState } from 'react';
import { AlertTriangle, ArrowLeft, ChevronDown, ChevronRight, FileDown, Lock, RefreshCw, Trash2, Unlock } from 'lucide-react';
import { fmtGs, periodoLabel } from '@/lib/rrhh/shared';
import { aCsv, descargarCsv } from '@/lib/marcacion/csv';
import type { LineaRecibo, ResumenAsistencia } from '@/lib/rrhh/planilla';

interface Recibo { id: string; funcionarioId: string; nombre: string; documento: string; cargo: string; detalle: LineaRecibo[]; asistencia: ResumenAsistencia; advertencias: string[]; totalHaberes: number; totalDescuentos: number; neto: number; aportePatronal: number }
interface Concepto { id: string; funcionarioId: string; tipo: 'HABER' | 'DESCUENTO'; nombre: string; monto: number; imponible: boolean; creadoPor: string }
interface Data { planilla: { id: string; periodo: string; tipo: 'MENSUAL' | 'AGUINALDO'; estado: 'BORRADOR' | 'CERRADA'; cerradaPor: string; cerradaAt: string | null }; recibos: Recibo[]; conceptos: Concepto[]; funcionarios: { id: string; nombre: string }[] }

const L = 'mb-1 block text-caption text-steel-400';

export default function PlanillaDetallePage({ params }: { params: { id: string } }) {
  const [d, setD] = useState<Data | null>(null);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [busy, setBusy] = useState(false);
  const [abierto, setAbierto] = useState<string | null>(null);
  const [c, setC] = useState({ funcionarioId: '', tipo: 'HABER', nombre: '', monto: '', imponible: false });

  const cargar = useCallback(async () => {
    try { const r = await fetch(`/api/rrhh/planillas/${params.id}`, { cache: 'no-store' }); const j = await r.json(); if (!r.ok) throw new Error(j.error ?? 'Error'); setD(j); }
    catch (e) { setError(e instanceof Error ? e.message : 'Error'); }
  }, [params.id]);
  useEffect(() => { cargar(); }, [cargar]);

  async function post(url: string, method: string, body?: unknown, msg = 'Listo') {
    setBusy(true); setError(''); setOk('');
    try {
      const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) { const err = Object.assign(new Error(j.error ?? 'Error'), { confirmar: !!j.requiereConfirmacion }); throw err; }
      await cargar(); setOk(msg); return true;
    } catch (e) { setError(e instanceof Error ? e.message : 'Error'); return e as Error & { confirmar?: boolean }; } finally { setBusy(false); }
  }

  async function cerrar() {
    if (!window.confirm('¿Cerrar la planilla? Se recalcula con los datos actuales y queda fija. Podés reabrirla después si hace falta corregir.')) return;
    const r = await post(`/api/rrhh/planillas/${params.id}`, 'POST', { accion: 'cerrar' }, 'Planilla cerrada');
    if (r !== true && r.confirmar && window.confirm(`${r.message}\n\n¿Cerrar de todas formas?`)) await post(`/api/rrhh/planillas/${params.id}`, 'POST', { accion: 'cerrar', confirmar: true }, 'Planilla cerrada');
  }

  if (!d) return <div className="p-6 text-steel-400">{error || 'Cargando…'}</div>;
  const pl = d.planilla;
  const cerrada = pl.estado === 'CERRADA';
  const titulo = pl.tipo === 'AGUINALDO' ? `Aguinaldo ${pl.periodo.slice(0, 4)}` : `Sueldos de ${periodoLabel(pl.periodo)}`;
  const tot = d.recibos.reduce((a, r) => ({ h: a.h + r.totalHaberes, d: a.d + r.totalDescuentos, n: a.n + r.neto, p: a.p + r.aportePatronal }), { h: 0, d: 0, n: 0, p: 0 });
  const avisos = d.recibos.reduce((n, r) => n + r.advertencias.length, 0);
  const pdf = (tipo: string, fid?: string) => `/api/rrhh/planillas/${pl.id}/pdf?tipo=${tipo}${fid ? `&funcionarioId=${fid}` : ''}`;

  function csv() {
    descargarCsv(`planilla-${pl.tipo === 'AGUINALDO' ? 'aguinaldo-' + pl.periodo.slice(0, 4) : pl.periodo}.csv`, aCsv(
      ['Funcionario', 'CI', 'Cargo', 'Haberes', 'Descuentos', 'Neto', 'Aporte patronal', 'Advertencias'],
      d!.recibos.map(r => [r.nombre, r.documento, r.cargo, r.totalHaberes, r.totalDescuentos, r.neto, r.aportePatronal, r.advertencias.join(' | ')])));
  }

  return (
    <div className="p-4 sm:p-6">
      <Link href="/admin/rrhh/planilla" className="mb-3 inline-flex items-center gap-1 text-body-sm text-steel-400 hover:text-arctic"><ArrowLeft className="h-4 w-4" />Planillas</Link>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-h1 text-arctic">{titulo}</h1>
          <p className="font-body text-body-sm text-steel-400"><span className={`rounded-full px-2 py-0.5 text-caption ${cerrada ? 'bg-success-light/20 text-success-bright' : 'bg-orange-muted text-orange-bright'}`}>{cerrada ? 'Cerrada' : 'Borrador'}</span>{cerrada && pl.cerradaAt ? ` · por ${pl.cerradaPor} el ${new Date(pl.cerradaAt).toLocaleDateString('es-PY')}` : ' · los cambios se recalculan al instante'}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {!cerrada && <button disabled={busy} onClick={() => post(`/api/rrhh/planillas/${pl.id}`, 'POST', { accion: 'calcular' }, 'Recalculada con los datos actuales')} className="btn-secondary disabled:opacity-50"><RefreshCw className="h-4 w-4" />Recalcular</button>}
          {!cerrada && <button disabled={busy || d.recibos.length === 0} onClick={cerrar} className="btn-primary disabled:opacity-50"><Lock className="h-4 w-4" />Cerrar planilla</button>}
          {cerrada && <button disabled={busy} onClick={() => window.confirm('¿Reabrir la planilla? Queda en borrador y se puede recalcular.') && post(`/api/rrhh/planillas/${pl.id}`, 'POST', { accion: 'reabrir' }, 'Planilla reabierta')} className="btn-secondary disabled:opacity-50"><Unlock className="h-4 w-4" />Reabrir</button>}
          {!cerrada && <button disabled={busy} onClick={async () => { if (window.confirm('¿Borrar esta planilla en borrador?') && (await post(`/api/rrhh/planillas/${pl.id}`, 'DELETE', undefined, 'Borrada')) === true) window.location.href = '/admin/rrhh/planilla'; }} className="btn-ghost text-danger-bright disabled:opacity-50"><Trash2 className="h-4 w-4" />Borrar</button>}
        </div>
      </div>

      {error && <p role="alert" className="mb-3 rounded-md bg-danger-light/10 px-3 py-2 text-caption text-danger-bright">{error}</p>}
      {ok && <p role="status" className="mb-3 rounded-md bg-success-light/10 px-3 py-2 text-caption text-success-bright">{ok}</p>}
      {!cerrada && <div className="mb-4 flex gap-3 rounded-lg border border-orange/40 bg-orange-muted/40 p-3 text-body-sm text-orange-bright"><AlertTriangle className="mt-0.5 h-5 w-5 flex-none" /><p>Es un <b>borrador</b>: los recibos llevan marca de agua. Revisá las advertencias antes de cerrar. Las reglas de cálculo son de referencia hasta que contabilidad las valide.</p></div>}

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[[fmtGs(tot.h), 'Haberes'], [fmtGs(tot.d), 'Descuentos'], [fmtGs(tot.n), 'Neto a pagar'], [fmtGs(tot.h + tot.p), 'Costo para la empresa']].map(([n, l]) => <div key={l} className="card p-4"><div className="font-display text-h3 text-arctic">{n}</div><div className="text-caption text-steel-400">{l}</div></div>)}
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <a href={pdf('recibos')} target="_blank" rel="noopener noreferrer" className="btn-secondary"><FileDown className="h-4 w-4" />Recibos (PDF)</a>
        <a href={pdf('resumen')} target="_blank" rel="noopener noreferrer" className="btn-secondary"><FileDown className="h-4 w-4" />Resumen (PDF)</a>
        <button onClick={csv} className="btn-secondary"><FileDown className="h-4 w-4" />Exportar CSV</button>
        {avisos > 0 && <span className="inline-flex min-h-11 items-center gap-1 text-body-sm text-orange-bright"><AlertTriangle className="h-4 w-4" />{avisos} advertencia{avisos > 1 ? 's' : ''}</span>}
      </div>

      <div className="card mb-6 overflow-x-auto">
        <table className="w-full min-w-[780px] text-left font-body text-body-sm text-steel-100">
          <thead><tr className="border-b border-steel-700 text-caption text-steel-400">{['', 'Funcionario', 'Haberes', 'Descuentos', 'Neto', 'Aporte patronal', ''].map((h, i) => <th key={i} className="px-4 py-3 font-medium">{h}</th>)}</tr></thead>
          <tbody>
            {d.recibos.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-steel-400">{pl.tipo === 'AGUINALDO' ? 'No hay planillas mensuales cerradas de ese año: el aguinaldo se calcula sobre ellas.' : 'No hay funcionarios con vínculo en este período.'}</td></tr>}
            {d.recibos.map(r => (
              <Fragment key={r.id}>
                <tr className="border-b border-steel-700/60">
                  <td className="w-10 px-2"><button onClick={() => setAbierto(abierto === r.id ? null : r.id)} aria-label={`Detalle de ${r.nombre}`} aria-expanded={abierto === r.id} className="rounded p-2 text-steel-400 hover:text-arctic">{abierto === r.id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}</button></td>
                  <td className="px-4 py-3 text-arctic">{r.nombre}<div className="text-caption text-steel-400">{r.cargo || 'Sin cargo'}</div></td>
                  <td className="px-4 py-3">{fmtGs(r.totalHaberes)}</td><td className="px-4 py-3">{fmtGs(r.totalDescuentos)}</td><td className="px-4 py-3 font-medium text-arctic">{fmtGs(r.neto)}</td><td className="px-4 py-3 text-steel-300">{fmtGs(r.aportePatronal)}</td>
                  <td className="px-4 py-3 text-right">{r.advertencias.length > 0 && <AlertTriangle aria-label={`${r.advertencias.length} advertencias`} className="mr-3 inline h-4 w-4 text-orange-bright" />}<a href={pdf('recibos', r.funcionarioId)} target="_blank" rel="noopener noreferrer" className="text-blue-bright hover:underline">Recibo</a></td>
                </tr>
                {abierto === r.id && (
                  <tr className="border-b border-steel-700/60 bg-carbon/40"><td colSpan={7} className="px-6 py-4">
                    <table className="mb-3 w-full max-w-3xl text-body-sm"><tbody>
                      {r.detalle.map((l, i) => <tr key={i}><td className="py-1 pr-4 text-arctic">{l.concepto}</td><td className="py-1 pr-4 text-caption text-steel-400">{l.detalle}</td><td className={`py-1 text-right ${l.tipo === 'HABER' ? 'text-success-bright' : 'text-danger-bright'}`}>{l.tipo === 'DESCUENTO' ? '−' : ''}{fmtGs(l.monto)}</td></tr>)}
                    </tbody></table>
                    {r.advertencias.map((a, i) => <p key={i} className="mb-1 flex gap-2 text-caption text-orange-bright"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-none" />{a}</p>)}
                  </td></tr>)}
              </Fragment>))}
          </tbody>
        </table>
      </div>

      <section className="card p-5">
        <h2 className="mb-1 font-display text-h3 text-arctic">Conceptos manuales</h2>
        <p className="mb-3 text-body-sm text-steel-400">Bonificaciones, premios, anticipos, préstamos u otros descuentos de {pl.tipo === 'AGUINALDO' ? 'este aguinaldo' : 'este mes'}. Un haber <b>imponible</b> suma a la base del aporte a IPS.</p>
        {d.conceptos.length > 0 && (
          <ul className="mb-4 divide-y divide-steel-700/60">
            {d.conceptos.map(x => (
              <li key={x.id} className="flex items-center justify-between gap-3 py-2 text-body-sm">
                <span className="text-steel-100">{d.funcionarios.find(f => f.id === x.funcionarioId)?.nombre ?? d.recibos.find(r => r.funcionarioId === x.funcionarioId)?.nombre ?? 'Funcionario'} · {x.nombre}{x.imponible ? ' (imponible)' : ''}</span>
                <span className="flex items-center gap-2"><span className={x.tipo === 'HABER' ? 'text-success-bright' : 'text-danger-bright'}>{x.tipo === 'DESCUENTO' ? '−' : '+'}{fmtGs(x.monto)}</span>
                  {!cerrada && <button aria-label={`Quitar ${x.nombre}`} disabled={busy} onClick={() => post(`/api/rrhh/conceptos?id=${x.id}`, 'DELETE', undefined, 'Concepto quitado')} className="rounded p-2 text-steel-400 hover:text-danger-bright"><Trash2 className="h-4 w-4" /></button>}</span>
              </li>))}
          </ul>)}
        {!cerrada ? (
          <form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5" onSubmit={async e => { e.preventDefault(); const r = await post('/api/rrhh/conceptos', 'POST', { funcionarioId: c.funcionarioId, periodo: pl.periodo, planilla: pl.tipo, tipo: c.tipo, nombre: c.nombre, monto: Math.round(Number(c.monto.replace(/\D/g, ''))), imponible: c.tipo === 'HABER' && c.imponible }, 'Concepto agregado'); if (r === true) setC({ ...c, nombre: '', monto: '' }); }}>
            <div><label htmlFor="cn-f" className={L}>Funcionario</label><select id="cn-f" required value={c.funcionarioId} onChange={e => setC({ ...c, funcionarioId: e.target.value })} className="input w-full"><option value="">Elegí…</option>{d.funcionarios.map(f => <option key={f.id} value={f.id}>{f.nombre}</option>)}</select></div>
            <div><label htmlFor="cn-t" className={L}>Tipo</label><select id="cn-t" value={c.tipo} onChange={e => setC({ ...c, tipo: e.target.value })} className="input w-full"><option value="HABER">Haber (suma)</option><option value="DESCUENTO">Descuento (resta)</option></select></div>
            <div><label htmlFor="cn-n" className={L}>Concepto</label><input id="cn-n" required maxLength={80} value={c.nombre} onChange={e => setC({ ...c, nombre: e.target.value })} placeholder="Ej: Anticipo" className="input w-full" /></div>
            <div><label htmlFor="cn-m" className={L}>Monto (Gs.)</label><input id="cn-m" required inputMode="numeric" value={c.monto} onChange={e => setC({ ...c, monto: e.target.value })} className="input w-full" /></div>
            <div className="flex flex-col justify-end gap-2">{c.tipo === 'HABER' && <label className="flex min-h-9 items-center gap-2 text-caption text-steel-300"><input type="checkbox" checked={c.imponible} onChange={e => setC({ ...c, imponible: e.target.checked })} className="h-4 w-4" />Imponible a IPS</label>}<button disabled={busy} className="btn-primary disabled:opacity-50">Agregar</button></div>
          </form>) : <p className="text-body-sm text-steel-500">La planilla está cerrada: reabrila para modificar conceptos.</p>}
      </section>
    </div>
  );
}
