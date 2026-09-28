'use client';

import { usePathname } from 'next/navigation';
import { Navbar } from './navbar';
import { Footer } from './footer';
import { BotyAssistant } from './boty-assistant';
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
      <Footer settings={settings} showStore={settings.sections?.showStore !== false} />
      <BotyAssistant />
    </div>
  );
}
