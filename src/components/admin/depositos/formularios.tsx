'use client';

import { useEffect, useState } from 'react';
import { Camera, X } from 'lucide-react';
import { IN, L, Modal, api, nf, subirFoto } from './comun';
import type { Dep, Item } from './comun';

const MAX_FOTOS = 5;

export const ITEM_VACIO = { id: '', depositoId: '', nombre: '', codigo: '', descripcion: '', categoria: '', unidad: 'un', cantidad: 0, stockMinimo: 0, ubicacion: '', fotos: [] as string[], notas: '' };

export function FormDeposito({ inicial, onClose, onSaved }: { inicial: Partial<Dep>; onClose: () => void; onSaved: () => void }) {
  const [d, setD] = useState({ nombre: inicial.nombre ?? '', direccion: inicial.direccion ?? '', responsableId: inicial.responsableId ?? '', notas: inicial.notas ?? '', activo: inicial.activo ?? true });
  const [err, setErr] = useState('');
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);
  useEffect(() => { fetch('/api/depositos/usuarios').then(r => r.json()).then(j => Array.isArray(j) && setUsers(j)).catch(() => {}); }, []);
  async function guardar(e: React.FormEvent) {
    e.preventDefault(); setErr('');
    try { await api(inicial.id ? `/api/depositos/${inicial.id}` : '/api/depositos', inicial.id ? 'PATCH' : 'POST', { ...d, responsableId: d.responsableId || null }); onSaved(); } catch (x) { setErr((x as Error).message); }
  }
  return (
    <Modal titulo={inicial.id ? 'Editar depósito' : 'Nuevo depósito'} onClose={onClose}>
      <form onSubmit={guardar} className="space-y-3">
        <div><label htmlFor="d-n" className={L}>Nombre</label><input id="d-n" required minLength={2} maxLength={80} value={d.nombre} onChange={e => setD({ ...d, nombre: e.target.value })} className={IN} placeholder="Depósito central" /></div>
        <div><label htmlFor="d-d" className={L}>Dirección o ubicación</label><input id="d-d" maxLength={200} value={d.direccion} onChange={e => setD({ ...d, direccion: e.target.value })} className={IN} /></div>
        <div><label htmlFor="d-r" className={L}>Encargado</label><select id="d-r" value={d.responsableId} onChange={e => setD({ ...d, responsableId: e.target.value })} className={IN}><option value="">Sin encargado</option>{users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select><p className="mt-1 text-caption text-steel-500">Recibe un aviso en la campana cuando llega un traslado a este depósito. Sin encargado, el aviso le llega a la administración.</p></div>
        <div><label htmlFor="d-no" className={L}>Notas</label><textarea id="d-no" rows={2} maxLength={1000} value={d.notas} onChange={e => setD({ ...d, notas: e.target.value })} className={IN} /></div>
        {inicial.id && <label className="flex min-h-[44px] items-center gap-2 text-body-sm text-steel-100"><input type="checkbox" checked={d.activo} onChange={e => setD({ ...d, activo: e.target.checked })} className="h-5 w-5" />Activo (si se desactiva no admite artículos ni traslados nuevos)</label>}
        {err && <p role="alert" className="text-caption text-danger-bright">{err}</p>}
        <div className="flex gap-2"><button className="btn-primary">Guardar</button><button type="button" onClick={onClose} className="btn-ghost">Cancelar</button></div>
      </form>
    </Modal>
  );
}

