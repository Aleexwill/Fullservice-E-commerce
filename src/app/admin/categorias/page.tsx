'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, Check, X, GripVertical, Tag } from 'lucide-react';

type Scope = 'productos' | 'trabajos' | 'servicios' | 'inventario';

interface Category {
  id: string;
  name: string;
  slug: string;
  scope: string;
  isActive: boolean;
  order: number;
}

const SCOPES: { key: Scope; label: string }[] = [
  { key: 'productos', label: 'Productos (tienda)' },
  { key: 'trabajos', label: 'Portfolio / Trabajos' },
  { key: 'servicios', label: 'Servicios' },
  { key: 'inventario', label: 'Inventario / Precios' },
];

function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function EditRow({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Partial<Category>;
  onSave: (data: { name: string; slug: string; order: number }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [slug, setSlug] = useState(initial?.slug ?? '');
  const [order, setOrder] = useState(String(initial?.order ?? 0));
  const [autoSlug, setAutoSlug] = useState(!initial?.id);

  return (
    <div className="flex items-center gap-2 rounded-lg border border-blue-bright/30 bg-blue-muted/10 px-3 py-2">
      <GripVertical className="h-4 w-4 shrink-0 text-steel-600" />
      <input
        className="input h-8 flex-1 text-sm"
        placeholder="Nombre"
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          if (autoSlug) setSlug(slugify(e.target.value));
        }}
        autoFocus
      />
      <input
        className="input h-8 w-44 text-sm font-mono"
        placeholder="slug"
        value={slug}
        onChange={(e) => { setSlug(e.target.value); setAutoSlug(false); }}
      />
      <input
        className="input h-8 w-16 text-sm"
        placeholder="Orden"
        type="number"
        value={order}
        onChange={(e) => setOrder(e.target.value)}
      />
      <button
        onClick={() => onSave({ name, slug, order: Number(order) || 0 })}
        disabled={!name.trim() || !slug.trim()}
        className="btn-primary h-8 px-3 text-xs"
      >
        <Check className="h-3.5 w-3.5" />
      </button>
      <button onClick={onCancel} className="h-8 rounded-lg border border-steel-700 px-3 text-steel-400 hover:border-steel-500 hover:text-arctic transition-colors text-xs">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export default function CategoriasPage() {
  const [activeScope, setActiveScope] = useState<Scope>('productos');
  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const load = useCallback(async (scope: Scope) => {
    setLoading(true);
    try {
      const r = await fetch(`/api/categorias?scope=${scope}`);
      const d = await r.json();
      setItems(d.items ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(activeScope); }, [activeScope, load]);

  const handleAdd = async (data: { name: string; slug: string; order: number }) => {
    const r = await fetch('/api/categorias', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, scope: activeScope }),
    });
    const d = await r.json();
    if (!r.ok) { showToast(d.error ?? 'Error'); return; }
    setAdding(false);
    await load(activeScope);
    showToast('Categoría creada');
  };

  const handleEdit = async (id: string, data: { name: string; slug: string; order: number }) => {
    const r = await fetch(`/api/categorias/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const d = await r.json();
    if (!r.ok) { showToast(d.error ?? 'Error'); return; }
    setEditingId(null);
    await load(activeScope);
    showToast('Categoría actualizada');
  };

  const handleToggle = async (item: Category) => {
    await fetch(`/api/categorias/${item.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !item.isActive }),
    });
    await load(activeScope);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta categoría?')) return;
    const r = await fetch(`/api/categorias/${id}`, { method: 'DELETE' });
    if (!r.ok) { showToast('Error al eliminar'); return; }
    await load(activeScope);
    showToast('Categoría eliminada');
  };

  return (
    <div className="p-6">
      {toast && (
        <div className="fixed right-4 top-4 z-50 rounded-lg bg-blue-bright px-4 py-2.5 font-body text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}

      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-muted">
          <Tag className="h-5 w-5 text-blue-bright" />
        </div>
        <div>
          <h1 className="font-display text-h3 text-arctic">Categorías</h1>
          <p className="font-body text-caption text-steel-500">Gestioná las categorías de cada sección</p>
        </div>
      </div>

      {/* Scope tabs */}
      <div className="mb-6 flex gap-1 rounded-xl border border-steel-900/40 bg-carbon-light p-1">
        {SCOPES.map((s) => (
          <button
            key={s.key}
            onClick={() => { setActiveScope(s.key); setAdding(false); setEditingId(null); }}
            className={`flex-1 rounded-lg px-3 py-2 font-body text-xs font-medium transition-colors ${
              activeScope === s.key
                ? 'bg-blue-muted/60 text-blue-bright shadow-sm'
                : 'text-steel-400 hover:text-arctic'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="rounded-xl border border-steel-900/40 bg-carbon-light">
        <div className="flex items-center justify-between border-b border-steel-900/40 px-4 py-3">
          <p className="font-body text-body-sm font-medium text-arctic">
            {SCOPES.find((s) => s.key === activeScope)?.label}
            <span className="ml-2 text-steel-500">({items.length})</span>
          </p>
          <button
            onClick={() => { setAdding(true); setEditingId(null); }}
            className="btn-primary h-8 px-3 text-xs"
          >
            <Plus className="h-3.5 w-3.5" /> Nueva
          </button>
        </div>

        <div className="divide-y divide-steel-900/20">
          {/* Header */}
          <div className="grid grid-cols-[1.5rem_1fr_12rem_5rem_6rem] gap-3 px-4 py-2 font-body text-[0.65rem] uppercase tracking-[0.08em] text-steel-600">
            <span />
            <span>Nombre</span>
            <span>Slug</span>
            <span>Orden</span>
            <span className="text-right">Acciones</span>
          </div>

          {loading && (
            <div className="px-4 py-8 text-center font-body text-body-sm text-steel-500">Cargando…</div>
          )}

          {!loading && items.length === 0 && !adding && (
            <div className="px-4 py-8 text-center font-body text-body-sm text-steel-500">
              Sin categorías. Agregá la primera.
            </div>
          )}

          {adding && (
            <div className="px-4 py-2">
              <EditRow
                onSave={handleAdd}
                onCancel={() => setAdding(false)}
              />
            </div>
          )}

          {items.map((item) => (
            <div key={item.id}>
              {editingId === item.id ? (
                <div className="px-4 py-2">
                  <EditRow
                    initial={item}
                    onSave={(data) => handleEdit(item.id, data)}
                    onCancel={() => setEditingId(null)}
                  />
                </div>
              ) : (
                <div className={`grid grid-cols-[1.5rem_1fr_12rem_5rem_6rem] items-center gap-3 px-4 py-2.5 transition-colors hover:bg-steel-900/20 ${!item.isActive ? 'opacity-50' : ''}`}>
                  <GripVertical className="h-4 w-4 text-steel-700" />
                  <span className="font-body text-body-sm text-arctic truncate">{item.name}</span>
                  <span className="font-mono text-[0.72rem] text-steel-500 truncate">{item.slug}</span>
                  <span className="font-body text-[0.72rem] text-steel-500">{item.order}</span>
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => handleToggle(item)}
                      title={item.isActive ? 'Desactivar' : 'Activar'}
                      className={`h-6 w-6 rounded flex items-center justify-center transition-colors ${item.isActive ? 'text-emerald-400 hover:bg-emerald-400/10' : 'text-steel-600 hover:bg-steel-700'}`}
                    >
                      <span className="h-2 w-2 rounded-full bg-current" />
                    </button>
                    <button
                      onClick={() => { setEditingId(item.id); setAdding(false); }}
                      className="h-6 w-6 rounded flex items-center justify-center text-steel-500 transition-colors hover:bg-steel-700 hover:text-arctic"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="h-6 w-6 rounded flex items-center justify-center text-steel-600 transition-colors hover:bg-red-500/10 hover:text-red-400"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
