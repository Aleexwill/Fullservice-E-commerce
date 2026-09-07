'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard, Package, ShoppingCart, Users, FileText, Settings, LogOut,
  ChevronRight, FolderOpen, Wrench, PenSquare, BarChart3, Eye, ClipboardList,
  TrendingUp, Calculator, Layers, Megaphone, Menu, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { NotificationBell } from '@/components/admin/notification-bell';
import { AdminThemeProvider, AdminShell } from '@/components/admin/theme-provider';
import { ThemeToggle } from '@/components/admin/theme-toggle';

interface NavGroup {
  label: string;
  items: { href: string; label: string; icon: any; exact?: boolean }[];
}

const navGroups: NavGroup[] = [
  { label: '', items: [{ href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true }] },
  { label: 'E-Commerce', items: [
    { href: '/admin/productos', label: 'Productos', icon: Package },
    { href: '/admin/pedidos', label: 'Pedidos', icon: ShoppingCart },
    { href: '/admin/reportes/ecommerce', label: 'Reporte E-com', icon: TrendingUp },
  ]},
  { label: 'Servicios', items: [
    { href: '/admin/servicios', label: 'Servicios', icon: Wrench },
    { href: '/admin/presupuestos', label: 'Presupuestos', icon: Calculator },
    { href: '/admin/inventario', label: 'Catálogo', icon: ClipboardList },
    { href: '/admin/reportes/servicios', label: 'Reporte Serv.', icon: ClipboardList },
  ]},
  { label: 'Sitio Web', items: [
    { href: '/admin/contenido', label: 'Contenido', icon: PenSquare },
    { href: '/admin/portfolio', label: 'Portfolio', icon: FolderOpen },
    { href: '/admin/carousel', label: 'Carrusel hero', icon: Layers },
    { href: '/admin/promos', label: 'Banners / Promos', icon: Megaphone },
  ]},
  { label: 'Marketing', items: [
    { href: '/admin/clientes', label: 'Clientes', icon: Users },
    { href: '/admin/leads', label: 'Leads', icon: Users },
    { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  ]},
  { label: 'Sistema', items: [
    { href: '/admin/usuarios', label: 'Usuarios', icon: Users },
    { href: '/admin/reportes', label: 'Reporte General', icon: FileText, exact: true },
    { href: '/admin/config', label: 'Configuracion', icon: Settings },
  ]},
];

function getPageLabel(pathname: string): string {
  for (const group of navGroups) {
    for (const item of group.items) {
      if (item.exact ? pathname === item.href : pathname.startsWith(item.href)) {
        return item.label;
      }
    }
  }
  return '';
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isActive = (href: string, exact?: boolean) => exact ? pathname === href : pathname.startsWith(href);
  const pageLabel = getPageLabel(pathname);

  if (pathname === '/admin/login') return <>{children}</>;

  const SidebarContent = () => (
    <>
      <div className="flex h-[60px] items-center justify-between border-b border-steel-900/40 px-4">
        <Image src="/logo.png" alt="Full Service & Clean" width={140} height={44} className="object-contain" />
        <span className="badge-blue text-[0.6rem] font-bold">Admin</span>
      </div>
      <nav className="flex-1 overflow-y-auto p-3" aria-label="Navegación principal">
        {navGroups.map((group, gi) => (
          <div key={gi} className={gi > 0 ? 'mt-1 border-t border-steel-900/30 pt-3' : ''}>
            {group.label && <p className="mb-1.5 px-3 font-body text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-steel-500">{group.label}</p>}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href, item.exact);
                return (
                  <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)} className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2.5 font-body text-body-sm transition-all',
                    active ? 'bg-blue-muted text-blue-bright font-medium' : 'text-steel-300 hover:bg-steel-900 hover:text-arctic'
                  )}>
                    <Icon className="h-4 w-4 shrink-0" />
                    {item.label}
                    {active && <ChevronRight className="ml-auto h-3 w-3" />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="border-t border-steel-900/40 p-3">
        <div className="mb-2 rounded-md bg-steel-900/50 px-3 py-2"><p className="font-body text-caption font-medium text-arctic">Administrador</p></div>
        <div className="flex gap-1">
          <Link href="/" className="flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-2 font-body text-caption text-steel-500 transition-colors hover:bg-steel-900 hover:text-arctic"><Eye className="h-3.5 w-3.5" />Ver sitio</Link>
          <button type="button" onClick={async () => { await fetch('/api/auth/logout', { method: 'POST' }); window.location.href = '/admin/login'; }} className="flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-2 font-body text-caption text-steel-500 transition-colors hover:bg-steel-900 hover:text-arctic"><LogOut className="h-3.5 w-3.5" />Salir</button>
        </div>
      </div>
    </>
  );

  return (
    <AdminThemeProvider>
    <AdminShell>
    <div className="flex min-h-screen bg-carbon">
{sidebarOpen && <div className="fixed inset-0 z-40 bg-carbon/70 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} aria-hidden="true" />}
      <aside className={cn('fixed left-0 top-0 z-50 flex h-full w-[240px] flex-col border-r border-steel-900/40 bg-carbon-light transition-transform duration-200', 'lg:translate-x-0', sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0')}>
        <button onClick={() => setSidebarOpen(false)} aria-label="Cerrar menú" className="absolute right-3 top-3 rounded-md p-1.5 text-steel-500 hover:bg-steel-900 hover:text-arctic lg:hidden"><X className="h-4 w-4" /></button>
        <SidebarContent />
      </aside>
      <main className="min-h-screen flex-1 lg:ml-[240px]">
        <div className="sticky top-0 z-40 flex h-[52px] items-center gap-3 border-b border-steel-900/40 bg-carbon-light px-4">
          <button onClick={() => setSidebarOpen(true)} aria-label="Abrir menú" className="rounded-md p-2 text-steel-400 hover:bg-steel-900 hover:text-arctic lg:hidden"><Menu className="h-5 w-5" /></button>
          {pageLabel && (
            <span className="font-body text-body-sm font-medium text-steel-400 lg:block hidden">
              {pageLabel}
            </span>
          )}
          <div className="ml-auto flex items-center gap-1"><ThemeToggle /><NotificationBell /></div>
        </div>
        {children}
      </main>
    </div>
    </AdminShell>
    </AdminThemeProvider>
  );
}
