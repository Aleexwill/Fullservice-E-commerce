'use client';

import { useEffect, useState, useCallback } from 'react';
import { Search, RefreshCw, Plus, X, User, Mail, Phone, Building, MapPin, Loader2, Users, TrendingUp, Calendar } from 'lucide-react';

interface Cliente {
  id: string; name: string; company: string; email: string; phone: string;
  address: string; ruc: string; category: string; notes: string;
  totalSpent: number; jobsCount: number; lastServiceAt: string;
  isActive: boolean; createdAt: string;
}

const CATEGORIES = ['servicios', 'ecommerce', 'ambos'];
const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('es-PY', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export default function AdminClientesPage() {
  const [items, setItems] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Cliente | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const fetchData = useCallback((q = search) => {
    setLoading(true);
    const p = new URLSearchParams();
    if (q) p.set('q', q);
    p.set('limit', '100');
    fetch(`/api/clientes?${p}`).then(r => r.json()).then(d => { setItems(d?.clientes || []); setLoading(false); });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchData(search); }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-h1 uppercase text-arctic">Clientes</h1>
          <p className="mt-1 font-body text-body-sm text-steel-300">Clientes confirmados — presupuestos aprobados y compras</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary"><Plus className="h-4 w-4" /> Nuevo cliente</button>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="card p-4 text-center">
          <p className="font-mono text-h2 text-arctic">{items.length}</p>
          <p className="font-body text-caption text-steel-500">Total clientes</p>
        </div>
        <div className="card p-4 text-center">
          <p className="font-mono text-h2 text-arctic">{items.filter(c => c.lastServiceAt && c.lastServiceAt >= new Date(Date.now() - 90*24*3600*1000).toISOString().split('T')[0]).length}</p>
          <p className="font-body text-caption text-steel-500">Activos últimos 90 días</p>
        </div>
        <div className="card p-4 text-center">
          <p className="font-mono text-h2 text-arctic">{items.reduce((s, c) => s + c.jobsCount, 0)}</p>
          <p className="font-body text-caption text-steel-500">Trabajos totales</p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4 flex gap-3">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-steel-500" /><input type="text" placeholder="Buscar por nombre, empresa, teléfono o email..." value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-10" /></div>
        <button onClick={() => fetchData(search)} className="btn-secondary"><RefreshCw className="h-4 w-4" /></button>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="card animate-pulse p-4"><div className="h-12 rounded bg-steel-900" /></div>)}</div>
      ) : items.length === 0 ? (
        <div className="card p-12 text-center">
          <Users className="mx-auto h-12 w-12 text-steel-700" />
          <h3 className="mt-4 font-display text-h3 text-arctic">Sin clientes</h3>
          <p className="mt-2 font-body text-body-sm text-steel-500">Los clientes se crean automáticamente al aprobar un presupuesto.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((c) => (
            <div key={c.id} className="card-interactive flex items-center gap-4 p-4" onClick={() => setSelected(c)}>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue/20 font-display text-h4 text-blue-bright">
                {c.name[0]?.toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-body text-body-sm font-medium text-arctic">{c.name}</p>
                <p className="font-body text-caption text-steel-500">{[c.company, c.phone, c.email].filter(Boolean).join(' · ')}</p>
              </div>
              <div className="hidden shrink-0 text-right sm:block">
                <p className="font-mono text-body-sm text-arctic">{c.jobsCount} trabajo{c.jobsCount !== 1 ? 's' : ''}</p>
                <p className="font-body text-caption text-steel-700">Último: {c.lastServiceAt || '—'}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail panel */}
      {selected && (
        <div className="fixed inset-0 z-[100] flex items-end justify-end">
          <div className="absolute inset-0 bg-carbon/60 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="relative h-full w-full max-w-lg overflow-y-auto border-l border-steel-900/40 bg-carbon-light shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-steel-900/40 bg-carbon-light px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue/20 font-display text-h4 text-blue-bright">{selected.name[0]?.toUpperCase()}</div>
                <div><h2 className="font-display text-h3 text-arctic">{selected.name}</h2>{selected.company && <p className="font-body text-caption text-steel-500">{selected.company}</p>}</div>
              </div>
              <button onClick={() => setSelected(null)} className="rounded-md p-1.5 text-steel-500 hover:bg-steel-900"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4 p-6">
              <div className="grid grid-cols-2 gap-3">
                <div className="card p-3 text-center"><p className="font-mono text-h2 text-arctic">{selected.jobsCount}</p><p className="font-body text-caption text-steel-500">Trabajos</p></div>
                <div className="card p-3 text-center"><p className="font-mono text-body-sm text-arctic">{selected.lastServiceAt || '—'}</p><p className="font-body text-caption text-steel-500">Último servicio</p></div>
              </div>
              <div className="card p-4 space-y-2 font-body text-body-sm">
                {selected.email && <p className="flex items-center gap-2 text-steel-300"><Mail className="h-4 w-4 text-blue-bright shrink-0" />{selected.email}</p>}
                {selected.phone && <p className="flex items-center gap-2 text-steel-300"><Phone className="h-4 w-4 text-blue-bright shrink-0" />{selected.phone}</p>}
                {selected.address && <p className="flex items-center gap-2 text-steel-300"><MapPin className="h-4 w-4 text-blue-bright shrink-0" />{selected.address}</p>}
                {selected.ruc && <p className="flex items-center gap-2 text-steel-300"><Building className="h-4 w-4 text-blue-bright shrink-0" />RUC: {selected.ruc}</p>}
              </div>
              {selected.notes && (
                <div className="card p-4">
                  <p className="mb-1 font-body text-caption text-steel-500">Notas</p>
                  <p className="font-body text-body-sm text-steel-300 whitespace-pre-line">{selected.notes}</p>
                </div>
              )}
              <p className="font-mono text-[0.6rem] text-steel-700">Cliente desde: {formatDate(selected.createdAt)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Create modal */}
      {showCreate && <CreateClienteModal onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); setSearch(''); fetchData(''); }} />}
    </div>
  );
}

function CreateClienteModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [f, setF] = useState({ name: '', company: '', email: '', phone: '', address: '', ruc: '', category: 'servicios', notes: '' });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const res = await fetch('/api/clientes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(f) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Error al crear cliente'); setSaving(false); return; }
      onCreated();
    } catch {
      setError('Error de conexión');
      setSaving(false);
    }
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
