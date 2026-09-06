'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light';

interface ThemeCtx {
  theme: Theme;
  toggle: () => void;
}

const Ctx = createContext<ThemeCtx>({ theme: 'dark', toggle: () => {} });

export function AdminThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    const saved = localStorage.getItem('fs-theme') as Theme | null;
    if (saved === 'light' || saved === 'dark') setTheme(saved);

    const handler = (e: StorageEvent) => {
      if (e.key === 'fs-theme' && (e.newValue === 'light' || e.newValue === 'dark')) {
        setTheme(e.newValue);
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const toggle = () => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('fs-theme', next);
      return next;
    });
  };

  return <Ctx.Provider value={{ theme, toggle }}>{children}</Ctx.Provider>;
}

const LIGHT_CSS = `
.admin-shell[data-theme="light"]{color-scheme:light}

/* Shell backgrounds */
.admin-shell[data-theme="light"] .bg-carbon{background-color:#f0f2f5!important}
.admin-shell[data-theme="light"] .bg-carbon-light{background-color:#ffffff!important}
.admin-shell[data-theme="light"] .bg-steel-900{background-color:#e8ecf2!important}
.admin-shell[data-theme="light"] .bg-blue-muted{background-color:#dbeeff!important}

/* Status / semantic backgrounds */
.admin-shell[data-theme="light"] .bg-success-light{background-color:#dcfce7!important}
.admin-shell[data-theme="light"] .bg-yellow-muted,.admin-shell[data-theme="light"] .bg-orange-muted{background-color:#fef9c3!important}
.admin-shell[data-theme="light"] .bg-danger-light{background-color:#fee2e2!important}

/* Table hardcoded backgrounds */
.admin-shell[data-theme="light"] .theme-table-bg{background-color:#f8fafc!important}
.admin-shell[data-theme="light"] .theme-table-head{background-color:#e2e8f0!important}

/* Borders */
.admin-shell[data-theme="light"] [class*="border-steel-900"]{border-color:rgba(0,0,0,.1)!important}
.admin-shell[data-theme="light"] [class*="border-steel-800"]{border-color:#d1d9e6!important}
.admin-shell[data-theme="light"] [class*="border-steel-700"]{border-color:#d1d9e6!important}

/* Text */
.admin-shell[data-theme="light"] .text-arctic{color:#0B1120!important}
.admin-shell[data-theme="light"] .text-cloud{color:#1e2a40!important}
.admin-shell[data-theme="light"] .text-steel-100{color:#1e2a40!important}
.admin-shell[data-theme="light"] .text-steel-300{color:#3a4e6e!important}
.admin-shell[data-theme="light"] .text-steel-400{color:#4a5e80!important}
.admin-shell[data-theme="light"] .text-steel-500{color:#6a7e9a!important}
.admin-shell[data-theme="light"] .text-steel-600{color:#64748b!important}
.admin-shell[data-theme="light"] .text-steel-700{color:#475569!important}
.admin-shell[data-theme="light"] .text-blue-bright{color:#1a5d9a!important}
.admin-shell[data-theme="light"] .text-yellow-bright{color:#854d0e!important}

/* Hover states */
.admin-shell[data-theme="light"] [class*="hover:bg-steel-900"]:hover{background-color:#e8ecf2!important}
.admin-shell[data-theme="light"] [class*="hover:text-arctic"]:hover{color:#0B1120!important}

/* Nav active */
.admin-shell[data-theme="light"] .bg-blue-muted.text-blue-bright{background-color:#dbeeff!important;color:#1a5d9a!important}

/* Components */
.admin-shell[data-theme="light"] .card{background-color:#ffffff!important;border-color:#e2e5ea!important;box-shadow:0 2px 8px rgba(0,0,0,.06)!important}
.admin-shell[data-theme="light"] .input{background-color:#f8fafc!important;border-color:#d1d9e6!important;color:#0B1120!important}
.admin-shell[data-theme="light"] .input::placeholder{color:#7a8ba6!important}
.admin-shell[data-theme="light"] .admin-input{background-color:#f8fafc!important;border-color:#d1d9e6!important;color:#0B1120!important}
.admin-shell[data-theme="light"] .admin-input::placeholder{color:#7a8ba6!important}
.admin-shell[data-theme="light"] .label{color:#3a4e6e!important}
.admin-shell[data-theme="light"] .data-text{color:#4a5e80!important}
.admin-shell[data-theme="light"] .btn-secondary{background-color:#ffffff!important;border-color:#d1d9e6!important;color:#1e2a40!important}
.admin-shell[data-theme="light"] .btn-secondary:hover{background-color:#e8ecf2!important;color:#0B1120!important}
.admin-shell[data-theme="light"] .btn-ghost{color:#3a4e6e!important}
.admin-shell[data-theme="light"] .btn-ghost:hover{background-color:#e8ecf2!important;color:#0B1120!important}
.admin-shell[data-theme="light"] .badge-neutral{background-color:#e8ecf2!important;color:#1e2a40!important}
.admin-shell[data-theme="light"] .badge-blue{background-color:#dbeeff!important;color:#1a5d9a!important}
.admin-shell[data-theme="light"] .alert-info{background-color:#ebf5fb!important;color:#1e5577!important}

/* Tab pills */
.admin-shell[data-theme="light"] [class*="bg-blue-bright"]{background-color:#dbeeff!important}

/* Inline transparent table row stripes */
.admin-shell[data-theme="light"] .theme-row-alt{background-color:rgba(0,0,0,.025)!important}

/* card-interactive: @apply card at build time means .card selector won't match .card-interactive elements */
.admin-shell[data-theme="light"] .card-interactive{background-color:#ffffff!important;border-color:#e2e5ea!important;box-shadow:0 2px 8px rgba(0,0,0,.06)!important}

/* Modal/overlay panel backgrounds */
.admin-shell[data-theme="light"] [class*="bg-carbon/"]{background-color:rgba(240,242,245,.85)!important}

/* Table header rows */
.admin-shell[data-theme="light"] thead tr{background-color:#e2e8f0!important;color:#1e2a40!important}
.admin-shell[data-theme="light"] tr.bg-carbon-light{background-color:#e2e8f0!important;color:#1e2a40!important}

/* Stat tile fine borders */
.admin-shell[data-theme="light"] [class*="border-steel-900/30"]{border-color:rgba(0,0,0,.08)!important}
.admin-shell[data-theme="light"] [class*="border-steel-900/20"]{border-color:rgba(0,0,0,.06)!important}
`;

/** Aplica la clase admin-shell y el data-theme reactivo. Envuelve el contenido del layout. */
export function AdminShell({ children }: { children: React.ReactNode }) {
  const { theme } = useAdminTheme();
  return (
    <div className="admin-shell" data-theme={theme} style={{ transition: 'background-color .2s, color .2s' }}>
      {/* eslint-disable-next-line react/no-danger */}
      <style dangerouslySetInnerHTML={{ __html: LIGHT_CSS }} />
      {children}
    </div>
  );
}

export const useAdminTheme = () => useContext(Ctx);
