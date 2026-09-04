'use client';

import { usePathname } from 'next/navigation';
import { Navbar } from './navbar';
import { Footer } from './footer';
import { WhatsAppButton } from './whatsapp-button';
import type { SiteSettings } from '@/lib/settings-store';

export function PublicShell({ settings, children }: { settings: SiteSettings; children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith('/admin');

  if (isAdmin) {
    return <main>{children}</main>;
  }

  return (
    <div className="public-site">
      <Navbar settings={settings} />
      <main className="min-h-screen">{children}</main>
      <Footer settings={settings} />
      <WhatsAppButton settings={settings} />
    </div>
  );
}
