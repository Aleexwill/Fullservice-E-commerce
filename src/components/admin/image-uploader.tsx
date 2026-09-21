'use client';

import { useRef, useState } from 'react';
import { Upload, X, ImageIcon, Loader2 } from 'lucide-react';

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_DIMENSION = 1920;

/** Comprime una imagen usando Canvas si supera MAX_BYTES. Devuelve un File listo para subir. */
async function compressIfNeeded(file: File): Promise<File> {
  if (file.size <= MAX_BYTES) return file;

  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;

      // Reducir dimensiones si exceden MAX_DIMENSION
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, width, height);

      // Bajar calidad iterativamente hasta entrar en MAX_BYTES
      let quality = 0.85;
      const tryBlob = () => {
        canvas.toBlob((blob) => {
          if (!blob) { resolve(file); return; }
          if (blob.size <= MAX_BYTES || quality <= 0.3) {
            resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }));
          } else {
            quality -= 0.1;
            tryBlob();
          }
        }, 'image/jpeg', quality);
      };
      tryBlob();
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}

interface Props {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  hint?: string;
  className?: string;
  previewHeight?: string; // Tailwind h-* class, default h-36
}

/** Single-image uploader: drag & drop or click → Vercel Blob → returns URL */
export function ImageUploader({ value, onChange, label, hint, className = '', previewHeight = 'h-36' }: Props) {
  const [uploading, setUploading] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    setError('');
    if (file.size > MAX_BYTES) {
      setCompressing(true);
      file = await compressIfNeeded(file);
      setCompressing(false);
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const text = await res.text();
      let json: any;
      try { json = JSON.parse(text); } catch { throw new Error('Error en el servidor al subir imagen'); }
      if (!res.ok) throw new Error(json.error || 'Error al subir');
      onChange(json.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al subir');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className={className}>
      {label && <label className="mb-1.5 block font-body text-xs text-steel-400">{label}</label>}

      <div
        className={`group relative flex cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-steel-700 transition hover:border-blue ${previewHeight} ${uploading || compressing ? 'pointer-events-none' : ''}`}
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files[0];
          if (file) upload(file);
        }}
      >
        {value ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-black/50 opacity-0 transition group-hover:opacity-100">
              <Upload className="h-5 w-5 text-white" />
              <span className="font-body text-xs text-white">Cambiar imagen</span>
            </div>
          </>
        ) : compressing || uploading ? (
          <div className="flex flex-col items-center gap-2 text-steel-400">
            <Loader2 className="h-6 w-6 animate-spin text-blue" />
            <span className="font-body text-xs">{compressing ? 'Optimizando…' : 'Subiendo…'}</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 px-4 text-center text-steel-500">
            <ImageIcon className="h-8 w-8 opacity-50" />
            <span className="font-body text-xs leading-relaxed">
              {hint || 'Clic o arrastrá una imagen (JPG, PNG, WEBP · máx 5 MB)'}
            </span>
          </div>
        )}
      </div>

      {error && <p className="mt-1 font-body text-xs text-red-400">{error}</p>}

      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="mt-1 inline-flex items-center gap-1 font-body text-xs text-steel-500 hover:text-red-400"
        >
          <X className="h-3 w-3" /> Quitar imagen
        </button>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) upload(f);
          e.target.value = '';
        }}
      />
    </div>
  );
}

interface MultiProps {
  value: string[];
  onChange: (urls: string[]) => void;
  label?: string;
  max?: number;
}

/** Multi-image uploader: add multiple images, show thumbnails with remove buttons */
export function MultiImageUploader({ value, onChange, label, max = 10 }: MultiProps) {
  const [uploading, setUploading] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  async function upload(files: FileList) {
    setError('');
    const uploaded: string[] = [];
    try {
      for (let file of Array.from(files)) {
        if (file.size > MAX_BYTES) {
          setCompressing(true);
          file = await compressIfNeeded(file);
          setCompressing(false);
        }
        setUploading(true);
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        const text = await res.text();
        let json: any;
        try { json = JSON.parse(text); } catch { setError('Error en el servidor al subir imagen'); break; }
        if (!res.ok) { setError(json.error || 'Error al subir'); break; }
        uploaded.push(json.url);
      }
      if (uploaded.length > 0) onChange([...value, ...uploaded].slice(0, max));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al subir');
    } finally {
      setUploading(false);
      setCompressing(false);
    }
  }

  const remove = (url: string) => onChange(value.filter((u) => u !== url));

  return (
    <div>
      {label && <label className="mb-1.5 block font-body text-xs text-steel-400">{label}</label>}

      {/* Thumbnails */}
      {value.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {value.map((url) => (
            <div key={url} className="group relative h-16 w-16 overflow-hidden rounded-md border border-steel-800">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => remove(url)}
                className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition group-hover:opacity-100"
              >
                <X className="h-4 w-4 text-white" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Drop zone */}
      {value.length < max && (
        <div
          className={`flex h-20 cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-steel-700 transition hover:border-blue ${uploading || compressing ? 'pointer-events-none opacity-60' : ''}`}
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files.length) upload(e.dataTransfer.files); }}
        >
          {compressing || uploading ? (
            <div className="flex items-center gap-2 text-steel-400">
              <Loader2 className="h-5 w-5 animate-spin text-blue" />
              <span className="font-body text-xs">{compressing ? 'Optimizando…' : 'Subiendo…'}</span>
            </div>
          ) : (
            <>
              <Upload className="h-4 w-4 text-steel-500" />
              <span className="font-body text-xs text-steel-500">
                Agregar imágenes ({value.length}/{max})
              </span>
            </>
          )}
        </div>
      )}

      {error && <p className="mt-1 font-body text-xs text-red-400">{error}</p>}

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        className="hidden"
        onChange={(e) => { if (e.target.files?.length) upload(e.target.files); e.target.value = ''; }}
      />
    </div>
  );
}
