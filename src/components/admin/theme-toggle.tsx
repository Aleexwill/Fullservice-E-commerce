'use client';

import { Sun, Moon } from 'lucide-react';
import { useAdminTheme } from './theme-provider';

export function ThemeToggle() {
  const { theme, toggle } = useAdminTheme();
  return (
    <button
      onClick={toggle}
      title={theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
      aria-label={theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
      className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 font-body text-caption text-steel-400 transition-colors hover:bg-steel-900 hover:text-arctic"
    >
      {theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
      <span className="hidden sm:inline">{theme === 'dark' ? 'Claro' : 'Oscuro'}</span>
    </button>
  );
}
