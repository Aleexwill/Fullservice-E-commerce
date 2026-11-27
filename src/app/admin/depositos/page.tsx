'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertTriangle, ArrowDownToLine, ArrowRight, ArrowUpFromLine, Camera, Pencil, Plus, QrCode, ScanLine, Search, SlidersHorizontal, Trash2, Truck, Warehouse, X } from 'lucide-react';
import { IN, L, Modal, TIPO_MOV, api, fecha, nf } from '@/components/admin/depositos/comun';
import type { Dep, Item, Mov, Tras } from '@/components/admin/depositos/comun';
import { FormDeposito, FormItem, FormMovimiento, FormTraslado, ITEM_VACIO } from '@/components/admin/depositos/formularios';
import { Escaner } from '@/components/admin/depositos/escaner';

type Pestana = 'inventario' | 'traslados' | 'historial';
const COLOR_MOV: Record<string, string> = { ENTRADA: 'text-success-bright', TRASLADO_ENTRADA: 'text-success-bright', SALIDA: 'text-danger-bright', TRASLADO_SALIDA: 'text-orange-bright', AJUSTE: 'text-blue-bright', TRASLADO_ANULADO: 'text-steel-400' };

function Pagina() {
  const router = useRouter();
  const sp = useSearchParams();
  const [tab, setTab] = useState<Pestana>('inventario');
  const [deps, setDeps] = useState<Dep[]>([]);
  const [items, setItems] = useState<Item[] | null>(null);
  const [filtro, setFiltro] = useState({ depositoId: '', q: '', bajoStock: false });
  const [err, setErr] = useState('');
  const [fd, setFd] = useState<Partial<Dep> | null>(null);
  const [fi, setFi] = useState<typeof ITEM_VACIO | null>(null);
  const [ver, setVer] = useState<Item | null>(null);
  const [mov, setMov] = useState<{ item: Item; tipo: 'ENTRADA' | 'SALIDA' | 'AJUSTE' } | null>(null);
  const [tras, setTras] = useState<Item | null>(null);
  const [escaneando, setEscaneando] = useState(false);
  // traslados
  const [trasList, setTrasList] = useState<Tras[] | null>(null);
  const [estadoT, setEstadoT] = useState('EN_TRANSITO');
  const [enTransito, setEnTransito] = useState(0);
  const [resolver, setResolver] = useState<{ t: Tras; accion: 'recibir' | 'cancelar' } | null>(null);
  const [designar, setDesignar] = useState<Tras | null>(null);
  // historial
  const [fh, setFh] = useState({ itemId: '', itemNombre: '', q: '', tipo: '', desde: '', hasta: '' });
  const [movs, setMovs] = useState<Mov[] | null>(null);
  const [siguiente, setSiguiente] = useState<string | null>(null);

  const cargarDeps = useCallback(() => fetch('/api/depositos').then(r => r.json()).then(j => Array.isArray(j) ? setDeps(j) : setErr(j.error || 'Error')).catch(() => setErr('Error al cargar depósitos')), []);
  const cargarItems = useCallback(() => {
    const qs = new URLSearchParams(); if (filtro.depositoId) qs.set('depositoId', filtro.depositoId); if (filtro.q.trim()) qs.set('q', filtro.q.trim()); if (filtro.bajoStock) qs.set('bajoStock', '1');
    return fetch(`/api/depositos/items?${qs}`).then(r => r.json()).then(j => Array.isArray(j) ? setItems(j) : setErr(j.error || 'Error')).catch(() => setErr('Error al cargar el inventario'));
  }, [filtro]);
  const cargarTras = useCallback(() => {
    const qs = new URLSearchParams(); if (estadoT) qs.set('estado', estadoT); if (filtro.depositoId) qs.set('depositoId', filtro.depositoId);
    fetch(`/api/depositos/traslados?${qs}`).then(r => r.json()).then(j => Array.isArray(j) ? setTrasList(j) : setErr(j.error || 'Error')).catch(() => setErr('Error al cargar traslados'));
    fetch('/api/depositos/traslados?estado=EN_TRANSITO').then(r => r.json()).then(j => Array.isArray(j) && setEnTransito(j.length)).catch(() => {});
  }, [estadoT, filtro.depositoId]);
  const cargarMovs = useCallback((mas?: string | null) => {
    const qs = new URLSearchParams(); if (fh.itemId) qs.set('itemId', fh.itemId); if (fh.q.trim()) qs.set('q', fh.q.trim()); if (fh.tipo) qs.set('tipo', fh.tipo); if (fh.desde) qs.set('desde', fh.desde); if (fh.hasta) qs.set('hasta', fh.hasta); if (filtro.depositoId) qs.set('depositoId', filtro.depositoId); if (mas) qs.set('antes', mas);
    fetch(`/api/depositos/movimientos?${qs}`).then(r => r.json()).then(j => { if (!j.items) return setErr(j.error || 'Error'); setMovs(p => mas && p ? [...p, ...j.items] : j.items); setSiguiente(j.siguiente); }).catch(() => setErr('Error al cargar el historial'));
  }, [fh, filtro.depositoId]);

  useEffect(() => { cargarDeps(); }, [cargarDeps]);
  useEffect(() => { const t = setTimeout(cargarItems, filtro.q ? 300 : 0); return () => clearTimeout(t); }, [cargarItems, filtro.q]);
  useEffect(() => { cargarTras(); }, [cargarTras]);
  useEffect(() => { if (tab !== 'historial') return; const t = setTimeout(() => cargarMovs(), fh.q ? 300 : 0); return () => clearTimeout(t); }, [tab, cargarMovs, fh.q]);

  // Enlace directo desde un QR: /admin/depositos?item=<id>
  const tabParam = sp.get('tab');
  useEffect(() => { if (tabParam === 'traslados' || tabParam === 'historial') { setTab(tabParam); router.replace('/admin/depositos'); } }, [tabParam, router]);
  const itemParam = sp.get('item');
  useEffect(() => {
    if (!itemParam) return;
    fetch(`/api/depositos/items?id=${encodeURIComponent(itemParam)}`).then(r => r.json()).then(j => { if (Array.isArray(j) && j[0]) setVer(j[0]); else setErr('El artículo del QR ya no existe'); }).catch(() => {});
    router.replace('/admin/depositos');
  }, [itemParam, router]);

  const recargar = () => { cargarDeps(); cargarItems(); cargarTras(); if (tab === 'historial') cargarMovs(); };
  const depActual = useMemo(() => deps.find(d => d.id === filtro.depositoId), [deps, filtro.depositoId]);

  async function borrarDep(d: Dep) {
    if (!confirm(`¿Eliminar el depósito "${d.nombre}"?`)) return;
    try { await api(`/api/depositos/${d.id}`, 'DELETE'); if (filtro.depositoId === d.id) setFiltro({ ...filtro, depositoId: '' }); recargar(); } catch (x) { alert((x as Error).message); }
  }
  async function borrarItem(i: Item) {
    if (!confirm(`¿Eliminar "${i.nombre}" del inventario? Su historial de movimientos se conserva.`)) return;
    try { await api(`/api/depositos/items/${i.id}`, 'DELETE'); setVer(null); recargar(); } catch (x) { alert((x as Error).message); }
  }
  async function escaneado(r: { id?: string; texto: string }) {
    setEscaneando(false);
    const qs = r.id ? `id=${encodeURIComponent(r.id)}` : `q=${encodeURIComponent(r.texto)}`;
    const j = await fetch(`/api/depositos/items?${qs}`).then(x => x.json()).catch(() => []);
    if (Array.isArray(j) && j.length) { if (j.length === 1) setVer(j[0]); else { setFiltro(f => ({ ...f, q: r.texto })); setTab('inventario'); } } else setErr(`No se encontró ningún artículo para "${r.texto}"`);
  }
  async function confirmarResolver(nota: string) {
    if (!resolver) return;
    try { await api(`/api/depositos/traslados/${resolver.t.id}`, 'POST', { accion: resolver.accion, nota: nota || undefined }); setResolver(null); recargar(); } catch (x) { alert((x as Error).message); }
  }
  const nuevoItem = () => setFi({ ...ITEM_VACIO, depositoId: filtro.depositoId || (deps.filter(d => d.activo).length === 1 ? deps.find(d => d.activo)!.id : '') });
  const verHistorialDe = (i: Item) => { setFh({ itemId: i.id, itemNombre: i.nombre, q: '', tipo: '', desde: '', hasta: '' }); setMovs(null); setVer(null); setTab('historial'); };

  const accion = 'flex min-h-[48px] flex-col items-center justify-center gap-1 rounded-lg bg-steel-900/70 px-2 py-2 text-caption text-steel-100 hover:bg-steel-800';

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="font-display text-h1 text-arctic">Depósitos e inventario</h1><p className="font-body text-body-sm text-steel-400">Depósitos, inventario con fotos, movimientos y traslados.</p></div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setEscaneando(true)} className="btn-secondary inline-flex min-h-[44px] items-center gap-2"><ScanLine className="h-4 w-4" />Escanear QR</button>
          <button onClick={() => setFd({})} className="btn-secondary inline-flex min-h-[44px] items-center gap-2"><Warehouse className="h-4 w-4" />Nuevo depósito</button>
          <button onClick={nuevoItem} disabled={deps.every(d => !d.activo)} className="btn-primary inline-flex min-h-[44px] items-center gap-2 disabled:opacity-50"><Plus className="h-4 w-4" />Cargar artículo</button>
        </div>
      </div>
      {err && <p role="alert" className="mb-3 flex justify-between gap-2 rounded-md bg-danger-light/10 px-3 py-2 text-caption text-danger-bright">{err}<button onClick={() => setErr('')} aria-label="Cerrar aviso"><X className="h-4 w-4" /></button></p>}

      <section aria-label="Depósitos" className="mb-5 flex gap-3 overflow-x-auto pb-1 sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-3">
        {deps.length === 0 && <div className="card col-span-full w-full p-6 text-center text-body-sm text-steel-400">Todavía no hay depósitos. Creá el primero con "Nuevo depósito".</div>}
        {deps.map(d => (
          <div key={d.id} className={`card w-64 flex-none p-3 sm:w-auto ${filtro.depositoId === d.id ? 'ring-1 ring-blue-bright' : ''} ${d.activo ? '' : 'opacity-60'}`}>
            <div className="flex items-start justify-between gap-2">
              <button onClick={() => setFiltro({ ...filtro, depositoId: filtro.depositoId === d.id ? '' : d.id })} className="min-w-0 py-1 text-left" aria-pressed={filtro.depositoId === d.id}>
                <p className="truncate font-display text-h3 text-arctic">{d.nombre}{!d.activo && <span className="ml-2 text-caption text-steel-500">(desactivado)</span>}</p>
                <p className="text-caption text-steel-400">{d.articulos} artículo(s){d.bajoStock > 0 && <span className="ml-2 text-orange-bright">· {d.bajoStock} bajo mínimo</span>}</p>
                {(d.direccion || d.responsable) && <p className="mt-1 truncate text-caption text-steel-500">{[d.direccion, d.responsable && `Encargado: ${d.responsable}`].filter(Boolean).join(' · ')}</p>}
              </button>
              <div className="flex flex-none"><button onClick={() => setFd(d)} aria-label={`Editar ${d.nombre}`} className="flex h-11 w-11 items-center justify-center text-steel-400 hover:text-arctic"><Pencil className="h-4 w-4" /></button><button onClick={() => borrarDep(d)} aria-label={`Eliminar ${d.nombre}`} className="flex h-11 w-11 items-center justify-center text-steel-400 hover:text-danger-bright"><Trash2 className="h-4 w-4" /></button></div>
            </div>
          </div>))}
      </section>

      <div role="tablist" aria-label="Secciones" className="mb-4 flex gap-1 overflow-x-auto border-b border-steel-800">
        {([['inventario', 'Inventario'], ['traslados', 'Traslados'], ['historial', 'Historial']] as const).map(([k, l]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`min-h-[44px] flex-none whitespace-nowrap border-b-2 px-4 font-body text-body-sm ${tab === k ? 'border-blue-bright text-arctic' : 'border-transparent text-steel-400 hover:text-arctic'}`}>
            {l}{k === 'traslados' && enTransito > 0 && <span className="ml-2 rounded-full bg-orange-muted px-2 py-0.5 text-caption text-orange-bright">{enTransito}</span>}
          </button>))}
        {depActual && <span className="ml-auto flex-none self-center whitespace-nowrap px-2 text-caption text-steel-500">Depósito: {depActual.nombre}</span>}
      </div>

      {tab === 'inventario' && (
        <section aria-label="Inventario">
          <div className="mb-3 flex flex-wrap items-end gap-3">
            <div className="relative w-full sm:w-auto"><label htmlFor="f-q" className="sr-only">Buscar</label><Search className="pointer-events-none absolute left-2 top-3.5 h-4 w-4 text-steel-500" /><input id="f-q" value={filtro.q} onChange={e => setFiltro({ ...filtro, q: e.target.value })} placeholder="Buscar nombre, código, ubicación" className="input w-full pl-8 text-base sm:w-72 sm:text-sm" /></div>
            <label className="flex min-h-[44px] items-center gap-2 text-body-sm text-steel-100"><input type="checkbox" checked={filtro.bajoStock} onChange={e => setFiltro({ ...filtro, bajoStock: e.target.checked })} className="h-5 w-5" />Solo bajo el mínimo</label>
            <Link href="/admin/depositos/etiquetas" className="btn-ghost inline-flex min-h-[44px] items-center gap-2"><QrCode className="h-4 w-4" />Etiquetas QR</Link>
          </div>
          {items === null ? <p className="text-steel-400">Cargando…</p> : items.length === 0 ? <div className="card p-6 text-center text-body-sm text-steel-400">No hay artículos con esos filtros.</div> : (
            <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {items.map(i => (
                <li key={i.id} className="card overflow-hidden">
                  <button onClick={() => setVer(i)} className="block w-full text-left">
                    {i.fotos[0]
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={i.fotos[0]} alt={i.nombre} loading="lazy" className="h-28 w-full object-cover sm:h-36" />
                      : <div className="flex h-28 w-full items-center justify-center bg-steel-900/60 text-steel-600 sm:h-36"><Camera className="h-8 w-8" aria-hidden="true" /><span className="sr-only">Sin foto</span></div>}
                    <div className="p-3">
                      <p className="truncate text-body-sm font-medium text-arctic">{i.nombre}</p>
                      <p className="truncate text-caption text-steel-500">{i.deposito}{i.ubicacion ? ` · ${i.ubicacion}` : ''}</p>
                      <p className={`mt-1 text-body-sm ${i.bajoStock ? 'text-orange-bright' : 'text-steel-100'}`}>{i.bajoStock && <AlertTriangle className="mr-1 inline h-3.5 w-3.5" aria-label="Bajo el mínimo" />}{nf(i.cantidad)} {i.unidad}{i.stockMinimo > 0 && <span className="text-caption text-steel-500"> (mín. {nf(i.stockMinimo)})</span>}</p>
                    </div>
                  </button>
                </li>))}
            </ul>)}
        </section>)}

      {tab === 'traslados' && (
        <section aria-label="Traslados">
          <div className="mb-3 flex items-center gap-3"><label htmlFor="e-t" className="sr-only">Estado</label><select id="e-t" value={estadoT} onChange={e => setEstadoT(e.target.value)} className="input text-base sm:text-sm"><option value="EN_TRANSITO">En tránsito (por recibir)</option><option value="RECIBIDO">Recibidos</option><option value="CANCELADO">Cancelados</option><option value="">Todos</option></select><p className="text-caption text-steel-500">Para crear uno, abrí un artículo y tocá "Trasladar".</p></div>
          {trasList === null ? <p className="text-steel-400">Cargando…</p> : trasList.length === 0 ? <div className="card p-6 text-center text-body-sm text-steel-400">No hay traslados {estadoT === 'EN_TRANSITO' ? 'pendientes de recibir' : 'con ese estado'}.</div> : (
            <ul className="space-y-3">{trasList.map(t => (
              <li key={t.id} className="card p-3 sm:p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0"><p className="text-body-sm font-medium text-arctic">#{t.numero} · {t.itemNombre}{t.codigo && <span className="text-steel-500"> · {t.codigo}</span>}</p>
                    <p className="mt-1 flex flex-wrap items-center gap-1 text-body-sm text-steel-100">{t.origen}<ArrowRight className="h-4 w-4 text-steel-500" aria-label="hacia" />{t.destino} <b className="ml-2 text-arctic">{nf(t.cantidad)} {t.unidad}</b></p>
                    <p className="mt-1 text-caption text-steel-500">Enviado por {t.creadoPor} · {fecha(t.createdAt)}{t.motivo && ` · ${t.motivo}`}</p>
                    {t.estado === 'EN_TRANSITO' && <p className="text-caption text-steel-400">Recibe: <b className="text-steel-100">{t.receptor || t.encargado || 'la administración (el depósito no tiene encargado)'}</b>{t.receptor && t.encargado && ` en lugar de ${t.encargado}`}{t.receptor && t.designadoPor && ` · designado por ${t.designadoPor}`}</p>}
                    {t.estado !== 'EN_TRANSITO' && <p className="text-caption text-steel-500">{t.estado === 'RECIBIDO' ? 'Recibido' : 'Cancelado'} por {t.resueltoPor} · {t.resueltoAt && fecha(t.resueltoAt)}{t.nota && ` · ${t.nota}`}</p>}</div>
                  <span className={`rounded-full px-2 py-0.5 text-caption ${t.estado === 'EN_TRANSITO' ? 'bg-orange-muted text-orange-bright' : t.estado === 'RECIBIDO' ? 'bg-success-light/20 text-success-bright' : 'bg-steel-700/60 text-steel-400'}`}>{t.estado === 'EN_TRANSITO' ? 'En tránsito' : t.estado === 'RECIBIDO' ? 'Recibido' : 'Cancelado'}</span>
                </div>
                {t.estado === 'EN_TRANSITO' && <div className="mt-3 flex flex-wrap gap-2">
                  {t.puede.recibir && <button onClick={() => setResolver({ t, accion: 'recibir' })} className="btn-primary min-h-[44px] flex-1 sm:flex-none">Confirmar recepción</button>}
                  {t.puede.designar && <button onClick={() => setDesignar(t)} className="btn-secondary min-h-[44px]">{t.receptor ? 'Cambiar quién recibe' : 'Designar a otra persona'}</button>}
                  {t.puede.cancelar && <button onClick={() => setResolver({ t, accion: 'cancelar' })} className="btn-ghost min-h-[44px]">Cancelar / rechazar</button>}
                  {!t.puede.recibir && !t.puede.designar && <p className="w-full text-caption text-steel-500">Solo {t.receptor || t.encargado || 'la administración'} puede confirmar la recepción.</p>}
                </div>}
              </li>))}</ul>)}
        </section>)}

      {tab === 'historial' && (
        <section aria-label="Historial">
          <div className="mb-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div className="relative lg:col-span-2"><label htmlFor="h-q" className="sr-only">Buscar</label><Search className="pointer-events-none absolute left-2 top-3.5 h-4 w-4 text-steel-500" /><input id="h-q" value={fh.q} onChange={e => setFh({ ...fh, q: e.target.value })} placeholder="Artículo, motivo, remito, usuario" className="input w-full pl-8 text-base sm:text-sm" /></div>
            <div><label htmlFor="h-t" className="sr-only">Tipo</label><select id="h-t" value={fh.tipo} onChange={e => setFh({ ...fh, tipo: e.target.value })} className={IN}><option value="">Todos los tipos</option>{Object.entries(TIPO_MOV).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
            <div className="grid grid-cols-2 gap-3 sm:contents"><div><label htmlFor="h-d" className="sr-only">Desde</label><input id="h-d" type="date" value={fh.desde} onChange={e => setFh({ ...fh, desde: e.target.value })} className={IN} aria-label="Desde" /></div>
            <div><label htmlFor="h-h" className="sr-only">Hasta</label><input id="h-h" type="date" value={fh.hasta} onChange={e => setFh({ ...fh, hasta: e.target.value })} className={IN} aria-label="Hasta" /></div></div>
          </div>
          {fh.itemId && <p className="mb-3 flex items-center gap-2 text-body-sm text-steel-100">Solo: <b className="text-arctic">{fh.itemNombre}</b><button onClick={() => setFh({ ...fh, itemId: '', itemNombre: '' })} className="flex h-8 items-center gap-1 rounded bg-steel-800 px-2 text-caption">Quitar <X className="h-3 w-3" /></button></p>}
          {movs === null ? <p className="text-steel-400">Cargando…</p> : movs.length === 0 ? <div className="card p-6 text-center text-body-sm text-steel-400">No hay movimientos con esos filtros.</div> : (
            <ul className="space-y-2">{movs.map(m => (
              <li key={m.id} className="card flex flex-wrap items-start justify-between gap-2 p-3">
                <div className="min-w-0 flex-1">
                  <p className="text-body-sm text-arctic">{m.itemNombre}{m.codigo && <span className="text-steel-500"> · {m.codigo}</span>} <span className="text-caption text-steel-500">· {m.depositoNombre}</span></p>
                  <p className="text-caption text-steel-400"><span className={COLOR_MOV[m.tipo]}>{TIPO_MOV[m.tipo] ?? m.tipo}</span>{m.motivo && ` · ${m.motivo}`}{m.referencia && ` · ${m.referencia}`}{m.destinatario && ` · a ${m.destinatario}`}</p>
                  <p className="text-caption text-steel-500">{m.usuario} · {fecha(m.createdAt)}</p>
                  {m.foto && <a href={m.foto} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-caption text-blue-bright">Ver foto adjunta</a>}
                </div>
                <div className="text-right"><p className={`font-display text-h3 ${m.delta >= 0 ? 'text-success-bright' : 'text-danger-bright'}`}>{m.delta > 0 ? '+' : ''}{nf(m.delta)} {m.unidad}</p><p className="text-caption text-steel-500">Saldo: {nf(m.saldo)}</p></div>
              </li>))}</ul>)}
          {siguiente && <div className="mt-3 text-center"><button onClick={() => cargarMovs(siguiente)} className="btn-secondary min-h-[44px]">Ver más</button></div>}
        </section>)}

      {fd && <FormDeposito inicial={fd} onClose={() => setFd(null)} onSaved={() => { setFd(null); recargar(); }} />}
      {fi && <FormItem inicial={fi} deps={deps} onClose={() => setFi(null)} onSaved={() => { setFi(null); recargar(); }} />}
      {mov && <FormMovimiento item={mov.item} tipo={mov.tipo} onClose={() => setMov(null)} onSaved={() => { setMov(null); recargar(); }} />}
      {tras && <FormTraslado item={tras} deps={deps} onClose={() => setTras(null)} onSaved={() => { setTras(null); setTab('traslados'); setEstadoT('EN_TRANSITO'); recargar(); }} />}
      {escaneando && <Escaner onClose={() => setEscaneando(false)} onResult={escaneado} />}
      {designar && <Designar t={designar} onClose={() => setDesignar(null)} onSaved={() => { setDesignar(null); recargar(); }} />}
      {resolver && <Resolver r={resolver} onClose={() => setResolver(null)} onOk={confirmarResolver} />}
      {ver && (
        <Modal titulo={ver.nombre} onClose={() => setVer(null)} ancho>
          {ver.fotos.length > 0 && <div className="mb-3 flex gap-2 overflow-x-auto">{ver.fotos.map((u, k) => (
            // eslint-disable-next-line @next/next/no-img-element
            <a key={k} href={u} target="_blank" rel="noopener noreferrer" className="flex-none"><img src={u} alt={`${ver.nombre}, foto ${k + 1}`} className="h-40 w-auto max-w-[80vw] rounded border border-steel-700 object-cover" /></a>))}</div>}
          <p className={`mb-3 font-display text-h2 ${ver.bajoStock ? 'text-orange-bright' : 'text-arctic'}`}>{nf(ver.cantidad)} {ver.unidad}{ver.stockMinimo > 0 && <span className="text-body-sm text-steel-500"> · mín. {nf(ver.stockMinimo)}</span>}</p>
          <div className="mb-4 grid grid-cols-4 gap-2">
            <button onClick={() => { setMov({ item: ver, tipo: 'ENTRADA' }); setVer(null); }} className={accion}><ArrowDownToLine className="h-5 w-5 text-success-bright" />Entrada</button>
            <button onClick={() => { setMov({ item: ver, tipo: 'SALIDA' }); setVer(null); }} className={accion}><ArrowUpFromLine className="h-5 w-5 text-danger-bright" />Salida</button>
            <button onClick={() => { setMov({ item: ver, tipo: 'AJUSTE' }); setVer(null); }} className={accion}><SlidersHorizontal className="h-5 w-5 text-blue-bright" />Ajuste</button>
            <button onClick={() => { setTras(ver); setVer(null); }} className={accion}><Truck className="h-5 w-5 text-orange-bright" />Trasladar</button>
          </div>
          <dl className="grid gap-x-4 gap-y-2 text-body-sm sm:grid-cols-2">
            {([['Depósito', ver.deposito], ['Ubicación', ver.ubicacion], ['Código', ver.codigo], ['Categoría', ver.categoria], ['Descripción', ver.descripcion], ['Notas', ver.notas]] as const).filter(([, v]) => v).map(([k, v]) => <div key={k}><dt className="text-caption text-steel-500">{k}</dt><dd className="whitespace-pre-wrap text-steel-100">{v}</dd></div>)}
          </dl>
          <div className="mt-4 flex flex-wrap gap-2"><button onClick={() => verHistorialDe(ver)} className="btn-secondary min-h-[44px]">Ver historial</button><button onClick={() => { setFi({ id: ver.id, depositoId: ver.depositoId, nombre: ver.nombre, codigo: ver.codigo, descripcion: ver.descripcion, categoria: ver.categoria, unidad: ver.unidad, cantidad: ver.cantidad, stockMinimo: ver.stockMinimo, ubicacion: ver.ubicacion, fotos: ver.fotos, notas: ver.notas }); setVer(null); }} className="btn-ghost min-h-[44px]">Editar datos</button><button onClick={() => borrarItem(ver)} className="btn-ghost min-h-[44px] text-danger-bright">Eliminar</button></div>
        </Modal>)}
    </div>
  );
}