function Fotos({ fotos, onChange, max = MAX_FOTOS }: { fotos: string[]; onChange: (f: string[]) => void; max?: number }) {
  const [subiendo, setSubiendo] = useState(false); const [err, setErr] = useState('');
  async function elegir(files: FileList | null) {
    if (!files?.length) return; setErr(''); setSubiendo(true);
    let lista = [...fotos];
    for (const f of Array.from(files)) {
      if (lista.length >= max) { setErr(`Máximo ${max} foto(s)`); break; }
      try { lista = [...lista, await subirFoto(f)]; } catch (x) { setErr((x as Error).message); }
    }
    onChange(lista); setSubiendo(false);
  }
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {fotos.map((u, i) => (
          <div key={i} className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={u} alt={`Foto ${i + 1}`} className="h-20 w-20 rounded border border-steel-700 object-cover" />
            <button type="button" aria-label={`Quitar foto ${i + 1}`} onClick={() => onChange(fotos.filter((_, j) => j !== i))} className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-steel-900 text-steel-100 ring-1 ring-steel-600"><X className="h-4 w-4" /></button>
          </div>))}
        {fotos.length < max && (
          <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded border border-dashed border-steel-600 text-caption text-steel-400 hover:text-arctic">
            <Camera className="h-5 w-5" />{subiendo ? 'Subiendo…' : 'Foto'}
            {/* sin "capture": en el teléfono el navegador ofrece cámara o galería */}
            <input type="file" accept="image/jpeg,image/png,image/webp" multiple={max > 1} className="sr-only" disabled={subiendo} onChange={e => { elegir(e.target.files); e.target.value = ''; }} />
          </label>)}
      </div>
      {err && <p role="alert" className="mt-1 text-caption text-danger-bright">{err}</p>}
    </div>
  );
}

export function FormItem({ inicial, deps, onClose, onSaved }: { inicial: typeof ITEM_VACIO; deps: Dep[]; onClose: () => void; onSaved: () => void }) {
  const [d, setD] = useState(inicial);
  const [err, setErr] = useState('');
  const editando = !!inicial.id;
  const activos = deps.filter(x => x.activo);
  const set = (k: string, v: string | number) => setD(x => ({ ...x, [k]: v }));
  async function guardar(e: React.FormEvent) {
    e.preventDefault(); setErr('');
    const { id, depositoId, cantidad, ...resto } = d;
    try { await api(id ? `/api/depositos/items/${id}` : '/api/depositos/items', id ? 'PATCH' : 'POST', id ? resto : { depositoId, cantidad, ...resto }); onSaved(); } catch (x) { setErr((x as Error).message); }
  }
  return (
    <Modal titulo={editando ? 'Editar artículo' : 'Cargar artículo al inventario'} onClose={onClose} ancho>
      <form onSubmit={guardar} className="space-y-3">
        <div><label htmlFor="i-dep" className={L}>Depósito *</label>
          {editando ? <p className="rounded-lg bg-steel-900/60 px-3 py-3 text-body-sm text-steel-100">{deps.find(x => x.id === d.depositoId)?.nombre}<span className="block text-caption text-steel-500">Para cambiarlo usá "Trasladar" (queda registrado).</span></p>
            : <select id="i-dep" required value={d.depositoId} onChange={e => set('depositoId', e.target.value)} className={IN}><option value="">Elegí el depósito…</option>{activos.map(x => <option key={x.id} value={x.id}>{x.nombre}</option>)}</select>}</div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="sm:col-span-2"><label htmlFor="i-n" className={L}>Nombre *</label><input id="i-n" required minLength={2} maxLength={140} value={d.nombre} onChange={e => set('nombre', e.target.value)} className={IN} /></div>
          <div><label htmlFor="i-c" className={L}>Código</label><input id="i-c" maxLength={60} value={d.codigo} onChange={e => set('codigo', e.target.value)} className={IN} /></div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {!editando && <div><label htmlFor="i-q" className={L}>Cantidad inicial</label><input id="i-q" type="number" inputMode="decimal" min={0} step="any" value={d.cantidad} onChange={e => set('cantidad', Number(e.target.value))} className={IN} /></div>}
          <div><label htmlFor="i-u" className={L}>Unidad</label><input id="i-u" maxLength={20} value={d.unidad} onChange={e => set('unidad', e.target.value)} className={IN} placeholder="un, kg, lt, caja" /></div>
          <div><label htmlFor="i-m" className={L}>Stock mínimo</label><input id="i-m" type="number" inputMode="decimal" min={0} step="any" value={d.stockMinimo} onChange={e => set('stockMinimo', Number(e.target.value))} className={IN} /></div>
          <div><label htmlFor="i-ub" className={L}>Ubicación</label><input id="i-ub" maxLength={80} value={d.ubicacion} onChange={e => set('ubicacion', e.target.value)} className={IN} placeholder="Estante B2" /></div>
        </div>
        {editando && <p className="text-caption text-steel-500">La cantidad se cambia con Entrada, Salida o Ajuste, para que quede en el historial.</p>}
        <div className="grid gap-3 sm:grid-cols-2">
          <div><label htmlFor="i-cat" className={L}>Categoría</label><input id="i-cat" maxLength={60} value={d.categoria} onChange={e => set('categoria', e.target.value)} className={IN} /></div>
          <div><label htmlFor="i-no" className={L}>Notas</label><input id="i-no" maxLength={1000} value={d.notas} onChange={e => set('notas', e.target.value)} className={IN} /></div>
        </div>
        <div><label htmlFor="i-de" className={L}>Descripción</label><textarea id="i-de" rows={2} maxLength={2000} value={d.descripcion} onChange={e => set('descripcion', e.target.value)} className={IN} /></div>
        <div><span className={L}>Fotos (hasta {MAX_FOTOS})</span><Fotos fotos={d.fotos} onChange={f => setD(x => ({ ...x, fotos: f }))} /></div>
        {err && <p role="alert" className="text-caption text-danger-bright">{err}</p>}
        <div className="flex gap-2"><button className="btn-primary">Guardar</button><button type="button" onClick={onClose} className="btn-ghost">Cancelar</button></div>
      </form>
    </Modal>
  );
}

