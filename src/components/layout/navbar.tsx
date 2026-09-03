'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Menu,
  X,
  ShoppingCart,
  Phone,
  Search,
} from 'lucide-react';
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
    <header className="sticky top-0 z-50 border-b border-steel-900/40 bg-carbon/[0.92] backdrop-blur-xl">
      {/* Barra superior */}
      <div className="hidden border-b border-steel-900/30 sm:block">
        <div className="container-main flex items-center justify-between py-1.5">
          <p className="flex items-center gap-1.5 font-body text-xs tracking-[0.04em] text-steel-500">
            <Phone className="h-3 w-3" />
            {phone} — {openingHours}
          </p>
          <p className="font-body text-xs tracking-[0.04em] text-steel-500">
            Envios a todo el pais
          </p>
        </div>
      </div>

      {/* Navbar principal */}
      <nav className="container-main">
        <div className="flex h-[84px] items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image
              src="/logo.png"
              alt="Full Service & Clean"
              width={200}
              height={80}
              className="object-contain"
              priority
            />
          </Link>

          {/* Desktop Links */}
          <div className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded px-4 py-2.5 font-body text-xs font-medium uppercase tracking-[0.05em] text-steel-500 transition-colors hover:text-arctic"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              className="rounded p-2.5 text-steel-500 transition-colors hover:text-arctic"
              aria-label="Buscar"
            >
              <Search className="h-4 w-4" />
            </button>

            <Link
              href="/carrito"
              aria-label={cartCount > 0 ? `Carrito — ${cartCount} item${cartCount !== 1 ? 's' : ''}` : 'Carrito'}
              className="relative rounded p-2.5 text-steel-500 transition-colors hover:text-arctic"
            >
              <ShoppingCart className="h-4 w-4" />
              {cartCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-orange text-[0.65rem] font-bold leading-none text-white">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </Link>

            <Link
              href="/contacto?tipo=presupuesto"
              className="btn-primary ml-2 hidden text-[0.65rem] sm:inline-flex"
            >
              Presupuesto
            </Link>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="rounded p-2 text-steel-300 md:hidden"
              aria-label="Menu"
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={cn(
            'overflow-hidden transition-all duration-300 md:hidden',
            isOpen ? 'max-h-80 pb-4' : 'max-h-0'
          )}
        >
          <div className="flex flex-col gap-1 border-t border-steel-900/40 pt-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="rounded px-3 py-2.5 font-body text-[0.75rem] font-medium uppercase tracking-[0.05em] text-steel-300 transition-colors hover:bg-steel-900 hover:text-arctic"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/contacto?tipo=presupuesto"
              onClick={() => setIsOpen(false)}
              className="btn-primary mt-2 text-[0.65rem]"
            >
              Pedir presupuesto
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
}
