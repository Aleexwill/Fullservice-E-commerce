'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Save,
  Loader2,
  X,
  Plus,
  Image as ImageIcon,
  Tag,
  Package,
  DollarSign,
  FileText,
  Settings,
  Trash2,
  Sparkles,
  Percent,
  Calendar,
} from 'lucide-react';
import AIAssistModal from './ai-assist-modal';

interface ProductFormData {
  sku: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  category: string;
  brand: string;
  price: string;
  compareAtPrice: string;
  stock: string;
  images: string[];
  specifications: Record<string, string>;
  tags: string[];
  isFeatured: boolean;
  isActive: boolean;
  promoDiscountPercent: string;
  promoStartsAt: string;
  promoEndsAt: string;
}

interface ProductFormProps {
  initialData?: ProductFormData;
  productId?: string;
  mode: 'create' | 'edit';
}

const CATEGORIES = [
  'Herramientas Manuales',
  'Herramientas Electricas',
  'Materiales de Construccion',
  'Seguridad Industrial',
  'Plomeria',
  'Electricidad',
  'Pinturas y Acabados',
  'Soldadura',
  'Ferreteria General',
  'EPP',
];

const defaultData: ProductFormData = {
  sku: '',
  name: '',
  slug: '',
  description: '',
  shortDescription: '',
  category: 'Ferreteria General',
  brand: '',
  price: '',
  compareAtPrice: '',
  stock: '',
  images: [],
  specifications: {},
  tags: [],
  isFeatured: false,
  isActive: true,
  promoDiscountPercent: '',
  promoStartsAt: '',
  promoEndsAt: '',
};

