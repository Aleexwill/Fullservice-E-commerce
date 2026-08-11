import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('es-PY', {
    style: 'currency',
    currency: 'PYG',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatWhatsAppUrl(phone: string, message?: string): string {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const base = `https://wa.me/${cleanPhone}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

/**
 * fetch + parse JSON, devolviendo null ante cualquier respuesta no-ok
 * (401, 404, 500, etc.) en vez de propagar el body de error como si
 * fuera el dato esperado.
 */
export async function fetchJson<T = unknown>(input: RequestInfo | URL, init?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(input, init);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}
