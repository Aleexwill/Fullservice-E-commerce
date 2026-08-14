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

/**
 * Calcula si una promoción por tiempo está vigente ahora mismo y el precio
 * resultante. La promo (con fecha) tiene prioridad sobre compareAtPrice
 * (que sigue existiendo como "precio anterior" permanente, sin vigencia).
 * Sin dependencias de servidor a propósito, para poder usarse tanto en
 * componentes cliente como en API routes.
 */
export function getEffectivePrice(product: {
  price: number;
  promoDiscountPercent: number | null;
  promoStartsAt: string | null;
  promoEndsAt: string | null;
}) {
  const now = Date.now();
  const starts = product.promoStartsAt ? new Date(product.promoStartsAt).getTime() : null;
  const ends = product.promoEndsAt ? new Date(product.promoEndsAt).getTime() : null;
  const isOnSale =
    !!product.promoDiscountPercent &&
    product.promoDiscountPercent > 0 &&
    (starts === null || now >= starts) &&
    (ends === null || now <= ends);

  if (!isOnSale) return { isOnSale: false, price: product.price, discountPercent: 0 };

  const discountPercent = product.promoDiscountPercent!;
  const price = Math.round(product.price * (1 - discountPercent / 100));
  return { isOnSale: true, price, discountPercent };
}
