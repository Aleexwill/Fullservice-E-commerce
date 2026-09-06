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
.admin-shell[data-theme="light"] .bg-carbon{background-color:#f0f2f5!important}
.admin-shell[data-theme="light"] .bg-carbon-light{background-color:#ffffff!important}
.admin-shell[data-theme="light"] .bg-steel-900{background-color:#e8ecf2!important}
.admin-shell[data-theme="light"] .bg-blue-muted{background-color:#dbeeff!important}
.admin-shell[data-theme="light"] [class*="border-steel-900"]{border-color:rgba(0,0,0,.1)!important}
.admin-shell[data-theme="light"] [class*="border-steel-700"]{border-color:#d1d9e6!important}
.admin-shell[data-theme="light"] .text-arctic{color:#0B1120!important}
.admin-shell[data-theme="light"] .text-steel-100{color:#1e2a40!important}
.admin-shell[data-theme="light"] .text-steel-300{color:#3a4e6e!important}
.admin-shell[data-theme="light"] .text-steel-400{color:#4a5e80!important}
.admin-shell[data-theme="light"] .text-steel-500{color:#6a7e9a!important}
.admin-shell[data-theme="light"] .text-blue-bright{color:#1a5d9a!important}
.admin-shell[data-theme="light"] [class*="hover:bg-steel-900"]:hover{background-color:#e8ecf2!important}
.admin-shell[data-theme="light"] [class*="hover:text-arctic"]:hover{color:#0B1120!important}
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
`;

/** Aplica la clase admin-shell y el data-theme reactivo. Envuelve el contenido del layout. */
export function AdminShell({ children }: { children: React.ReactNode }) {
  const { theme } = useAdminTheme();
  return (
    <div className="admin-shell" data-theme={theme}>
      {/* eslint-disable-next-line react/no-danger */}
      <style dangerouslySetInnerHTML={{ __html: LIGHT_CSS }} />
      {children}
    </div>
  );
}

export const useAdminTheme = () => useContext(Ctx);
