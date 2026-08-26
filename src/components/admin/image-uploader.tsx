'use client';

import { useRef, useState } from 'react';
import { Upload, X, ImageIcon, Loader2 } from 'lucide-react';

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
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    setUploading(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const json = await res.json();
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
        className={`group relative flex cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-steel-700 transition hover:border-blue ${previewHeight} ${uploading ? 'pointer-events-none' : ''}`}
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
        ) : uploading ? (
          <div className="flex flex-col items-center gap-2 text-steel-400">
            <Loader2 className="h-6 w-6 animate-spin text-blue" />
            <span className="font-body text-xs">Subiendo…</span>
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
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  async function upload(files: FileList) {
    setUploading(true);
    setError('');
    const uploaded: string[] = [];
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        const json = await res.json();
        if (!res.ok) { setError(json.error || 'Error al subir'); break; }
        uploaded.push(json.url);
      }
      if (uploaded.length > 0) onChange([...value, ...uploaded].slice(0, max));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al subir');
    } finally {
      setUploading(false);
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
          className={`flex h-20 cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-steel-700 transition hover:border-blue ${uploading ? 'pointer-events-none opacity-60' : ''}`}
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files.length) upload(e.dataTransfer.files); }}
        >
          {uploading ? (
            <Loader2 className="h-5 w-5 animate-spin text-blue" />
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
