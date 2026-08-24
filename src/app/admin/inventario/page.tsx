'use client';

import { useEffect, useState, useCallback } from 'react';
import { Search, RefreshCw, Plus, Trash2, X, Loader2, Package, Save } from 'lucide-react';

interface Material {
  id: string; code: string; description: string; unit: string; unitPrice: number;
  provider: string; category: string; isActive: boolean; notes: string;
}

const CATEGORIES: Record<string, string> = {
  metalurgica: 'Metalúrgica', chapas: 'Chapas', policarbonato: 'Policarbonato',
  civil: 'Civil', pinturas: 'Pinturas', electrica: 'Eléctrica', plomeria: 'Plomería',
  carpinteria: 'Carpintería', mano_obra: 'Mano de obra', consumibles: 'Consumibles', general: 'General',
};

const gs = (n: number) => 'Gs. ' + Math.round(n).toLocaleString('es-PY');

export default function AdminInventarioPage() {
  const [items, setItems] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Material | null>(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    const p = new URLSearchParams();
    if (search) p.set('q', search);
    if (filterCat) p.set('category', filterCat);
    p.set('limit', '200');
    fetch(`/api/materiales?${p}`).then(r => r.json()).then(d => { setItems(d.materials || []); setLoading(false); });
  }, [search, filterCat]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const del = async (id: string) => {
    if (!confirm('¿Eliminar este material?')) return;
    await fetch(`/api/materiales/${id}`, { method: 'DELETE' });
    fetchData();
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-h1 uppercase text-arctic">Inventario de Materiales</h1>
          <p className="mt-1 font-body text-body-sm text-steel-300">Lista interna de materiales y tarifas para presupuestos de servicios</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary"><Plus className="h-4 w-4" /> Agregar material</button>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[240px] flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-steel-500" /><input type="text" placeholder="Buscar material..." value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-10" /></div>
        <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} className="input max-w-[180px]">
          <option value="">Todas las categorías</option>
          {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <button onClick={fetchData} className="btn-secondary"><RefreshCw className="h-4 w-4" /></button>
        <span className="font-mono text-caption text-steel-500">{items.length} materiales</span>
      </div>

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="card animate-pulse p-4"><div className="h-10 rounded bg-steel-900" /></div>)}</div>
      ) : (
        <div className="rounded-lg border border-steel-900/40 overflow-hidden">
          <div className="grid grid-cols-[40px_1fr_80px_80px_130px_120px_80px] gap-2 bg-steel-900/50 px-4 py-2.5 font-body text-[0.6rem] uppercase tracking-wider text-steel-500">
            <span>#</span><span>Descripción</span><span>Unidad</span><span>Categoría</span><span className="text-right">Precio Unit.</span><span>Proveedor</span><span />
          </div>
          {items.map((m) => (
            <div key={m.id} className={`grid grid-cols-[40px_1fr_80px_80px_130px_120px_80px] gap-2 border-t border-steel-900/30 px-4 py-3 items-center hover:bg-steel-900/20 ${!m.isActive ? 'opacity-40' : ''}`}>
              <span className="font-mono text-caption text-steel-700">{m.code}</span>
              <span className="font-body text-body-sm text-arctic">{m.description}</span>
              <span className="font-mono text-caption text-steel-400">{m.unit}</span>
              <span className="font-body text-caption text-steel-500">{CATEGORIES[m.category] || m.category}</span>
              <span className="text-right font-mono text-body-sm text-[#48BB78]">{gs(m.unitPrice)}</span>
              <span className="font-body text-caption text-steel-500 truncate">{m.provider}</span>
              <div className="flex items-center gap-1">
                <button onClick={() => setEditing(m)} className="rounded p-1 text-steel-500 hover:text-arctic"><Save className="h-3.5 w-3.5" /></button>
                <button onClick={() => del(m.id)} className="rounded p-1 text-steel-700 hover:text-red-400"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {(showAdd || editing) && (
        <MaterialModal
          material={editing}
          onClose={() => { setShowAdd(false); setEditing(null); }}
          onSaved={() => { setShowAdd(false); setEditing(null); fetchData(); }}
        />
      )}
    </div>
  );
}

function MaterialModal({ material, onClose, onSaved }: { material: Material | null; onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [f, setF] = useState({
    description: material?.description || '', unit: material?.unit || 'un',
    unitPrice: material?.unitPrice ? String(material.unitPrice) : '', provider: material?.provider || '',
    category: material?.category || 'general', notes: material?.notes || '', isActive: material?.isActive ?? true,
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    const body = { ...f, unitPrice: Number(f.unitPrice) };
    if (material) {
      await fetch(`/api/materiales/${material.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    } else {
      await fetch('/api/materiales', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    }
    setSaving(false); onSaved();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-carbon/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-lg border border-steel-900/60 bg-carbon-light shadow-2xl">
        <div className="flex items-center justify-between border-b border-steel-900/40 px-6 py-4">
          <h2 className="font-display text-h3 text-arctic">{material ? 'Editar material' : 'Nuevo material'}</h2>
          <button onClick={onClose} className="rounded-md p-1.5 text-steel-500 hover:bg-steel-900"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={submit} className="space-y-4 p-6">
          <div><label className="label mb-1 block">Descripción *</label><input className="input" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} required /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label mb-1 block">Unidad</label><input className="input" value={f.unit} onChange={(e) => setF({ ...f, unit: e.target.value })} placeholder="un, ml, m², kg, gl..." /></div>
            <div><label className="label mb-1 block">Precio unitario (Gs.) *</label><input type="number" className="input font-mono" value={f.unitPrice} onChange={(e) => setF({ ...f, unitPrice: e.target.value })} required /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label mb-1 block">Categoría</label>
              <select className="input" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>
                {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div><label className="label mb-1 block">Proveedor</label><input className="input" value={f.provider} onChange={(e) => setF({ ...f, provider: e.target.value })} /></div>
          </div>
          <div><label className="label mb-1 block">Notas</label><input className="input" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="isActive" checked={f.isActive} onChange={(e) => setF({ ...f, isActive: e.target.checked })} className="h-4 w-4" />
            <label htmlFor="isActive" className="font-body text-body-sm text-steel-300">Activo (aparece en búsquedas)</label>
          </div>
          <button type="submit" disabled={saving || !f.description || !f.unitPrice} className="btn-primary w-full justify-center">
            {saving ? <><Loader2 className="h-4 w-4 animate-spin" />Guardando...</> : material ? 'Guardar cambios' : 'Crear material'}
          </button>
        </form>
      </div>
    </div>
  );
}
