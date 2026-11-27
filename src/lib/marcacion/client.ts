'use client';

export interface Posicion { lat: number; lng: number; precisionM: number; t: number }

/** Pide el GPS al navegador con alta precisión. Rechaza con un mensaje en español. */
export function obtenerPosicion(timeout = 15000): Promise<Posicion> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) return reject(new Error('Este teléfono no permite usar la ubicación'));
    navigator.geolocation.getCurrentPosition(
      p => resolve({ lat: p.coords.latitude, lng: p.coords.longitude, precisionM: p.coords.accuracy, t: Date.now() }),
      err => reject(new Error(
        err.code === err.PERMISSION_DENIED ? 'Permití la ubicación en los ajustes del navegador para poder marcar'
          : err.code === err.TIMEOUT ? 'No se pudo obtener el GPS a tiempo. Salí a un lugar abierto e intentá de nuevo'
            : 'No se pudo obtener tu ubicación')),
      { enableHighAccuracy: true, timeout, maximumAge: 0 },
    );
  });
}

/** Sigue la posición en vivo (traslados). Devuelve la función para detener el seguimiento. */
export function seguirPosicion(onPos: (p: Posicion) => void, onError: (m: string) => void): () => void {
  if (!('geolocation' in navigator)) { onError('Este teléfono no permite usar la ubicación'); return () => {}; }
  const id = navigator.geolocation.watchPosition(
    p => onPos({ lat: p.coords.latitude, lng: p.coords.longitude, precisionM: p.coords.accuracy, t: Date.now() }),
    err => onError(err.code === err.PERMISSION_DENIED ? 'Permití la ubicación para ver tu distancia' : 'Sin señal de GPS'),
    { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 },
  );
  return () => navigator.geolocation.clearWatch(id);
}

/** Reduce una imagen a JPEG de hasta `max` px de lado (≈100-250 KB) y la devuelve como data URL. */
export async function comprimirImagen(src: Blob | HTMLVideoElement, max = 960, calidad = 0.78): Promise<string> {
  let w: number, h: number, draw: (c: CanvasRenderingContext2D, W: number, H: number) => void;
  if (src instanceof HTMLVideoElement) {
    w = src.videoWidth; h = src.videoHeight;
    draw = (c, W, H) => c.drawImage(src, 0, 0, W, H);
  } else {
    const bmp = await createImageBitmap(src);
    w = bmp.width; h = bmp.height;
    draw = (c, W, H) => c.drawImage(bmp, 0, 0, W, H);
  }
  const r = Math.min(1, max / Math.max(w, h));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(w * r); canvas.height = Math.round(h * r);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No se pudo procesar la imagen');
  draw(ctx, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', calidad);
}

export async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, headers: { 'Content-Type': 'application/json', ...init?.headers }, cache: 'no-store' });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) { window.location.href = '/marcacion/login'; throw new Error('Sesión vencida'); }
  if (!res.ok) throw new Error(data?.error ?? 'Error de conexión');
  return data as T;
}

export const hora = (iso: string) =>
  new Intl.DateTimeFormat('es-PY', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Asuncion' }).format(new Date(iso));
