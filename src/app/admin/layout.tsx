'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard, Package, ShoppingCart, UserCheck, FileText, Settings, LogOut,
  ChevronRight, FolderOpen, Wrench, PenSquare, BarChart3, Eye, ClipboardList,
  TrendingUp, Calculator, Layers, Megaphone, Menu, X, UserCog, Inbox, History,
  Image as ImageIcon, Tag, Wallet, CalendarDays, ClipboardCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { NotificationBell } from '@/components/admin/notification-bell';
import { AdminThemeProvider, AdminShell } from '@/components/admin/theme-provider';
import { ThemeToggle } from '@/components/admin/theme-toggle';
import { ToastProvider } from '@/components/admin/toast';

interface NavItem { href: string; label: string; icon: any; exact?: boolean; badge?: number }
interface NavGroup { label: string; items: NavItem[] }

const navGroups: NavGroup[] = [
  { label: '', items: [{ href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true }] },
  { label: 'E-Commerce', items: [
    { href: '/admin/productos', label: 'Productos', icon: Package },
    { href: '/admin/pedidos', label: 'Pedidos', icon: ShoppingCart },
    { href: '/admin/promos', label: 'Descuentos', icon: Tag },
    { href: '/admin/reportes/ecommerce', label: 'Reporte ventas', icon: TrendingUp },
  ]},
  { label: 'Servicios', items: [
    { href: '/admin/presupuestos', label: 'Presupuestos', icon: Calculator },
    { href: '/admin/presupuestos/solicitudes', label: 'Solicitudes web', icon: Inbox },
    { href: '/admin/agenda', label: 'Agenda de trabajo', icon: CalendarDays },
    { href: '/admin/informes-tecnicos', label: 'Informes técnicos', icon: ClipboardCheck },
    { href: '/admin/inventario', label: 'Lista de precios', icon: ClipboardList },
    { href: '/admin/reportes/servicios', label: 'Reporte servicios', icon: BarChart3 },
  ]},
  { label: 'Sitio Web', items: [
    { href: '/admin/contenido', label: 'Contenido', icon: PenSquare },
    { href: '/admin/servicios', label: 'Servicios', icon: Wrench },
    { href: '/admin/trabajos', label: 'Portfolio', icon: FolderOpen },
    { href: '/admin/carousel', label: 'Carrusel hero', icon: ImageIcon },
    { href: '/admin/clientes-logo', label: 'Logos clientes', icon: Layers },
    { href: '/admin/promos', label: 'Banners & Promos', icon: Megaphone },
  ]},
  { label: 'Clientes & CRM', items: [
    { href: '/admin/clientes', label: 'Clientes', icon: UserCheck },
    { href: '/admin/leads', label: 'Leads', icon: Inbox },
    { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  ]},
  { label: 'Sistema', items: [
    { href: '/admin/usuarios', label: 'Usuarios', icon: UserCog },
    { href: '/admin/sistema/logs', label: 'Log de cambios', icon: History },
    { href: '/admin/reportes', label: 'Reporte general', icon: FileText, exact: true },
    { href: '/admin/config', label: 'Configuración', icon: Settings },
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
  const sidebarRef = useRef<HTMLElement>(null);
  const openBtnRef = useRef<HTMLButtonElement>(null);
  const [pendingReceipts, setPendingReceipts] = useState(0);
  const [adminName, setAdminName] = useState('Administrador');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() => {
    if (typeof window === 'undefined') return {};
    try { return JSON.parse(localStorage.getItem('fs-nav-collapsed') ?? '{}'); } catch { return {}; }
  });
  const toggleGroup = (label: string) => {
    setCollapsed((prev) => {
      const next = { ...prev, [label]: !prev[label] };
      try { localStorage.setItem('fs-nav-collapsed', JSON.stringify(next)); } catch {}
      return next;
    });
  };
  const isActive = (href: string, exact?: boolean) => exact ? pathname === href : pathname.startsWith(href);
  const pageLabel = getPageLabel(pathname);

  useEffect(() => {
    fetch('/api/auth/me').then((r) => r.ok ? r.json() : null).then((d) => { if (d?.name) setAdminName(d.name); }).catch(() => {});
  }, []);

  // Move focus into sidebar when it opens, return to trigger when it closes
  useEffect(() => {
    if (sidebarOpen) {
      const first = sidebarRef.current?.querySelector<HTMLElement>('a, button');
      first?.focus();
    } else {
      openBtnRef.current?.focus();
    }
  }, [sidebarOpen]);


  // Count orders with receipt_submitted for badge on Pedidos
  useEffect(() => {
    fetch('/api/pedidos?status=pending')
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (!d?.orders) return;
        const count = d.orders.filter((o: any) => o.paymentStatus === 'receipt_submitted').length;
        setPendingReceipts(count);
      })
      .catch(() => {});
  }, [pathname]);

  if (pathname === '/admin/login') return <>{children}</>;

  // Inject badge into Pedidos nav item
  const navGroupsWithBadges = navGroups.map((g) => ({
    ...g,
    items: g.items.map((item) =>
      item.href === '/admin/pedidos' ? { ...item, badge: pendingReceipts } : item
    ),
  }));

  const SidebarContent = () => (
    <>
      <div className="flex h-[60px] items-center justify-between border-b border-steel-900/40 px-4">
        <Image src="/logo.png" alt="Full Service & Clean" width={130} height={44} className="object-contain" />
        <span className="badge-blue text-[0.6rem] font-bold tracking-widest">ADMIN</span>
      </div>
      <nav className="flex-1 overflow-y-auto px-2 py-3" aria-label="Navegación principal">
        {navGroupsWithBadges.map((group, gi) => {
          const isCollapsed = group.label ? !!collapsed[group.label] : false;
          // If a child is active, keep group open regardless
          const hasActive = group.items.some((item) => isActive(item.href, item.exact));
          const open = !isCollapsed || hasActive;
          return (
          <div key={gi} className={gi > 0 ? 'mt-2 border-t border-steel-900/30 pt-2' : ''}>
            {group.label && (
              <button
                type="button"
                onClick={() => toggleGroup(group.label)}
                className="mb-1 flex w-full items-center justify-between rounded px-3 pt-1 pb-0.5 font-body text-[0.6rem] font-bold uppercase tracking-[0.12em] text-steel-600 transition-colors hover:text-steel-400"
              >
                {group.label}
                <ChevronRight className={cn('h-3 w-3 shrink-0 transition-transform duration-200', open ? 'rotate-90' : '')} />
              </button>
            )}
            {open && (
              <div className="space-y-px">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href, item.exact);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        'group flex items-center gap-2.5 rounded-lg px-3 py-2 font-body text-[0.8rem] transition-all duration-150',
                        active
                          ? 'bg-blue-muted/70 text-blue-bright font-semibold shadow-[inset_0_0_0_1px_rgba(45,143,204,.18)]'
                          : 'text-steel-400 hover:bg-steel-900/60 hover:text-arctic'
                      )}
                    >
                      <Icon className={cn('h-[15px] w-[15px] shrink-0 transition-colors', active ? 'text-blue-bright' : 'text-steel-500 group-hover:text-arctic')} />
                      <span className="flex-1 leading-none">{item.label}</span>
                      {item.badge && item.badge > 0 ? (
                        <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#E65C4F] px-1 text-[0.6rem] font-bold text-white">
                          {item.badge > 9 ? '9+' : item.badge}
                        </span>
                      ) : active ? (
                        <ChevronRight className="ml-auto h-3 w-3 opacity-60" />
                      ) : null}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )})}
      </nav>
      <div className="border-t border-steel-900/40 p-2.5">
        <div className="mb-2 flex items-center gap-2 rounded-lg bg-steel-900/40 px-3 py-2.5">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-muted text-blue-bright">
            <UserCog className="h-3.5 w-3.5" />
          </div>
          <p className="font-body text-caption font-medium text-arctic">{adminName}</p>
        </div>
        <div className="grid grid-cols-2 gap-1">
          <Link
            href="/"
            className="flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 font-body text-[0.72rem] text-steel-500 transition-colors hover:bg-steel-900 hover:text-arctic"
          >
            <Eye className="h-3.5 w-3.5" />Ver sitio
          </Link>
          <button
            type="button"
            onClick={async () => { await fetch('/api/auth/logout', { method: 'POST' }); window.location.href = '/admin/login'; }}
            className="flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 font-body text-[0.72rem] text-steel-500 transition-colors hover:bg-red-500/10 hover:text-red-400"
          >
            <LogOut className="h-3.5 w-3.5" />Salir
          </button>
        </div>
      </div>
    </>
  );



  return (
    <AdminThemeProvider>
    <AdminShell>
    <ToastProvider>
    <div className="flex min-h-screen bg-carbon">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-carbon/70 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
      <aside id="admin-sidebar" ref={sidebarRef} aria-label="Navegación admin" className={cn(
        'fixed left-0 top-0 z-50 flex h-full w-[220px] flex-col border-r border-steel-900/40 bg-carbon-light transition-transform duration-200',
        'lg:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        <button
          onClick={() => setSidebarOpen(false)}
          aria-label="Cerrar menú"
          className="absolute right-2 top-2.5 rounded-md p-1.5 text-steel-500 hover:bg-steel-900 hover:text-arctic lg:hidden"
        >
          <X className="h-4 w-4" />
        </button>
        <SidebarContent />
      </aside>
      <main className="min-h-screen flex-1 lg:ml-[220px]">
        <div className="sticky top-0 z-40 flex h-[52px] items-center gap-3 border-b border-steel-900/40 bg-carbon-light/95 px-4 backdrop-blur-sm">
          <button
            ref={openBtnRef}
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menú"
            aria-expanded={sidebarOpen}
            aria-controls="admin-sidebar"
            className="rounded-md p-2 text-steel-400 hover:bg-steel-900 hover:text-arctic lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          {pageLabel && (
            <span className="hidden font-body text-body-sm font-medium text-steel-400 lg:block">
              {pageLabel}
            </span>
          )}
          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
            <NotificationBell />
          </div>
        </div>
        {children}
      </main>
    </div>
    </ToastProvider>
    </AdminShell>
    </AdminThemeProvider>
  );
}
