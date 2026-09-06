'use client';

import { Sun, Moon } from 'lucide-react';
import { useAdminTheme } from './theme-provider';

export function ThemeToggle() {
  const { theme, toggle } = useAdminTheme();
  return (
    <button
      onClick={toggle}
      aria-label={theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
      className="rounded-md p-2 text-steel-400 transition-colors hover:bg-steel-900 hover:text-arctic"
    >
      {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
