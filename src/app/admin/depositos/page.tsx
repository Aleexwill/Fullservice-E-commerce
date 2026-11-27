'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Camera, Pencil, Plus, Search, Trash2, Warehouse, X } from 'lucide-react';
import { redimensionar } from '@/lib/redimensionar-imagen';

interface Dep { id: string; nombre: string; direccion: string; responsable: string; notas: string; activo: boolean; articulos: number; bajoStock: number }
interface Item { id: string; depositoId: string; deposito: string; codigo: string; nombre: string; descripcion: string; categoria: string; unidad: string; cantidad: number; stockMinimo: number; bajoStock: boolean; ubicacion: string; fotos: string[]; notas: string; activo: boolean }
const L = 'mb-1 block font-body text-caption text-steel-400';
const MAX_FOTOS = 5;
const nf = (n: number) => n.toLocaleString('es-PY', { maximumFractionDigits: 3 });
const VACIO = { id: '', depositoId: '', nombre: '', codigo: '', descripcion: '', categoria: '', unidad: 'un', cantidad: 0, stockMinimo: 0, ubicacion: '', fotos: [] as string[], notas: '' };

async function api(url: string, method: string, body?: object) {
  const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || 'No se pudo guardar');
  return j;
}

function FormDeposito({ inicial, onClose, onSaved }: { inicial: Partial<Dep>; onClose: () => void; onSaved: () => void }) {
  const [d, setD] = useState({ nombre: inicial.nombre ?? '', direccion: inicial.direccion ?? '', responsable: inicial.responsable ?? '', notas: inicial.notas ?? '', activo: inicial.activo ?? true });
  const [err, setErr] = useState('');
  async function guardar(e: React.FormEvent) {
    e.preventDefault(); setErr('');
    try { await api(inicial.id ? `/api/depositos/${inicial.id}` : '/api/depositos', inicial.id ? 'PATCH' : 'POST', d); onSaved(); } catch (x) { setErr((x as Error).message); }
  }
  return (
    <Modal titulo={inicial.id ? 'Editar depósito' : 'Nuevo depósito'} onClose={onClose}>
      <form onSubmit={guardar} className="space-y-3">
        <div><label htmlFor="d-n" className={L}>Nombre</label><input id="d-n" required minLength={2} maxLength={80} value={d.nombre} onChange={e => setD({ ...d, nombre: e.target.value })} className="input w-full" placeholder="Depósito central" /></div>
        <div><label htmlFor="d-d" className={L}>Dirección o ubicación</label><input id="d-d" maxLength={200} value={d.direccion} onChange={e => setD({ ...d, direccion: e.target.value })} className="input w-full" /></div>
        <div><label htmlFor="d-r" className={L}>Responsable</label><input id="d-r" maxLength={80} value={d.responsable} onChange={e => setD({ ...d, responsable: e.target.value })} className="input w-full" /></div>
        <div><label htmlFor="d-no" className={L}>Notas</label><textarea id="d-no" rows={2} maxLength={1000} value={d.notas} onChange={e => setD({ ...d, notas: e.target.value })} className="input w-full" /></div>
        {inicial.id && <label className="flex items-center gap-2 text-body-sm text-steel-100"><input type="checkbox" checked={d.activo} onChange={e => setD({ ...d, activo: e.target.checked })} className="h-4 w-4" />Activo (si se desactiva no admite artículos nuevos)</label>}
        {err && <p role="alert" className="text-caption text-danger-bright">{err}</p>}
        <div className="flex gap-2"><button className="btn-primary">Guardar</button><button type="button" onClick={onClose} className="btn-ghost">Cancelar</button></div>
      </form>
    </Modal>
  );
}

