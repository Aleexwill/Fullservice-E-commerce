'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Eye, EyeOff, Save, X, Megaphone, ChevronUp, ChevronDown } from 'lucide-react';
import { ImageUploader } from '@/components/admin/image-uploader';

interface Banner {
  id: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaUrl: string;
  imageUrl: string;
  bgColor: string;
  accentColor: string;
  badge: string;
  order: number;
  isActive: boolean;
}

const ACCENT_PRESETS = [
  '#2D8FCC', '#E8862B', '#48BB78', '#9F7AEA', '#F6E05E', '#FC8181', '#F687B3',
];

const BG_PRESETS = [
  { color: '#0a1628', label: 'Azul noche' },
  { color: '#1a0a00', label: 'Naranja oscuro' },
  { color: '#0a1a0f', label: 'Verde oscuro' },
  { color: '#1a0a28', label: 'Violeta oscuro' },
  { color: '#0a0a0a', label: 'Negro' },
  { color: '#1a1200', label: 'Ámbar oscuro' },
];

const EMPTY: Omit<Banner, 'id' | 'order' | 'isActive'> = {
  title: '', subtitle: '', ctaLabel: '', ctaUrl: '', imageUrl: '',
  bgColor: '#0a1628', accentColor: '#E8862B', badge: '',
};