function Designar({ t, onClose, onSaved }: { t: Tras; onClose: () => void; onSaved: () => void }) {
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);
  const [uid, setUid] = useState(t.receptorId ?? '');
  const [err, setErr] = useState('');
  useEffect(() => { fetch('/api/depositos/usuarios').then(r => r.json()).then(j => Array.isArray(j) && setUsers(j)).catch(() => {}); }, []);
  async function guardar(receptorId: string | null) {
    try { await api(`/api/depositos/traslados/${t.id}`, 'POST', { accion: 'designar', receptorId }); onSaved(); } catch (x) { setErr((x as Error).message); }
  }
  return (
    <Modal titulo="Designar quién recibe" onClose={onClose}>
      <p className="mb-3 text-body-sm text-steel-100">#{t.numero} · {t.itemNombre}: <b>{nf(t.cantidad)} {t.unidad}</b> a {t.destino}.</p>
      <p className="mb-3 text-caption text-steel-400">Si {t.encargado || 'el encargado'} no puede recibirlo, elegí a otra persona. Le llega un aviso en la campana y solo ella (o {t.encargado || 'el encargado'}) podrá confirmar la recepción. Queda registrado quién la designó.</p>
      <label htmlFor="ds-u" className={L}>Persona que recibe</label>
      <select id="ds-u" value={uid} onChange={e => setUid(e.target.value)} className={IN}><option value="">Elegí una persona…</option>{users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select>
      {err && <p role="alert" className="mt-2 text-caption text-danger-bright">{err}</p>}
      <div className="mt-4 flex flex-wrap gap-2"><button disabled={!uid} onClick={() => guardar(uid)} className="btn-primary min-h-[44px] flex-1 sm:flex-none">Designar</button>{t.receptorId && <button onClick={() => guardar(null)} className="btn-secondary min-h-[44px]">Quitar designación</button>}<button onClick={onClose} className="btn-ghost min-h-[44px]">Volver</button></div>
    </Modal>
  );
}