const TITULO = { ENTRADA: 'Registrar entrada', SALIDA: 'Registrar salida', AJUSTE: 'Ajustar por conteo' } as const;

export function FormMovimiento({ item, tipo, onClose, onSaved }: { item: Item; tipo: 'ENTRADA' | 'SALIDA' | 'AJUSTE'; onClose: () => void; onSaved: () => void }) {
  const [cant, setCant] = useState(tipo === 'AJUSTE' ? String(item.cantidad) : '');
  const [motivo, setMotivo] = useState(''); const [ref, setRef] = useState(''); const [dest, setDest] = useState('');
  const [foto, setFoto] = useState<string[]>([]);
  const [err, setErr] = useState(''); const [enviando, setEnviando] = useState(false);
  const n = Number(cant);
  const nuevo = tipo === 'ENTRADA' ? item.cantidad + n : tipo === 'SALIDA' ? item.cantidad - n : n;
  async function guardar(e: React.FormEvent) {
    e.preventDefault(); setErr(''); setEnviando(true);
    const base = { tipo, itemId: item.id, motivo: motivo || undefined, foto: foto[0] };
    const body = tipo === 'AJUSTE' ? { ...base, conteo: n } : tipo === 'SALIDA' ? { ...base, cantidad: n, referencia: ref || undefined, destinatario: dest || undefined } : { ...base, cantidad: n, referencia: ref || undefined };
    try { await api('/api/depositos/movimientos', 'POST', body); onSaved(); } catch (x) { setErr((x as Error).message); setEnviando(false); }
  }
  return (
    <Modal titulo={`${TITULO[tipo]} · ${item.nombre}`} onClose={onClose}>
      <p className="mb-3 text-body-sm text-steel-400">{item.deposito} · Stock actual: <b className="text-arctic">{nf(item.cantidad)} {item.unidad}</b></p>
      <form onSubmit={guardar} className="space-y-3">
        <div><label htmlFor="m-c" className={L}>{tipo === 'AJUSTE' ? 'Cantidad contada (real)' : `Cantidad a ${tipo === 'ENTRADA' ? 'ingresar' : 'sacar'}`} ({item.unidad})</label>
          <input id="m-c" required type="number" inputMode="decimal" min={tipo === 'AJUSTE' ? 0 : 0.001} max={tipo === 'SALIDA' ? item.cantidad : undefined} step="any" autoFocus value={cant} onChange={e => setCant(e.target.value)} className={`${IN} h-14 text-xl`} />
          {cant !== '' && !Number.isNaN(n) && <p className={`mt-1 text-caption ${nuevo < 0 ? 'text-danger-bright' : 'text-steel-400'}`}>{nuevo < 0 ? 'No alcanza el stock.' : `Quedará en ${nf(nuevo)} ${item.unidad}`}{tipo === 'AJUSTE' && n !== item.cantidad && ` (${n > item.cantidad ? '+' : ''}${nf(n - item.cantidad)})`}</p>}</div>
        <div><label htmlFor="m-m" className={L}>{tipo === 'ENTRADA' ? 'Motivo (opcional)' : 'Motivo *'}</label><input id="m-m" required={tipo !== 'ENTRADA'} minLength={tipo === 'ENTRADA' ? undefined : 3} maxLength={200} value={motivo} onChange={e => setMotivo(e.target.value)} className={IN} placeholder={tipo === 'ENTRADA' ? 'Compra, devolución…' : tipo === 'SALIDA' ? 'Uso en obra, entrega, consumo…' : 'Conteo físico, merma, rotura…'} /></div>
        {tipo === 'SALIDA' && <div><label htmlFor="m-d" className={L}>Entregado a / trabajo (opcional)</label><input id="m-d" maxLength={120} value={dest} onChange={e => setDest(e.target.value)} className={IN} /></div>}
        {tipo !== 'AJUSTE' && <div><label htmlFor="m-r" className={L}>Remito o referencia (opcional)</label><input id="m-r" maxLength={80} value={ref} onChange={e => setRef(e.target.value)} className={IN} /></div>}
        <div><span className={L}>Foto (remito, mercadería) — opcional</span><Fotos fotos={foto} onChange={setFoto} max={1} /></div>
        {err && <p role="alert" className="text-caption text-danger-bright">{err}</p>}
        <div className="flex gap-2"><button disabled={enviando || nuevo < 0} className="btn-primary min-h-[44px] flex-1 sm:flex-none">{enviando ? 'Guardando…' : 'Confirmar'}</button><button type="button" onClick={onClose} className="btn-ghost min-h-[44px]">Cancelar</button></div>
      </form>
    </Modal>
  );
}

