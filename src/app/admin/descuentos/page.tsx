'use client';

import { useState, useEffect, useCallback } from 'react';
import { Tag, Search, Percent, Calendar, X, Save, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import NextImage from 'next/image';
import { formatPrice } from '@/lib/utils';

interface Product {
  id: string;
  sku: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  images: string[];
  isFeatured: boolean;
  promoDiscountPercent: number | null;
  promoStartsAt: string | null;
  promoEndsAt: string | null;
}

function promoStatus(p: Product): 'active' | 'scheduled' | 'expired' | 'none' {
  if (!p.promoDiscountPercent) return 'none';
  const now = new Date();
  const start = p.promoStartsAt ? new Date(p.promoStartsAt) : null;
  const end = p.promoEndsAt ? new Date(p.promoEndsAt) : null;
  if (end && end < now) return 'expired';
  if (start && start > now) return 'scheduled';
  return 'active';
}

const STATUS_LABELS = {
  active:    { label: 'Activa',     color: 'border-success-bright/20 bg-success-light/10 text-success-bright' },
  scheduled: { label: 'Programada', color: 'border-blue/20 bg-blue-muted/50 text-blue-bright' },
  expired:   { label: 'Vencida',    color: 'border-steel-700 bg-steel-900/50 text-steel-400' },
  none:      { label: 'Sin promo',  color: 'border-steel-700 bg-steel-900/50 text-steel-500' },
};

interface EditState {
  productId: string;
  promoDiscountPercent: string;
  promoStartsAt: string;
  promoEndsAt: string;
}

function toDateLocal(iso: string | null): string {
  if (!iso) return '';
  return iso.slice(0, 16);
}

export default function DescuentosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'scheduled' | 'expired' | 'none'>('all');
  const [editing, setEditing] = useState<EditState | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/productos?limit=200&sortBy=name&order=asc');
      const data = await res.json();
      setProducts(data.products ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }

  function openEdit(p: Product) {
    setEditing({
      productId: p.id,
      promoDiscountPercent: p.promoDiscountPercent?.toString() ?? '',
      promoStartsAt: toDateLocal(p.promoStartsAt),
      promoEndsAt: toDateLocal(p.promoEndsAt),
    });
  }

  async function saveEdit() {
    if (!editing) return;
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        promoDiscountPercent: editing.promoDiscountPercent ? Number(editing.promoDiscountPercent) : null,
        promoStartsAt: editing.promoStartsAt ? new Date(editing.promoStartsAt).toISOString() : null,
        promoEndsAt: editing.promoEndsAt ? new Date(editing.promoEndsAt).toISOString() : null,
      };
      const res = await fetch(`/api/productos/${editing.productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Error al guardar');
      const updated: Product = await res.json();
      setProducts((prev) => prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)));
      setEditing(null);
      showToast('Descuento guardado');
    } catch {
      showToast('Error al guardar', false);
    } finally {
      setSaving(false);
    }
  }

  async function clearPromo(id: string) {
    try {
      const res = await fetch(`/api/productos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promoDiscountPercent: null, promoStartsAt: null, promoEndsAt: null }),
      });
      if (!res.ok) throw new Error();
      setProducts((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, promoDiscountPercent: null, promoStartsAt: null, promoEndsAt: null } : p
        )
      );
      showToast('Promo eliminada');
    } catch {
      showToast('Error al eliminar', false);
    }
  }

  const visible = products
    .filter((p) => {
      if (filter !== 'all' && promoStatus(p) !== filter) return false;
      const q = search.toLowerCase();
      return !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q);
    });

  const counts = {
    all: products.length,
    active: products.filter((p) => promoStatus(p) === 'active').length,
    scheduled: products.filter((p) => promoStatus(p) === 'scheduled').length,
    expired: products.filter((p) => promoStatus(p) === 'expired').length,
    none: products.filter((p) => promoStatus(p) === 'none').length,
  };

  const editingProduct = editing ? products.find((p) => p.id === editing.productId) : null;

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-h1 uppercase text-arctic">Descuentos & Promos</h1>
          <p className="mt-1 font-body text-body-sm text-steel-400">
            Aplicá descuentos por tiempo limitado a productos de la tienda
          </p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="mb-4 flex flex-wrap gap-2">
        {([
          { key: 'all',       short: 'Todos' },
          { key: 'active',    short: 'Activas' },
          { key: 'scheduled', short: 'Progr.' },
          { key: 'expired',   short: 'Venc.' },
          { key: 'none',      short: 'Sin promo' },
        ] as const).map(({ key, short }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`rounded-full border px-3 py-1 font-body text-body-sm transition-colors whitespace-nowrap ${
              filter === key
                ? 'border-blue bg-blue text-white'
                : 'border-steel-900/40 bg-carbon-light text-steel-400 hover:border-blue hover:text-arctic'
            }`}
          >
            {short} <span className="opacity-70">({counts[key]})</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-steel-500" />
        <input
          type="text"
          placeholder="Buscar producto, SKU, marca..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input pl-10"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="py-16 text-center font-body text-body-sm text-steel-500">Cargando productos…</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-steel-900/40">
          <table className="w-full">
            <thead>
              <tr className="border-b border-steel-900/40 bg-carbon-light">
                <th className="px-4 py-3 text-left font-body text-caption font-semibold text-steel-500">Producto</th>
                <th className="px-4 py-3 text-left font-body text-caption font-semibold text-steel-500">Precio</th>
                <th className="px-4 py-3 text-left font-body text-caption font-semibold text-steel-500">Descuento</th>
                <th className="px-4 py-3 text-left font-body text-caption font-semibold text-steel-500">Vigencia</th>
                <th className="px-4 py-3 text-left font-body text-caption font-semibold text-steel-500">Estado</th>
                <th className="px-4 py-3 text-right font-body text-caption font-semibold text-steel-500">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-steel-900/20">
              {visible.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center font-body text-body-sm text-steel-500">
                    Sin resultados
                  </td>
                </tr>
              )}
              {visible.map((p) => {
                const status = promoStatus(p);
                const { label, color } = STATUS_LABELS[status];
                const promoPrice = p.promoDiscountPercent ? p.price * (1 - p.promoDiscountPercent / 100) : null;
                return (
                  <tr key={p.id} className="hover:bg-steel-900/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-steel-900">
                          {p.images?.[0] ? (
                            <NextImage src={p.images[0]} alt={p.name} fill className="object-contain p-1" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-steel-600">
                              <Tag className="h-4 w-4" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-body text-body-sm font-semibold text-arctic line-clamp-1">{p.name}</p>
                          <p className="font-mono text-[0.65rem] text-steel-500">{p.sku}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-body text-body-sm font-semibold text-arctic">{formatPrice(p.price)}</p>
                        {promoPrice && (
                          <p className="font-body text-caption text-success-bright">{formatPrice(Math.round(promoPrice))}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {p.promoDiscountPercent ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-danger-light/10 px-2 py-0.5 font-body text-caption font-semibold text-danger-bright border border-danger-bright/20">
                          <Percent className="h-3 w-3" />
                          {p.promoDiscountPercent}% off
                        </span>
                      ) : (
                        <span className="font-body text-caption text-steel-600">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-body text-caption text-steel-300">
                      {p.promoStartsAt || p.promoEndsAt ? (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 flex-shrink-0 text-steel-500" />
                          <span>
                            {p.promoStartsAt ? new Date(p.promoStartsAt).toLocaleDateString('es-PY') : '—'}
                            {' → '}
                            {p.promoEndsAt ? new Date(p.promoEndsAt).toLocaleDateString('es-PY') : 'indefinido'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-steel-600">Sin fechas</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-body text-caption ${color}`}>
                        {status === 'active' && <CheckCircle2 className="h-3 w-3" />}
                        {status === 'scheduled' && <Clock className="h-3 w-3" />}
                        {status === 'expired' && <AlertCircle className="h-3 w-3" />}
                        {label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(p)}
                          className="btn-secondary py-1 px-3 text-body-sm"
                        >
                          Editar
                        </button>
                        {p.promoDiscountPercent && (
                          <button
                            onClick={() => clearPromo(p.id)}
                            className="rounded-lg border border-danger-bright/20 bg-danger-light/10 px-2 py-1 font-body text-caption text-danger-bright hover:bg-danger-light/20 transition-colors"
                            title="Quitar promo"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit modal */}
      {editing && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-carbon/70 p-4 backdrop-blur-sm">
          <div className="card w-full max-w-md">
            <div className="flex items-center justify-between border-b border-steel-900/40 px-6 py-4">
              <h2 className="font-display text-h3 text-arctic">Editar descuento</h2>
              <button onClick={() => setEditing(null)} className="text-steel-500 hover:text-arctic transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <p className="font-body text-body-sm font-semibold text-arctic line-clamp-2">{editingProduct.name}</p>
              <p className="font-body text-caption text-steel-400">Precio base: {formatPrice(editingProduct.price)}</p>

              <div>
                <label className="label">Descuento (%)</label>
                <div className="relative">
                  <Percent className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-steel-500" />
                  <input
                    type="number"
                    min="1"
                    max="99"
                    placeholder="ej. 20"
                    value={editing.promoDiscountPercent}
                    onChange={(e) => setEditing({ ...editing, promoDiscountPercent: e.target.value })}
                    className="input pl-10"
                  />
                </div>
                {editing.promoDiscountPercent && Number(editing.promoDiscountPercent) > 0 && (
                  <p className="mt-1 font-body text-caption text-success-bright">
                    Precio promo: {formatPrice(Math.round(editingProduct.price * (1 - Number(editing.promoDiscountPercent) / 100)))}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Inicio</label>
                  <input
                    type="datetime-local"
                    value={editing.promoStartsAt}
                    onChange={(e) => setEditing({ ...editing, promoStartsAt: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Fin</label>
                  <input
                    type="datetime-local"
                    value={editing.promoEndsAt}
                    onChange={(e) => setEditing({ ...editing, promoEndsAt: e.target.value })}
                    className="input"
                  />
                </div>
              </div>
              <p className="font-body text-caption text-steel-400">
                Dejá las fechas vacías para que la promo aplique indefinidamente.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-steel-900/40 px-6 py-4">
              <button onClick={() => setEditing(null)} className="btn-secondary">Cancelar</button>
              <button onClick={saveEdit} disabled={saving} className="btn-primary">
                <Save className="h-4 w-4" />
                {saving ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl px-4 py-3 shadow-lg font-body text-body-sm text-white ${toast.ok ? 'bg-success-bright' : 'bg-danger-bright'}`}>
          {toast.ok ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {toast.msg}
        </div>
      )}
    </div>
  );
}
