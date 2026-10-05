'use client';

import { createContext, useContext } from 'react';
import type { SiteSettings } from './settings-store';

const SettingsContext = createContext<SiteSettings | null>(null);

export function SettingsProvider({ settings, children }: { settings: SiteSettings; children: React.ReactNode }) {
  return <SettingsContext.Provider value={settings}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SiteSettings | null {
  return useContext(SettingsContext);
}
