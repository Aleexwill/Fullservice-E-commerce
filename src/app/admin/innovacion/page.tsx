'use client';

import { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Eye, EyeOff, Save, X, Video, ImageIcon, Film, Link2, Upload, Loader2 } from 'lucide-react';
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

// ─── Video uploader (file or URL tabs) ───────────────────────────────────────

function VideoInput({
  mediaUrl,
  thumbnail,
  onChangeUrl,
  onChangeThumbnail,
}: {
  mediaUrl: string;
  thumbnail: string;
  onChangeUrl: (url: string) => void;
  onChangeThumbnail: (url: string) => void;
}) {
  const [tab, setTab] = useState<'file' | 'url'>(mediaUrl && !mediaUrl.startsWith('blob') ? (mediaUrl.startsWith('http') && (mediaUrl.includes('youtube') || mediaUrl.includes('vimeo') || !mediaUrl.match(/\.(mp4|webm|mov)$/i)) ? 'url' : 'file') : 'file');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setUploadError('');
    setUploading(true);
    setProgress(0);

    // Simulate progress with XHR for better UX
    const formData = new FormData();
    formData.append('file', file);

    try {
      const xhr = new XMLHttpRequest();
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 95));
      };
      const result = await new Promise<{ url?: string; error?: string }>((resolve, reject) => {
        xhr.onload = () => {
          try { resolve(JSON.parse(xhr.responseText)); } catch { reject(new Error('Respuesta inválida')); }
        };
        xhr.onerror = () => reject(new Error('Error de red'));
        xhr.open('POST', '/api/upload-video');
        xhr.send(formData);
      });
      if (result.error) throw new Error(result.error);
      setProgress(100);
      onChangeUrl(result.url!);
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : 'Error al subir');
    } finally {
      setUploading(false);
    }
  }

  const isUploaded = mediaUrl && !mediaUrl.includes('youtube') && !mediaUrl.includes('vimeo') && mediaUrl.startsWith('http');

  return (
    <div className="space-y-3">
      {/* Tab switcher */}
      <div className="flex gap-1.5 rounded-lg border border-steel-700 bg-steel-900 p-1">
        <button
          type="button"
          onClick={() => setTab('file')}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 font-body text-xs font-semibold transition ${
            tab === 'file' ? 'bg-steel-700 text-arctic' : 'text-steel-400 hover:text-steel-200'
          }`}
        >
          <Upload className="h-3.5 w-3.5" /> Subir archivo
        </button>
        <button
          type="button"
          onClick={() => setTab('url')}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 font-body text-xs font-semibold transition ${
            tab === 'url' ? 'bg-steel-700 text-arctic' : 'text-steel-400 hover:text-steel-200'
          }`}
        >
          <Link2 className="h-3.5 w-3.5" /> URL externa
        </button>
      </div>

      {tab === 'file' ? (
        <div>
          {isUploaded && tab === 'file' && !mediaUrl.includes('youtube') && !mediaUrl.includes('vimeo') ? (
            <div className="flex items-center justify-between rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2.5">
              <div className="flex items-center gap-2 min-w-0">
                <Video className="h-4 w-4 shrink-0 text-green-400" />
                <span className="truncate font-body text-xs text-green-300">Video subido correctamente</span>
              </div>
              <button
                type="button"
                onClick={() => { onChangeUrl(''); if (inputRef.current) inputRef.current.value = ''; }}
                className="ml-2 shrink-0 text-steel-400 hover:text-red-400"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div
              onClick={() => !uploading && inputRef.current?.click()}
              className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 transition ${
                uploading ? 'border-steel-700 opacity-60' : 'border-steel-600 hover:border-blue hover:bg-blue/5'
              }`}
            >
              {uploading ? (
                <>
                  <Loader2 className="h-6 w-6 animate-spin text-blue" />
                  <p className="font-body text-xs text-steel-400">{progress}% subiendo...</p>
                  <div className="h-1.5 w-full max-w-[180px] rounded-full bg-steel-700">
                    <div className="h-full rounded-full bg-blue transition-all" style={{ width: `${progress}%` }} />
                  </div>
                </>
              ) : (
                <>
                  <Upload className="h-6 w-6 text-steel-500" />
                  <p className="font-body text-xs text-steel-400 text-center">
                    Hacé click para subir un video<br />
                    <span className="text-steel-500">MP4, WEBM, MOV · máx 200MB</span>
                  </p>
                </>
              )}
              <input
                ref={inputRef}
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
              />
            </div>
          )}
          {uploadError && (
            <p className="mt-1 font-body text-[0.68rem] text-red-400">{uploadError}</p>
          )}
        </div>
      ) : (
        <div>
          <input
            className="admin-input w-full"
            value={mediaUrl}
            onChange={(e) => onChangeUrl(e.target.value)}
            placeholder="https://youtube.com/watch?v=... o https://vimeo.com/..."
          />
          <p className="mt-1 font-body text-[0.65rem] text-steel-500">
            Pegá el link de YouTube, Vimeo, o URL directa de un MP4.
          </p>
        </div>
      )}

      {/* Thumbnail */}
      <div className="mt-1">
        <ImageUploader
          label="Miniatura del video (opcional)"
          value={thumbnail}
          onChange={onChangeThumbnail}
          hint="Imagen de portada (JPG, PNG · máx 3 MB)"
          previewHeight="h-24"
        />
      </div>
    </div>
  );
}

// ─── Item editor modal ────────────────────────────────────────────────────────

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
    item ?? { title: '', description: '', mediaUrl: '', mediaType: 'image', thumbnail: '', isActive: true }
  );

  const isVideo = form.mediaType === 'video';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="flex w-full max-w-lg flex-col rounded-xl border border-steel-800 bg-carbon-light shadow-2xl" style={{ maxHeight: '92vh' }}>
        <div className="flex shrink-0 items-center justify-between border-b border-steel-800 px-5 py-4">
          <h2 className="font-display text-sm font-bold uppercase text-arctic">
            {item ? 'Editar innovación' : 'Nueva innovación'}
          </h2>
          <button onClick={onClose} className="text-steel-500 hover:text-arctic"><X className="h-4 w-4" /></button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="space-y-4 p-5">
            {/* Tipo */}
            <div>
              <label className="mb-2 block font-body text-xs text-steel-400">Tipo de contenido</label>
              <div className="flex gap-2">
                {([['image', 'Imagen', ImageIcon], ['video', 'Video', Video]] as const).map(([type, label, Icon]) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, mediaType: type, mediaUrl: '', thumbnail: '' }))}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-lg border py-2.5 font-body text-xs font-semibold transition ${
                      form.mediaType === type
                        ? 'border-blue bg-blue/10 text-blue'
                        : 'border-steel-700 text-steel-400 hover:border-steel-500'
                    }`}
                  >
                    <Icon className="h-4 w-4" /> {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Media */}
            {isVideo ? (
              <div>
                <label className="mb-2 block font-body text-xs text-steel-400">Video *</label>
                <VideoInput
                  mediaUrl={form.mediaUrl || ''}
                  thumbnail={form.thumbnail || ''}
                  onChangeUrl={(url) => setForm((f) => ({ ...f, mediaUrl: url }))}
                  onChangeThumbnail={(url) => setForm((f) => ({ ...f, thumbnail: url }))}
                />
              </div>
            ) : (
              <ImageUploader
                label="Imagen *"
                value={form.mediaUrl || ''}
                onChange={(url) => setForm((f) => ({ ...f, mediaUrl: url, thumbnail: url }))}
                hint="JPG, PNG, WEBP · máx 5 MB"
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
              <label className="mb-1 block font-body text-xs text-steel-400">Descripción <span className="text-steel-600">(opcional)</span></label>
              <textarea
                className="admin-input w-full resize-none"
                rows={2}
                value={form.description || ''}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Breve descripción que aparece en el lightbox..."
              />
            </div>

            {/* Order + Active */}
            <div className="flex items-center gap-4">
              <div>
                <label className="mb-1 block font-body text-xs text-steel-400">Orden</label>
                <input
                  type="number"
                  min={0}
                  className="admin-input w-20"
                  value={form.order ?? 0}
                  onChange={(e) => setForm((f) => ({ ...f, order: Number(e.target.value) }))}
                />
              </div>
              <label className="flex cursor-pointer items-center gap-2.5 pt-4">
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
                <span className="font-body text-xs text-steel-400">Visible al público</span>
              </label>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 justify-end gap-2 border-t border-steel-800 px-5 py-4">
          <button onClick={onClose} className="btn-ghost text-sm">Cancelar</button>
          <button
            onClick={() => onSave(form)}
            disabled={!form.title || !form.mediaUrl}
            className="btn-primary gap-2 text-sm disabled:opacity-40"
          >
            <Save className="h-3.5 w-3.5" /> Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminInnovacionPage() {
  const [items, setItems] = useState<InnovacionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<InnovacionItem | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/innovacion')
      .then((r) => r.json())
      .then((d) => { if (d.items) setItems(d.items); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(data: Partial<InnovacionItem>) {
    const isNew = !editing?.id;
    const url = isNew ? '/api/innovacion' : `/api/innovacion/${editing!.id}`;
    const method = isNew ? 'POST' : 'PUT';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (!res.ok) { alert('Error al guardar.'); return; }
    const saved: InnovacionItem = await res.json();
    setItems((prev) => isNew ? [saved, ...prev] : prev.map((i) => (i.id === saved.id ? saved : i)));
    setShowEditor(false);
    setEditing(null);
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar esta innovación?')) return;
    setDeleting(id);
    await fetch(`/api/innovacion/${id}`, { method: 'DELETE' });
    setItems((prev) => prev.filter((i) => i.id !== id));
    setDeleting(null);
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
          <p className="mt-0.5 font-body text-xs text-steel-400">Galería de imágenes y videos para la página pública</p>
        </div>
        <button onClick={() => { setEditing(null); setShowEditor(true); }} className="btn-primary gap-2 text-sm">
          <Plus className="h-4 w-4" /> Nueva innovación
        </button>
      </div>

      {loading ? (
        <div className="py-16 text-center font-body text-sm text-steel-400">Cargando...</div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-steel-700 py-20 text-center">
          <Film className="mx-auto h-10 w-10 text-steel-600" />
          <p className="mt-3 font-body text-sm font-semibold text-steel-400">Sin contenido todavía</p>
          <p className="mt-1 font-body text-xs text-steel-500">Agregá imágenes o videos para mostrar en la página pública.</p>
          <button onClick={() => { setEditing(null); setShowEditor(true); }} className="btn-primary mt-5 gap-2 text-sm">
            <Plus className="h-4 w-4" /> Agregar primera innovación
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => {
            const thumb = item.thumbnail || (item.mediaType === 'image' ? item.mediaUrl : '');
            return (
              <div
                key={item.id}
                className={`overflow-hidden rounded-xl border transition ${
                  item.isActive ? 'border-steel-700 bg-carbon' : 'border-steel-800 bg-carbon/50 opacity-55'
                }`}
              >
                <div className="relative flex h-36 items-center justify-center bg-steel-900 overflow-hidden">
                  {thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={thumb} alt={item.title} className="h-full w-full object-cover" />
                  ) : (
                    <Film className="h-10 w-10 text-steel-600" />
                  )}
                  {item.mediaType === 'video' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <div className="rounded-full bg-white/90 p-2 shadow">
                        <Video className="h-4 w-4 text-[#0B1120]" />
                      </div>
                    </div>
                  )}
                </div>

                <div className="px-3 py-2.5">
                  <p className="font-body text-xs font-semibold text-arctic line-clamp-1">{item.title}</p>
                  <span className={`mt-1 inline-block rounded-full px-2 py-0.5 font-body text-[0.6rem] font-semibold ${
                    item.mediaType === 'video' ? 'bg-orange-500/15 text-orange-400' : 'bg-blue/15 text-blue'
                  }`}>
                    {item.mediaType === 'video' ? 'Video' : 'Imagen'}
                  </span>
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
                      onClick={() => { setEditing(item); setShowEditor(true); }}
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
            );
          })}
        </div>
      )}

      {showEditor && (
        <ItemEditor
          item={editing}
          onSave={handleSave}
          onClose={() => { setShowEditor(false); setEditing(null); }}
        />
      )}
    </div>
  );
}