export function FormTraslado({ item, deps, onClose, onSaved }: { item: Item; deps: Dep[]; onClose: () => void; onSaved: () => void }) {
  const destinos = deps.filter(d => d.activo && d.id !== item.depositoId);
  const [destino, setDestino] = useState(destinos.length === 1 ? destinos[0].id : '');
  const [cant, setCant] = useState(''); const [motivo, setMotivo] = useState('');
  const [err, setErr] = useState(''); const [enviando, setEnviando] = useState(false);
  async function guardar(e: React.FormEvent) {
    e.preventDefault(); setErr(''); setEnviando(true);
    try { await api('/api/depositos/traslados', 'POST', { itemId: item.id, destinoId: destino, cantidad: Number(cant), motivo: motivo || undefined }); onSaved(); } catch (x) { setErr((x as Error).message); setEnviando(false); }
  }
  return (
    <Modal titulo={`Trasladar · ${item.nombre}`} onClose={onClose}>
      <p className="mb-3 text-body-sm text-steel-400">Sale de <b className="text-arctic">{item.deposito}</b> · Stock: <b className="text-arctic">{nf(item.cantidad)} {item.unidad}</b></p>
      {destinos.length === 0 ? <p className="text-body-sm text-orange-bright">No hay otro depósito activo. Creá uno primero.</p> : (
        <form onSubmit={guardar} className="space-y-3">
          <div><label htmlFor="t-d" className={L}>Depósito de destino *</label><select id="t-d" required value={destino} onChange={e => setDestino(e.target.value)} className={IN}><option value="">Elegí el destino…</option>{destinos.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}</select></div>
          <div><label htmlFor="t-c" className={L}>Cantidad ({item.unidad})</label><input id="t-c" required type="number" inputMode="decimal" min={0.001} max={item.cantidad} step="any" autoFocus value={cant} onChange={e => setCant(e.target.value)} className={`${IN} h-14 text-xl`} /></div>
          <div><label htmlFor="t-m" className={L}>Motivo (opcional)</label><input id="t-m" maxLength={200} value={motivo} onChange={e => setMotivo(e.target.value)} className={IN} placeholder="Reposición de obra…" /></div>
          <p className="text-caption text-steel-500">El stock sale ahora y queda <b>en tránsito</b> hasta que el depósito de destino confirme la recepción.</p>
          {err && <p role="alert" className="text-caption text-danger-bright">{err}</p>}
          <div className="flex gap-2"><button disabled={enviando || Number(cant) > item.cantidad} className="btn-primary min-h-[44px] flex-1 sm:flex-none">{enviando ? 'Enviando…' : 'Enviar traslado'}</button><button type="button" onClick={onClose} className="btn-ghost min-h-[44px]">Cancelar</button></div>
        </form>)}
    </Modal>
  );
}
