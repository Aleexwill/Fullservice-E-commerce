'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  Search, RefreshCw, Plus, X, User, Mail, Phone, Building, MapPin,
  Loader2, Users, FileText, ShoppingCart, CheckCircle2, Clock,
  AlertTriangle, Edit2, Check, Ban, RotateCcw, Tag, ChevronRight,
  DollarSign, Calendar, Briefcase, Package,
} from 'lucide-react';

interface Cliente {
  id: string; name: string; company: string; email: string; phone: string;
  address: string; ruc: string; category: string; notes: string; tags: string[];
  totalSpent: number; jobsCount: number; lastServiceAt: string;
  isActive: boolean; createdAt: string;
}

interface Presupuesto {
  id: string; code: string; status: string; serviceTitle: string; serviceType: string;
  estimatedValue: number | null; finalValue: number | null;
  createdAt: string; scheduledDate: string;
  seguimientoData?: { alerta?: string; vendido?: number; facturado?: string; nroFactura?: string };
}

interface Pedido {
  id: string; orderNumber: string; status: string; paymentStatus: string;
  total: number; subtotal: number; discount: number;
  items: { name: string; qty: number; price: number }[];
  createdAt: string;
}

interface FichaData { cliente: Cliente; presupuestos: Presupuesto[]; pedidos: Pedido[] }

const STATUS_PRES: Record<string, { label: string; color: string }> = {
  falta_presupuestar:   { label: 'Falta presupuestar',  color: '#A78BFA' },
  pendiente_relevo:     { label: 'Pendiente relevo',    color: '#F97316' },
  nuevo:                { label: 'Nuevo',               color: '#3B82F6' },
  en_revision:          { label: 'En revisión',         color: '#F59E0B' },
  enviado:              { label: 'Enviado',             color: '#EAB308' },
  pendiente_aprobacion: { label: 'Pend. aprobación',   color: '#F59E0B' },
  aprobado:             { label: 'Aprobado',            color: '#48BB78' },
  en_ejecucion:         { label: 'En ejecución',        color: '#22C55E' },
  finalizado:           { label: 'Finalizado',          color: '#16A34A' },
  de_baja:              { label: 'De baja',             color: '#FC8181' },
};

const STATUS_PEDIDO: Record<string, { label: string; color: string }> = {
  pending:    { label: 'Pendiente',  color: '#F59E0B' },
  confirmed:  { label: 'Confirmado', color: '#3B82F6' },
  processing: { label: 'Procesando', color: '#A78BFA' },
  shipped:    { label: 'Enviado',    color: '#22C55E' },
  delivered:  { label: 'Entregado',  color: '#16A34A' },
  cancelled:  { label: 'Cancelado',  color: '#FC8181' },
};

const PAY_STATUS: Record<string, { label: string; color: string }> = {
  pending:  { label: 'Pendiente', color: '#F59E0B' },
  paid:     { label: 'Pagado',    color: '#16A34A' },
  partial:  { label: 'Parcial',   color: '#F97316' },
  refunded: { label: 'Devuelto',  color: '#FC8181' },
};