function BannerEditor({ banner, onSave, onClose }: {
  banner: Banner | null;
  onSave: (data: Partial<Banner>) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<Partial<Banner>>(banner ?? { ...EMPTY, isActive: true });
  const f = (k: keyof Banner) => (v: any) => setForm((p) => ({ ...p, [k]: v }));

  // Live preview bg
  const previewStyle = {
    background: form.imageUrl
      ? `linear-gradient(105deg, ${form.bgColor}f0 45%, ${form.bgColor}80 75%, transparent 100%)`
      : form.bgColor,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="flex w-full max-w-2xl flex-col rounded-xl border border-steel-800 bg-carbon-light shadow-2xl" style={{ maxHeight: '92vh' }}>

        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-steel-800 px-5 py-4">
          <h2 className="font-display text-sm font-bold uppercase text-arctic">
            {banner ? 'Editar banner' : 'Nuevo banner promocional'}
          </h2>
          <button onClick={onClose}><X className="h-4 w-4 text-steel-500" /></button>
        </div>

        {/* Live preview */}
        <div className="shrink-0 relative overflow-hidden" style={{ minHeight: 120, ...previewStyle }}>
          {form.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={form.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
          )}
          <div className="absolute inset-0" style={previewStyle} />
          <div className="relative z-10 px-6 py-5">
            {form.badge && (
              <span className="mb-2 inline-block rounded-full px-2 py-0.5 font-body text-[0.6rem] font-bold uppercase tracking-widest"
                style={{ background: (form.accentColor || '#2D8FCC') + '30', color: form.accentColor, border: `1px solid ${form.accentColor}50` }}>
                {form.badge}
              </span>
            )}
            <h3 className="font-display text-lg font-bold uppercase leading-tight text-white">
              {form.title || 'Título del banner'}
            </h3>
            {form.subtitle && <p className="mt-1 font-body text-xs text-white/60">{form.subtitle}</p>}
            {form.ctaLabel && (
              <span className="mt-3 inline-block rounded-lg px-4 py-1.5 font-body text-xs font-bold uppercase text-carbon"
                style={{ background: form.accentColor }}>
                {form.ctaLabel}
              </span>
            )}
          </div>
        </div>

        {/* Scrollable form */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 gap-4 p-5">

            {/* Image */}
            <div className="col-span-2">
              <ImageUploader
                label="Imagen de fondo (opcional — se recomienda 1400×400 px)"
                value={form.imageUrl || ''}
                onChange={f('imageUrl')}
                previewHeight="h-28"
                hint="JPG, PNG, WEBP · máx 5 MB · horizontal/panorámica"
              />
            </div>

            {/* Title */}
            <div className="col-span-2">
              <label className="mb-1 block font-body text-xs text-steel-400">Título principal *</label>
              <input className="admin-input w-full" value={form.title || ''} onChange={(e) => f('title')(e.target.value)}
                placeholder="Ej: Hasta 30% OFF en herramientas" />
            </div>

            {/* Subtitle */}
            <div className="col-span-2">
              <label className="mb-1 block font-body text-xs text-steel-400">Subtítulo / descripción</label>
              <textarea className="admin-input w-full resize-none" rows={2} value={form.subtitle || ''}
                onChange={(e) => f('subtitle')(e.target.value)}
                placeholder="Ej: Ofertas válidas hasta fin de mes. Stock limitado." />
            </div>

            {/* Badge */}
            <div>
              <label className="mb-1 block font-body text-xs text-steel-400">Badge / etiqueta</label>
              <input className="admin-input w-full" value={form.badge || ''} onChange={(e) => f('badge')(e.target.value)}
                placeholder="Ej: OFERTA, NUEVO, HOY" />
            </div>

            {/* CTA label */}
            <div>
              <label className="mb-1 block font-body text-xs text-steel-400">Texto del botón</label>
              <input className="admin-input w-full" value={form.ctaLabel || ''} onChange={(e) => f('ctaLabel')(e.target.value)}
                placeholder="Ej: Ver ofertas" />
            </div>

            {/* CTA URL */}
            <div className="col-span-2">
              <label className="mb-1 block font-body text-xs text-steel-400">Enlace del botón</label>
              <input className="admin-input w-full" value={form.ctaUrl || ''} onChange={(e) => f('ctaUrl')(e.target.value)}
                placeholder="Ej: /tienda  o  /contacto?tipo=presupuesto" />
            </div>

            {/* Accent color */}
            <div>
              <label className="mb-1.5 block font-body text-xs text-steel-400">Color de acento (botón / badge)</label>
              <div className="flex flex-wrap gap-2">
                {ACCENT_PRESETS.map((c) => (
                  <button key={c} title={c}
                    className={`h-6 w-6 rounded-full border-2 transition ${form.accentColor === c ? 'scale-110 border-white' : 'border-transparent'}`}
                    style={{ background: c }} onClick={() => f('accentColor')(c)} />
                ))}
                <input type="color" value={form.accentColor || '#E8862B'}
                  onChange={(e) => f('accentColor')(e.target.value)}
                  className="h-6 w-6 cursor-pointer rounded-full border-0 bg-transparent" title="Personalizado" />
              </div>
            </div>

            {/* Bg color */}
            <div>
              <label className="mb-1.5 block font-body text-xs text-steel-400">Color de fondo</label>
              <div className="flex flex-wrap gap-2">
                {BG_PRESETS.map((p) => (
                  <button key={p.color} title={p.label}
                    className={`h-6 w-10 rounded border-2 transition ${form.bgColor === p.color ? 'border-white' : 'border-steel-700'}`}
                    style={{ background: p.color }} onClick={() => f('bgColor')(p.color)} />
                ))}
                <input type="color" value={form.bgColor || '#0a1628'}
                  onChange={(e) => f('bgColor')(e.target.value)}
                  className="h-6 w-6 cursor-pointer rounded border-0 bg-transparent" title="Personalizado" />
              </div>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="flex shrink-0 justify-end gap-2 border-t border-steel-800 px-5 py-4">
          <button onClick={onClose} className="btn-ghost text-xs">Cancelar</button>
          <button onClick={() => onSave(form)} disabled={!form.title}
            className="btn-primary text-xs disabled:opacity-40">
            <Save className="h-3.5 w-3.5" /> Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PromosAdminPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Banner | null | 'new'>('new' as any);
  const [editorOpen, setEditorOpen] = useState(false);

  useEffect(() => {
    fetch('/api/promo-banners')
      .then((r) => r.json())
      .then((d) => { setBanners(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function saveBanner(data: Partial<Banner>) {
    const isNew = !editing || editing === 'new' || !(editing as Banner).id;
    const id = isNew ? null : (editing as Banner).id;
    const res = await fetch(isNew ? '/api/promo-banners' : `/api/promo-banners/${id}`, {
      method: isNew ? 'POST' : 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const saved: Banner = await res.json();
    setBanners((b) => isNew ? [...b, saved] : b.map((x) => x.id === id ? saved : x));
    setEditorOpen(false);
  }

  async function toggle(banner: Banner) {
    const res = await fetch(`/api/promo-banners/${banner.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !banner.isActive }),
    });
    const updated: Banner = await res.json();
    setBanners((b) => b.map((x) => x.id === banner.id ? updated : x));
  }

  async function remove(banner: Banner) {
    if (!confirm(`¿Eliminar "${banner.title}"?`)) return;
    await fetch(`/api/promo-banners/${banner.id}`, { method: 'DELETE' });
    setBanners((b) => b.filter((x) => x.id !== banner.id));
  }

  async function move(banner: Banner, dir: -1 | 1) {
    const idx = banners.findIndex((b) => b.id === banner.id);
    const target = banners[idx + dir];
    if (!target) return;
    await Promise.all([
      fetch(`/api/promo-banners/${banner.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ order: target.order }) }),
      fetch(`/api/promo-banners/${target.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ order: banner.order }) }),
    ]);
    const updated = [...banners];
    updated[idx] = { ...banner, order: target.order };
    updated[idx + dir] = { ...target, order: banner.order };
    setBanners(updated.sort((a, b) => a.order - b.order));
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-bold uppercase text-arctic">Banners promocionales</h1>
          <p className="mt-0.5 font-body text-sm text-steel-400">
            Flyers y ofertas que se muestran en el inicio y en la tienda.
          </p>
        </div>
        <button onClick={() => { setEditing(null); setEditorOpen(true); }} className="btn-primary text-xs">
          <Plus className="h-3.5 w-3.5" /> Nuevo banner
        </button>
      </div>

      <div className="mb-5 rounded-lg border border-blue/20 bg-blue/5 px-4 py-3">
        <p className="font-body text-xs text-steel-300">
          <span className="font-semibold text-blue">Tip:</span> Usá imágenes horizontales (1400×400 px mínimo) para mejor resultado.
          Si no subís imagen, se usa el color de fondo. Los banners se rotan automáticamente cada 5 segundos.
        </p>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center text-steel-500">Cargando…</div>
      ) : banners.length === 0 ? (
        <div className="flex h-40 flex-col items-center justify-center gap-3 text-steel-500">
          <Megaphone className="h-10 w-10 opacity-30" />
          <p className="font-body text-sm">No hay banners. Creá el primero.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {banners.map((banner, idx) => (
            <div key={banner.id}
              className={`flex items-center gap-3 rounded-xl border bg-carbon-light p-3 transition ${banner.isActive ? 'border-steel-800' : 'border-steel-900 opacity-50'}`}>

              {/* Order controls */}
              <div className="flex flex-col gap-0.5">
                <button disabled={idx === 0} onClick={() => move(banner, -1)} className="text-steel-600 hover:text-arctic disabled:opacity-20"><ChevronUp className="h-3.5 w-3.5" /></button>
                <button disabled={idx === banners.length - 1} onClick={() => move(banner, 1)} className="text-steel-600 hover:text-arctic disabled:opacity-20"><ChevronDown className="h-3.5 w-3.5" /></button>
              </div>

              {/* Preview thumb */}
              <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded-lg"
                style={{ background: banner.bgColor }}>
                {banner.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={banner.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-60" />
                )}
                <div className="absolute inset-x-0 bottom-0 h-0.5" style={{ background: banner.accentColor }} />
                {banner.badge && (
                  <span className="absolute left-1.5 top-1.5 rounded-full px-1.5 py-0.5 font-body text-[0.6rem] font-bold"
                    style={{ background: banner.accentColor + '30', color: banner.accentColor }}>
                    {banner.badge}
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-display text-sm font-bold text-arctic truncate">{banner.title}</p>
                {banner.subtitle && <p className="font-body text-xs text-steel-400 truncate">{banner.subtitle}</p>}
                {banner.ctaLabel && (
                  <span className="mt-0.5 inline-block font-body text-[0.6rem] text-steel-500">
                    → {banner.ctaLabel} · {banner.ctaUrl}
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="flex shrink-0 items-center gap-1.5">
                <button onClick={() => toggle(banner)} title={banner.isActive ? 'Ocultar' : 'Mostrar'}
                  className="rounded-lg p-2 text-steel-500 transition hover:bg-steel-900 hover:text-arctic">
                  {banner.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
                <button onClick={() => { setEditing(banner); setEditorOpen(true); }}
                  className="rounded-lg p-2 text-steel-500 transition hover:bg-steel-900 hover:text-arctic">
                  <Save className="h-4 w-4" />
                </button>
                <button onClick={() => remove(banner)}
                  className="rounded-lg p-2 text-steel-500 transition hover:bg-red-900/30 hover:text-red-400">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editorOpen && (
        <BannerEditor
          banner={editing && editing !== ('new' as any) ? (editing as Banner) : null}
          onSave={saveBanner}
          onClose={() => setEditorOpen(false)}
        />
      )}
    </div>
  );
}