export default function ProductForm({ initialData, productId, mode }: ProductFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<ProductFormData>(initialData || defaultData);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Tags
  const [newTag, setNewTag] = useState('');

  // Specs
  const [specKey, setSpecKey] = useState('');
  const [specValue, setSpecValue] = useState('');

  // Images
  const [newImageUrl, setNewImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setUploadError('');
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        const body = new FormData();
        body.append('file', file);
        const res = await fetch('/api/upload', { method: 'POST', body });
        const data = await res.json();
        if (!res.ok) {
          setUploadError(data.error || `Error al subir ${file.name}`);
          continue;
        }
        uploaded.push(data.url);
      }
      if (uploaded.length > 0) {
        setForm((f) => ({ ...f, images: [...f.images, ...uploaded] }));
      }
    } catch {
      setUploadError('Error de conexión al subir la imagen');
    } finally {
      setUploading(false);
    }
  };

  // AI Assist
  const [aiModalOpen, setAiModalOpen] = useState(false);

  const handleAIApply = (fields: {
    shortDescription?: string;
    description?: string;
    tags?: string[];
  }) => {
    if (fields.shortDescription !== undefined) updateField('shortDescription', fields.shortDescription);
    if (fields.description !== undefined) updateField('description', fields.description);
    if (fields.tags !== undefined) updateField('tags', fields.tags);
  };

  const updateField = (field: keyof ProductFormData, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError('');
    setSuccess(false);
  };

  const addTag = () => {
    if (newTag.trim() && !form.tags.includes(newTag.trim())) {
      updateField('tags', [...form.tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    updateField('tags', form.tags.filter((t) => t !== tag));
  };

  const addSpec = () => {
    if (specKey.trim() && specValue.trim()) {
      updateField('specifications', {
        ...form.specifications,
        [specKey.trim()]: specValue.trim(),
      });
      setSpecKey('');
      setSpecValue('');
    }
  };

  const removeSpec = (key: string) => {
    const specs = { ...form.specifications };
    delete specs[key];
    updateField('specifications', specs);
  };

  const addImage = () => {
    if (newImageUrl.trim() && !form.images.includes(newImageUrl.trim())) {
      updateField('images', [...form.images, newImageUrl.trim()]);
      setNewImageUrl('');
    }
  };

  const removeImage = (url: string) => {
    updateField('images', form.images.filter((i) => i !== url));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    // Validation
    if (!form.name.trim()) { setError('El nombre es obligatorio'); setSaving(false); return; }
    if (!form.sku.trim()) { setError('El SKU es obligatorio'); setSaving(false); return; }
    if (!form.price || Number(form.price) <= 0) { setError('El precio debe ser mayor a 0'); setSaving(false); return; }

    try {
      const url = mode === 'create' ? '/api/productos' : `/api/productos/${productId}`;
      const method = mode === 'create' ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          price: Number(form.price),
          compareAtPrice: form.compareAtPrice ? Number(form.compareAtPrice) : null,
          stock: Number(form.stock) || 0,
          promoDiscountPercent: form.promoDiscountPercent ? Number(form.promoDiscountPercent) : null,
          promoStartsAt: form.promoStartsAt ? new Date(form.promoStartsAt).toISOString() : null,
          promoEndsAt: form.promoEndsAt ? new Date(form.promoEndsAt).toISOString() : null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al guardar');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/admin/productos');
        router.refresh();
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Error al guardar el producto');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error / Success messages */}
      {error && (
        <div className="alert-error flex items-center gap-2">
          <X className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
      {success && (
        <div className="alert-success flex items-center gap-2">
          <Save className="h-4 w-4 shrink-0" />
          Producto {mode === 'create' ? 'creado' : 'actualizado'} exitosamente. Redirigiendo...
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Left column - Main info */}
        <div className="space-y-6 xl:col-span-2">
          {/* Informacion basica */}
          <div className="card p-6">
            <div className="mb-4 flex items-center gap-2 border-b border-steel-900/40 pb-4">
              <Package className="h-5 w-5 text-blue-bright" />
              <h2 className="font-display text-h3 text-arctic">Informacion basica</h2>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-1.5 block font-body text-caption uppercase tracking-[0.06em] text-steel-300">
                  Nombre del producto *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="Ej: Taladro Percutor 800W DeWalt"
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block font-body text-caption uppercase tracking-[0.06em] text-steel-300">
                  SKU *
                </label>
                <input
                  type="text"
                  value={form.sku}
                  onChange={(e) => updateField('sku', e.target.value.toUpperCase())}
                  placeholder="Ej: HE-TAL-001"
                  className="input font-mono"
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block font-body text-caption uppercase tracking-[0.06em] text-steel-300">
                  Slug (URL)
                </label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => updateField('slug', e.target.value)}
                  placeholder="Se genera automaticamente"
                  className="input"
                />
              </div>
              <div className="md:col-span-2">
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="font-body text-caption uppercase tracking-[0.06em] text-steel-300">
                    Descripcion corta
                  </label>
                  <span className="font-mono text-[0.6rem] text-steel-700">
                    {form.shortDescription.length}/160
                  </span>
                </div>
                <input
                  type="text"
                  value={form.shortDescription}
                  onChange={(e) => updateField('shortDescription', e.target.value)}
                  placeholder="Escribe una breve descripcion y usa la IA para mejorarla..."
                  className="input"
                  maxLength={160}
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1.5 block font-body text-caption uppercase tracking-[0.06em] text-steel-300">
                  Descripcion completa
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  placeholder="Descripcion detallada del producto, caracteristicas, usos, etc."
                  className="input min-h-[120px] resize-y"
                  rows={5}
                />
              </div>

              {/* AI Assist Button */}
              <div className="md:col-span-2">
                <button
                  type="button"
                  onClick={() => setAiModalOpen(true)}
                  disabled={!form.name.trim()}
                  className="group relative flex w-full items-center gap-3 rounded-lg border border-dashed border-blue/30 bg-blue-muted/10 px-4 py-3.5 transition-all hover:border-blue/60 hover:bg-blue-muted/20 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-blue/30 disabled:hover:bg-blue-muted/10"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-blue-muted to-blue/20 transition-transform group-hover:scale-105">
                    <Sparkles className="h-4.5 w-4.5 text-blue-bright" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-display text-[0.8rem] font-semibold uppercase tracking-wide text-blue-bright">
                      {form.shortDescription || form.description
                        ? 'Mejorar con IA'
                        : 'Generar con IA'}
                    </p>
                    <p className="font-body text-caption text-steel-500">
                      {form.shortDescription || form.description
                        ? 'Optimiza tus descripciones para SEO y conversiones'
                        : 'Genera descripciones profesionales a partir de los datos del producto'}
                    </p>
                  </div>
                  <Sparkles className="h-4 w-4 text-blue/40 transition-colors group-hover:text-blue-bright" />
                </button>
                {!form.name.trim() && (
                  <p className="mt-1 font-body text-[0.6rem] text-steel-700">
                    Completa al menos el nombre del producto para activar la asistencia IA
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Precios y stock */}
          <div className="card p-6">
            <div className="mb-4 flex items-center gap-2 border-b border-steel-900/40 pb-4">
              <DollarSign className="h-5 w-5 text-[#48BB78]" />
              <h2 className="font-display text-h3 text-arctic">Precios y stock</h2>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="mb-1.5 block font-body text-caption uppercase tracking-[0.06em] text-steel-300">
                  Precio (Gs.) *
                </label>
                <input
                  type="number"
                  value={form.price}
                  onChange={(e) => updateField('price', e.target.value)}
                  placeholder="0"
                  className="input font-mono"
                  min="0"
                  step="1000"
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block font-body text-caption uppercase tracking-[0.06em] text-steel-300">
                  Precio anterior (Gs.)
                </label>
                <input
                  type="number"
                  value={form.compareAtPrice}
                  onChange={(e) => updateField('compareAtPrice', e.target.value)}
                  placeholder="Para mostrar descuento"
                  className="input font-mono"
                  min="0"
                  step="1000"
                />
              </div>
              <div>
                <label className="mb-1.5 block font-body text-caption uppercase tracking-[0.06em] text-steel-300">
                  Stock disponible
                </label>
                <input
                  type="number"
                  value={form.stock}
                  onChange={(e) => updateField('stock', e.target.value)}
                  placeholder="0"
                  className="input font-mono"
                  min="0"
                />
              </div>
            </div>
            {form.compareAtPrice && Number(form.compareAtPrice) > Number(form.price) && (
              <div className="mt-3 rounded-md bg-[#48BB78]/10 px-3 py-2 font-body text-caption text-[#48BB78]">
                Descuento: {Math.round((1 - Number(form.price) / Number(form.compareAtPrice)) * 100)}% OFF
              </div>
            )}
          </div>

          {/* Promocion por tiempo */}
          <div className="card p-6">
            <div className="mb-4 flex items-center gap-2 border-b border-steel-900/40 pb-4">
              <Percent className="h-5 w-5 text-orange" />
              <h2 className="font-display text-h3 text-arctic">Promocion</h2>
            </div>
            <p className="mb-4 font-body text-caption text-steel-500">
              Descuento temporal que se activa y desactiva solo segun las fechas. Dejar el descuento vacio para no tener promocion activa.
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1.5 block font-body text-caption uppercase tracking-[0.06em] text-steel-300">
                  Descuento (%)
                </label>
                <input
                  type="number"
                  value={form.promoDiscountPercent}
                  onChange={(e) => updateField('promoDiscountPercent', e.target.value)}
                  placeholder="Ej: 20"
                  className="input font-mono"
                  min="1"
                  max="90"
                />
              </div>
              <div>
                <label className="mb-1.5 flex items-center gap-1 font-body text-caption uppercase tracking-[0.06em] text-steel-300">
                  <Calendar className="h-3 w-3" /> Desde
                </label>
                <input
                  type="datetime-local"
                  value={form.promoStartsAt}
                  onChange={(e) => updateField('promoStartsAt', e.target.value)}
                  className="input font-mono"
                />
              </div>
              <div>
                <label className="mb-1.5 flex items-center gap-1 font-body text-caption uppercase tracking-[0.06em] text-steel-300">
                  <Calendar className="h-3 w-3" /> Hasta
                </label>
                <input
                  type="datetime-local"
                  value={form.promoEndsAt}
                  onChange={(e) => updateField('promoEndsAt', e.target.value)}
                  className="input font-mono"
                />
              </div>
            </div>
            {form.promoDiscountPercent && Number(form.price) > 0 && (
              <div className="mt-3 rounded-md bg-orange/10 px-3 py-2 font-body text-caption text-orange">
                Precio en promocion: {Math.round(Number(form.price) * (1 - Number(form.promoDiscountPercent) / 100)).toLocaleString('es-PY')} Gs.
              </div>
            )}
          </div>

          {/* Imagenes */}
          <div className="card p-6">
            <div className="mb-4 flex items-center gap-2 border-b border-steel-900/40 pb-4">
              <ImageIcon className="h-5 w-5 text-blue-bright" />
              <h2 className="font-display text-h3 text-arctic">Imagenes</h2>
            </div>

            {/* Subir desde la computadora */}
            <label
              className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-steel-900/50 p-6 text-center transition-colors hover:border-blue-bright/50 ${uploading ? 'pointer-events-none opacity-60' : ''}`}
            >
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                className="hidden"
                onChange={(e) => { handleFileUpload(e.target.files); e.target.value = ''; }}
                disabled={uploading}
              />
              {uploading ? (
                <Loader2 className="h-6 w-6 animate-spin text-blue-bright" />
              ) : (
                <ImageIcon className="h-6 w-6 text-steel-500" />
              )}
              <span className="font-body text-caption text-steel-300">
                {uploading ? 'Subiendo...' : 'Click para subir imagenes (JPG, PNG, WEBP, GIF - max 5MB)'}
              </span>
            </label>
            {uploadError && (
              <p className="mt-2 font-body text-caption text-red-400">{uploadError}</p>
            )}

            {/* O pegar una URL */}
            <div className="mt-4 flex gap-2">
              <input
                type="url"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder="...o pegar la URL de una imagen (https://...)"
                className="input flex-1"
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addImage())}
              />
              <button type="button" onClick={addImage} className="btn-secondary shrink-0">
                <Plus className="h-4 w-4" />
                Agregar
              </button>
            </div>
            {form.images.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                {form.images.map((url, i) => (
                  <div key={i} className="group relative overflow-hidden rounded-lg border border-steel-900/40 bg-steel-900">
                    <img
                      src={url}
                      alt={`Imagen ${i + 1}`}
                      className="aspect-square w-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).src = ''; }}
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(url)}
                      className="absolute right-1 top-1 rounded-md bg-carbon/80 p-1 text-red-400 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-500/20"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                    {i === 0 && (
                      <span className="absolute bottom-1 left-1 rounded bg-blue-muted px-1.5 py-0.5 font-body text-[0.55rem] font-medium text-blue-bright">
                        Principal
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
            <p className="mt-2 font-body text-caption text-steel-500">
              La primera imagen sera la imagen principal del producto.
            </p>
          </div>

          {/* Especificaciones tecnicas */}
          <div className="card p-6">
            <div className="mb-4 flex items-center gap-2 border-b border-steel-900/40 pb-4">
              <Settings className="h-5 w-5 text-steel-300" />
              <h2 className="font-display text-h3 text-arctic">Especificaciones tecnicas</h2>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={specKey}
                onChange={(e) => setSpecKey(e.target.value)}
                placeholder="Atributo (ej: Potencia)"
                className="input flex-1"
              />
              <input
                type="text"
                value={specValue}
                onChange={(e) => setSpecValue(e.target.value)}
                placeholder="Valor (ej: 800W)"
                className="input flex-1"
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSpec())}
              />
              <button type="button" onClick={addSpec} className="btn-secondary shrink-0">
                <Plus className="h-4 w-4" />
              </button>
            </div>
            {Object.keys(form.specifications).length > 0 && (
              <div className="mt-3 overflow-hidden rounded-lg border border-steel-900/40">
                {Object.entries(form.specifications).map(([key, val]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between border-b border-steel-900/20 px-3 py-2 last:border-0"
                  >
                    <span className="font-body text-body-sm text-steel-300">{key}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-caption text-arctic">{val}</span>
                      <button
                        type="button"
                        onClick={() => removeSpec(key)}
                        className="text-steel-700 hover:text-red-400"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column - Sidebar */}
        <div className="space-y-6">
          {/* Clasificacion */}
          <div className="card p-6">
            <div className="mb-4 flex items-center gap-2 border-b border-steel-900/40 pb-4">
              <Tag className="h-5 w-5 text-yellow-bright" />
              <h2 className="font-display text-h3 text-arctic">Clasificacion</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block font-body text-caption uppercase tracking-[0.06em] text-steel-300">
                  Categoria
                </label>
                <select
                  value={form.category}
                  onChange={(e) => updateField('category', e.target.value)}
                  className="input"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block font-body text-caption uppercase tracking-[0.06em] text-steel-300">
                  Marca
                </label>
                <input
                  type="text"
                  value={form.brand}
                  onChange={(e) => updateField('brand', e.target.value)}
                  placeholder="Ej: DeWalt, Bosch, Stanley"
                  className="input"
                />
              </div>
            </div>
          </div>

          {/* Visibilidad */}
          <div className="card p-6">
            <div className="mb-4 flex items-center gap-2 border-b border-steel-900/40 pb-4">
              <FileText className="h-5 w-5 text-blue-bright" />
              <h2 className="font-display text-h3 text-arctic">Visibilidad</h2>
            </div>
            <div className="space-y-3">
              <label className="flex cursor-pointer items-center gap-3 rounded-md p-2 transition-colors hover:bg-steel-900/30">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => updateField('isActive', e.target.checked)}
                  className="h-4 w-4 rounded border-steel-700 bg-steel-900 text-blue accent-blue"
                />
                <div>
                  <p className="font-body text-body-sm text-arctic">Producto activo</p>
                  <p className="font-body text-caption text-steel-500">
                    Visible en la tienda publica
                  </p>
                </div>
              </label>
              <label className="flex cursor-pointer items-center gap-3 rounded-md p-2 transition-colors hover:bg-steel-900/30">
                <input
                  type="checkbox"
                  checked={form.isFeatured}
                  onChange={(e) => updateField('isFeatured', e.target.checked)}
                  className="h-4 w-4 rounded border-steel-700 bg-steel-900 text-yellow-bright accent-yellow-bright"
                />
                <div>
                  <p className="font-body text-body-sm text-arctic">Producto destacado</p>
                  <p className="font-body text-caption text-steel-500">
                    Aparece en la seccion de destacados
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Tags */}
          <div className="card p-6">
            <div className="mb-4 flex items-center gap-2 border-b border-steel-900/40 pb-4">
              <Tag className="h-5 w-5 text-steel-300" />
              <h2 className="font-display text-h3 text-arctic">Etiquetas</h2>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Agregar etiqueta"
                className="input flex-1"
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <button type="button" onClick={addTag} className="btn-secondary shrink-0">
                <Plus className="h-4 w-4" />
              </button>
            </div>
            {form.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {form.tags.map((tag) => (
                  <span key={tag} className="badge-blue flex items-center gap-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-0.5 hover:text-red-400"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={saving || success}
            className="btn-primary w-full justify-center gap-2 py-3"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : success ? (
              <>
                <Save className="h-4 w-4" />
                Guardado!
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                {mode === 'create' ? 'Crear producto' : 'Guardar cambios'}
              </>
            )}
          </button>
        </div>
      </div>

      {/* AI Assist Modal */}
      <AIAssistModal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        productContext={{
          name: form.name,
          brand: form.brand,
          category: form.category,
          shortDescription: form.shortDescription,
          description: form.description,
          specifications: form.specifications,
          tags: form.tags,
          price: form.price,
        }}
        onApply={handleAIApply}
      />
    </form>
  );
}
