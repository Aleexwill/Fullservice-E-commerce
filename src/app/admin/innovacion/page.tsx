'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Eye, EyeOff, Save, X, Video, ImageIcon, GripVertical, Film } from 'lucide-react';
import { ImageUploader } from '@/components/admin/image-uploader';

interface InnovacionItem {
  id: string;
  title: string;
  description: string;
  mediaUrl: string;
  mediaType: string;
  thumbnail: string;
  isActive: boolean;
  order: number;
}

function ItemEditor({
  item,
  onSave,
  onClose,
}: {
  item: InnovacionItem | null;
  onSave: (data: Partial<InnovacionItem>) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<Partial<InnovacionItem>>(
    item ?? {
      title: '',
      description: '',
      mediaUrl: '',
      mediaType: 'image',
      thumbnail: '',
      isActive: true,
    }
  );

  const isVideo = form.mediaType === 'video';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="flex w-full max-w-lg flex-col rounded-xl border border-steel-800 bg-carbon-light shadow-2xl" style={{ maxHeight: '92vh' }}>
        <div className="flex shrink-0 items-center justify-between border-b border-steel-800 px-5 py-4">
          <h2 className="font-display text-sm font-bold uppercase text-arctic">
            {item ? 'Editar innovación' : 'Nueva innovación'}
          </h2>
          <button onClick={onClose} className="text-steel-500 hover:text-arctic">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="space-y-4 p-5">
            {/* Tipo de media */}
            <div>
              <label className="mb-2 block font-body text-xs text-steel-400">Tipo de contenido</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, mediaType: 'image' }))}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-lg border py-2.5 font-body text-xs font-semibold transition ${
                    !isVideo
                      ? 'border-blue bg-blue/10 text-blue'
                      : 'border-steel-700 text-steel-400 hover:border-steel-500'
                  }`}
                >
                  <ImageIcon className="h-4 w-4" /> Imagen
                </button>
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, mediaType: 'video' }))}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-lg border py-2.5 font-body text-xs font-semibold transition ${
                    isVideo
                      ? 'border-blue bg-blue/10 text-blue'
                      : 'border-steel-700 text-steel-400 hover:border-steel-500'
                  }`}
                >
                  <Video className="h-4 w-4" /> Video
                </button>
              </div>
            </div>

            {/* Media upload */}
            {isVideo ? (
              <div>
                <label className="mb-1 block font-body text-xs text-steel-400">URL del video *</label>
                <input
                  className="admin-input w-full"
                  value={form.mediaUrl || ''}
                  onChange={(e) => setForm((f) => ({ ...f, mediaUrl: e.target.value }))}
                  placeholder="https://... (YouTube, Vimeo o directo MP4)"
                />
                <p className="mt-1 font-body text-[0.65rem] text-steel-500">
                  Pegá el link del video de YouTube, Vimeo, o una URL directa de archivo MP4.
                </p>
                <div className="mt-3">
                  <ImageUploader
                    label="Miniatura del video (opcional)"
                    value={form.thumbnail || ''}
                    onChange={(url) => setForm((f) => ({ ...f, thumbnail: url }))}
                    hint="Imagen de portada que se muestra antes de reproducir (JPG, PNG · máx 3 MB)"
                    previewHeight="h-28"
                  />
                </div>
              </div>
            ) : (
              <ImageUploader
                label="Imagen de la innovación *"
                value={form.mediaUrl || ''}
                onChange={(url) => setForm((f) => ({ ...f, mediaUrl: url, thumbnail: url }))}
                hint="Subí una imagen del proyecto o innovación (JPG, PNG, WEBP · máx 5 MB)"
                previewHeight="h-36"
              />
            )}

            {/* Title */}
            <div>
              <label className="mb-1 block font-body text-xs text-steel-400">Título *</label>
              <input
                className="admin-input w-full"
                value={form.title || ''}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Ej: Soldadura de alta precisión"
              />
            </div>

            {/* Description */}
            <div>
              <label className="mb-1 block font-body text-xs text-steel-400">Descripción</label>
              <textarea
                className="admin-input w-full resize-none"
                rows={3}
                value={form.description || ''}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Breve descripción de la innovación mostrada..."
              />
            </div>

            {/* Order */}
            <div>
              <label className="mb-1 block font-body text-xs text-steel-400">Orden</label>
              <input
                type="number"
                min={0}
                className="admin-input w-24"
                value={form.order ?? 0}
                onChange={(e) => setForm((f) => ({ ...f, order: Number(e.target.value) }))}
              />
            </div>

            {/* Active */}
            <label className="flex cursor-pointer items-center gap-3">
              <div className="relative">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={form.isActive !== false}
                  onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                />
                <div className={`h-5 w-9 rounded-full transition ${form.isActive !== false ? 'bg-blue' : 'bg-steel-700'}`} />
                <div className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${form.isActive !== false ? 'translate-x-4' : ''}`} />
              </div>
              <span className="font-body text-xs text-steel-400">Visible en la página pública</span>
            </label>
          </div>
        </div>

        <div className="flex shrink-0 justify-end gap-2 border-t border-steel-800 px-5 py-4">
          <button onClick={onClose} className="btn-ghost text-sm">Cancelar</button>
          <button
            onClick={() => onSave(form)}
            disabled={!form.title || (!form.mediaUrl && !isVideo)}
            className="btn-primary gap-2 text-sm disabled:opacity-40"
          >
            <Save className="h-3.5 w-3.5" /> Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminInnovacionPage() {
  const [items, setItems] = useState<InnovacionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<InnovacionItem | null | 'new'>('new' as unknown as null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Reset editing to null after initial load
  useEffect(() => {
    setEditing(null);
  }, []);

  useEffect(() => {
    fetch('/api/innovacion')
      .then((r) => r.json())
      .then((d) => { if (d.items) setItems(d.items); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(data: Partial<InnovacionItem>) {
    setSaving(true);
    try {
      const isNew = !editing || editing === 'new' || !(editing as InnovacionItem).id;
      const url = isNew ? '/api/innovacion' : `/api/innovacion/${(editing as InnovacionItem).id}`;
      const method = isNew ? 'POST' : 'PUT';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error('Error al guardar');
      const saved: InnovacionItem = await res.json();
      setItems((prev) =>
        isNew ? [saved, ...prev] : prev.map((i) => (i.id === saved.id ? saved : i))
      );
      setEditing(null);
    } catch {
      alert('Error al guardar. Intentá de nuevo.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar esta innovación? Esta acción no se puede deshacer.')) return;
    setDeleting(id);
    try {
      await fetch(`/api/innovacion/${id}`, { method: 'DELETE' });
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch {
      alert('Error al eliminar.');
    } finally {
      setDeleting(null);
    }
  }

  async function handleToggle(item: InnovacionItem) {
    const res = await fetch(`/api/innovacion/${item.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !item.isActive }),
    });
    if (res.ok) {
      const updated: InnovacionItem = await res.json();
      setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-bold uppercase text-arctic">Innovación</h1>
          <p className="mt-0.5 font-body text-xs text-steel-400">Galería de imágenes y videos para la página de Innovación</p>
        </div>
        <button onClick={() => setEditing({} as InnovacionItem)} className="btn-primary gap-2 text-sm">
          <Plus className="h-4 w-4" /> Nueva innovación
        </button>
      </div>

      {loading ? (
        <div className="py-16 text-center font-body text-sm text-steel-400">Cargando...</div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-steel-700 py-20 text-center">
          <Film className="mx-auto h-10 w-10 text-steel-600" />
          <p className="mt-3 font-body text-sm font-semibold text-steel-400">Sin contenido todavía</p>
          <p className="mt-1 font-body text-xs text-steel-500">Agregá imágenes o videos de innovaciones para mostrar en la página pública.</p>
          <button onClick={() => setEditing({} as InnovacionItem)} className="btn-primary mt-5 gap-2 text-sm">
            <Plus className="h-4 w-4" /> Agregar primera innovación
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <div
              key={item.id}
              className={`group relative overflow-hidden rounded-xl border transition ${
                item.isActive ? 'border-steel-700 bg-carbon' : 'border-steel-800 bg-carbon/50 opacity-60'
              }`}
            >
              {/* Thumbnail */}
              <div className="relative flex h-36 items-center justify-center bg-steel-900 overflow-hidden">
                {item.thumbnail || (item.mediaType === 'image' && item.mediaUrl) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.thumbnail || item.mediaUrl}
                    alt={item.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Film className="h-10 w-10 text-steel-600" />
                )}
                {item.mediaType === 'video' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <div className="rounded-full bg-white/90 p-2">
                      <Video className="h-5 w-5 text-[#0B1120]" />
                    </div>
                  </div>
                )}
              </div>

              <div className="p-3">
                <p className="font-body text-xs font-semibold text-arctic line-clamp-1">{item.title}</p>
                {item.description && (
                  <p className="mt-0.5 font-body text-[0.7rem] text-steel-400 line-clamp-2">{item.description}</p>
                )}
                <div className="mt-2 flex items-center gap-1">
                  <span className={`rounded-full px-2 py-0.5 font-body text-[0.6rem] font-semibold ${
                    item.mediaType === 'video' ? 'bg-orange-500/15 text-orange-400' : 'bg-blue/15 text-blue'
                  }`}>
                    {item.mediaType === 'video' ? 'Video' : 'Imagen'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-steel-800 px-3 py-2">
                <button
                  onClick={() => handleToggle(item)}
                  className={`flex items-center gap-1.5 font-body text-[0.7rem] transition ${
                    item.isActive ? 'text-green-400 hover:text-green-300' : 'text-steel-500 hover:text-steel-300'
                  }`}
                >
                  {item.isActive ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                  {item.isActive ? 'Visible' : 'Oculto'}
                </button>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setEditing(item)}
                    className="rounded-lg px-2.5 py-1.5 font-body text-[0.7rem] font-semibold text-steel-400 hover:bg-steel-800 hover:text-arctic transition"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={deleting === item.id}
                    className="rounded-lg p-1.5 text-steel-500 hover:bg-red-500/10 hover:text-red-400 transition disabled:opacity-40"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing !== null && (
        <ItemEditor
          item={typeof editing === 'object' && (editing as InnovacionItem).id ? (editing as InnovacionItem) : null}
          onSave={handleSave}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
