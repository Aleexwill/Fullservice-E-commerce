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

    // Sincroniza si el iframe (costos.html / tablero.html) cambia el tema
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
.admin-shell[data-theme="light"]{color-scheme:light;color:#1e2a40}

/* Shell backgrounds */
.admin-shell[data-theme="light"] .bg-carbon{background-color:#f0f2f5!important}
.admin-shell[data-theme="light"] .bg-carbon-light{background-color:#ffffff!important}
.admin-shell[data-theme="light"] .bg-steel-900{background-color:#e8ecf2!important}
.admin-shell[data-theme="light"] .bg-blue-muted{background-color:#dbeeff!important}

/* Status / semantic backgrounds */
.admin-shell[data-theme="light"] .bg-success-light{background-color:#dcfce7!important}
.admin-shell[data-theme="light"] .bg-yellow-muted,.admin-shell[data-theme="light"] .bg-orange-muted{background-color:#fef9c3!important}
.admin-shell[data-theme="light"] .bg-danger-light{background-color:#fee2e2!important}

/* Table hardcoded backgrounds → neutralos claro */
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
.admin-shell[data-theme="light"] .text-steel-400{color:#3a4e6e!important}
.admin-shell[data-theme="light"] .text-steel-500{color:#4a5e80!important}
.admin-shell[data-theme="light"] .text-steel-600{color:#3a4e6e!important}
.admin-shell[data-theme="light"] .text-steel-600{color:#64748b!important}
.admin-shell[data-theme="light"] .text-steel-700{color:#475569!important}
.admin-shell[data-theme="light"] .text-blue-bright{color:#1a5d9a!important}
.admin-shell[data-theme="light"] .text-yellow-bright{color:#854d0e!important}
.admin-shell[data-theme="light"] .text-success-bright{color:#1e3a5f!important}
.admin-shell[data-theme="light"] .text-danger-bright{color:#b91c1c!important}
.admin-shell[data-theme="light"] .text-orange-bright{color:#92400e!important}

/* Hover states */
.admin-shell[data-theme="light"] [class*="hover:bg-steel-900"]:hover{background-color:#e8ecf2!important}
.admin-shell[data-theme="light"] [class*="hover:text-arctic"]:hover{color:#0B1120!important}

/* Nav active */
.admin-shell[data-theme="light"] .bg-blue-muted\/70{background-color:#cce4ff!important}
.admin-shell[data-theme="light"] .bg-blue-muted.text-blue-bright{background-color:#cce4ff!important;color:#0f4c8a!important}
.admin-shell[data-theme="light"] .bg-blue-muted\/70.text-blue-bright{background-color:#cce4ff!important;color:#0f4c8a!important}

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

/* card-interactive (presupuesto rows, archivo rows, etc) */
.admin-shell[data-theme="light"] .card-interactive{background-color:#ffffff!important;border-color:#e2e5ea!important;box-shadow:0 1px 4px rgba(0,0,0,.06)!important}
.admin-shell[data-theme="light"] .card-interactive:hover{background-color:#f4f7fb!important;border-color:#c8d0de!important}

/* bg-steel-900 with opacity modifiers (bg-steel-900/40, /20, /50, /60, /80) */
.admin-shell[data-theme="light"] [class*="bg-steel-900\/"]{background-color:rgba(200,208,222,.35)!important}
.admin-shell[data-theme="light"] [class*="bg-carbon\/"]{background-color:rgba(240,242,245,.85)!important}

/* Tab pills with opacity */
.admin-shell[data-theme="light"] [class*="bg-blue-bright"]{background-color:#dbeeff!important}

/* Inline transparent table row stripes */
.admin-shell[data-theme="light"] .theme-row-alt{background-color:rgba(0,0,0,.025)!important}

/* Hardcoded bg-steel-800, bg-steel-950, bg-steel-600 (used in dropdowns, inputs) */
.admin-shell[data-theme="light"] .bg-steel-800,.admin-shell[data-theme="light"] .bg-steel-950,.admin-shell[data-theme="light"] .bg-steel-600{background-color:#e8ecf2!important}

/* Icon container bg-steel-900 inside card-interactive */
.admin-shell[data-theme="light"] .card-interactive .bg-steel-900{background-color:#e2e8f2!important}

/* bg-carbon-light/50 → kanban column en leads */
.admin-shell[data-theme="light"] [class~="bg-carbon-light/50"]{background-color:rgba(248,250,252,.85)!important}

/* Hardcoded hex text colors (accent / status) */
.admin-shell[data-theme="light"] [class*="text-[#2D8FCC]"]{color:#1a5d9a!important}
.admin-shell[data-theme="light"] [class*="text-[#38BDF8]"]{color:#0369a1!important}
.admin-shell[data-theme="light"] [class*="text-[#A78BFA]"]{color:#6d28d9!important}
.admin-shell[data-theme="light"] [class*="text-[#F6C90E]"]{color:#854d0e!important}
.admin-shell[data-theme="light"] [class*="text-[#25D366]"]{color:#166534!important}
.admin-shell[data-theme="light"] [class*="text-[#8094B4]"]{color:#4a5e80!important}
.admin-shell[data-theme="light"] [class*="text-[#B7C5D9]"]{color:#3a4e6e!important}
.admin-shell[data-theme="light"] [class*="text-[#C0CEDF]"]{color:#4a5e80!important}
.admin-shell[data-theme="light"] [class*="text-[#4A5E80]"]{color:#1e2a40!important}
.admin-shell[data-theme="light"] [class*="text-[#0B1120]"]{color:#0B1120!important}

/* Modal / dialog backgrounds */
.admin-shell[data-theme="light"] .bg-carbon-light\/95{background-color:rgba(255,255,255,.97)!important}
.admin-shell[data-theme="light"] [class*="bg-carbon-light/95"]{background-color:rgba(255,255,255,.97)!important}

/* Dividers */
.admin-shell[data-theme="light"] [class*="divide-steel-"]{border-color:#e2e5ea!important}
.admin-shell[data-theme="light"] [class*="border-steel-"]:not([class*="border-steel-900"]):not([class*="border-steel-800"]):not([class*="border-steel-700"]){border-color:#d1d9e6!important}

/* bg-blue-bright used as active nav / tag bg */
.admin-shell[data-theme="light"] .bg-blue-bright.text-white{background-color:#1a5d9a!important}
.admin-shell[data-theme="light"] [class*="bg-blue-bright"]:not(.text-white){background-color:#dbeeff!important}

/* Sidebar nav items that inherit dark colors */
.admin-shell[data-theme="light"] .nav-item{color:#3a4e6e!important}
.admin-shell[data-theme="light"] .nav-item:hover{background-color:#e8ecf2!important;color:#0B1120!important}

/* Success / warning / danger semantic text → readable on light bg */
.admin-shell[data-theme="light"] .text-success-bright{color:#15803d!important}
.admin-shell[data-theme="light"] .text-yellow-bright{color:#a16207!important}
.admin-shell[data-theme="light"] .text-danger-bright{color:#b91c1c!important}
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
