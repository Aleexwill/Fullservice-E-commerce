'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Eye, EyeOff, X, Save, RefreshCw, Building2, ChevronDown, ChevronUp, Layers } from 'lucide-react';
import { fetchJson } from '@/lib/utils';
import { ImageUploader } from '@/components/admin/image-uploader';

interface ClienteLogo {
  id: string; name: string; logoUrl: string; website: string;
  parentId: string | null; children: ClienteLogo[];
  isActive: boolean; order: number;
}

interface SubForm { tempId: string; id?: string; name: string; logoUrl: string; website: string; isActive: boolean; order: number; }

interface EditForm {
  id?: string; name: string; logoUrl: string; website: string;
  parentId: string | null; isActive: boolean; order: number;
  hasChildren: boolean; subs: SubForm[];
}

const emptyForm = (order = 0): EditForm => ({
  name: '', logoUrl: '', website: '', parentId: null, isActive: true, order,
  hasChildren: false, subs: [],
});

const emptySub = (order = 0): SubForm => ({
  tempId: Math.random().toString(36).slice(2), name: '', logoUrl: '', website: '', isActive: true, order,
});

export default function AdminClientesLogoPage() {
  const [clientes, setClientes] = useState<ClienteLogo[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<EditForm | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    fetchJson<{ clientes: ClienteLogo[] }>('/api/clientes-logo').then((d) => {
      setClientes(d?.clientes || []);
      setLoading(false);
    });
  }, []);

  useEffect(() => { load(); }, [load]);

  const openNew = () => setEditing(emptyForm(clientes.length)) || setIsNew(true);
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  const openEdit = (c: ClienteLogo) => {
    setIsNew(false);
    setEditing({
      id: c.id, name: c.name, logoUrl: c.logoUrl, website: c.website,
      parentId: c.parentId, isActive: c.isActive, order: c.order,
      hasChildren: (c.children?.length || 0) > 0,
      subs: (c.children || []).map((s) => ({
        tempId: s.id, id: s.id, name: s.name, logoUrl: s.logoUrl,
        website: s.website, isActive: s.isActive, order: s.order,
      })),
    });
  };

  const save = async () => {
    if (!editing || !editing.name.trim()) return;
    setSaving(true);
    try {
      // 1. Save the parent
      const parentBody = {
        name: editing.name, logoUrl: editing.logoUrl, website: editing.website,
        parentId: editing.parentId, isActive: editing.isActive, order: editing.order,
      };
      let parentId = editing.id;
      if (isNew) {
        const res = await fetch('/api/clientes-logo', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(parentBody) });
        const created = await res.json();
        parentId = created.id;
      } else {
        await fetch(`/api/clientes-logo/${editing.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(parentBody) });
      }

      // 2. Save subs only if hasChildren
      if (editing.hasChildren && parentId) {
        for (const sub of editing.subs) {
          if (!sub.name.trim()) continue;
          const subBody = { name: sub.name, logoUrl: sub.logoUrl, website: sub.website, parentId, isActive: sub.isActive, order: sub.order };
          if (sub.id) {
            await fetch(`/api/clientes-logo/${sub.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(subBody) });
          } else {
            await fetch('/api/clientes-logo', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(subBody) });
          }
        }
      }

      setEditing(null);
      load();
    } finally {
      setSaving(false);
    }
  };

  const del = async (id: string) => {
    if (!confirm('¿Eliminar este cliente y sus subdivisiones?')) return;
    await fetch(`/api/clientes-logo/${id}`, { method: 'DELETE' });
    load();
  };

  const toggle = async (id: string, val: boolean) => {
    await fetch(`/api/clientes-logo/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: !val }) });
    load();
  };

  const toggleExpand = (id: string) => {
    setExpanded((prev) => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  };

  const addSub = () => {
    if (!editing) return;
    setEditing({ ...editing, subs: [...editing.subs, emptySub(editing.subs.length)] });
  };

  const updateSub = (tempId: string, patch: Partial<SubForm>) => {
    if (!editing) return;
    setEditing({ ...editing, subs: editing.subs.map((s) => s.tempId === tempId ? { ...s, ...patch } : s) });
  };

  const removeSub = async (sub: SubForm) => {
    if (!editing) return;
    if (sub.id && !confirm(`¿Eliminar la subdivisión "${sub.name}"?`)) return;
    if (sub.id) await fetch(`/api/clientes-logo/${sub.id}`, { method: 'DELETE' });
    setEditing({ ...editing, subs: editing.subs.filter((s) => s.tempId !== sub.tempId) });
    if (sub.id) load();
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-h1 uppercase text-arctic">Clientes</h1>
          <p className="mt-1 font-body text-body-sm text-steel-300">{clientes.length} cliente{clientes.length !== 1 ? 's' : ''} principales</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="btn-secondary"><RefreshCw className="h-4 w-4" /></button>
          <button onClick={() => { setIsNew(true); openNew(); }} className="btn-primary"><Plus className="h-4 w-4" /> Nuevo cliente</button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="card animate-pulse p-4"><div className="h-20 rounded bg-steel-900" /></div>)}</div>
      ) : clientes.length === 0 ? (
        <div className="card p-12 text-center">
          <Building2 className="mx-auto h-12 w-12 text-steel-700" />
          <h3 className="mt-4 font-display text-h3 text-arctic">Sin clientes</h3>
          <p className="mt-2 font-body text-body-sm text-steel-500">Agregá los logos de tus clientes.</p>
          <button onClick={() => { setIsNew(true); openNew(); }} className="btn-primary mt-6 inline-flex"><Plus className="h-4 w-4" /> Agregar cliente</button>
        </div>
      ) : (
        <div className="space-y-4">
          {clientes.map((c) => (
            <div key={c.id} className="card overflow-hidden">
              <div className="flex items-center gap-4 p-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-steel-900/40 bg-steel-950 overflow-hidden">
                  {c.logoUrl ? <img src={c.logoUrl} alt={c.name} className="h-full w-full object-contain p-1" /> : <Building2 className="h-6 w-6 text-steel-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display text-h4 text-arctic">{c.name}</h3>
                  {c.website && <p className="font-body text-caption text-steel-500 truncate">{c.website}</p>}
                  {(c.children?.length || 0) > 0 && (
                    <p className="font-body text-caption text-steel-600 flex items-center gap-1">
                      <Layers className="h-3 w-3" /> {c.children.length} subdivisione{c.children.length !== 1 ? 's' : ''}
                    </p>
                  )}
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
                  <button onClick={() => openEdit(c)} className="rounded p-1.5 text-steel-500 hover:bg-blue-muted hover:text-blue-bright">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => del(c.id)} className="rounded p-1.5 text-steel-500 hover:bg-red-500/10 hover:text-red-400">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

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
                      <span className={`text-caption font-body ${sub.isActive ? 'text-green-400' : 'text-steel-600'}`}>{sub.isActive ? 'Visible' : 'Oculta'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {editing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-carbon/80 backdrop-blur-sm" onClick={() => setEditing(null)} />
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg border border-steel-900/60 bg-carbon-light shadow-2xl">
            <div className="flex items-center justify-between border-b border-steel-900/40 px-6 py-4">
              <h2 className="font-display text-h2 text-arctic">{isNew ? 'Nuevo cliente' : 'Editar cliente'}</h2>
              <button onClick={() => setEditing(null)} className="rounded-md p-1.5 text-steel-500 hover:bg-steel-900"><X className="h-5 w-5" /></button>
            </div>

            <div className="space-y-5 p-6">
              {/* Datos principales */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="label mb-1 block">Nombre *</label>
                  <input type="text" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className="input" placeholder="Ej: Grupo MAO" />
                </div>
                <div>
                  <label className="label mb-1 block">Sitio web</label>
                  <input type="url" value={editing.website} onChange={(e) => setEditing({ ...editing, website: e.target.value })} className="input" placeholder="https://..." />
                </div>
                <div>
                  <label className="label mb-1 block">Orden</label>
                  <input type="number" value={editing.order} onChange={(e) => setEditing({ ...editing, order: Number(e.target.value) })} className="input" min={0} />
                </div>
              </div>

              <ImageUploader label="Logo del cliente" value={editing.logoUrl} onChange={(url) => setEditing({ ...editing, logoUrl: url })} previewHeight="h-24" />

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={editing.isActive} onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })} className="h-4 w-4 accent-blue" />
                <span className="font-body text-body-sm text-arctic">Visible en la página</span>
              </label>

              {/* Toggle subdivisiones */}
              <div className="rounded-xl border border-steel-900/40 bg-steel-950/40 p-4">
                <label className="flex cursor-pointer items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-blue-bright" />
                    <span className="font-body text-body-sm font-semibold text-arctic">Tiene subdivisiones / empresas del grupo</span>
                  </div>
                  <div
                    onClick={() => setEditing({ ...editing, hasChildren: !editing.hasChildren, subs: editing.hasChildren ? [] : editing.subs })}
                    className={`relative h-6 w-11 rounded-full transition-colors cursor-pointer ${editing.hasChildren ? 'bg-blue' : 'bg-steel-800'}`}
                  >
                    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${editing.hasChildren ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </div>
                </label>
                <p className="mt-1 font-body text-caption text-steel-500">Activá esto si esta empresa tiene divisiones o marcas dentro del grupo (ej: MAO Construcciones, MAO Industrias).</p>

                {editing.hasChildren && (
                  <div className="mt-4 space-y-3">
                    {editing.subs.map((sub, idx) => (
                      <div key={sub.tempId} className="rounded-lg border border-steel-900/60 bg-carbon p-4">
                        <div className="mb-3 flex items-center justify-between">
                          <span className="font-body text-caption font-semibold text-steel-400">Subdivisión {idx + 1}</span>
                          <button onClick={() => removeSub(sub)} className="rounded p-1 text-steel-600 hover:bg-red-500/10 hover:text-red-400"><X className="h-3.5 w-3.5" /></button>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="sm:col-span-2">
                            <label className="label mb-1 block text-xs">Nombre *</label>
                            <input type="text" value={sub.name} onChange={(e) => updateSub(sub.tempId, { name: e.target.value })} className="input text-sm" placeholder="Ej: MAO Construcciones" />
                          </div>
                          <div>
                            <label className="label mb-1 block text-xs">Sitio web</label>
                            <input type="url" value={sub.website} onChange={(e) => updateSub(sub.tempId, { website: e.target.value })} className="input text-sm" placeholder="https://..." />
                          </div>
                          <div>
                            <label className="label mb-1 block text-xs">Orden</label>
                            <input type="number" value={sub.order} onChange={(e) => updateSub(sub.tempId, { order: Number(e.target.value) })} className="input text-sm" min={0} />
                          </div>
                          <div className="sm:col-span-2">
                            <ImageUploader label="Logo (opcional)" value={sub.logoUrl} onChange={(url) => updateSub(sub.tempId, { logoUrl: url })} previewHeight="h-16" />
                          </div>
                          <label className="flex items-center gap-2 cursor-pointer sm:col-span-2">
                            <input type="checkbox" checked={sub.isActive} onChange={(e) => updateSub(sub.tempId, { isActive: e.target.checked })} className="h-4 w-4 accent-blue" />
                            <span className="font-body text-caption text-arctic">Visible</span>
                          </label>
                        </div>
                      </div>
                    ))}
                    <button type="button" onClick={addSub} className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-steel-700 py-3 font-body text-body-sm text-steel-400 hover:border-blue-bright/50 hover:text-blue-bright transition-colors">
                      <Plus className="h-4 w-4" /> Agregar subdivisión
                    </button>
                  </div>
                )}
              </div>

              <button onClick={save} disabled={!editing.name.trim() || saving} className="btn-primary w-full justify-center gap-2 py-3">
                {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {saving ? 'Guardando…' : isNew ? 'Crear' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
