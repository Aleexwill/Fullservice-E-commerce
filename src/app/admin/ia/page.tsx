'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Power, RefreshCw, Save, XCircle } from 'lucide-react';
import type { Panel } from '@/lib/ia/estadisticas';
import type { IaConfig } from '@/lib/ia/config';

interface Reg { id: string; createdAt: string; funcion: string; proveedor: string; modelo: string; userName: string; tokensEntrada: number; tokensSalida: number; ms: number; estado: 'OK' | 'ERROR' | 'BLOQUEADA'; error: string }
const L = 'mb-1 block font-body text-caption text-steel-400';
const nf = (n: number) => n.toLocaleString('es-PY');
const usd = (n: number | null) => (n === null ? '—' : `US$ ${n < 1 ? n.toFixed(4) : n.toFixed(2)}`);
const mesesAtras = (n: number) => { const d = new Date(); d.setMonth(d.getMonth() - n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; };
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const mesTxt = (m: string) => `${MESES[Number(m.slice(5)) - 1]} ${m.slice(0, 4)}`;
const numOrNull = (v: string) => (v.trim() === '' ? null : Math.max(0, Number(v)));

export default function IaPage() {
  const [mes, setMes] = useState(mesesAtras(0));
  const [p, setP] = useState<Panel | null>(null);
  const [cfg, setCfg] = useState<IaConfig | null>(null);
  const [regs, setRegs] = useState<{ registros: Reg[]; total: number; pagina: number; paginas: number } | null>(null);
  const [filtro, setFiltro] = useState('');
  const [pagina, setPagina] = useState(1);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [busy, setBusy] = useState(false);
  const [probando, setProbando] = useState<string | null>(null);
  const [prueba, setPrueba] = useState<Record<string, { ok: boolean; ms?: number; error?: string }>>({});
  const [nuevaTarifa, setNuevaTarifa] = useState({ modelo: '', e: '', s: '' });

  const cargar = useCallback(async () => {
    setError('');
    try {
      const r = await fetch(`/api/ia/panel?mes=${mes}`, { cache: 'no-store' }); const j = await r.json(); if (!r.ok) throw new Error(j.error ?? 'Error');
      setP(j); setCfg(c => c ?? j.config);
    } catch (e) { setError(e instanceof Error ? e.message : 'Error'); }
  }, [mes]);
  const cargarRegs = useCallback(async () => {
    try { const r = await fetch(`/api/ia/registros?pagina=${pagina}${filtro ? `&estado=${filtro}` : ''}`, { cache: 'no-store' }); const j = await r.json(); if (r.ok) setRegs(j); } catch { /* ignorar */ }
  }, [pagina, filtro]);
  useEffect(() => { cargar(); }, [cargar]);
  useEffect(() => { cargarRegs(); }, [cargarRegs]);

  async function guardar() {
    if (!cfg) return;
    setBusy(true); setError(''); setOk('');
    try {
      const r = await fetch('/api/ia/config', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cfg) }); const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? 'No se pudo guardar'); setCfg(j); setOk('Configuración guardada'); await cargar();
    } catch (e) { setError(e instanceof Error ? e.message : 'Error'); } finally { setBusy(false); }
  }
  async function depurarAhora() {
    if (!cfg || cfg.retencionDias < 7) return;
    if (!window.confirm(`Se borrarán de forma permanente los registros de uso de IA con más de ${cfg.retencionDias} días. ¿Continuar?`)) return;
    setBusy(true); setError(''); setOk('');
    try {
      const r = await fetch(`/api/ia/registros?antesDeDias=${cfg.retencionDias}`, { method: 'DELETE' }); const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? 'No se pudo depurar'); setOk(`Se borraron ${nf(j.borrados)} registros`); await cargar(); await cargarRegs();
    } catch (e) { setError(e instanceof Error ? e.message : 'Error'); } finally { setBusy(false); }
  }
  async function probar(id: string) {
    setProbando(id);
    try { const r = await fetch('/api/ia/probar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ proveedor: id }) }); const j = await r.json(); setPrueba(x => ({ ...x, [id]: r.ok ? j : { ok: false, error: j.error } })); await cargar(); await cargarRegs(); }
    finally { setProbando(null); }
  }

  if (!p || !cfg) return <div className="p-6 text-steel-400">{error || 'Cargando…'}</div>;
  const t = p.total;
  const g = cfg.global;
  const maxDia = Math.max(1, ...p.porDia.map(d => d.llamadas + d.errores));
  const pctLlam = g.limiteMensualLlamadas ? Math.min(100, (t.llamadas / g.limiteMensualLlamadas) * 100) : null;
  const pctUsd = g.limiteMensualUsd && t.costoUsd !== null ? Math.min(100, (t.costoUsd / g.limiteMensualUsd) * 100) : null;
  const setGlobal = (patch: Partial<IaConfig['global']>) => setCfg({ ...cfg, global: { ...g, ...patch } });
  const setFn = (k: string, patch: Partial<IaConfig['funciones'][keyof IaConfig['funciones']]>) => setCfg({ ...cfg, funciones: { ...cfg.funciones, [k]: { ...cfg.funciones[k as keyof IaConfig['funciones']], ...patch } } });
  const modelosVistos = [...new Set([...p.porModelo.map(m => m.modelo), ...Object.keys(cfg.tarifas)])];

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-h1 text-arctic">Uso de IA</h1>
          <p className="font-body text-body-sm text-steel-400">Consumo, límites e interruptores de las funciones con inteligencia artificial. No se guarda el texto de lo que se envía ni de lo que responde, solo datos de uso.</p>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="ia-mes" className="sr-only">Mes</label>
          <select id="ia-mes" value={mes} onChange={e => setMes(e.target.value)} className="input">{[0, 1, 2, 3, 4, 5].map(n => <option key={n} value={mesesAtras(n)}>{mesTxt(mesesAtras(n))}</option>)}</select>
          <button onClick={() => { cargar(); cargarRegs(); }} className="btn-secondary" aria-label="Actualizar"><RefreshCw className="h-4 w-4" /></button>
        </div>
      </div>
      {error && <p role="alert" className="mb-3 rounded-md bg-danger-light/10 px-3 py-2 text-caption text-danger-bright">{error}</p>}
      {ok && <p role="status" className="mb-3 rounded-md bg-success-light/10 px-3 py-2 text-caption text-success-bright">{ok}</p>}

      {!g.activo && <div className="mb-4 flex gap-3 rounded-lg border border-danger/50 bg-danger-light/10 p-4 text-body-sm text-danger-bright"><Power className="mt-0.5 h-5 w-5 flex-none" /><p><b>La IA está desactivada.</b> Las funciones con IA responden que no están disponibles (título y descripciones usan la plantilla sin IA).</p></div>}

      <section className="mb-6 grid gap-3 sm:grid-cols-3" aria-label="Proveedores">
        {p.proveedores.map(pr => (
          <div key={pr.id} className="card p-4">
            <div className="flex items-center justify-between"><h2 className="font-body text-body font-medium text-arctic">{pr.nombre}</h2>
              {pr.configurado ? <span className="inline-flex items-center gap-1 text-caption text-success-bright"><CheckCircle2 className="h-4 w-4" />Clave configurada</span> : <span className="inline-flex items-center gap-1 text-caption text-steel-400"><XCircle className="h-4 w-4" />Sin clave</span>}</div>
            <p className="mt-1 text-caption text-steel-400">Modelo: {pr.modelo}</p>
            <div className="mt-3 flex items-center gap-3">
              <button disabled={!pr.configurado || probando === pr.id} onClick={() => probar(pr.id)} className="btn-secondary px-3 py-1.5 text-caption disabled:opacity-50">{probando === pr.id ? 'Probando…' : 'Probar conexión'}</button>
              {prueba[pr.id] && <span className={`text-caption ${prueba[pr.id].ok ? 'text-success-bright' : 'text-danger-bright'}`}>{prueba[pr.id].ok ? `Funciona (${prueba[pr.id].ms} ms)` : prueba[pr.id].error}</span>}
            </div>
          </div>))}
      </section>

      <section className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-5" aria-label="Resumen del mes">
        {[[nf(t.llamadas), 'Llamadas'], [nf(t.tokensEntrada + t.tokensSalida), 'Tokens (entrada y salida)'], [usd(t.costoUsd), t.costoUsd === null ? 'Costo (cargá las tarifas)' : t.costoParcial ? 'Costo estimado (parcial)' : 'Costo estimado'], [nf(t.errores), 'Con error'], [nf(t.bloqueadas), 'Bloqueadas por límite']].map(([n, l]) => (
          <div key={l} className="card p-4"><div className="font-display text-h3 text-arctic">{n}</div><div className="font-body text-caption text-steel-400">{l}</div></div>))}
      </section>

      <section className="card mb-6 p-5">
        <h2 className="mb-1 font-display text-h3 text-arctic">Interruptor y límites generales</h2>
        <p className="mb-4 text-body-sm text-steel-400">Al llegar a un límite, las funciones con IA dejan de responder hasta el mes siguiente (las de título y descripción siguen con plantilla). Vacío = sin límite.</p>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="flex min-h-11 items-center gap-2 text-body-sm text-arctic"><input type="checkbox" checked={g.activo} onChange={e => setGlobal({ activo: e.target.checked })} className="h-5 w-5" />IA activada en todo el sistema</label>
          <div><label htmlFor="g-llam" className={L}>Límite mensual de llamadas</label><input id="g-llam" type="number" min={0} value={g.limiteMensualLlamadas ?? ''} onChange={e => setGlobal({ limiteMensualLlamadas: numOrNull(e.target.value) })} className="input w-full" placeholder="Sin límite" />
            {pctLlam !== null && <div className="mt-2 h-2 rounded bg-steel-800" role="img" aria-label={`${Math.round(pctLlam)}% del límite`}><div className={`h-2 rounded ${pctLlam >= 90 ? 'bg-danger' : 'bg-blue'}`} style={{ width: `${pctLlam}%` }} /></div>}</div>
          <div><label htmlFor="g-usd" className={L}>Límite mensual de gasto (US$)</label><input id="g-usd" type="number" min={0} step="0.5" value={g.limiteMensualUsd ?? ''} onChange={e => setGlobal({ limiteMensualUsd: numOrNull(e.target.value) })} className="input w-full" placeholder="Sin límite" />
            {pctUsd !== null && <div className="mt-2 h-2 rounded bg-steel-800" role="img" aria-label={`${Math.round(pctUsd)}% del límite`}><div className={`h-2 rounded ${pctUsd >= 90 ? 'bg-danger' : 'bg-blue'}`} style={{ width: `${pctUsd}%` }} /></div>}
            {g.limiteMensualUsd !== null && <p className="mt-1 text-caption text-steel-500">Se calcula con las tarifas de abajo; los modelos sin tarifa no suman.</p>}</div>
        </div>
      </section>

      <section className="card mb-6 overflow-x-auto">
        <h2 className="px-5 pt-5 font-display text-h3 text-arctic">Funciones</h2>
        <table className="w-full min-w-[820px] text-left font-body text-body-sm text-steel-100">
          <thead><tr className="border-b border-steel-700 text-caption text-steel-400">{['Función', 'Activa', 'Llamadas', 'Tokens', 'Errores', 'Límite mensual', 'Límite diario por usuario'].map(h => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr></thead>
          <tbody>{Object.keys(cfg.funciones).map(k => {
            const f = cfg.funciones[k as keyof IaConfig['funciones']]; const u = p.porFuncion.find(x => x.funcion === k);
            const label = p.porFuncion.find(x => x.funcion === k)?.label ?? k;
            return (
              <tr key={k} className="border-b border-steel-700/60">
                <td className="px-4 py-3 text-arctic">{u?.label ?? label}<div className="text-caption text-steel-500">{k}</div></td>
                <td className="px-4 py-3"><input type="checkbox" checked={f.activo} onChange={e => setFn(k, { activo: e.target.checked })} aria-label={`Activar ${k}`} className="h-5 w-5" /></td>
                <td className="px-4 py-3">{nf(u?.llamadas ?? 0)}</td><td className="px-4 py-3">{nf((u?.tokensEntrada ?? 0) + (u?.tokensSalida ?? 0))}</td><td className="px-4 py-3">{u?.errores ? <span className="text-danger-bright">{u.errores}</span> : 0}</td>
                <td className="px-4 py-3"><input type="number" min={0} value={f.limiteMensualLlamadas ?? ''} onChange={e => setFn(k, { limiteMensualLlamadas: numOrNull(e.target.value) })} aria-label={`Límite mensual de ${k}`} placeholder="Sin límite" className="input w-28" /></td>
                <td className="px-4 py-3"><input type="number" min={0} value={f.limiteDiarioPorUsuario ?? ''} onChange={e => setFn(k, { limiteDiarioPorUsuario: numOrNull(e.target.value) })} aria-label={`Límite diario por usuario de ${k}`} placeholder="Sin límite" className="input w-28" /></td>
              </tr>);
          })}</tbody>
        </table>
      </section>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="mb-3 font-display text-h3 text-arctic">Llamadas por día</h2>
          {p.porDia.length === 0 ? <p className="text-body-sm text-steel-400">Todavía no hay uso en {mesTxt(mes)}.</p> : (
            <div className="flex h-32 items-end gap-1" role="img" aria-label="Gráfico de llamadas por día">
              {p.porDia.map(d => <div key={d.dia} title={`${d.dia}: ${d.llamadas} llamadas, ${d.errores} errores`} className="flex h-full min-w-[6px] flex-1 flex-col justify-end"><div className="bg-danger" style={{ height: `${(d.errores / maxDia) * 100}%` }} /><div className="bg-blue" style={{ height: `${(d.llamadas / maxDia) * 100}%` }} /></div>)}
            </div>)}
        </section>
        <section className="card p-5">
          <h2 className="mb-3 font-display text-h3 text-arctic">Por usuario</h2>
          {p.porUsuario.length === 0 ? <p className="text-body-sm text-steel-400">Sin datos.</p> : <ul className="space-y-1.5 text-body-sm">{p.porUsuario.map(u => <li key={u.usuario} className="flex justify-between"><span className="text-steel-100">{u.usuario}</span><span className="text-steel-300">{nf(u.llamadas)} llamadas · {nf(u.tokens)} tokens</span></li>)}</ul>}
        </section>
      </div>

      <section className="card mb-6 p-5">
        <h2 className="mb-1 font-display text-h3 text-arctic">Tarifas por modelo</h2>
        <p className="mb-3 text-body-sm text-steel-400">Para estimar el costo, cargá el precio vigente que publica cada proveedor, en dólares por millón de tokens. <b>Sin tarifa, el costo de ese modelo no se calcula.</b> Es una estimación, no la factura.</p>
        <div className="space-y-2">
          {modelosVistos.map(m => { const tf = cfg.tarifas[m]; const uso = p.porModelo.find(x => x.modelo === m); return (
            <div key={m} className="flex flex-wrap items-center gap-2">
              <span className="w-56 truncate text-body-sm text-arctic">{m}</span>
              <label className="sr-only" htmlFor={`te-${m}`}>Entrada de {m}</label><input id={`te-${m}`} type="number" min={0} step="0.01" placeholder="Entrada US$/M" value={tf?.entradaUsdPorMillon ?? ''} onChange={e => setCfg({ ...cfg, tarifas: { ...cfg.tarifas, [m]: { entradaUsdPorMillon: Number(e.target.value), salidaUsdPorMillon: tf?.salidaUsdPorMillon ?? 0 } } })} className="input w-36" />
              <label className="sr-only" htmlFor={`ts-${m}`}>Salida de {m}</label><input id={`ts-${m}`} type="number" min={0} step="0.01" placeholder="Salida US$/M" value={tf?.salidaUsdPorMillon ?? ''} onChange={e => setCfg({ ...cfg, tarifas: { ...cfg.tarifas, [m]: { entradaUsdPorMillon: tf?.entradaUsdPorMillon ?? 0, salidaUsdPorMillon: Number(e.target.value) } } })} className="input w-36" />
              <span className="text-caption text-steel-400">{uso ? `${nf(uso.llamadas)} llamadas · ${usd(uso.costoUsd)}` : ''}</span>
            </div>); })}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <input aria-label="Nombre del modelo" placeholder="Otro modelo (ej: gemini-1.5-flash)" value={nuevaTarifa.modelo} onChange={e => setNuevaTarifa({ ...nuevaTarifa, modelo: e.target.value.trim() })} className="input w-56" />
            <input aria-label="Entrada US$ por millón" type="number" min={0} step="0.01" placeholder="Entrada US$/M" value={nuevaTarifa.e} onChange={e => setNuevaTarifa({ ...nuevaTarifa, e: e.target.value })} className="input w-36" />
            <input aria-label="Salida US$ por millón" type="number" min={0} step="0.01" placeholder="Salida US$/M" value={nuevaTarifa.s} onChange={e => setNuevaTarifa({ ...nuevaTarifa, s: e.target.value })} className="input w-36" />
            <button disabled={!nuevaTarifa.modelo || nuevaTarifa.e === '' || nuevaTarifa.s === ''} onClick={() => { setCfg({ ...cfg, tarifas: { ...cfg.tarifas, [nuevaTarifa.modelo]: { entradaUsdPorMillon: Number(nuevaTarifa.e), salidaUsdPorMillon: Number(nuevaTarifa.s) } } }); setNuevaTarifa({ modelo: '', e: '', s: '' }); }} className="btn-secondary px-3 disabled:opacity-50">Agregar</button>
          </div>
        </div>
      </section>

      <section className="card mb-6 p-5">
        <h2 className="mb-1 font-display text-h3 text-arctic">Conservación de registros</h2>
        <p className="mb-3 text-body-sm text-steel-400">Los registros más viejos que este plazo se <b>depuran solos</b> (una vez por día). Las estadísticas de meses ya depurados dejan de estar disponibles.</p>
        <div className="flex flex-wrap items-end gap-4">
          <div><label htmlFor="ret" className={L}>Conservar durante (días)</label><input id="ret" type="number" min={7} max={3650} value={cfg.retencionDias} onChange={e => setCfg({ ...cfg, retencionDias: Number(e.target.value) })} className="input w-32" /></div>
          <button onClick={depurarAhora} disabled={busy} className="btn-secondary disabled:opacity-50">Depurar ahora</button>
          <p className="text-caption text-steel-400">{cfg.depuracion.ultima ? `Última depuración automática: ${new Date(cfg.depuracion.ultima).toLocaleString('es-PY', { timeZone: 'America/Asuncion', dateStyle: 'short', timeStyle: 'short' })} (${nf(cfg.depuracion.borrados)} ${cfg.depuracion.borrados === 1 ? 'registro borrado' : 'registros borrados'})` : 'Todavía no se depuró.'}</p>
        </div>
      </section>

      <div className="mb-8 flex flex-wrap gap-3">
        <button onClick={guardar} disabled={busy} className="btn-primary disabled:opacity-50"><Save className="h-4 w-4" />{busy ? 'Guardando…' : 'Guardar configuración'}</button>
        <button onClick={() => setCfg(p.config)} className="btn-ghost">Descartar cambios</button>
      </div>

      <section className="card overflow-x-auto">
        <div className="flex flex-wrap items-center justify-between gap-3 p-5">
          <h2 className="font-display text-h3 text-arctic">Últimas llamadas</h2>
          <div className="flex gap-2" role="group" aria-label="Filtrar por estado">
            {[['', 'Todas'], ['OK', 'Correctas'], ['ERROR', 'Con error'], ['BLOQUEADA', 'Bloqueadas']].map(([v, l]) => <button key={v} aria-pressed={filtro === v} onClick={() => { setFiltro(v); setPagina(1); }} className={`min-h-9 rounded-full border px-3 text-caption ${filtro === v ? 'border-blue bg-blue-muted text-blue-bright' : 'border-steel-700 text-steel-300'}`}>{l}</button>)}
          </div>
        </div>
        <table className="w-full min-w-[820px] text-left font-body text-body-sm text-steel-100">
          <thead><tr className="border-b border-steel-700 text-caption text-steel-400">{['Fecha', 'Función', 'Modelo', 'Usuario', 'Tokens', 'Tiempo', 'Estado'].map(h => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr></thead>
          <tbody>
            {regs && regs.registros.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-steel-400">Todavía no hay llamadas registradas.</td></tr>}
            {regs?.registros.map(r => (
              <tr key={r.id} className="border-b border-steel-700/60 align-top">
                <td className="whitespace-nowrap px-4 py-2.5 text-steel-300">{new Date(r.createdAt).toLocaleString('es-PY', { timeZone: 'America/Asuncion', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
                <td className="px-4 py-2.5">{r.funcion}</td><td className="px-4 py-2.5 text-steel-300">{r.modelo || '—'}</td><td className="px-4 py-2.5 text-steel-300">{r.userName || '—'}</td>
                <td className="px-4 py-2.5">{nf(r.tokensEntrada + r.tokensSalida)}</td><td className="px-4 py-2.5">{r.ms ? `${(r.ms / 1000).toFixed(1)} s` : '—'}</td>
                <td className="px-4 py-2.5"><span className={`rounded-full px-2 py-0.5 text-caption ${r.estado === 'OK' ? 'bg-success-light/20 text-success-bright' : r.estado === 'ERROR' ? 'bg-danger-light/20 text-danger-bright' : 'bg-orange-muted text-orange-bright'}`}>{r.estado === 'OK' ? 'Correcta' : r.estado === 'ERROR' ? 'Error' : 'Bloqueada'}</span>{r.error && <div className="mt-1 max-w-xs text-caption text-steel-400">{r.error}</div>}</td>
              </tr>))}
          </tbody>
        </table>
        {regs && regs.paginas > 1 && <div className="flex items-center justify-center gap-3 p-4 text-body-sm text-steel-300"><button disabled={pagina <= 1} onClick={() => setPagina(pagina - 1)} className="btn-ghost disabled:opacity-40">Anterior</button>Página {regs.pagina} de {regs.paginas}<button disabled={pagina >= regs.paginas} onClick={() => setPagina(pagina + 1)} className="btn-ghost disabled:opacity-40">Siguiente</button></div>}
      </section>
      <p className="mt-4 flex items-start gap-2 text-caption text-steel-500"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-none" />Solo se guardan datos de uso (nunca el texto de las consultas). Los registros se conservan {cfg.retencionDias} días y se depuran automáticamente.</p>
    </div>
  );
}
