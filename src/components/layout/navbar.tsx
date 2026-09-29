'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X, Phone, ArrowRight, ShoppingCart, User, LogIn, UserPlus, Package, LogOut } from 'lucide-react';
import { siteConfig } from '@/config/site';
import { cn } from '@/lib/utils';
import { useCartStore } from '@/lib/cart-store';
import type { SiteSettings } from '@/lib/settings-store';

const BASE_NAV_LINKS = [
  { href: '/servicios', label: 'Servicios', sectionKey: 'showServicios' },
  { href: '/trabajos', label: 'Trabajos', sectionKey: 'showPortfolio' },
  { href: '/clientes', label: 'Clientes', sectionKey: null },
  { href: '/nosotros', label: 'Nosotros', sectionKey: null },
  { href: '/contacto', label: 'Contacto', sectionKey: null },
];

export function Navbar({ settings }: { settings?: SiteSettings }) {
  const [isOpen, setIsOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);
  const totalItems = useCartStore((s) => s.totalItems());

  useEffect(() => {
    fetch('/api/customer/me').then((r) => { if (r.ok) setLoggedIn(true); }).catch(() => null);
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function handleLogout() {
    await fetch('/api/customer/logout', { method: 'POST' }).catch(() => null);
    setLoggedIn(false);
    setAccountOpen(false);
  }
  const phone = settings?.contact.phone || siteConfig.phone;
  const openingHours = settings?.business.openingHours.weekdays || siteConfig.openingHours;
  const navLinks = BASE_NAV_LINKS.filter(
    (l) => l.sectionKey === null || settings?.sections?.[l.sectionKey as keyof typeof settings.sections] !== false
  );

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0B1120]/95 shadow-[0_8px_30px_rgba(11,17,32,.16)] backdrop-blur-xl">
      <div className="hidden border-b border-white/10 bg-white/[0.03] lg:block">
        <div className="container-main flex items-center justify-between py-2">
          <div className="flex items-center gap-2 font-body text-[0.7rem] text-[#B7C5D9]">
            <Phone className="h-3.5 w-3.5 text-[#6FC3F5]" />
            <span>{phone}</span><span className="text-white/30">•</span><span>{openingHours}</span>
          </div>
          <span className="font-body text-[0.7rem] font-medium uppercase tracking-[.1em] text-[#B7C5D9]">Envíos a todo el país</span>
        </div>
      </div>

      <nav className="container-main">
        <div className="flex h-[68px] items-center justify-between gap-3 sm:h-[72px] lg:h-[76px] lg:gap-6">
          <Link href="/" className="min-w-0 shrink rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6FC3F5]" aria-label="Full Service & Clean — inicio">
            <Image src="/logo.png" alt="Full Service & Clean" width={220} height={88} className="h-auto w-[160px] object-contain sm:w-[185px] lg:w-[210px]" priority />
          </Link>

          <div className="hidden items-center gap-0.5 lg:flex">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className="group relative rounded-lg px-3 py-3 font-body text-xs font-semibold uppercase tracking-[.06em] text-[#B7C5D9] transition-colors hover:text-white focus:outline-none focus:ring-2 focus:ring-[#6FC3F5] xl:px-4">
                {link.label}
                <span className="absolute inset-x-3 bottom-1 h-0.5 origin-left scale-x-0 rounded-full bg-[#6FC3F5] transition-transform duration-200 group-hover:scale-x-100 xl:inset-x-4" />
              </Link>
            ))}
          </div>

          <div className="flex shrink-0 items-center gap-0.5 sm:gap-1.5">
            {/* Account dropdown */}
            <div ref={accountRef} className="relative">
              <button
                onClick={() => setAccountOpen((v) => !v)}
                className={cn('rounded-lg p-2.5 transition-colors hover:bg-white/5 hover:text-white', accountOpen ? 'bg-white/5 text-white' : 'text-[#B7C5D9]')}
                aria-label="Mi cuenta"
              >
                <User className="h-5 w-5" />
              </button>
              {accountOpen && (
                <div className="absolute right-0 top-full z-[9999] mt-2 w-52 overflow-hidden rounded-xl border border-white/10 bg-[#0d1628] shadow-[0_12px_40px_rgba(0,0,0,.6)]">
                  {loggedIn ? (
                    <>
                      <Link href="/cuenta" onClick={() => setAccountOpen(false)} className="flex items-center gap-3 px-4 py-3 font-body text-sm text-[#B7C5D9] transition-colors hover:bg-white/5 hover:text-white">
                        <User className="h-4 w-4 shrink-0 text-[#6FC3F5]" />
                        Mi cuenta
                      </Link>
                      <Link href="/cuenta" onClick={() => setAccountOpen(false)} className="flex items-center gap-3 px-4 py-3 font-body text-sm text-[#B7C5D9] transition-colors hover:bg-white/5 hover:text-white">
                        <Package className="h-4 w-4 shrink-0 text-[#6FC3F5]" />
                        Mis pedidos
                      </Link>
                      <div className="mx-3 border-t border-white/10" />
                      <button onClick={handleLogout} className="flex w-full items-center gap-3 px-4 py-3 font-body text-sm text-[#B7C5D9] transition-colors hover:bg-red-500/10 hover:text-red-400">
                        <LogOut className="h-4 w-4 shrink-0" />
                        Cerrar sesión
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="px-4 pb-2 pt-3">
                        <p className="font-body text-[0.7rem] font-semibold uppercase tracking-widest text-[#6FC3F5]">Mi cuenta</p>
                      </div>
                      <Link href="/cuenta/login" onClick={() => setAccountOpen(false)} className="flex items-center gap-3 px-4 py-3 font-body text-sm text-[#B7C5D9] transition-colors hover:bg-white/5 hover:text-white">
                        <LogIn className="h-4 w-4 shrink-0 text-[#6FC3F5]" />
                        Ingresar
                      </Link>
                      <Link href="/cuenta/registro" onClick={() => setAccountOpen(false)} className="flex items-center gap-3 px-4 py-3 font-body text-sm text-[#B7C5D9] transition-colors hover:bg-white/5 hover:text-white">
                        <UserPlus className="h-4 w-4 shrink-0 text-[#6FC3F5]" />
                        Crear cuenta
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>
            <Link href="/carrito" className="relative rounded-lg p-2.5 text-[#B7C5D9] transition-colors hover:bg-white/5 hover:text-white" aria-label={`Carrito${totalItems > 0 ? ` — ${totalItems} items` : ''}`}>
              <ShoppingCart className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#2D8FCC] text-[0.6rem] font-bold text-white">
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              )}
            </Link>
            <Link href="/tienda" className="btn-primary ml-1 hidden gap-2 xl:inline-flex">Tienda <ArrowRight className="h-3.5 w-3.5" /></Link>
            <button onClick={() => setIsOpen(!isOpen)} className="rounded-lg p-2.5 text-[#B7C5D9] transition-colors hover:bg-white/5 hover:text-white lg:hidden" aria-label={isOpen ? 'Cerrar menú' : 'Abrir menú'} aria-expanded={isOpen} aria-controls="mobile-navigation">
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <div id="mobile-navigation" className={cn('overflow-hidden transition-all duration-300 lg:hidden', isOpen ? 'max-h-[32rem] pb-5' : 'max-h-0')}>
          <div className="border-t border-white/10 pt-4">
            <div className="mb-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 font-body text-xs text-[#B7C5D9]">
              <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-[#6FC3F5]" />{phone}</div>
              <div className="mt-1 text-[#9AAAC0]">{openingHours}</div>
            </div>
            <div className="grid gap-1 sm:grid-cols-2">
              {navLinks.map((link) => <Link key={link.href} href={link.href} onClick={() => setIsOpen(false)} className="rounded-xl px-4 py-3.5 font-body text-sm font-semibold uppercase tracking-[.05em] text-[#B7C5D9] transition-colors hover:bg-white/5 hover:text-white">{link.label}</Link>)}
            </div>
            <div className="mt-3 flex gap-2">
              {loggedIn ? (
                <Link href="/cuenta" onClick={() => setIsOpen(false)} className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 py-3 font-body text-sm font-semibold text-[#B7C5D9] transition-colors hover:bg-white/5 hover:text-white">
                  <User className="h-4 w-4" />Mi cuenta
                </Link>
              ) : (
                <Link href="/cuenta/login" onClick={() => setIsOpen(false)} className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 py-3 font-body text-sm font-semibold text-[#B7C5D9] transition-colors hover:bg-white/5 hover:text-white">
                  <LogIn className="h-4 w-4" />Ingresar
                </Link>
              )}
              <Link href="/tienda" onClick={() => setIsOpen(false)} className="btn-primary flex-1 justify-center">Ver tienda <ArrowRight className="h-4 w-4" /></Link>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
