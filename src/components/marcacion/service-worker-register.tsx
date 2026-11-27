'use client';

import { useEffect } from 'react';

/** Registra el service worker de /marcacion (alcance limitado a esa sección). */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/marcacion/sw.js', { scope: '/marcacion/' }).catch(() => {});
  }, []);
  return null;
}
