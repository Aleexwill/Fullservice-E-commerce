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

  return {
    metadataBase: new URL(siteConfig.url),
    title: {
      default: title,
      template: `%s | ${settings.general.siteName || siteConfig.name}`,
    },
    description,
    openGraph: {
      type: 'website',
      locale: 'es_PY',
      url: siteConfig.url,
      siteName: settings.general.siteName || siteConfig.name,
      title,
      description,
      images: settings.seo.ogImage ? [settings.seo.ogImage] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: settings.general.siteName || siteConfig.name,
      description,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true },
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
    telephone: settings.contact.phone || siteConfig.phone,
    email: settings.contact.email || siteConfig.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: settings.contact.address || siteConfig.address.street,
      addressLocality: settings.contact.city || siteConfig.address.city,
      addressCountry: siteConfig.address.country,
    },
    openingHours: 'Mo-Fr 08:00-18:00, Sa 08:00-13:00',
    priceRange: '$$',
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
