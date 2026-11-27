'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import { redimensionar } from '@/lib/redimensionar-imagen';

export interface Dep { id: string; nombre: string; direccion: string; responsable: string; notas: string; activo: boolean; articulos: number; bajoStock: number }
export interface Item { id: string; depositoId: string; deposito: string; codigo: string; nombre: string; descripcion: string; categoria: string; unidad: string; cantidad: number; stockMinimo: number; bajoStock: boolean; ubicacion: string; fotos: string[]; notas: string; activo: boolean }
export interface Mov { id: string; itemId: string; itemNombre: string; codigo: string; unidad: string; depositoNombre: string; tipo: string; delta: number; saldo: number; motivo: string; referencia: string; destinatario: string; foto: string; usuario: string; createdAt: string }
export interface Tras { id: string; numero: number; itemId: string; itemNombre: string; codigo: string; unidad: string; cantidad: number; origenId: string; origen: string; destinoId: string; destino: string; estado: string; motivo: string; nota: string; creadoPor: string; resueltoPor: string; createdAt: string; resueltoAt: string | null }

export const L = 'mb-1 block font-body text-caption text-steel-400';
export const IN = 'input w-full text-base sm:text-sm'; // 16 px en teléfono: evita el zoom automático de iOS
export const nf = (n: number) => n.toLocaleString('es-PY', { maximumFractionDigits: 3 });
export const fecha = (iso: string) => new Date(iso).toLocaleString('es-PY', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'America/Asuncion' });
export const TIPO_MOV: Record<string, string> = { ENTRADA: 'Entrada', SALIDA: 'Salida', AJUSTE: 'Ajuste', TRASLADO_SALIDA: 'Traslado (sale)', TRASLADO_ENTRADA: 'Traslado (entra)', TRASLADO_ANULADO: 'Traslado anulado' };

export async function api<T = Record<string, unknown>>(url: string, method: string, body?: object): Promise<T> {
  const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || 'No se pudo completar la operación');
  return j as T;
}

/** Reduce la foto en el teléfono y la sube; devuelve la URL. */
export async function subirFoto(f0: File): Promise<string> {
  const f = await redimensionar(f0);
  const fd = new FormData(); fd.append('file', f);
  const r = await fetch('/api/depositos/upload', { method: 'POST', body: fd });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`${f0.name}: ${j.error || 'no se pudo subir'}`);
  return j.url as string;
}

/** Ventana: hoja que sube desde abajo en el teléfono, cuadro centrado en pantallas grandes. */
export function Modal({ titulo, onClose, children, ancho }: { titulo: string; onClose: () => void; children: React.ReactNode; ancho?: boolean }) {
  useEffect(() => { const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose(); window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h); }, [onClose]);
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/60 sm:items-start sm:overflow-y-auto sm:p-4" role="dialog" aria-modal="true" aria-label={titulo} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={`card max-h-[92vh] w-full overflow-y-auto rounded-b-none p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:my-6 sm:max-h-none sm:rounded-b-xl sm:p-5 ${ancho ? 'sm:max-w-2xl' : 'sm:max-w-md'}`}>
        <div className="mb-3 flex items-center justify-between gap-2"><h2 className="font-display text-h3 text-arctic">{titulo}</h2><button onClick={onClose} aria-label="Cerrar" className="flex h-11 w-11 flex-none items-center justify-center text-steel-400 hover:text-arctic"><X className="h-5 w-5" /></button></div>
        {children}
      </div>
    </div>
  );
}
