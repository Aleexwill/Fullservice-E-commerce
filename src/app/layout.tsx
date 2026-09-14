import type { Metadata } from 'next';
import { IBM_Plex_Sans, IBM_Plex_Mono, Barlow_Condensed } from 'next/font/google';
import { PublicShell } from '@/components/layout/public-shell';
import { PageTracker } from '@/components/layout/page-tracker';
import { Toaster } from 'sonner';
import { siteConfig } from '@/config/site';
import { getCachedSettings } from '@/lib/settings-store';
import '@/styles/globals.css';

// Barlow Condensed — Display / Títulos
const barlowCondensed = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-display',
  display: 'swap',
});

// IBM Plex Sans — Cuerpo / UI
const plexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
});

// IBM Plex Mono — Datos técnicos
const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getCachedSettings();
  const title = settings.seo.metaTitle || `${siteConfig.name} — Mantenimiento · Limpieza · Servicios`;
  const description = settings.seo.metaDescription || siteConfig.description;

  const ogImage = settings.seo.ogImage || `${siteConfig.url}/og-image.png`;
  const siteName = settings.general.siteName || siteConfig.name;

  return {
    metadataBase: new URL(siteConfig.url),
    title: {
      default: title,
      template: `%s | ${siteName}`,
    },
    description,
    alternates: { canonical: siteConfig.url },
    openGraph: {
      type: 'website',
      locale: 'es_PY',
      url: siteConfig.url,
      siteName,
      title,
      description,
      images: [{ url: ogImage, width: 1200, height: 630, alt: siteName }],
    },
    twitter: {
      card: 'summary_large_image',
      title: siteName,
      description,
      images: [ogImage],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
    },
    icons: {
      icon: [
        { url: '/favicon.ico', sizes: 'any' },
        { url: '/icon.svg', type: 'image/svg+xml' },
      ],
      apple: '/apple-touch-icon.png',
    },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getCachedSettings();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: settings.general.siteName || siteConfig.name,
    description: settings.general.siteDescription || siteConfig.description,
    url: siteConfig.url,
    telephone: siteConfig.phone,
    email: siteConfig.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: siteConfig.address.street,
      addressLocality: siteConfig.address.city,
      addressRegion: siteConfig.address.state,
      addressCountry: siteConfig.address.country,
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: '-25.3477',
      longitude: '-57.6009',
    },
    openingHoursSpecification: [
      { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday','Tuesday','Wednesday','Thursday','Friday'], opens: '07:00', closes: '18:00' },
      { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Saturday'], opens: '08:00', closes: '13:00' },
    ],
    priceRange: '$$',
    image: `${siteConfig.url}/og-image.png`,
    sameAs: Object.values(settings.social).filter(Boolean),
  };

  return (
    <html
      lang="es"
      className={`${barlowCondensed.variable} ${plexSans.variable} ${plexMono.variable}`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="font-body text-[#0B1120] bg-white antialiased">
        <PublicShell settings={settings}>{children}</PublicShell>
        <PageTracker />
        <Toaster position="top-center" theme="dark" richColors />
      </body>
    </html>
  );
}