function Resolver({ r, onClose, onOk }: { r: { t: Tras; accion: 'recibir' | 'cancelar' }; onClose: () => void; onOk: (nota: string) => void }) {
  const [nota, setNota] = useState('');
  const recibir = r.accion === 'recibir';
  return (
    <Modal titulo={recibir ? 'Confirmar recepción' : 'Cancelar traslado'} onClose={onClose}>
      <p className="mb-3 text-body-sm text-steel-100">#{r.t.numero} · {r.t.itemNombre}: <b>{nf(r.t.cantidad)} {r.t.unidad}</b> de {r.t.origen} a {r.t.destino}.</p>
      <p className="mb-3 text-caption text-steel-400">{recibir ? `El stock entra a ${r.t.destino}. Si el artículo no existe allí, se crea con sus datos y fotos.` : `El stock vuelve a ${r.t.origen}.`}</p>
      <label htmlFor="r-n" className={L}>{recibir ? 'Nota de recepción (opcional)' : 'Motivo (opcional)'}</label>
      <input id="r-n" maxLength={300} value={nota} onChange={e => setNota(e.target.value)} className={IN} placeholder={recibir ? 'Llegó completo' : 'Se canceló porque…'} />
      <div className="mt-4 flex gap-2"><button onClick={() => onOk(nota)} className="btn-primary min-h-[44px] flex-1 sm:flex-none">{recibir ? 'Confirmar recepción' : 'Cancelar traslado'}</button><button onClick={onClose} className="btn-ghost min-h-[44px]">Volver</button></div>
    </Modal>
  );
}

export default function DepositosPage() { return <Suspense fallback={<div className="p-6 text-steel-400">Cargando…</div>}><Pagina /></Suspense>; }
