'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Eye, EyeOff, X, Save, Loader2, RefreshCw, Building2, ChevronDown, ChevronUp } from 'lucide-react';
import { fetchJson } from '@/lib/utils';
import { ImageUploader } from '@/components/admin/image-uploader';

interface ClienteLogo {
  id: string; name: string; logoUrl: string; website: string;
  parentId: string | null; children: ClienteLogo[];
  isActive: boolean; order: number;
}

const EMPTY = {
  id: undefined as string | undefined,
  name: '', logoUrl: '', website: '', parentId: null as string | null, isActive: true, order: 0,
};

export default function AdminClientesLogoPage() {
  const [clientes, setClientes] = useState<ClienteLogo[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<{ id?: string; name: string; logoUrl: string; website: string; parentId: string | null; isActive: boolean; order: number } | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const fetch_ = useCallback(() => {
    setLoading(true);
    fetchJson<{ clientes: ClienteLogo[] }>('/api/clientes-logo').then((d) => {
      setClientes(d?.clientes || []);
      setLoading(false);
    });
  }, []);

  useEffect(() => { fetch_(); }, [fetch_]);

  const openNew = (parentId: string | null = null) => {
    setIsNew(true);
    setEditing({ ...EMPTY, parentId, order: clientes.length });
  };

  const save = async () => {
    if (!editing) return;
    const method = isNew ? 'POST' : 'PUT';
    const url = isNew ? '/api/clientes-logo' : `/api/clientes-logo/${editing.id}`;
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editing) });
    setEditing(null);
    fetch_();
  };

  const del = async (id: string) => {
    if (!confirm('¿Eliminar este cliente?')) return;
    await fetch(`/api/clientes-logo/${id}`, { method: 'DELETE' });
    fetch_();
  };

  const toggle = async (id: string, val: boolean) => {
    await fetch(`/api/clientes-logo/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: !val }) });
    fetch_();
  };

  const toggleExpand = (id: string) => {
    setExpanded((prev) => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-h1 uppercase text-arctic">Clientes</h1>
          <p className="mt-1 font-body text-body-sm text-steel-300">{clientes.length} cliente{clientes.length !== 1 ? 's' : ''} principales</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetch_} className="btn-secondary"><RefreshCw className="h-4 w-4" /></button>
          <button onClick={() => openNew(null)} className="btn-primary"><Plus className="h-4 w-4" /> Nuevo cliente</button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="card animate-pulse p-4"><div className="h-20 rounded bg-steel-900" /></div>)}</div>
      ) : clientes.length === 0 ? (
        <div className="card p-12 text-center">
          <Building2 className="mx-auto h-12 w-12 text-steel-700" />
          <h3 className="mt-4 font-display text-h3 text-arctic">Sin clientes</h3>
          <p className="mt-2 font-body text-body-sm text-steel-500">Agregá los logos de tus clientes para mostrarlos en la página pública.</p>
          <button onClick={() => openNew(null)} className="btn-primary mt-6 inline-flex"><Plus className="h-4 w-4" /> Agregar cliente</button>
        </div>
      ) : (
        <div className="space-y-4">
          {clientes.map((c) => (
            <div key={c.id} className="card overflow-hidden">
              {/* Cliente principal */}
              <div className="flex items-center gap-4 p-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-steel-900/40 bg-steel-950 overflow-hidden">
                  {c.logoUrl ? <img src={c.logoUrl} alt={c.name} className="h-full w-full object-contain p-1" /> : <Building2 className="h-6 w-6 text-steel-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display text-h4 text-arctic">{c.name}</h3>
                  {c.website && <p className="font-body text-caption text-steel-500 truncate">{c.website}</p>}
                  <p className="font-body text-caption text-steel-600">{c.children?.length || 0} subdivisione{(c.children?.length || 0) !== 1 ? 's' : ''}</p>
                </div>
                <div className="flex items-center gap-1">
                  {(c.children?.length || 0) > 0 && (
                    <button onClick={() => toggleExpand(c.id)} className="rounded p-1.5 text-steel-500 hover:text-arctic">
                      {expanded.has(c.id) ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                  )}
                  <button onClick={() => toggle(c.id, c.isActive)} className="rounded p-1.5 text-steel-500 hover:text-arctic">
                    {c.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                  <button onClick={() => { setIsNew(false); setEditing({ id: c.id, name: c.name, logoUrl: c.logoUrl, website: c.website, parentId: c.parentId, isActive: c.isActive, order: c.order }); }} className="rounded p-1.5 text-steel-500 hover:bg-blue-muted hover:text-blue-bright">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => openNew(c.id)} className="rounded p-1.5 text-steel-500 hover:bg-green-500/10 hover:text-green-400" title="Agregar subdivisión">
                    <Plus className="h-4 w-4" />
                  </button>
                  <button onClick={() => del(c.id)} className="rounded p-1.5 text-steel-500 hover:bg-red-500/10 hover:text-red-400">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Subdivisiones */}
              {expanded.has(c.id) && c.children && c.children.length > 0 && (
                <div className="border-t border-steel-900/40 bg-steel-950/30">
                  {c.children.map((sub) => (
                    <div key={sub.id} className="flex items-center gap-3 border-b border-steel-900/20 px-4 py-3 last:border-b-0">
                      <div className="ml-4 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-steel-900/40 bg-steel-950 overflow-hidden">
                        {sub.logoUrl ? <img src={sub.logoUrl} alt={sub.name} className="h-full w-full object-contain p-0.5" /> : <Building2 className="h-4 w-4 text-steel-600" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-body text-body-sm font-semibold text-arctic">{sub.name}</p>
                        {sub.website && <p className="font-body text-caption text-steel-500 truncate">{sub.website}</p>}
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => toggle(sub.id, sub.isActive)} className="rounded p-1.5 text-steel-500 hover:text-arctic">
                          {sub.isActive ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                        </button>
                        <button onClick={() => { setIsNew(false); setEditing({ id: sub.id, name: sub.name, logoUrl: sub.logoUrl, website: sub.website, parentId: sub.parentId, isActive: sub.isActive, order: sub.order }); }} className="rounded p-1.5 text-steel-500 hover:bg-blue-muted hover:text-blue-bright">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => del(sub.id)} className="rounded p-1.5 text-steel-500 hover:bg-red-500/10 hover:text-red-400">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal edicion */}
      {editing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-carbon/80 backdrop-blur-sm" onClick={() => setEditing(null)} />
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-lg border border-steel-900/60 bg-carbon-light shadow-2xl">
            <div className="flex items-center justify-between border-b border-steel-900/40 px-6 py-4">
              <h2 className="font-display text-h2 text-arctic">
                {isNew ? (editing.parentId ? 'Nueva subdivisión' : 'Nuevo cliente') : 'Editar cliente'}
              </h2>
              <button onClick={() => setEditing(null)} className="rounded-md p-1.5 text-steel-500 hover:bg-steel-900"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4 p-6">
              <div>
                <label className="label mb-1 block">Nombre *</label>
                <input type="text" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className="input" placeholder="Ej: Grupo MAO" />
              </div>
              <div>
                <label className="label mb-1 block">Sitio web</label>
                <input type="url" value={editing.website} onChange={(e) => setEditing({ ...editing, website: e.target.value })} className="input" placeholder="https://..." />
              </div>
              <ImageUploader
                label="Logo del cliente"
                value={editing.logoUrl}
                onChange={(url) => setEditing({ ...editing, logoUrl: url })}
                previewHeight="h-28"
              />
              <div>
                <label className="label mb-1 block">Orden</label>
                <input type="number" value={editing.order} onChange={(e) => setEditing({ ...editing, order: Number(e.target.value) })} className="input w-24" min={0} />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={editing.isActive} onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })} className="h-4 w-4 accent-blue" />
                <span className="font-body text-body-sm text-arctic">Visible en la página</span>
              </label>
              <button onClick={save} disabled={!editing.name} className="btn-primary w-full justify-center gap-2 py-3">
                <Save className="h-4 w-4" />{isNew ? 'Crear' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
