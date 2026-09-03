'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Upload, GripVertical, Eye, EyeOff, Save, X, ImageIcon } from 'lucide-react';
import { ImageUploader } from '@/components/admin/image-uploader';

interface Slide {
  id: string;
  label: string;
  tag: string;
  description: string;
  photoUrl: string;
  accent: string;
  gradient: string;
  overlayOpacity: number;
  order: number;
  isActive: boolean;
}

const ACCENT_PRESETS = [
  { color: '#2D8FCC', label: 'Azul' },
  { color: '#E8862B', label: 'Naranja' },
  { color: '#48BB78', label: 'Verde' },
  { color: '#9F7AEA', label: 'Violeta' },
  { color: '#F6E05E', label: 'Amarillo' },
  { color: '#FC8181', label: 'Rojo' },
];

const GRADIENT_PRESETS = [
  { value: 'from-[#0a1628] via-[#1a3a5c] to-[#0d2340]', label: 'Azul noche' },
  { value: 'from-[#1a1200] via-[#2d2000] to-[#1a1200]', label: 'Ámbar oscuro' },
  { value: 'from-[#0a1a0f] via-[#0f2d1a] to-[#0a1a0f]', label: 'Verde oscuro' },
  { value: 'from-[#1a0a28] via-[#2d1a40] to-[#1a0a28]', label: 'Violeta' },
  { value: 'from-[#1a0a0a] via-[#2d1010] to-[#0a0a0a]', label: 'Rojo oscuro' },
  { value: 'from-[#0a0a0a] via-[#1a1a1a] to-[#0a0a0a]', label: 'Negro' },
];

