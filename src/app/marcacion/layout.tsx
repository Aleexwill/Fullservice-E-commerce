import type { Metadata, Viewport } from 'next';
import { ServiceWorkerRegister } from '@/components/marcacion/service-worker-register';
import '@/styles/marcacion.css';

// Esta sección es una PWA instalable independiente del sitio público:
// manifest propio (scope /marcacion/) y service worker propio.
export const metadata: Metadata = {
  title: 'Marcación',
  description: 'Marcación de jornada en terreno',
  manifest: '/marcacion/manifest.webmanifest',
  robots: { index: false, follow: false },
  icons: { icon: '/marcacion/icon-192.png', apple: '/marcacion/apple-touch-icon.png' },
  appleWebApp: { capable: true, title: 'Marcación', statusBarStyle: 'black-translucent' },
  other: { 'mobile-web-app-capable': 'yes' },
};

export const viewport: Viewport = {
  themeColor: '#0B1120',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function MarcacionLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mc-root">
      <ServiceWorkerRegister />
      {children}
    </div>
  );
}
