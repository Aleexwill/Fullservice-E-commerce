'use client';

import { usePathname } from 'next/navigation';
import { Navbar } from './navbar';
import { Footer } from './footer';
import { WhatsAppButton } from './whatsapp-button';
import type { SiteSettings } from '@/lib/settings-store';

export function PublicShell({ settings, children }: { settings: SiteSettings; children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith('/admin');

  return (
    <>
      {!isAdmin && <Navbar settings={settings} />}
      <main className={isAdmin ? '' : 'min-h-screen'}>{children}</main>
      {!isAdmin && <Footer settings={settings} />}
      {!isAdmin && <WhatsAppButton settings={settings} />}
    </>
  );
}