function SlideEditor({
  slide,
  onSave,
  onClose,
}: {
  slide: Slide | null;
  onSave: (data: Partial<Slide>) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<Partial<Slide>>(
    slide ?? {
      label: '',
      tag: '',
      description: '',
      photoUrl: '',
      accent: '#2D8FCC',
      gradient: GRADIENT_PRESETS[0].value,
      overlayOpacity: 55,
      isActive: true,
    }
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="flex w-full max-w-lg flex-col rounded-xl border border-steel-800 bg-carbon-light shadow-2xl" style={{ maxHeight: '90vh' }}>
        {/* Header — fixed */}
        <div className="flex shrink-0 items-center justify-between border-b border-steel-800 px-5 py-4">
          <h2 className="font-display text-sm font-bold uppercase text-arctic">
            {slide ? 'Editar slide' : 'Nuevo slide'}
          </h2>
          <button onClick={onClose} className="text-steel-500 hover:text-arctic">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
        <div className="space-y-4 p-5">
          {/* Photo upload */}
          <ImageUploader
            label="Foto del trabajo"
            value={form.photoUrl || ''}
            onChange={(url) => setForm((f) => ({ ...f, photoUrl: url }))}
            hint="Subí una foto de un trabajo terminado (JPG, PNG, WEBP · máx 5 MB)"
            previewHeight="h-36"
          />

          {/* Overlay opacity — only relevant when photo is set */}
          {form.photoUrl && (
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="font-body text-xs text-steel-400">Oscuridad del fondo sobre la foto</label>
                <span className="font-body text-xs font-semibold text-arctic">{form.overlayOpacity ?? 55}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={form.overlayOpacity ?? 55}
                onChange={(e) => setForm((f) => ({ ...f, overlayOpacity: Number(e.target.value) }))}
                className="w-full accent-blue"
              />
              <div className="mt-1 flex justify-between font-body text-[0.6rem] text-steel-600">
                <span>0% — imagen limpia</span>
                <span>100% — fondo sólido</span>
              </div>
            </div>
          )}

          {/* Label */}
          <div>
            <label className="mb-1 block font-body text-xs text-steel-400">Título del slide *</label>
            <input
              className="admin-input w-full"
              value={form.label || ''}
              onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
              placeholder="Ej: Soldadura & Estructuras"
            />
          </div>

          {/* Tag */}
          <div>
            <label className="mb-1 block font-body text-xs text-steel-400">Categoría / tag</label>
            <input
              className="admin-input w-full"
              value={form.tag || ''}
              onChange={(e) => setForm((f) => ({ ...f, tag: e.target.value }))}
              placeholder="Ej: Metalurgica"
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-1 block font-body text-xs text-steel-400">Descripción corta</label>
            <textarea
              className="admin-input w-full resize-none"
              rows={2}
              value={form.description || ''}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Ej: Fabricación de rejas, portones y estructuras metálicas."
            />
          </div>

          {/* Accent color */}
          <div>
            <label className="mb-1.5 block font-body text-xs text-steel-400">Color de acento</label>
            <div className="flex flex-wrap gap-2">
              {ACCENT_PRESETS.map((p) => (
                <button
                  key={p.color}
                  title={p.label}
                  className={`h-7 w-7 rounded-full border-2 transition ${form.accent === p.color ? 'scale-110 border-white' : 'border-transparent'}`}
                  style={{ background: p.color }}
                  onClick={() => setForm((f) => ({ ...f, accent: p.color }))}
                />
              ))}
              <input
                type="color"
                value={form.accent || '#2D8FCC'}
                onChange={(e) => setForm((f) => ({ ...f, accent: e.target.value }))}
                className="h-7 w-7 cursor-pointer rounded-full border-0 bg-transparent"
                title="Color personalizado"
              />
            </div>
          </div>

          {/* Gradient */}
          <div>
            <label className="mb-1.5 block font-body text-xs text-steel-400">Fondo (cuando no hay foto)</label>
            <div className="flex flex-wrap gap-2">
              {GRADIENT_PRESETS.map((g) => (
                <button
                  key={g.value}
                  title={g.label}
                  className={`h-7 w-14 rounded border-2 bg-gradient-to-br text-[0.6rem] text-white transition ${form.gradient === g.value ? 'border-white' : 'border-transparent opacity-70'} ${g.value}`}
                  onClick={() => setForm((f) => ({ ...f, gradient: g.value }))}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          {/* Preview mini */}
          <div className="rounded-lg border border-steel-800 p-3">
            <p className="mb-2 font-body text-xs text-steel-500">Vista previa</p>
            <div className="relative flex h-20 items-end overflow-hidden rounded-lg">
              {form.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.photoUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
              ) : null}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${form.gradient || GRADIENT_PRESETS[0].value}`}
                style={{ opacity: form.photoUrl ? (form.overlayOpacity ?? 55) / 100 : 1 }}
              />
              <div
                className="absolute -right-4 -top-4 h-16 w-16 rounded-full opacity-30 blur-2xl"
                style={{ background: form.accent }}
              />
              <div className="relative z-10 px-3 pb-2">
                <span
                  className="rounded-full px-2 py-0.5 font-body text-[0.6rem] font-semibold uppercase"
                  style={{ background: (form.accent || '#2D8FCC') + '30', color: form.accent, border: `1px solid ${(form.accent || '#2D8FCC')}40` }}
                >
                  {form.tag || 'Tag'}
                </span>
                <p className="mt-0.5 font-display text-sm font-bold uppercase leading-tight text-white">
                  {form.label || 'Título'}
                </p>
              </div>
            </div>
          </div>
        </div>{/* end space-y-4 */}
        </div>{/* end scroll wrapper */}

        {/* Footer — fixed */}
        <div className="flex shrink-0 justify-end gap-2 border-t border-steel-800 px-5 py-4">
          <button onClick={onClose} className="btn-ghost text-xs">Cancelar</button>
          <button
            onClick={() => onSave(form)}
            disabled={!form.label}
            className="btn-primary text-xs disabled:opacity-40"
          >
            <Save className="h-3.5 w-3.5" />
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CarouselAdminPage() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Slide | null | 'new'>('new' as any);
  const [editorOpen, setEditorOpen] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/carousel-slides')
      .then((r) => r.json())
      .then((data) => {
        setSlides(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function saveSlide(data: Partial<Slide>) {
    const isNew = !editing || editing === 'new' || !(editing as Slide).id;
    const id = isNew ? null : (editing as Slide).id;
    setSaving(id ?? 'new');
    try {
      const res = await fetch(isNew ? '/api/carousel-slides' : `/api/carousel-slides/${id}`, {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const saved: Slide = await res.json();
      if (isNew) {
        setSlides((s) => [...s, saved]);
      } else {
        setSlides((s) => s.map((sl) => (sl.id === id ? saved : sl)));
      }
      setEditorOpen(false);
    } finally {
      setSaving(null);
    }
  }

  async function toggleActive(slide: Slide) {
    setSaving(slide.id);
    try {
      const res = await fetch(`/api/carousel-slides/${slide.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !slide.isActive }),
      });
      const updated: Slide = await res.json();
      setSlides((s) => s.map((sl) => (sl.id === slide.id ? updated : sl)));
    } finally {
      setSaving(null);
    }
  }

  async function deleteSlide(slide: Slide) {
    if (!confirm(`¿Eliminar el slide "${slide.label}"?`)) return;
    setSaving(slide.id);
    try {
      await fetch(`/api/carousel-slides/${slide.id}`, { method: 'DELETE' });
      setSlides((s) => s.filter((sl) => sl.id !== slide.id));
    } finally {
      setSaving(null);
    }
  }

  async function moveOrder(slide: Slide, dir: -1 | 1) {
    const idx = slides.findIndex((s) => s.id === slide.id);
    const target = slides[idx + dir];
    if (!target) return;
    setSaving(slide.id);
    try {
      await Promise.all([
        fetch(`/api/carousel-slides/${slide.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ order: target.order }) }),
        fetch(`/api/carousel-slides/${target.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ order: slide.order }) }),
      ]);
      const updated = [...slides];
      updated[idx] = { ...slide, order: target.order };
      updated[idx + dir] = { ...target, order: slide.order };
      setSlides(updated.sort((a, b) => a.order - b.order));
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-bold uppercase text-arctic">Carrusel del hero</h1>
          <p className="mt-0.5 font-body text-sm text-steel-400">
            Fotos de trabajos realizados que se muestran en la página de inicio.
          </p>
        </div>
        <button
          onClick={() => { setEditing(null); setEditorOpen(true); }}
          className="btn-primary text-xs"
        >
          <Plus className="h-3.5 w-3.5" />
          Nuevo slide
        </button>
      </div>

      {/* Info banner */}
      <div className="mb-5 rounded-lg border border-blue/20 bg-blue/5 px-4 py-3">
        <p className="font-body text-xs text-steel-300">
          <span className="font-semibold text-blue">Tip:</span> Subí fotos de tus trabajos terminados (soldaduras, obras, limpieza, etc.).
          Las imágenes se guardan en Vercel Blob y se muestran en el carrusel de la página de inicio.
          Tamaño recomendado: <strong className="text-arctic">800×600 px</strong> o superior, formato JPG o WEBP.
        </p>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center text-steel-500">Cargando…</div>
      ) : slides.length === 0 ? (
        <div className="flex h-40 flex-col items-center justify-center gap-3 text-steel-500">
          <ImageIcon className="h-10 w-10 opacity-30" />
          <p className="font-body text-sm">No hay slides todavía. Creá el primero.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {slides.map((slide, idx) => (
            <div
              key={slide.id}
              className={`flex items-center gap-3 rounded-xl border bg-carbon-light p-3 transition ${slide.isActive ? 'border-steel-800' : 'border-steel-900 opacity-50'}`}
            >
              {/* Drag handle / order */}
              <div className="flex flex-col gap-1">
                <button
                  disabled={idx === 0}
                  onClick={() => moveOrder(slide, -1)}
                  className="text-steel-600 hover:text-arctic disabled:opacity-20"
                  title="Subir"
                >
                  ▲
                </button>
                <GripVertical className="h-4 w-4 text-steel-700" />
                <button
                  disabled={idx === slides.length - 1}
                  onClick={() => moveOrder(slide, 1)}
                  className="text-steel-600 hover:text-arctic disabled:opacity-20"
                  title="Bajar"
                >
                  ▼
                </button>
              </div>

              {/* Thumbnail */}
              <div
                className={`h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br ${slide.gradient}`}
                style={{ position: 'relative' }}
              >
                {slide.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={slide.photoUrl} alt="" className="h-full w-full object-cover" style={{ position: 'absolute', inset: 0 }} />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <ImageIcon className="h-5 w-5 text-white/30" />
                  </div>
                )}
                <div
                  className="absolute inset-x-0 bottom-0 h-1 rounded-b-lg"
                  style={{ background: slide.accent }}
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-display text-sm font-bold text-arctic truncate">{slide.label}</p>
                <p className="font-body text-xs text-steel-400 truncate">{slide.tag}</p>
                {slide.description && (
                  <p className="mt-0.5 font-body text-xs text-steel-600 line-clamp-1">{slide.description}</p>
                )}
                {!slide.photoUrl && (
                  <span className="mt-1 inline-block rounded-full bg-orange/10 px-2 py-0.5 font-body text-[0.6rem] text-orange">
                    Sin foto — usando fondo de color
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => toggleActive(slide)}
                  disabled={saving === slide.id}
                  title={slide.isActive ? 'Ocultar' : 'Mostrar'}
                  className="rounded-lg p-2 text-steel-500 transition hover:bg-steel-900 hover:text-arctic"
                >
                  {slide.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => { setEditing(slide); setEditorOpen(true); }}
                  className="rounded-lg p-2 text-steel-500 transition hover:bg-steel-900 hover:text-arctic"
                >
                  <Upload className="h-4 w-4" />
                </button>
                <button
                  onClick={() => deleteSlide(slide)}
                  disabled={saving === slide.id}
                  className="rounded-lg p-2 text-steel-500 transition hover:bg-red-900/30 hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editorOpen && (
        <SlideEditor
          slide={editing && editing !== ('new' as any) ? (editing as Slide) : null}
          onSave={saveSlide}
          onClose={() => setEditorOpen(false)}
        />
      )}
    </div>
  );
}
