'use client';

import Link from 'next/link';
import NextImage from 'next/image';
import { useState, useEffect } from 'react';
import { Trash2, Minus, Plus, ChevronRight, ShoppingCart } from 'lucide-react';
import { useCartStore } from '@/lib/cart-store';
import { formatPrice } from '@/lib/utils';

export default function CarritoPage() {
  const { items, removeItem, setQuantity, subtotal } = useCartStore();
  const [hydrated, setHydrated] = useState(false);

  // Evita mismatch de hidratación: el store persistido solo tiene datos reales tras montar en cliente.
  useEffect(() => setHydrated(true), []);

  return (
    <>
      <div className="border-b border-gray-200">
        <div className="container-main flex items-center gap-2 py-3 font-body text-caption text-[#8094B4]">
          <Link href="/" className="hover:text-[#0B1120]">Inicio</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/tienda" className="hover:text-[#0B1120]">Tienda</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-[#0B1120]">Carrito</span>
        </div>
      </div>

      <section className="section">
        <div className="container-main">
          <h1 className="mb-8 font-display text-h1 uppercase text-[#0B1120]">Tu carrito</h1>

          {!hydrated ? null : items.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-16 text-center">
              <ShoppingCart className="h-12 w-12 text-[#C0CEDF]" />
              <p className="font-body text-body text-[#4A5E80]">Tu carrito está vacío.</p>
              <Link href="/tienda" className="btn-primary">Ir a la tienda</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              {/* Items */}
              <div className="space-y-4 lg:col-span-2">
                {items.map((item) => (
                  <div key={item.productId} className="card flex items-center gap-4 p-4">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md bg-[#F4F7FB]">
                      {item.image ? (
                        <NextImage src={item.image} alt={item.name} width={64} height={64} className="h-full w-full object-cover" />
                      ) : (
                        <ShoppingCart className="h-6 w-6 text-[#C0CEDF]" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-body text-body-sm font-semibold text-cloud">{item.name}</p>
                      <p className="font-mono text-caption text-[#8094B4]">{item.sku}</p>
                      <p className="mt-1 font-display text-body font-bold text-[#0B1120]">{formatPrice(item.price)}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setQuantity(item.productId, item.quantity - 1)}
                        className="rounded p-1.5 text-[#8094B4] hover:bg-[#F4F7FB] hover:text-[#0B1120]"
                        aria-label="Restar"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-6 text-center font-body text-body-sm text-[#0B1120]">{item.quantity}</span>
                      <button
                        onClick={() => setQuantity(item.productId, item.quantity + 1)}
                        disabled={item.quantity >= item.stock}
                        className="rounded p-1.5 text-[#8094B4] hover:bg-[#F4F7FB] hover:text-[#0B1120] disabled:opacity-30"
                        aria-label="Sumar"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <button
                      onClick={() => removeItem(item.productId)}
                      className="rounded p-2 text-[#8094B4] hover:bg-danger-light/10 hover:text-danger-light"
                      aria-label="Quitar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="card h-fit p-5">
                <h2 className="mb-4 font-display text-h4 uppercase text-[#0B1120]">Resumen</h2>
                <div className="flex justify-between font-body text-body-sm text-[#4A5E80]">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal())}</span>
                </div>
                <p className="mt-1 font-body text-caption text-[#8094B4]">
                  El envío se calcula en el siguiente paso.
                </p>
                <Link href="/checkout" className="btn-primary mt-5 w-full justify-center">
                  Continuar compra
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
