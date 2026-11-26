'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Trash2, ExternalLink } from 'lucide-react';
import type { FuncionarioDTO } from '@/lib/funcionarios-store';
import { ESTADOS_CIVILES, TIPOS_CONTRATO, TIPO_CONTRATO_LABEL, TIPOS_DOCUMENTO, TIPO_DOCUMENTO_LABEL, estadoVencimiento, fmtFecha, fmtGs } from '@/lib/rrhh/shared';
import type { EppCatalogoItem } from '@/lib/rrhh/shared';

interface Cargo { id: string; cargo: string; area: string; desde: string; hasta: string | null; notas: string }
interface Salario { id: string; vigenteDesde: string; tipo: 'MENSUAL' | 'JORNAL'; monto: number; notas: string; creadoPor: string }
interface Doc { id: string; tipo: keyof typeof TIPO_DOCUMENTO_LABEL; nombre: string; url: string; vence: string | null; notas: string }
interface Epp { id: string; item: string; cantidad: number; talle: string; fechaEntrega: string; vence: string | null; observacion: string }
interface Cap { id: string; nombre: string; fecha: string; horas: number; entidad: string; vence: string | null; certificadoUrl: string | null; notas: string }
interface Legajo { funcionario: FuncionarioDTO; usuariosLibres: { id: string; email: string; name: string }[]; cargos: Cargo[]; salarios: Salario[]; documentos: Doc[]; epp: Epp[]; capacitaciones: Cap[]; config: { eppCatalogo: EppCatalogoItem[]; alertaDias: number } }

const TABS = ['Datos', 'Cargos y salario', 'Documentos', 'EPP', 'Capacitaciones'] as const;
const hoyIso = () => new Date().toISOString().slice(0, 10);
const L = 'mb-1 block font-body text-caption text-steel-400';

async function api(url: string, method: string, body?: unknown) {
  const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error ?? 'No se pudo guardar');
  return d;
}
async function subir(file: File): Promise<string> {
  const fd = new FormData(); fd.append('file', file);
  const r = await fetch('/api/rrhh/upload', { method: 'POST', body: fd });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error ?? 'No se pudo subir el archivo');
  return d.url;
}
function Badge({ vence, alerta }: { vence: string | null; alerta: number }) {
  const e = estadoVencimiento(vence, hoyIso(), alerta);
  if (!e) return <span className="text-steel-500">Sin vencimiento</span>;
  return <span className={`rounded-full px-2 py-0.5 text-caption ${e === 'VENCIDO' ? 'bg-danger-light/20 text-danger-bright' : e === 'POR_VENCER' ? 'bg-orange-muted text-orange-bright' : 'bg-success-light/20 text-success-bright'}`}>{e === 'VENCIDO' ? 'Vencido' : e === 'POR_VENCER' ? 'Vence' : 'Vigente'} {fmtFecha(vence)}</span>;
}

