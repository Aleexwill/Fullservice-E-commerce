'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X, ShoppingCart, Phone, Search, ArrowRight } from 'lucide-react';
import { siteConfig } from '@/config/site';
import { cn } from '@/lib/utils';
import { useCartStore } from '@/lib/cart-store';
import type { SiteSettings } from '@/lib/settings-store';

const navLinks = [
  { href: '/servicios', label: 'Servicios' },
  { href: '/tienda', label: 'Tienda' },
  { href: '/portfolio', label: 'Portfolio' },
  { href: '/contacto', label: 'Contacto' },
];

export function Navbar({ settings }: { settings?: SiteSettings }) {
  const [isOpen, setIsOpen] = useState(false);
  const phone = settings?.contact.phone || siteConfig.phone;
  const openingHours = settings?.business.openingHours.weekdays || siteConfig.openingHours;
  const cartCount = useCartStore((s) => s.totalItems());

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
            <Image src="/logo.png" alt="Full Service & Clean" width={180} height={72} className="h-auto w-[126px] object-contain sm:w-[145px] lg:w-[165px]" priority />
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
            <Link href="/tienda" className="hidden rounded-lg p-2.5 text-[#B7C5D9] transition-colors hover:bg-white/5 hover:text-white sm:block" aria-label="Buscar productos">
              <Search className="h-[18px] w-[18px]" />
            </Link>
            <Link href="/carrito" aria-label={cartCount > 0 ? `Carrito — ${cartCount} item${cartCount !== 1 ? 's' : ''}` : 'Carrito'} className="relative rounded-lg p-2.5 text-[#B7C5D9] transition-colors hover:bg-white/5 hover:text-white">
              <ShoppingCart className="h-[18px] w-[18px]" />
              {cartCount > 0 && <span className="absolute right-0 top-0 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#D07420] px-1 text-[0.62rem] font-bold text-white">{cartCount > 9 ? '9+' : cartCount}</span>}
            </Link>
            <Link href="/contacto?tipo=presupuesto" className="btn-primary ml-1 hidden gap-2 xl:inline-flex">Presupuesto <ArrowRight className="h-3.5 w-3.5" /></Link>
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
            <Link href="/contacto?tipo=presupuesto" onClick={() => setIsOpen(false)} className="btn-primary mt-3 w-full justify-center">Pedir presupuesto <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </nav>
    </header>
  );
}