const Gs = (n: number) => 'Gs. ' + Math.round(n).toLocaleString('es-PY');
const fDate = (d: string) => d ? new Date(d).toLocaleDateString('es-PY', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const CATS = ['servicios', 'ecommerce', 'ambos'];

// ── Inline editable field ──────────────────────────────────────
function EditField({ label, value, onSave, type = 'text', options }: {
  label: string; value: string; onSave: (v: string) => void; type?: string;
  options?: { value: string; label: string }[];
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLInputElement & HTMLTextAreaElement & HTMLSelectElement>(null);

  useEffect(() => { if (editing) ref.current?.focus(); }, [editing]);
  useEffect(() => { setDraft(value); }, [value]);

  const commit = () => { setEditing(false); if (draft !== value) onSave(draft); };

  if (editing) {
    const cls = 'w-full rounded border border-blue/60 bg-steel-900 px-2 py-1 font-body text-body-sm text-arctic outline-none focus:border-blue-bright';
    return (
      <div className="flex flex-col gap-0.5">
        <span className="font-body text-[0.6rem] uppercase tracking-wider text-steel-700">{label}</span>
        <div className="flex items-center gap-2">
          {options ? (
            <select ref={ref as any} value={draft} onChange={e => setDraft(e.target.value)} className={cls}>
              {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          ) : type === 'textarea' ? (
            <textarea ref={ref as any} value={draft} onChange={e => setDraft(e.target.value)} rows={3} className={cls} />
          ) : (
            <input ref={ref as any} type={type} value={draft} onChange={e => setDraft(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setDraft(value); setEditing(false); } }}
              className={cls} />
          )}
          <button onClick={commit} className="shrink-0 text-success-bright hover:text-success-bright/80"><Check className="h-4 w-4" /></button>
          <button onClick={() => { setDraft(value); setEditing(false); }} className="shrink-0 text-steel-500 hover:text-arctic"><X className="h-4 w-4" /></button>
        </div>
      </div>
    );
  }

  return (
    <div className="group flex flex-col gap-0.5 cursor-pointer" onClick={() => setEditing(true)}>
      <span className="font-body text-[0.6rem] uppercase tracking-wider text-steel-700">{label}</span>
      <div className="flex items-center gap-1.5">
        <span className="font-body text-body-sm text-steel-300 group-hover:text-arctic">{value || <span className="text-steel-700 italic">Sin datos</span>}</span>
        <Edit2 className="h-3 w-3 shrink-0 text-steel-700 opacity-0 group-hover:opacity-100" />
      </div>
    </div>
  );
}

// ── Chip badge ─────────────────────────────────────────────────
function Chip({ label, color }: { label: string; color: string }) {
  return (
    <span className="inline-flex items-center rounded-full px-2 py-0.5 font-body text-[0.65rem] font-semibold"
      style={{ background: color + '22', color, border: `1px solid ${color}44` }}>
      {label}
    </span>
  );
}

// ── Ficha panel ────────────────────────────────────────────────
function FichaPanel({ clienteId, onClose, onUpdated }: {
  clienteId: string; onClose: () => void; onUpdated: (c: Cliente) => void;
}) {
  const [data, setData] = useState<FichaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'info' | 'presupuestos' | 'pedidos'>('info');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/clientes/${clienteId}`);
    if (res.ok) { const d = await res.json(); setData(d); }
    setLoading(false);
  }, [clienteId]);

  useEffect(() => { load(); }, [load]);

  const patch = async (fields: Partial<Cliente>) => {
    if (!data) return;
    const optimistic = { ...data.cliente, ...fields };
    setData(d => d ? { ...d, cliente: optimistic } : d);
    setSaving(true);
    try {
      const res = await fetch(`/api/clientes/${clienteId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      });
      if (res.ok) { const updated = await res.json(); setData(d => d ? { ...d, cliente: updated } : d); onUpdated(updated); }
    } finally { setSaving(false); }
  };

  const toggleActive = () => patch({ isActive: !data?.cliente.isActive });

  if (loading) return (
    <div className="flex h-full items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-steel-500" />
    </div>
  );
  if (!data) return null;

  const { cliente, presupuestos, pedidos } = data;

  // Totals
  const totalPresupuestado = presupuestos.reduce((s, p) => s + (Number(p.finalValue) || Number(p.estimatedValue) || 0), 0);
  const totalAprobado = presupuestos.filter(p => ['aprobado','en_ejecucion','finalizado'].includes(p.status)).reduce((s, p) => s + (Number(p.finalValue) || 0), 0);
  const totalFacturado = presupuestos.reduce((s, p) => s + (Number((p.seguimientoData as any)?.vendido) || 0), 0);
  const totalPedidos = pedidos.reduce((s, o) => s + Number(o.total), 0);
  const totalGeneral = totalAprobado + totalPedidos;

  const tabBtn = (t: typeof tab, label: string, count: number) => (
    <button onClick={() => setTab(t)}
      className={`flex items-center gap-2 border-b-2 px-1 pb-3 font-body text-body-sm transition-colors ${tab === t ? 'border-blue-bright text-arctic' : 'border-transparent text-steel-500 hover:text-steel-300'}`}>
      {label}
      <span className={`rounded-full px-1.5 py-0.5 text-[0.6rem] font-bold ${tab === t ? 'bg-blue/30 text-blue-bright' : 'bg-steel-900 text-steel-500'}`}>{count}</span>
    </button>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-end">
      <div className="absolute inset-0 bg-carbon/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex h-full w-full max-w-2xl flex-col border-l border-steel-900/40 bg-carbon-light shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="shrink-0 border-b border-steel-900/40 px-6 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue/20 font-display text-h3 text-blue-bright shrink-0">
                {cliente.name[0]?.toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-display text-h2 text-arctic">{cliente.name}</h2>
                  {!cliente.isActive && <Chip label="Inactivo" color="#FC8181" />}
                </div>
                {cliente.company && <p className="font-body text-caption text-steel-500">{cliente.company}</p>}
                <p className="font-body text-[0.6rem] text-steel-700 mt-0.5">Cliente desde {fDate(cliente.createdAt)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {saving && <Loader2 className="h-4 w-4 animate-spin text-steel-500" />}
              <button onClick={toggleActive}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 font-body text-caption transition-colors ${cliente.isActive ? 'text-steel-500 hover:bg-danger/10 hover:text-danger-bright' : 'text-success-bright hover:bg-success/10'}`}
                title={cliente.isActive ? 'Dar de baja' : 'Reactivar'}>
                {cliente.isActive ? <><Ban className="h-3.5 w-3.5" />Dar de baja</> : <><RotateCcw className="h-3.5 w-3.5" />Reactivar</>}
              </button>
              <button onClick={onClose} className="rounded-md p-1.5 text-steel-500 hover:bg-steel-900"><X className="h-5 w-5" /></button>
            </div>
          </div>

          {/* KPI strip */}
          <div className="mt-4 grid grid-cols-4 gap-2">
            {[
              { label: 'Trabajos', value: cliente.jobsCount, icon: Briefcase },
              { label: 'Aprobado', value: Gs(totalAprobado), icon: CheckCircle2 },
              { label: 'Pedidos', value: Gs(totalPedidos), icon: ShoppingCart },
              { label: 'Total general', value: Gs(totalGeneral), icon: DollarSign },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="rounded-lg border border-steel-900/60 bg-steel-950/50 p-2.5 text-center">
                <Icon className="mx-auto mb-1 h-3.5 w-3.5 text-blue-bright" />
                <p className="font-mono text-[0.75rem] font-semibold text-arctic leading-tight">{value}</p>
                <p className="font-body text-[0.6rem] text-steel-700">{label}</p>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="mt-4 flex gap-4 border-b border-steel-900/40">
            {tabBtn('info', 'Datos', 0)}
            {tabBtn('presupuestos', 'Presupuestos', presupuestos.length)}
            {tabBtn('pedidos', 'Pedidos', pedidos.length)}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">

          {/* ── TAB: INFO ── */}
          {tab === 'info' && (
            <div className="space-y-5">
              <div className="card p-4 grid grid-cols-2 gap-4">
                <EditField label="Nombre" value={cliente.name} onSave={v => patch({ name: v })} />
                <EditField label="Empresa" value={cliente.company} onSave={v => patch({ company: v })} />
                <EditField label="Email" value={cliente.email} type="email" onSave={v => patch({ email: v })} />
                <EditField label="Teléfono" value={cliente.phone} onSave={v => patch({ phone: v })} />
                <EditField label="RUC" value={cliente.ruc} onSave={v => patch({ ruc: v })} />
                <EditField label="Categoría" value={cliente.category}
                  options={CATS.map(c => ({ value: c, label: c.charAt(0).toUpperCase() + c.slice(1) }))}
                  onSave={v => patch({ category: v })} />
                <div className="col-span-2">
                  <EditField label="Dirección" value={cliente.address} onSave={v => patch({ address: v })} />
                </div>
              </div>

              <div className="card p-4">
                <p className="mb-2 font-body text-[0.6rem] uppercase tracking-wider text-steel-700">Notas internas</p>
                <EditField label="" value={cliente.notes} type="textarea" onSave={v => patch({ notes: v })} />
              </div>

              <div className="card p-4 space-y-2">
                <p className="font-body text-[0.6rem] uppercase tracking-wider text-steel-700">Resumen histórico</p>
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div><p className="font-mono text-h3 text-arctic">{presupuestos.length}</p><p className="font-body text-caption text-steel-500">Presupuestos</p></div>
                  <div><p className="font-mono text-h3 text-arctic">{presupuestos.filter(p=>['aprobado','en_ejecucion','finalizado'].includes(p.status)).length}</p><p className="font-body text-caption text-steel-500">Aprobados</p></div>
                  <div><p className="font-mono text-body-sm text-arctic">{Gs(totalPresupuestado)}</p><p className="font-body text-caption text-steel-500">Presupuestado</p></div>
                  <div><p className="font-mono text-body-sm text-arctic">{Gs(totalFacturado)}</p><p className="font-body text-caption text-steel-500">Facturado/Vendido</p></div>
                </div>
                {cliente.lastServiceAt && (
                  <p className="flex items-center gap-1.5 pt-1 font-body text-caption text-steel-500">
                    <Calendar className="h-3.5 w-3.5" />Último servicio: {fDate(cliente.lastServiceAt)}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ── TAB: PRESUPUESTOS ── */}
          {tab === 'presupuestos' && (
            <div className="space-y-2">
              {presupuestos.length === 0 ? (
                <div className="py-12 text-center">
                  <FileText className="mx-auto h-10 w-10 text-steel-700" />
                  <p className="mt-3 font-body text-body-sm text-steel-500">Sin presupuestos vinculados</p>
                </div>
              ) : presupuestos.map(p => {
                const st = STATUS_PRES[p.status] || { label: p.status, color: '#6B7280' };
                const seg = p.seguimientoData as any;
                const facturado = Number(seg?.vendido) || 0;
                const valor = Number(p.finalValue) || Number(p.estimatedValue) || 0;
                return (
                  <div key={p.id} className="card p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-body text-body-sm font-semibold text-arctic">{p.serviceTitle || '—'}</p>
                        <p className="font-mono text-caption text-steel-500">{p.code}</p>
                      </div>
                      <Chip label={st.label} color={st.color} />
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 font-body text-caption text-steel-500">
                      {valor > 0 && <span>Valor: <span className="text-arctic font-mono">{Gs(valor)}</span></span>}
                      {facturado > 0 && <span>Vendido: <span className="text-success-bright font-mono">{Gs(facturado)}</span></span>}
                      {seg?.nroFactura && <span>Factura: <span className="text-arctic">{seg.nroFactura}</span></span>}
                      {seg?.facturado && seg.facturado !== 'NO' && (
                        <span className="flex items-center gap-1 text-success-bright"><CheckCircle2 className="h-3 w-3" />Facturado</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="font-body text-[0.6rem] text-steel-700">{fDate(p.createdAt)}</p>
                      <a href={`/admin/presupuestos/${p.id}`} className="flex items-center gap-1 font-body text-caption text-blue-bright hover:underline">
                        Ver <ChevronRight className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── TAB: PEDIDOS ── */}
          {tab === 'pedidos' && (
            <div className="space-y-2">
              {pedidos.length === 0 ? (
                <div className="py-12 text-center">
                  <ShoppingCart className="mx-auto h-10 w-10 text-steel-700" />
                  <p className="mt-3 font-body text-body-sm text-steel-500">Sin pedidos vinculados</p>
                </div>
              ) : pedidos.map(o => {
                const st = STATUS_PEDIDO[o.status] || { label: o.status, color: '#6B7280' };
                const pay = PAY_STATUS[o.paymentStatus] || { label: o.paymentStatus, color: '#6B7280' };
                const items = Array.isArray(o.items) ? o.items as any[] : [];
                return (
                  <div key={o.id} className="card p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-body text-body-sm font-semibold text-arctic">Pedido {o.orderNumber}</p>
                        <p className="font-body text-caption text-steel-500">{fDate(o.createdAt)}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Chip label={st.label} color={st.color} />
                        <Chip label={pay.label} color={pay.color} />
                      </div>
                    </div>
                    {items.length > 0 && (
                      <div className="rounded border border-steel-900/40 divide-y divide-steel-900/30">
                        {items.slice(0, 4).map((it: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between px-3 py-1.5 font-body text-caption">
                            <span className="text-steel-300 truncate">{it.name || it.productName || 'Ítem'}</span>
                            <span className="shrink-0 text-steel-500 ml-2">x{it.qty || it.quantity || 1} · {Gs(Number(it.price || it.unitPrice || 0))}</span>
                          </div>
                        ))}
                        {items.length > 4 && <p className="px-3 py-1.5 font-body text-caption text-steel-700">+{items.length - 4} ítems más</p>}
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-1">
                      <p className="font-body text-caption text-steel-500">
                        {o.discount > 0 && <span className="text-success-bright mr-2">-{Gs(Number(o.discount))}</span>}
                        Total: <span className="font-mono text-arctic font-semibold">{Gs(Number(o.total))}</span>
                      </p>
                      <a href="/admin/pedidos" className="flex items-center gap-1 font-body text-caption text-blue-bright hover:underline">
                        Ver pedidos <ChevronRight className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────
export default function AdminClientesPage() {
  const [items, setItems] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const fetchData = useCallback((q = '') => {
    setLoading(true);
    const p = new URLSearchParams();
    if (q) p.set('q', q);
    p.set('limit', '100');
    fetch(`/api/clientes?${p}`).then(r => r.json()).then(d => { setItems(d?.clientes || []); setLoading(false); });
  }, []);

  useEffect(() => {
    const t = setTimeout(() => fetchData(search), 250);
    return () => clearTimeout(t);
  }, [search, fetchData]);

  const updateItem = (updated: Cliente) =>
    setItems(prev => prev.map(c => c.id === updated.id ? updated : c));

  const activos90 = items.filter(c => c.lastServiceAt && c.lastServiceAt >= new Date(Date.now() - 90*24*3600*1000).toISOString().split('T')[0]).length;
  const totalTrabajos = items.reduce((s, c) => s + c.jobsCount, 0);

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-h1 uppercase text-arctic">Clientes</h1>
          <p className="mt-1 font-body text-body-sm text-steel-300">Clientes confirmados — presupuestos aprobados y compras</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary"><Plus className="h-4 w-4" /> Nuevo cliente</button>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="card p-4 text-center"><p className="font-mono text-h2 text-arctic">{items.length}</p><p className="font-body text-caption text-steel-500">Total clientes</p></div>
        <div className="card p-4 text-center"><p className="font-mono text-h2 text-arctic">{activos90}</p><p className="font-body text-caption text-steel-500">Activos últimos 90 días</p></div>
        <div className="card p-4 text-center"><p className="font-mono text-h2 text-arctic">{totalTrabajos}</p><p className="font-body text-caption text-steel-500">Trabajos totales</p></div>
      </div>

      <div className="mb-4 flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-steel-500" />
          <input type="text" placeholder="Buscar por nombre, empresa, teléfono o email..." value={search}
            onChange={(e) => setSearch(e.target.value)} className="input pl-10" />
        </div>
        <button onClick={() => fetchData(search)} className="btn-secondary"><RefreshCw className="h-4 w-4" /></button>
      </div>

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="card animate-pulse p-4"><div className="h-12 rounded bg-steel-900" /></div>
        ))}</div>
      ) : items.length === 0 ? (
        <div className="card p-12 text-center">
          <Users className="mx-auto h-12 w-12 text-steel-700" />
          <h3 className="mt-4 font-display text-h3 text-arctic">Sin clientes</h3>
          <p className="mt-2 font-body text-body-sm text-steel-500">Los clientes se crean automáticamente al aprobar un presupuesto.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((c) => (
            <div key={c.id} className={`card-interactive flex items-center gap-4 p-4 ${!c.isActive ? 'opacity-50' : ''}`}
              onClick={() => setSelectedId(c.id)}>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue/20 font-display text-h4 text-blue-bright">
                {c.name[0]?.toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-body text-body-sm font-medium text-arctic">{c.name}</p>
                  {!c.isActive && <Chip label="Inactivo" color="#FC8181" />}
                </div>
                <p className="font-body text-caption text-steel-500">{[c.company, c.phone, c.email].filter(Boolean).join(' · ')}</p>
              </div>
              <div className="hidden shrink-0 text-right sm:block">
                <p className="font-mono text-body-sm text-arctic">{c.jobsCount} trabajo{c.jobsCount !== 1 ? 's' : ''}</p>
                <p className="font-body text-caption text-steel-700">Último: {c.lastServiceAt || '—'}</p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-steel-700" />
            </div>
          ))}
        </div>
      )}

      {selectedId && (
        <FichaPanel
          clienteId={selectedId}
          onClose={() => setSelectedId(null)}
          onUpdated={updateItem}
        />
      )}

      {showCreate && (
        <CreateClienteModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); fetchData(search); }}
        />
      )}
    </div>
  );
}

// ── Create modal ───────────────────────────────────────────────
function CreateClienteModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [f, setF] = useState({ name: '', company: '', email: '', phone: '', address: '', ruc: '', category: 'servicios', notes: '' });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setSaving(true);
    try {
      const res = await fetch('/api/clientes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(f) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Error al crear cliente'); setSaving(false); return; }
      onCreated();
    } catch { setError('Error de conexión'); setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-carbon/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-lg border border-steel-900/60 bg-carbon-light shadow-2xl">
        <div className="flex items-center justify-between border-b border-steel-900/40 px-6 py-4">
          <h2 className="font-display text-h2 text-arctic">Nuevo cliente</h2>
          <button onClick={onClose} className="rounded-md p-1.5 text-steel-500 hover:bg-steel-900"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={submit} className="space-y-4 p-6">
          <div className="grid grid-cols-2 gap-3">
            <input type="text" placeholder="Nombre *" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className="input" required />
            <input type="text" placeholder="Empresa" value={f.company} onChange={(e) => setF({ ...f, company: e.target.value })} className="input" />
            <input type="email" placeholder="Email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} className="input" />
            <input type="text" placeholder="Teléfono" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} className="input" />
            <input type="text" placeholder="Dirección" value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} className="input col-span-2" />
            <input type="text" placeholder="RUC" value={f.ruc} onChange={(e) => setF({ ...f, ruc: e.target.value })} className="input" />
            <select value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} className="input">
              <option value="servicios">Servicios</option>
              <option value="ecommerce">E-commerce</option>
              <option value="ambos">Ambos</option>
            </select>
          </div>
          <textarea placeholder="Notas" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} className="input" rows={3} />
          {error && <p className="rounded-md bg-danger-light/10 px-3 py-2 font-body text-caption text-danger-light">{error}</p>}
          <button type="submit" disabled={saving || !f.name} className="btn-primary w-full justify-center gap-2 py-3">
            {saving ? <><Loader2 className="h-4 w-4 animate-spin" />Guardando...</> : <><User className="h-4 w-4" />Crear cliente</>}
          </button>
        </form>
      </div>
    </div>
  );
}
