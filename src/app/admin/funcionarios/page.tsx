'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, UserX, X, Link2, Search, ScanFace } from 'lucide-react';
import { FaceCapture } from '@/components/marcacion/face-capture';
import { ROLE_LABELS } from '@/lib/roles';
import type { Role } from '@/lib/roles';
import type { FuncionarioDTO } from '@/lib/funcionarios-store';

interface UsuarioLibre { id: string; email: string; name: string; role: string }
interface Form { nombre: string; documento: string; cargo: string; telefono: string; email: string; fechaIngreso: string; fechaEgreso: string; userId: string; notas: string; isActive: boolean }
const VACIO: Form = { nombre: '', documento: '', cargo: '', telefono: '', email: '', fechaIngreso: '', fechaEgreso: '', userId: '', notas: '', isActive: true };

const fmt = (f: string | null) => (f ? f.split('-').reverse().join('/') : '—');
const antTxt = (a: { anios: number; meses: number }) => (a.anios ? `${a.anios} año${a.anios > 1 ? 's' : ''}${a.meses ? ` ${a.meses} m` : ''}` : `${a.meses} mes${a.meses === 1 ? '' : 'es'}`);

export default function FuncionariosPage() {
  const [items, setItems] = useState<FuncionarioDTO[]>([]);
  const [libres, setLibres] = useState<UsuarioLibre[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [verBajas, setVerBajas] = useState(false);
  const [form, setForm] = useState<Form | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editUser, setEditUser] = useState<UsuarioLibre | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [enrolar, setEnrolar] = useState<FuncionarioDTO | null>(null);
  const [consentido, setConsentido] = useState(false);
  const [camara, setCamara] = useState(false);
  const [enrolMsg, setEnrolMsg] = useState('');

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/funcionarios', { cache: 'no-store' });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? 'Error al cargar');
      setItems(d.funcionarios); setLibres(d.usuariosLibres);
    } catch (e) { setError(e instanceof Error ? e.message : 'Error'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { cargar(); }, [cargar]);

  const visibles = useMemo(() => items.filter(f => (verBajas || f.isActive) && `${f.nombre} ${f.documento ?? ''} ${f.cargo}`.toLowerCase().includes(q.toLowerCase())), [items, q, verBajas]);
  const activos = items.filter(f => f.isActive);
  const sinUsuario = activos.filter(f => !f.userId).length;

  function abrir(f?: FuncionarioDTO) {
    setError('');
    setEditId(f?.id ?? null);
    setEditUser(f?.usuario && f.userId ? { id: f.userId, ...f.usuario } : null);
    setForm(f ? { nombre: f.nombre, documento: f.documento ?? '', cargo: f.cargo, telefono: f.telefono, email: f.email, fechaIngreso: f.fechaIngreso, fechaEgreso: f.fechaEgreso ?? '', userId: f.userId ?? '', notas: f.notas, isActive: f.isActive } : { ...VACIO });
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaving(true); setError('');
    try {
      const body = { ...form, documento: form.documento || null, fechaEgreso: form.fechaEgreso || null, userId: form.userId || null };
      const r = await fetch(editId ? `/api/funcionarios/${editId}` : '/api/funcionarios', { method: editId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error ?? 'No se pudo guardar');
      setForm(null); await cargar();
    } catch (er) { setError(er instanceof Error ? er.message : 'Error'); }
    finally { setSaving(false); }
  }

  async function baja(f: FuncionarioDTO) {
    if (!window.confirm(`¿Dar de baja a ${f.nombre}? Se conserva su historial y podés reactivarlo después.`)) return;
    const r = await fetch(`/api/funcionarios/${f.id}`, { method: 'DELETE' });
    if (!r.ok) setError((await r.json().catch(() => ({}))).error ?? 'Error'); else await cargar();
  }

  async function guardarRostro(huellas: number[][]) {
    if (!enrolar?.userId) return;
    setCamara(false); setEnrolMsg('Guardando…');
    const r = await fetch('/api/marcacion/rostro', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: enrolar.userId, vectores: huellas }) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) { setEnrolMsg(d.error ?? 'No se pudo guardar'); return; }
    setEnrolar(null); setConsentido(false); setEnrolMsg(''); await cargar();
  }
  async function quitarRostro(f: FuncionarioDTO) {
    if (!f.userId || !window.confirm(`¿Borrar la huella facial de ${f.nombre}? Tendrá que enrolarse de nuevo.`)) return;
    await fetch(`/api/marcacion/rostro?userId=${encodeURIComponent(f.userId)}`, { method: 'DELETE' });
    await cargar();
  }

  const set = (k: keyof Form, v: string | boolean) => setForm(s => (s ? { ...s, [k]: v } : s));
  const usuarioOpciones = editUser ? [editUser, ...libres] : libres;

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-h1 text-arctic">Funcionarios</h1>
          <p className="font-body text-body-sm text-steel-400">Personal con fecha de ingreso. De ahí se calcula la antigüedad y los días de vacaciones.</p>
        </div>
        <button onClick={() => abrir()} className="btn-primary"><Plus className="h-4 w-4" /> Nuevo funcionario</button>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[[activos.length, 'Activos'], [activos.length - sinUsuario, 'Con usuario del sistema'], [sinUsuario, 'Sin usuario enlazado']].map(([n, l]) => (
          <div key={String(l)} className="card p-4"><div className="font-display text-h1 text-arctic">{n}</div><div className="font-body text-caption text-steel-400">{l}</div></div>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-steel-500" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar por nombre, CI o cargo" aria-label="Buscar funcionario" className="input w-full pl-9" />
        </div>
        <label className="flex min-h-11 items-center gap-2 font-body text-body-sm text-steel-300">
          <input type="checkbox" checked={verBajas} onChange={e => setVerBajas(e.target.checked)} className="h-4 w-4" /> Mostrar bajas
        </label>
      </div>

      {error && !form && <p role="alert" className="mb-3 rounded-md bg-danger-light/10 px-3 py-2 font-body text-caption text-danger-bright">{error}</p>}

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[960px] text-left font-body text-body-sm">
          <thead>
            <tr className="border-b border-steel-700 text-caption text-steel-400">
              {['Funcionario', 'Cargo', 'Ingreso', 'Antigüedad', 'Vacaciones', 'Usuario del sistema', 'Rostro', ''].map(h => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={8} className="px-4 py-6 text-steel-400">Cargando…</td></tr>}
            {!loading && visibles.length === 0 && <tr><td colSpan={8} className="px-4 py-8 text-center text-steel-400">{items.length === 0 ? 'Todavía no hay funcionarios. Cargá el primero con “Nuevo funcionario”.' : 'Sin resultados.'}</td></tr>}
            {visibles.map(f => (
              <tr key={f.id} className={`border-b border-steel-700/60 ${f.isActive ? '' : 'opacity-60'}`}>
                <td className="px-4 py-3"><div className="font-medium text-arctic">{f.nombre}</div><div className="text-caption text-steel-400">{f.documento ? `CI ${f.documento}` : 'Sin documento'}{f.isActive ? '' : ` · Baja ${fmt(f.fechaEgreso)}`}</div></td>
                <td className="px-4 py-3 text-steel-300">{f.cargo || '—'}</td>
                <td className="px-4 py-3 text-steel-300">{fmt(f.fechaIngreso)}</td>
                <td className="px-4 py-3 text-arctic">{antTxt(f.antiguedad)}{f.antiguedad.proximoTramo && f.isActive && <div className="text-caption text-steel-400">Próximo tramo: {fmt(f.antiguedad.proximoTramo)}</div>}</td>
                <td className="px-4 py-3 text-steel-300">{f.diasVacaciones} días</td>
                <td className="px-4 py-3">{f.usuario ? <span className="inline-flex items-center gap-1.5 text-steel-300"><Link2 className="h-3.5 w-3.5 text-success-bright" />{f.usuario.name}<span className="text-caption text-steel-400">· {ROLE_LABELS[f.usuario.role as Role] ?? f.usuario.role}</span></span> : <span className="text-steel-400">Sin enlazar</span>}</td>
                <td className="px-4 py-3">{!f.userId ? <span className="text-caption text-steel-400">Enlazá un usuario</span> : f.rostro.enrolado
                  ? <span className="inline-flex items-center gap-1.5 text-steel-300"><ScanFace className="h-4 w-4 text-success-bright" />Enrolado {fmt(f.rostro.fecha)}</span>
                  : <span className="text-steel-400">Sin enrolar</span>}
                  {f.userId && f.isActive && <div className="mt-1 flex gap-3 text-caption">
                    <button onClick={() => { setEnrolar(f); setConsentido(false); setEnrolMsg(''); }} className="text-blue-bright hover:underline">{f.rostro.enrolado ? 'Volver a enrolar' : 'Enrolar rostro'}</button>
                    {f.rostro.enrolado && <button onClick={() => quitarRostro(f)} className="text-steel-400 hover:text-danger-bright">Borrar</button>}
                  </div>}
                </td>
                <td className="px-4 py-3"><div className="flex justify-end gap-1">
                  <button onClick={() => abrir(f)} aria-label={`Editar ${f.nombre}`} className="rounded p-2 text-steel-400 hover:text-arctic"><Pencil className="h-4 w-4" /></button>
                  {f.isActive && <button onClick={() => baja(f)} aria-label={`Dar de baja a ${f.nombre}`} className="rounded p-2 text-steel-400 hover:text-danger-bright"><UserX className="h-4 w-4" /></button>}
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {enrolar && (
        <div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-carbon/70 px-4 py-8 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Enrolar rostro">
          <div className="card w-full max-w-md space-y-4 p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-h3 text-arctic">Enrolar rostro</h2>
              <button type="button" onClick={() => setEnrolar(null)} aria-label="Cerrar" className="rounded p-1 text-steel-500 hover:text-arctic"><X className="h-5 w-5" /></button>
            </div>
            <p className="font-body text-body-sm text-steel-300">{enrolar.nombre}</p>
            <p className="font-body text-caption text-steel-400">Se toman 3 capturas de frente con la cámara de este dispositivo, con la persona presente y buena luz. <b>No se guarda ninguna imagen</b>: solo una huella numérica con la que se compara cada ingreso y salida. La huella se borra al dar de baja al funcionario.</p>
            <label className="flex items-start gap-2 font-body text-body-sm text-steel-300"><input type="checkbox" checked={consentido} onChange={e => setConsentido(e.target.checked)} className="mt-1 h-4 w-4" /> La persona dio su consentimiento para registrar su huella facial.</label>
            {enrolMsg && <p role="alert" className="rounded-md bg-danger-light/10 px-3 py-2 font-body text-caption text-danger-bright">{enrolMsg}</p>}
            <div className="flex gap-2">
              <button disabled={!consentido} onClick={() => { setEnrolMsg(''); setCamara(true); }} className="btn-primary flex-1 justify-center disabled:opacity-50">Abrir cámara</button>
              <button onClick={() => setEnrolar(null)} className="btn-ghost flex-1 justify-center">Cancelar</button>
            </div>
          </div>
        </div>
      )}
      {camara && enrolar && <FaceCapture modo="enrolar" titulo={`Enrolar a ${enrolar.nombre}`} onHuellas={guardarRostro} onCancel={() => setCamara(false)} />}

      {form && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-carbon/70 px-4 py-8 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={editId ? 'Editar funcionario' : 'Nuevo funcionario'}>
          <form onSubmit={guardar} className="card w-full max-w-xl space-y-4 p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-h3 text-arctic">{editId ? 'Editar funcionario' : 'Nuevo funcionario'}</h2>
              <button type="button" onClick={() => setForm(null)} aria-label="Cerrar" className="rounded p-1 text-steel-500 hover:text-arctic"><X className="h-5 w-5" /></button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2"><label htmlFor="f-nombre" className="mb-1 block font-body text-caption text-steel-400">Nombre completo *</label><input id="f-nombre" required maxLength={120} value={form.nombre} onChange={e => set('nombre', e.target.value)} className="input w-full" /></div>
              <div><label htmlFor="f-doc" className="mb-1 block font-body text-caption text-steel-400">Documento (CI)</label><input id="f-doc" maxLength={30} value={form.documento} onChange={e => set('documento', e.target.value)} className="input w-full" /></div>
              <div><label htmlFor="f-cargo" className="mb-1 block font-body text-caption text-steel-400">Cargo</label><input id="f-cargo" maxLength={80} value={form.cargo} onChange={e => set('cargo', e.target.value)} className="input w-full" /></div>
              <div><label htmlFor="f-ing" className="mb-1 block font-body text-caption text-steel-400">Fecha de ingreso *</label><input id="f-ing" type="date" required value={form.fechaIngreso} max={new Date().toISOString().slice(0, 10)} onChange={e => set('fechaIngreso', e.target.value)} className="input w-full" /></div>
              <div><label htmlFor="f-egr" className="mb-1 block font-body text-caption text-steel-400">Fecha de egreso</label><input id="f-egr" type="date" value={form.fechaEgreso} min={form.fechaIngreso} onChange={e => set('fechaEgreso', e.target.value)} className="input w-full" /></div>
              <div><label htmlFor="f-tel" className="mb-1 block font-body text-caption text-steel-400">Teléfono</label><input id="f-tel" maxLength={40} value={form.telefono} onChange={e => set('telefono', e.target.value)} className="input w-full" /></div>
              <div><label htmlFor="f-mail" className="mb-1 block font-body text-caption text-steel-400">Correo</label><input id="f-mail" type="email" maxLength={254} value={form.email} onChange={e => set('email', e.target.value)} className="input w-full" /></div>
              <div className="sm:col-span-2">
                <label htmlFor="f-user" className="mb-1 block font-body text-caption text-steel-400">Usuario del sistema</label>
                <select id="f-user" value={form.userId} onChange={e => set('userId', e.target.value)} className="input w-full">
                  <option value="">Sin enlazar</option>
                  {usuarioOpciones.map(u => <option key={u.id} value={u.id}>{u.name} · {u.email}</option>)}
                </select>
                <p className="mt-1 font-body text-caption text-steel-500">Al enlazarlo, su antigüedad se usa en las vacaciones y en el reporte de marcaciones. Solo aparecen usuarios sin funcionario.</p>
              </div>
              <div className="sm:col-span-2"><label htmlFor="f-notas" className="mb-1 block font-body text-caption text-steel-400">Notas</label><textarea id="f-notas" rows={2} maxLength={500} value={form.notas} onChange={e => set('notas', e.target.value)} className="input w-full" /></div>
              {editId && <label className="flex min-h-11 items-center gap-2 font-body text-body-sm text-steel-300 sm:col-span-2"><input type="checkbox" checked={form.isActive} onChange={e => set('isActive', e.target.checked)} className="h-4 w-4" /> Activo</label>}
            </div>
            {error && <p role="alert" className="rounded-md bg-danger-light/10 px-3 py-2 font-body text-caption text-danger-bright">{error}</p>}
            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center disabled:opacity-50">{saving ? 'Guardando…' : 'Guardar'}</button>
              <button type="button" onClick={() => setForm(null)} className="btn-ghost flex-1 justify-center">Cancelar</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