function FormItem({ inicial, deps, onClose, onSaved }: { inicial: typeof VACIO; deps: Dep[]; onClose: () => void; onSaved: () => void }) {
  const [d, setD] = useState(inicial);
  const [err, setErr] = useState(''); const [subiendo, setSubiendo] = useState(false);
  const activos = deps.filter(x => x.activo || x.id === inicial.depositoId);
  const set = (k: string, v: string | number) => setD(x => ({ ...x, [k]: v }));

  async function fotos(files: FileList | null) {
    if (!files?.length) return; setErr(''); setSubiendo(true);
    let lista = [...d.fotos];
    for (const f0 of Array.from(files)) {
      if (lista.length >= MAX_FOTOS) { setErr(`Máximo ${MAX_FOTOS} fotos`); break; }
      const f = await redimensionar(f0);
      const fd = new FormData(); fd.append('file', f);
      const r = await fetch('/api/depositos/upload', { method: 'POST', body: fd }); const j = await r.json().catch(() => ({}));
      if (!r.ok) { setErr(`${f0.name}: ${j.error || 'no se pudo subir'}`); continue; }
      lista = [...lista, j.url];
    }
    setD(x => ({ ...x, fotos: lista })); setSubiendo(false);
  }
  async function guardar(e: React.FormEvent) {
    e.preventDefault(); setErr('');
    const { id, ...body } = d;
    try { await api(id ? `/api/depositos/items/${id}` : '/api/depositos/items', id ? 'PATCH' : 'POST', body); onSaved(); } catch (x) { setErr((x as Error).message); }
  }
  return (
    <Modal titulo={inicial.id ? 'Editar artículo' : 'Cargar artículo al inventario'} onClose={onClose} ancho>
      <form onSubmit={guardar} className="space-y-3">
        <div><label htmlFor="i-dep" className={L}>Depósito *</label>
          <select id="i-dep" required value={d.depositoId} onChange={e => set('depositoId', e.target.value)} className="input w-full"><option value="">Elegí el depósito…</option>{activos.map(x => <option key={x.id} value={x.id}>{x.nombre}{x.activo ? '' : ' (desactivado)'}</option>)}</select></div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="sm:col-span-2"><label htmlFor="i-n" className={L}>Nombre *</label><input id="i-n" required minLength={2} maxLength={140} value={d.nombre} onChange={e => set('nombre', e.target.value)} className="input w-full" /></div>
          <div><label htmlFor="i-c" className={L}>Código</label><input id="i-c" maxLength={60} value={d.codigo} onChange={e => set('codigo', e.target.value)} className="input w-full" /></div>
        </div>
        <div className="grid gap-3 sm:grid-cols-4">
          <div><label htmlFor="i-q" className={L}>Cantidad</label><input id="i-q" type="number" min={0} step="any" value={d.cantidad} onChange={e => set('cantidad', Number(e.target.value))} className="input w-full" /></div>
          <div><label htmlFor="i-u" className={L}>Unidad</label><input id="i-u" maxLength={20} value={d.unidad} onChange={e => set('unidad', e.target.value)} className="input w-full" placeholder="un, kg, lt, caja" /></div>
          <div><label htmlFor="i-m" className={L}>Stock mínimo</label><input id="i-m" type="number" min={0} step="any" value={d.stockMinimo} onChange={e => set('stockMinimo', Number(e.target.value))} className="input w-full" /></div>
          <div><label htmlFor="i-ub" className={L}>Ubicación</label><input id="i-ub" maxLength={80} value={d.ubicacion} onChange={e => set('ubicacion', e.target.value)} className="input w-full" placeholder="Estante B2" /></div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><label htmlFor="i-cat" className={L}>Categoría</label><input id="i-cat" maxLength={60} value={d.categoria} onChange={e => set('categoria', e.target.value)} className="input w-full" /></div>
          <div><label htmlFor="i-no" className={L}>Notas</label><input id="i-no" maxLength={1000} value={d.notas} onChange={e => set('notas', e.target.value)} className="input w-full" /></div>
        </div>
        <div><label htmlFor="i-de" className={L}>Descripción</label><textarea id="i-de" rows={2} maxLength={2000} value={d.descripcion} onChange={e => set('descripcion', e.target.value)} className="input w-full" /></div>
        <div>
          <span className={L}>Fotos (hasta {MAX_FOTOS})</span>
          <div className="flex flex-wrap items-center gap-2">
            {d.fotos.map((u, i) => (
              <div key={i} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={u} alt={`Foto ${i + 1} del artículo`} className="h-20 w-20 rounded border border-steel-700 object-cover" />
                <button type="button" aria-label={`Quitar foto ${i + 1}`} onClick={() => setD(x => ({ ...x, fotos: x.fotos.filter((_, j) => j !== i) }))} className="absolute -right-1.5 -top-1.5 rounded-full bg-steel-900 p-0.5 text-steel-100 ring-1 ring-steel-600"><X className="h-3 w-3" /></button>
              </div>))}
            {d.fotos.length < MAX_FOTOS && (
              <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded border border-dashed border-steel-600 text-caption text-steel-400 hover:text-arctic">
                <Camera className="h-5 w-5" />{subiendo ? 'Subiendo…' : 'Agregar'}
                <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" disabled={subiendo} onChange={e => { fotos(e.target.files); e.target.value = ''; }} />
              </label>)}
          </div>
        </div>
        {err && <p role="alert" className="text-caption text-danger-bright">{err}</p>}
        <div className="flex gap-2"><button disabled={subiendo} className="btn-primary">Guardar</button><button type="button" onClick={onClose} className="btn-ghost">Cancelar</button></div>
      </form>
    </Modal>
  );
}

