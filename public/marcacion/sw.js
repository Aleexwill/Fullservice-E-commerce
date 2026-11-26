// Service worker de la PWA de marcación. Alcance: /marcacion/ (solo esta sección).
// Nunca cachea /api ni fotos: los datos de marcación siempre van a la red.
const VERSION = 'marcacion-v1';
const SHELL = ['/marcacion/icon-192.png', '/marcacion/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;

  // Archivos estáticos de Next y de la PWA: cache primero (llevan hash o cambian poco)
  if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/marcacion/icon')) {
    e.respondWith(
      caches.match(req).then(hit => hit || fetch(req).then(res => {
        if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
        return res;
      }))
    );
    return;
  }

  // Páginas de /marcacion: red primero; sin conexión, la última versión vista
  if (req.mode === 'navigate' && url.pathname.startsWith('/marcacion')) {
    e.respondWith(
      fetch(req).then(res => {
        if (res.ok && res.type === 'basic' && !res.redirected) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
        return res;
      }).catch(() => caches.match(req).then(hit => hit || new Response('Sin conexión. Volvé a intentar cuando tengas señal.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } })))
    );
  }
});
