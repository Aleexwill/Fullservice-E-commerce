'use client';

import { Sun, Moon } from 'lucide-react';
import { useAdminTheme } from './theme-provider';

export function ThemeToggle() {
  const { theme, toggle } = useAdminTheme();
  const isDark = theme === 'dark';
  return (
    <button
      onClick={toggle}
      aria-label={isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
      title={isDark ? 'Tema claro' : 'Tema oscuro'}
      className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-steel-300 transition-colors hover:bg-steel-900 hover:text-arctic border border-steel-900/60"
    >
      {isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
      <span>{isDark ? 'Claro' : 'Oscuro'}</span>
    </button>
  );
}