function Modal({ titulo, onClose, children, ancho }: { titulo: string; onClose: () => void; children: React.ReactNode; ancho?: boolean }) {
  useEffect(() => { const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose(); window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h); }, [onClose]);
  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-black/60 p-4" role="dialog" aria-modal="true" aria-label={titulo}>
      <div className={`card my-6 w-full p-5 ${ancho ? 'max-w-2xl' : 'max-w-md'}`}>
        <div className="mb-3 flex items-center justify-between"><h2 className="font-display text-h3 text-arctic">{titulo}</h2><button onClick={onClose} aria-label="Cerrar" className="text-steel-400 hover:text-arctic"><X className="h-5 w-5" /></button></div>
        {children}
      </div>
    </div>
  );
}

export default function DepositosPage() {
  const [deps, setDeps] = useState<Dep[]>([]);
  const [items, setItems] = useState<Item[] | null>(null);
  const [filtro, setFiltro] = useState({ depositoId: '', q: '', bajoStock: false });
  const [err, setErr] = useState('');
  const [fd, setFd] = useState<Partial<Dep> | null>(null);
  const [fi, setFi] = useState<typeof VACIO | null>(null);
  const [ver, setVer] = useState<Item | null>(null);

  const cargarDeps = useCallback(() => fetch('/api/depositos').then(r => r.json()).then(j => Array.isArray(j) ? setDeps(j) : setErr(j.error || 'Error')).catch(() => setErr('Error al cargar depósitos')), []);
  const cargarItems = useCallback(() => {
    const qs = new URLSearchParams(); if (filtro.depositoId) qs.set('depositoId', filtro.depositoId); if (filtro.q.trim()) qs.set('q', filtro.q.trim()); if (filtro.bajoStock) qs.set('bajoStock', '1');
    return fetch(`/api/depositos/items?${qs}`).then(r => r.json()).then(j => Array.isArray(j) ? setItems(j) : setErr(j.error || 'Error')).catch(() => setErr('Error al cargar el inventario'));
  }, [filtro]);
  useEffect(() => { cargarDeps(); }, [cargarDeps]);
  useEffect(() => { const t = setTimeout(cargarItems, filtro.q ? 300 : 0); return () => clearTimeout(t); }, [cargarItems, filtro.q]);
  const recargar = () => { cargarDeps(); cargarItems(); };
  const depActual = useMemo(() => deps.find(d => d.id === filtro.depositoId), [deps, filtro.depositoId]);

  async function borrarDep(d: Dep) {
    if (!confirm(`¿Eliminar el depósito "${d.nombre}"?`)) return;
    try { await api(`/api/depositos/${d.id}`, 'DELETE'); if (filtro.depositoId === d.id) setFiltro({ ...filtro, depositoId: '' }); recargar(); } catch (x) { alert((x as Error).message); }
  }
  async function borrarItem(i: Item) {
    if (!confirm(`¿Eliminar "${i.nombre}" del inventario?`)) return;
    try { await api(`/api/depositos/items/${i.id}`, 'DELETE'); setVer(null); recargar(); } catch (x) { alert((x as Error).message); }
  }
  const nuevoItem = () => setFi({ ...VACIO, depositoId: filtro.depositoId || (deps.filter(d => d.activo).length === 1 ? deps.find(d => d.activo)!.id : '') });

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="font-display text-h1 text-arctic">Depósitos e inventario</h1><p className="font-body text-body-sm text-steel-400">Creá los depósitos y cargá el inventario de cada uno con sus fotos.</p></div>
        <div className="flex gap-2"><button onClick={() => setFd({})} className="btn-secondary inline-flex items-center gap-2"><Warehouse className="h-4 w-4" />Nuevo depósito</button><button onClick={nuevoItem} disabled={deps.every(d => !d.activo)} className="btn-primary inline-flex items-center gap-2 disabled:opacity-50"><Plus className="h-4 w-4" />Cargar artículo</button></div>
      </div>
      {err && <p role="alert" className="mb-3 rounded-md bg-danger-light/10 px-3 py-2 text-caption text-danger-bright">{err}</p>}

      <section aria-label="Depósitos" className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {deps.length === 0 && <div className="card col-span-full p-6 text-center text-body-sm text-steel-400">Todavía no hay depósitos. Creá el primero con "Nuevo depósito".</div>}
        {deps.map(d => (
          <div key={d.id} className={`card p-4 ${filtro.depositoId === d.id ? 'ring-1 ring-blue-bright' : ''} ${d.activo ? '' : 'opacity-60'}`}>
            <div className="flex items-start justify-between gap-2">
              <button onClick={() => setFiltro({ ...filtro, depositoId: filtro.depositoId === d.id ? '' : d.id })} className="min-w-0 text-left" aria-pressed={filtro.depositoId === d.id}>
                <p className="truncate font-display text-h3 text-arctic">{d.nombre}{!d.activo && <span className="ml-2 text-caption text-steel-500">(desactivado)</span>}</p>
                <p className="text-caption text-steel-400">{d.articulos} artículo(s){d.bajoStock > 0 && <span className="ml-2 text-orange-bright">· {d.bajoStock} bajo mínimo</span>}</p>
                {(d.direccion || d.responsable) && <p className="mt-1 truncate text-caption text-steel-500">{[d.direccion, d.responsable && `Resp.: ${d.responsable}`].filter(Boolean).join(' · ')}</p>}
              </button>
              <div className="flex flex-none gap-1"><button onClick={() => setFd(d)} aria-label={`Editar ${d.nombre}`} className="p-1 text-steel-400 hover:text-arctic"><Pencil className="h-4 w-4" /></button><button onClick={() => borrarDep(d)} aria-label={`Eliminar ${d.nombre}`} className="p-1 text-steel-400 hover:text-danger-bright"><Trash2 className="h-4 w-4" /></button></div>
            </div>
          </div>))}
      </section>

      <section aria-label="Inventario">
        <div className="mb-3 flex flex-wrap items-end gap-3">
          <h2 className="font-display text-h3 text-arctic">Inventario{depActual ? ` · ${depActual.nombre}` : ''}</h2>
          <div className="relative"><label htmlFor="f-q" className="sr-only">Buscar</label><Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-steel-500" /><input id="f-q" value={filtro.q} onChange={e => setFiltro({ ...filtro, q: e.target.value })} placeholder="Buscar nombre, código, ubicación" className="input pl-8" /></div>
          <div><label htmlFor="f-d" className="sr-only">Depósito</label><select id="f-d" value={filtro.depositoId} onChange={e => setFiltro({ ...filtro, depositoId: e.target.value })} className="input"><option value="">Todos los depósitos</option>{deps.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}</select></div>
          <label className="flex items-center gap-2 pb-2 text-body-sm text-steel-100"><input type="checkbox" checked={filtro.bajoStock} onChange={e => setFiltro({ ...filtro, bajoStock: e.target.checked })} className="h-4 w-4" />Solo bajo el mínimo</label>
        </div>
        {items === null ? <p className="text-steel-400">Cargando…</p> : items.length === 0 ? <div className="card p-6 text-center text-body-sm text-steel-400">No hay artículos con esos filtros.</div> : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map(i => (
              <li key={i.id} className="card overflow-hidden">
                <button onClick={() => setVer(i)} className="block w-full text-left">
                  {i.fotos[0]
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={i.fotos[0]} alt={i.nombre} loading="lazy" className="h-36 w-full object-cover" />
                    : <div className="flex h-36 w-full items-center justify-center bg-steel-900/60 text-steel-600"><Camera className="h-8 w-8" aria-hidden="true" /><span className="sr-only">Sin foto</span></div>}
                  <div className="p-3">
                    <p className="truncate text-body-sm font-medium text-arctic">{i.nombre}</p>
                    <p className="truncate text-caption text-steel-500">{i.deposito}{i.ubicacion ? ` · ${i.ubicacion}` : ''}{i.codigo ? ` · ${i.codigo}` : ''}</p>
                    <p className={`mt-1 text-body-sm ${i.bajoStock ? 'text-orange-bright' : 'text-steel-100'}`}>{i.bajoStock && <AlertTriangle className="mr-1 inline h-3.5 w-3.5" aria-label="Bajo el mínimo" />}{nf(i.cantidad)} {i.unidad}{i.stockMinimo > 0 && <span className="text-caption text-steel-500"> (mín. {nf(i.stockMinimo)})</span>}</p>
                  </div>
                </button>
              </li>))}
          </ul>)}
      </section>

      {fd && <FormDeposito inicial={fd} onClose={() => setFd(null)} onSaved={() => { setFd(null); recargar(); }} />}
      {fi && <FormItem inicial={fi} deps={deps} onClose={() => setFi(null)} onSaved={() => { setFi(null); recargar(); }} />}
      {ver && (
        <Modal titulo={ver.nombre} onClose={() => setVer(null)} ancho>
          {ver.fotos.length > 0 && <div className="mb-3 flex flex-wrap gap-2">{ver.fotos.map((u, k) => (
            // eslint-disable-next-line @next/next/no-img-element
            <a key={k} href={u} target="_blank" rel="noopener noreferrer"><img src={u} alt={`${ver.nombre}, foto ${k + 1}`} className="h-40 w-auto max-w-full rounded border border-steel-700 object-cover" /></a>))}</div>}
          <dl className="grid gap-x-4 gap-y-2 text-body-sm sm:grid-cols-2">
            {([['Depósito', ver.deposito], ['Cantidad', `${nf(ver.cantidad)} ${ver.unidad}`], ['Stock mínimo', ver.stockMinimo ? nf(ver.stockMinimo) : ''], ['Ubicación', ver.ubicacion], ['Código', ver.codigo], ['Categoría', ver.categoria], ['Descripción', ver.descripcion], ['Notas', ver.notas]] as const).filter(([, v]) => v).map(([k, v]) => <div key={k}><dt className="text-caption text-steel-500">{k}</dt><dd className="whitespace-pre-wrap text-steel-100">{v}</dd></div>)}
          </dl>
          <div className="mt-4 flex gap-2"><button onClick={() => { setFi({ id: ver.id, depositoId: ver.depositoId, nombre: ver.nombre, codigo: ver.codigo, descripcion: ver.descripcion, categoria: ver.categoria, unidad: ver.unidad, cantidad: ver.cantidad, stockMinimo: ver.stockMinimo, ubicacion: ver.ubicacion, fotos: ver.fotos, notas: ver.notas }); setVer(null); }} className="btn-primary">Editar / mover de depósito</button><button onClick={() => borrarItem(ver)} className="btn-ghost text-danger-bright">Eliminar</button></div>
        </Modal>)}
    </div>
  );
}