export default function LegajoPage({ params }: { params: { id: string } }) {
  const [d, setD] = useState<Legajo | null>(null);
  const [tab, setTab] = useState<(typeof TABS)[number]>('Datos');
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [busy, setBusy] = useState(false);

  const cargar = useCallback(async () => {
    try { const r = await fetch(`/api/rrhh/legajo/${params.id}`, { cache: 'no-store' }); const j = await r.json(); if (!r.ok) throw new Error(j.error ?? 'Error'); setD(j); }
    catch (e) { setError(e instanceof Error ? e.message : 'Error'); }
  }, [params.id]);
  useEffect(() => { cargar(); }, [cargar]);

  const run = async (fn: () => Promise<unknown>, msg = 'Guardado') => {
    setBusy(true); setError(''); setOk('');
    try { await fn(); await cargar(); setOk(msg); } catch (e) { setError(e instanceof Error ? e.message : 'Error'); } finally { setBusy(false); }
  };

  if (!d) return <div className="p-6 text-steel-400">{error || 'Cargando…'}</div>;
  const f = d.funcionario;
  const salarioActual = d.salarios.find(s => s.vigenteDesde <= hoyIso());

  return (
    <div className="p-4 sm:p-6">
      <Link href="/admin/funcionarios" className="mb-3 inline-flex items-center gap-1 text-body-sm text-steel-400 hover:text-arctic"><ArrowLeft className="h-4 w-4" />Funcionarios</Link>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-h1 text-arctic">{f.nombre}</h1>
          <p className="font-body text-body-sm text-steel-400">{f.cargo || 'Sin cargo'}{f.area ? ` · ${f.area}` : ''} · Ingreso {fmtFecha(f.fechaIngreso)} · {f.antiguedad.anios} años {f.antiguedad.meses} m{f.isActive ? '' : ` · Baja ${fmtFecha(f.fechaEgreso)}`}</p>
        </div>
        {salarioActual && <div className="card px-4 py-2 text-right"><div className="font-display text-h3 text-arctic">{fmtGs(salarioActual.monto)}</div><div className="text-caption text-steel-400">{salarioActual.tipo === 'MENSUAL' ? 'Sueldo mensual' : 'Jornal'}</div></div>}
      </div>

      <div className="mb-5 flex flex-wrap gap-2" role="tablist">
        {TABS.map(t => <button key={t} role="tab" aria-selected={tab === t} onClick={() => { setTab(t); setError(''); setOk(''); }} className={`min-h-10 rounded-lg border px-4 text-body-sm ${tab === t ? 'border-blue bg-blue-muted text-blue-bright' : 'border-steel-700 text-steel-300 hover:text-arctic'}`}>{t}</button>)}
      </div>
      {error && <p role="alert" className="mb-3 rounded-md bg-danger-light/10 px-3 py-2 text-caption text-danger-bright">{error}</p>}
      {ok && <p role="status" className="mb-3 rounded-md bg-success-light/10 px-3 py-2 text-caption text-success-bright">{ok}</p>}

      {tab === 'Datos' && <DatosTab f={f} libres={d.usuariosLibres} busy={busy} onSave={body => run(() => api(`/api/funcionarios/${f.id}`, 'PUT', body))} />}
      {tab === 'Cargos y salario' && <CargosTab d={d} busy={busy} run={run} />}
      {tab === 'Documentos' && <DocsTab d={d} busy={busy} run={run} />}
      {tab === 'EPP' && <EppTab d={d} busy={busy} run={run} />}
      {tab === 'Capacitaciones' && <CapsTab d={d} busy={busy} run={run} />}
    </div>
  );
}

type Run = (fn: () => Promise<unknown>, msg?: string) => Promise<void>;
const Tabla = ({ cols, children }: { cols: string[]; children: React.ReactNode }) => (
  <div className="card mb-5 overflow-x-auto"><table className="w-full min-w-[560px] text-left font-body text-body-sm text-steel-100"><thead><tr className="border-b border-steel-700 text-caption text-steel-400">{cols.map(c => <th key={c} className="px-4 py-3 font-medium">{c}</th>)}</tr></thead><tbody>{children}</tbody></table></div>
);
const Vacio = ({ n, t }: { n: number; t: string }) => (n === 0 ? <tr><td colSpan={9} className="px-4 py-6 text-center text-steel-400">{t}</td></tr> : null);
const Borrar = ({ onClick, label }: { onClick: () => void; label: string }) => <button onClick={onClick} aria-label={label} className="rounded p-2 text-steel-400 hover:text-danger-bright"><Trash2 className="h-4 w-4" /></button>;

