'use client';

import { useState } from 'react';
import { Paperclip, X } from 'lucide-react';
import { MAX_ADJUNTOS } from '@/lib/ti/etiquetas';

export interface Adjunto { url: string; nombre: string }

/** Selector de adjuntos (capturas o PDF, hasta 3). Sube cada archivo apenas se elige. */
export function SelectorAdjuntos({ valor, onChange }: { valor: Adjunto[]; onChange: (a: Adjunto[]) => void }) {
  const [subiendo, setSubiendo] = useState(false);
  const [err, setErr] = useState('');
  async function elegir(files: FileList | null) {
    if (!files?.length) return;
    setErr(''); setSubiendo(true);
    let lista = [...valor];
    for (const f of Array.from(files)) {
      if (lista.length >= MAX_ADJUNTOS) { setErr(`Máximo ${MAX_ADJUNTOS} archivos`); break; }
      const fd = new FormData(); fd.append('file', f);
      const r = await fetch('/api/ti/tickets/upload', { method: 'POST', body: fd });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) { setErr(`${f.name}: ${j.error || 'no se pudo subir'}`); continue; }
      lista = [...lista, { url: j.url, nombre: f.name.slice(0, 120) }];
    }
    onChange(lista); setSubiendo(false);
  }
  return (
    <div>
      <label className="btn-secondary inline-flex cursor-pointer items-center gap-2">
        <Paperclip className="h-4 w-4" />{subiendo ? 'Subiendo…' : 'Adjuntar captura o PDF'}
        <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" multiple className="sr-only" disabled={subiendo || valor.length >= MAX_ADJUNTOS} onChange={e => { elegir(e.target.files); e.target.value = ''; }} />
      </label>
      <span className="ml-2 text-caption text-steel-500">Hasta {MAX_ADJUNTOS} archivos de 4 MB</span>
      {err && <p role="alert" className="mt-1 text-caption text-danger-bright">{err}</p>}
      {valor.length > 0 && <ul className="mt-2 flex flex-wrap gap-2">{valor.map((a, i) => (
        <li key={i} className="flex items-center gap-1 rounded bg-steel-800 px-2 py-1 text-caption text-steel-100">{a.nombre}<button type="button" aria-label={`Quitar ${a.nombre}`} onClick={() => onChange(valor.filter((_, j) => j !== i))}><X className="h-3 w-3" /></button></li>))}</ul>}
    </div>
  );
}

export function ListaAdjuntos({ items }: { items: Adjunto[] }) {
  if (!items?.length) return null;
  return (
    <ul className="mt-2 flex flex-wrap gap-2">{items.map((a, i) => {
      const img = /^data:image|\.(jpe?g|png|webp)(\?|$)/i.test(a.url);
      return <li key={i}>{img
        // eslint-disable-next-line @next/next/no-img-element
        ? <a href={a.url} target="_blank" rel="noopener noreferrer"><img src={a.url} alt={a.nombre} className="h-24 w-auto rounded border border-steel-700 object-cover" /></a>
        : <a href={a.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded bg-steel-800 px-2 py-1 text-caption text-blue-bright"><Paperclip className="h-3 w-3" />{a.nombre}</a>}</li>;
    })}</ul>
  );
}