function DatosTab({ f, libres, busy, onSave }: { f: FuncionarioDTO; libres: { id: string; email: string; name: string }[]; busy: boolean; onSave: (b: object) => void }) {
  const [s, setS] = useState({ ...f, userId: f.userId ?? '', documento: f.documento ?? '', fechaEgreso: f.fechaEgreso ?? '', fechaNacimiento: f.fechaNacimiento ?? '' });
  const set = (k: string, v: string | number | boolean) => setS(x => ({ ...x, [k]: v }));
  const inp = (k: keyof typeof s, label: string, type = 'text', extra: object = {}) => (
    <div><label htmlFor={`d-${k}`} className={L}>{label}</label><input id={`d-${k}`} type={type} value={String(s[k] ?? '')} onChange={e => set(k, type === 'number' ? Number(e.target.value) : e.target.value)} className="input w-full" {...extra} /></div>
  );
  const guardar = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ nombre: s.nombre, documento: s.documento || null, cargo: s.cargo, telefono: s.telefono, email: s.email, fechaIngreso: s.fechaIngreso, fechaEgreso: s.fechaEgreso || null, userId: s.userId || null, notas: s.notas, isActive: s.isActive,
      area: s.area, tipoContrato: s.tipoContrato, fechaNacimiento: s.fechaNacimiento || null, estadoCivil: s.estadoCivil, hijosMenores: s.hijosMenores, direccion: s.direccion, ciudad: s.ciudad, ipsNumero: s.ipsNumero, banco: s.banco, cuentaBancaria: s.cuentaBancaria,
      emergenciaNombre: s.emergenciaNombre, emergenciaParentesco: s.emergenciaParentesco, emergenciaTelefono: s.emergenciaTelefono });
  };
  return (
    <form onSubmit={guardar} className="space-y-6">
      <section className="card p-5"><h2 className="mb-4 font-display text-h3 text-arctic">Datos laborales</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {inp('nombre', 'Nombre completo *', 'text', { required: true, maxLength: 120 })}{inp('documento', 'Documento (CI)')}{inp('cargo', 'Cargo vigente')}{inp('area', 'Área')}
          <div><label htmlFor="d-tc" className={L}>Tipo de contrato</label><select id="d-tc" value={s.tipoContrato} onChange={e => set('tipoContrato', e.target.value)} className="input w-full">{TIPOS_CONTRATO.map(t => <option key={t} value={t}>{TIPO_CONTRATO_LABEL[t]}</option>)}</select></div>
          {inp('fechaIngreso', 'Fecha de ingreso *', 'date', { required: true })}{inp('fechaEgreso', 'Fecha de egreso', 'date')}{inp('ipsNumero', 'Nº de IPS')}
          <div className="sm:col-span-2 lg:col-span-3"><label htmlFor="d-user" className={L}>Usuario del sistema</label><select id="d-user" value={s.userId} onChange={e => set('userId', e.target.value)} className="input w-full"><option value="">Sin enlazar</option>{libres.map(u => <option key={u.id} value={u.id}>{u.name} · {u.email}</option>)}</select></div>
        </div></section>
      <section className="card p-5"><h2 className="mb-4 font-display text-h3 text-arctic">Datos personales</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {inp('fechaNacimiento', 'Fecha de nacimiento', 'date')}
          <div><label htmlFor="d-ec" className={L}>Estado civil</label><select id="d-ec" value={s.estadoCivil} onChange={e => set('estadoCivil', e.target.value)} className="input w-full">{ESTADOS_CIVILES.map(x => <option key={x} value={x}>{x || 'Sin indicar'}</option>)}</select></div>
          {inp('hijosMenores', 'Hijos menores de 18', 'number', { min: 0, max: 30 })}
          {inp('telefono', 'Teléfono')}{inp('email', 'Correo', 'email')}{inp('ciudad', 'Ciudad')}
          <div className="sm:col-span-2 lg:col-span-3">{inp('direccion', 'Dirección')}</div>
        </div></section>
      <section className="card p-5"><h2 className="mb-4 font-display text-h3 text-arctic">Contacto de emergencia y datos bancarios</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {inp('emergenciaNombre', 'Contacto de emergencia')}{inp('emergenciaParentesco', 'Parentesco')}{inp('emergenciaTelefono', 'Teléfono de emergencia')}
          {inp('banco', 'Banco')}{inp('cuentaBancaria', 'Cuenta bancaria')}
        </div>
        <div className="mt-4"><label htmlFor="d-notas" className={L}>Notas</label><textarea id="d-notas" rows={2} maxLength={500} value={s.notas} onChange={e => set('notas', e.target.value)} className="input w-full" /></div>
        <label className="mt-3 flex min-h-11 items-center gap-2 text-body-sm text-steel-300"><input type="checkbox" checked={s.isActive} onChange={e => set('isActive', e.target.checked)} className="h-4 w-4" />Activo</label>
      </section>
      <button disabled={busy} className="btn-primary disabled:opacity-50">{busy ? 'Guardando…' : 'Guardar datos'}</button>
    </form>
  );
}

function CargosTab({ d, busy, run }: { d: Legajo; busy: boolean; run: Run }) {
  const [c, setC] = useState({ cargo: '', area: '', desde: hoyIso(), notas: '' });
  const [s, setS] = useState({ vigenteDesde: hoyIso(), tipo: 'MENSUAL', monto: '', notas: '' });
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section>
        <h2 className="mb-2 font-display text-h3 text-arctic">Historial de cargos</h2>
        <Tabla cols={['Cargo', 'Desde', 'Hasta', '']}>
          <Vacio n={d.cargos.length} t="Sin cargos registrados." />
          {d.cargos.map(x => <tr key={x.id} className="border-b border-steel-700/60"><td className="px-4 py-3 text-arctic">{x.cargo}<div className="text-caption text-steel-400">{x.area}</div></td><td className="px-4 py-3">{fmtFecha(x.desde)}</td><td className="px-4 py-3">{x.hasta ? fmtFecha(x.hasta) : 'Actual'}</td><td className="px-2"><Borrar label="Quitar cargo" onClick={() => window.confirm('¿Quitar este registro?') && run(() => api(`/api/rrhh/cargos?id=${x.id}`, 'DELETE'), 'Quitado')} /></td></tr>)}
        </Tabla>
        <form className="card space-y-3 p-4" onSubmit={e => { e.preventDefault(); run(() => api('/api/rrhh/cargos', 'POST', { funcionarioId: d.funcionario.id, ...c }), 'Cargo registrado').then(() => setC({ cargo: '', area: '', desde: hoyIso(), notas: '' })); }}>
          <h3 className="font-body text-body font-medium text-arctic">Registrar cambio de cargo</h3>
          <div className="grid gap-3 sm:grid-cols-2"><div><label htmlFor="c-cargo" className={L}>Nuevo cargo *</label><input id="c-cargo" required value={c.cargo} onChange={e => setC({ ...c, cargo: e.target.value })} className="input w-full" /></div>
            <div><label htmlFor="c-area" className={L}>Área</label><input id="c-area" value={c.area} onChange={e => setC({ ...c, area: e.target.value })} className="input w-full" /></div>
            <div><label htmlFor="c-desde" className={L}>Desde *</label><input id="c-desde" type="date" required value={c.desde} onChange={e => setC({ ...c, desde: e.target.value })} className="input w-full" /></div>
            <div><label htmlFor="c-notas" className={L}>Notas</label><input id="c-notas" value={c.notas} onChange={e => setC({ ...c, notas: e.target.value })} className="input w-full" /></div></div>
          <button disabled={busy} className="btn-primary disabled:opacity-50">Registrar cargo</button>
        </form>
      </section>
      <section>
        <h2 className="mb-2 font-display text-h3 text-arctic">Historial salarial</h2>
        <Tabla cols={['Vigente desde', 'Tipo', 'Monto', '']}>
          <Vacio n={d.salarios.length} t="Sin salario cargado. Sin esto no se puede liquidar la planilla." />
          {d.salarios.map(x => <tr key={x.id} className="border-b border-steel-700/60"><td className="px-4 py-3 text-arctic">{fmtFecha(x.vigenteDesde)}{x.notas && <div className="text-caption text-steel-400">{x.notas}</div>}</td><td className="px-4 py-3">{x.tipo === 'MENSUAL' ? 'Mensual' : 'Jornal'}</td><td className="px-4 py-3 text-arctic">{fmtGs(x.monto)}</td><td className="px-2"><Borrar label="Quitar salario" onClick={() => window.confirm('¿Quitar este salario del historial?') && run(() => api(`/api/rrhh/salarios?id=${x.id}`, 'DELETE'), 'Quitado')} /></td></tr>)}
        </Tabla>
        <form className="card space-y-3 p-4" onSubmit={e => { e.preventDefault(); run(() => api('/api/rrhh/salarios', 'POST', { funcionarioId: d.funcionario.id, vigenteDesde: s.vigenteDesde, tipo: s.tipo, monto: Math.round(Number(s.monto.replace(/\D/g, ''))), notas: s.notas }), 'Salario registrado').then(() => setS({ ...s, monto: '', notas: '' })); }}>
          <h3 className="font-body text-body font-medium text-arctic">Registrar salario o aumento</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><label htmlFor="s-tipo" className={L}>Tipo</label><select id="s-tipo" value={s.tipo} onChange={e => setS({ ...s, tipo: e.target.value })} className="input w-full"><option value="MENSUAL">Sueldo mensual</option><option value="JORNAL">Jornal (por día)</option></select></div>
            <div><label htmlFor="s-monto" className={L}>Monto en guaraníes *</label><input id="s-monto" required inputMode="numeric" value={s.monto} onChange={e => setS({ ...s, monto: e.target.value })} placeholder="Ej: 3000000" className="input w-full" /></div>
            <div><label htmlFor="s-desde" className={L}>Vigente desde *</label><input id="s-desde" type="date" required value={s.vigenteDesde} onChange={e => setS({ ...s, vigenteDesde: e.target.value })} className="input w-full" /></div>
            <div><label htmlFor="s-notas" className={L}>Notas</label><input id="s-notas" value={s.notas} onChange={e => setS({ ...s, notas: e.target.value })} className="input w-full" /></div>
          </div>
          <button disabled={busy} className="btn-primary disabled:opacity-50">Registrar salario</button>
        </form>
      </section>
    </div>
  );
}

function DocsTab({ d, busy, run }: { d: Legajo; busy: boolean; run: Run }) {
  const [x, setX] = useState({ tipo: 'CONTRATO', nombre: '', vence: '', notas: '' });
  const [file, setFile] = useState<File | null>(null);
  return (
    <div>
      <Tabla cols={['Documento', 'Tipo', 'Vencimiento', 'Archivo', '']}>
        <Vacio n={d.documentos.length} t="Sin documentos cargados." />
        {d.documentos.map(o => <tr key={o.id} className="border-b border-steel-700/60"><td className="px-4 py-3 text-arctic">{o.nombre}{o.notas && <div className="text-caption text-steel-400">{o.notas}</div>}</td><td className="px-4 py-3">{TIPO_DOCUMENTO_LABEL[o.tipo]}</td><td className="px-4 py-3"><Badge vence={o.vence} alerta={d.config.alertaDias} /></td>
          <td className="px-4 py-3"><a href={o.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-blue-bright hover:underline">Abrir<ExternalLink className="h-3.5 w-3.5" /></a></td><td className="px-2"><Borrar label="Quitar documento" onClick={() => window.confirm('¿Quitar este documento?') && run(() => api(`/api/rrhh/documentos?id=${o.id}`, 'DELETE'), 'Quitado')} /></td></tr>)}
      </Tabla>
      <form className="card max-w-2xl space-y-3 p-4" onSubmit={e => { e.preventDefault(); if (!file) return; run(async () => { const url = await subir(file); await api('/api/rrhh/documentos', 'POST', { funcionarioId: d.funcionario.id, tipo: x.tipo, nombre: x.nombre, url, vence: x.vence || null, notas: x.notas }); setFile(null); setX({ tipo: 'CONTRATO', nombre: '', vence: '', notas: '' }); }, 'Documento agregado'); }}>
        <h3 className="font-body text-body font-medium text-arctic">Agregar documento</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><label htmlFor="x-tipo" className={L}>Tipo</label><select id="x-tipo" value={x.tipo} onChange={e => setX({ ...x, tipo: e.target.value })} className="input w-full">{TIPOS_DOCUMENTO.map(t => <option key={t} value={t}>{TIPO_DOCUMENTO_LABEL[t]}</option>)}</select></div>
          <div><label htmlFor="x-nombre" className={L}>Nombre *</label><input id="x-nombre" required maxLength={120} value={x.nombre} onChange={e => setX({ ...x, nombre: e.target.value })} className="input w-full" /></div>
          <div><label htmlFor="x-vence" className={L}>Vence (opcional)</label><input id="x-vence" type="date" value={x.vence} onChange={e => setX({ ...x, vence: e.target.value })} className="input w-full" /></div>
          <div><label htmlFor="x-file" className={L}>Archivo (PDF o imagen, hasta 4 MB) *</label><input id="x-file" type="file" required accept="application/pdf,image/*" onChange={e => setFile(e.target.files?.[0] ?? null)} className="input w-full" /></div>
        </div>
        <button disabled={busy || !file} className="btn-primary disabled:opacity-50">{busy ? 'Subiendo…' : 'Agregar documento'}</button>
      </form>
    </div>
  );
}

function EppTab({ d, busy, run }: { d: Legajo; busy: boolean; run: Run }) {
  const [x, setX] = useState({ item: d.config.eppCatalogo[0]?.key ?? '', cantidad: 1, talle: '', fechaEntrega: hoyIso(), observacion: '' });
  const label = (k: string) => d.config.eppCatalogo.find(i => i.key === k)?.label ?? k;
  return (
    <div>
      <Tabla cols={['Ítem', 'Cantidad / talle', 'Entregado', 'Reposición', '']}>
        <Vacio n={d.epp.length} t="Sin entregas de EPP registradas." />
        {d.epp.map(o => <tr key={o.id} className="border-b border-steel-700/60"><td className="px-4 py-3 text-arctic">{label(o.item)}{o.observacion && <div className="text-caption text-steel-400">{o.observacion}</div>}</td><td className="px-4 py-3">{o.cantidad}{o.talle ? ` · talle ${o.talle}` : ''}</td><td className="px-4 py-3">{fmtFecha(o.fechaEntrega)}</td><td className="px-4 py-3"><Badge vence={o.vence} alerta={d.config.alertaDias} /></td><td className="px-2"><Borrar label="Quitar entrega" onClick={() => window.confirm('¿Quitar esta entrega?') && run(() => api(`/api/rrhh/epp?id=${o.id}`, 'DELETE'), 'Quitado')} /></td></tr>)}
      </Tabla>
      <form className="card max-w-2xl space-y-3 p-4" onSubmit={e => { e.preventDefault(); run(() => api('/api/rrhh/epp', 'POST', { funcionarioId: d.funcionario.id, ...x }), 'Entrega registrada'); }}>
        <h3 className="font-body text-body font-medium text-arctic">Registrar entrega</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><label htmlFor="e-item" className={L}>Ítem</label><select id="e-item" value={x.item} onChange={e => setX({ ...x, item: e.target.value })} className="input w-full">{d.config.eppCatalogo.map(i => <option key={i.key} value={i.key}>{i.label}{i.vidaUtilMeses ? ` (repone cada ${i.vidaUtilMeses} m)` : ''}</option>)}</select></div>
          <div><label htmlFor="e-fecha" className={L}>Fecha de entrega *</label><input id="e-fecha" type="date" required value={x.fechaEntrega} onChange={e => setX({ ...x, fechaEntrega: e.target.value })} className="input w-full" /></div>
          <div><label htmlFor="e-cant" className={L}>Cantidad</label><input id="e-cant" type="number" min={1} max={100} value={x.cantidad} onChange={e => setX({ ...x, cantidad: Number(e.target.value) })} className="input w-full" /></div>
          <div><label htmlFor="e-talle" className={L}>Talle / medida</label><input id="e-talle" maxLength={20} value={x.talle} onChange={e => setX({ ...x, talle: e.target.value })} className="input w-full" /></div>
          <div className="sm:col-span-2"><label htmlFor="e-obs" className={L}>Observación</label><input id="e-obs" maxLength={200} value={x.observacion} onChange={e => setX({ ...x, observacion: e.target.value })} className="input w-full" /></div>
        </div>
        <button disabled={busy} className="btn-primary disabled:opacity-50">Registrar entrega</button>
      </form>
    </div>
  );
}

function CapsTab({ d, busy, run }: { d: Legajo; busy: boolean; run: Run }) {
  const [x, setX] = useState({ nombre: '', fecha: hoyIso(), horas: 0, entidad: '', vence: '', notas: '' });
  const [file, setFile] = useState<File | null>(null);
  return (
    <div>
      <Tabla cols={['Capacitación', 'Fecha', 'Horas', 'Vencimiento', 'Certificado', '']}>
        <Vacio n={d.capacitaciones.length} t="Sin capacitaciones registradas." />
        {d.capacitaciones.map(o => <tr key={o.id} className="border-b border-steel-700/60"><td className="px-4 py-3 text-arctic">{o.nombre}{o.entidad && <div className="text-caption text-steel-400">{o.entidad}</div>}</td><td className="px-4 py-3">{fmtFecha(o.fecha)}</td><td className="px-4 py-3">{o.horas || '—'}</td><td className="px-4 py-3"><Badge vence={o.vence} alerta={d.config.alertaDias} /></td>
          <td className="px-4 py-3">{o.certificadoUrl ? <a href={o.certificadoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-blue-bright hover:underline">Abrir<ExternalLink className="h-3.5 w-3.5" /></a> : '—'}</td><td className="px-2"><Borrar label="Quitar capacitación" onClick={() => window.confirm('¿Quitar esta capacitación?') && run(() => api(`/api/rrhh/capacitaciones?id=${o.id}`, 'DELETE'), 'Quitado')} /></td></tr>)}
      </Tabla>
      <form className="card max-w-2xl space-y-3 p-4" onSubmit={e => { e.preventDefault(); run(async () => { const certificadoUrl = file ? await subir(file) : null; await api('/api/rrhh/capacitaciones', 'POST', { funcionarioId: d.funcionario.id, ...x, vence: x.vence || null, certificadoUrl }); setFile(null); setX({ nombre: '', fecha: hoyIso(), horas: 0, entidad: '', vence: '', notas: '' }); }, 'Capacitación registrada'); }}>
        <h3 className="font-body text-body font-medium text-arctic">Registrar capacitación</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2"><label htmlFor="k-nombre" className={L}>Nombre *</label><input id="k-nombre" required maxLength={120} value={x.nombre} onChange={e => setX({ ...x, nombre: e.target.value })} className="input w-full" placeholder="Ej: Trabajo en altura" /></div>
          <div><label htmlFor="k-fecha" className={L}>Fecha *</label><input id="k-fecha" type="date" required value={x.fecha} onChange={e => setX({ ...x, fecha: e.target.value })} className="input w-full" /></div>
          <div><label htmlFor="k-horas" className={L}>Horas</label><input id="k-horas" type="number" min={0} max={2000} value={x.horas} onChange={e => setX({ ...x, horas: Number(e.target.value) })} className="input w-full" /></div>
          <div><label htmlFor="k-ent" className={L}>Entidad</label><input id="k-ent" maxLength={120} value={x.entidad} onChange={e => setX({ ...x, entidad: e.target.value })} className="input w-full" /></div>
          <div><label htmlFor="k-vence" className={L}>Vence (si tiene vigencia)</label><input id="k-vence" type="date" value={x.vence} min={x.fecha} onChange={e => setX({ ...x, vence: e.target.value })} className="input w-full" /></div>
          <div className="sm:col-span-2"><label htmlFor="k-file" className={L}>Certificado (opcional)</label><input id="k-file" type="file" accept="application/pdf,image/*" onChange={e => setFile(e.target.files?.[0] ?? null)} className="input w-full" /></div>
        </div>
        <button disabled={busy} className="btn-primary disabled:opacity-50">{busy ? 'Guardando…' : 'Registrar capacitación'}</button>
      </form>
    </div>
  );
}
