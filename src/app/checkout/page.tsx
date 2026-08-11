'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ChevronRight, CheckCircle2, Copy } from 'lucide-react';
import { useCartStore } from '@/lib/cart-store';
import { formatPrice, formatWhatsAppUrl } from '@/lib/utils';
import { siteConfig } from '@/config/site';
import type { SiteSettings } from '@/lib/settings-store';

type PaymentMethod = 'transferencia' | 'efectivo';

interface ConfirmedOrder {
  orderNumber: string;
  total: number;
  paymentMethod: PaymentMethod;
}

export default function CheckoutPage() {
  const { items, subtotal, clear } = useCartStore();
  const [hydrated, setHydrated] = useState(false);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', city: '', notes: '' });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('transferencia');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [confirmedOrder, setConfirmedOrder] = useState<ConfirmedOrder | null>(null);

  useEffect(() => {
    setHydrated(true);
    fetch('/api/config').then((r) => (r.ok ? r.json() : null)).then(setSettings).catch(() => {});
  }, []);

  const shippingBase = settings?.business.shippingBase ?? 25000;
  const freeShippingThreshold = settings?.business.freeShippingThreshold ?? 500000;
  const sub = subtotal();
  const shipping = sub === 0 || sub >= freeShippingThreshold ? 0 : shippingBase;
  const total = sub + shipping;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: form,
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
          shipping,
          paymentMethod,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'No se pudo crear el pedido');
        setSubmitting(false);
        return;
      }
      const order = await res.json();
      setConfirmedOrder({ orderNumber: order.orderNumber, total: order.total, paymentMethod });
      clear();
    } catch {
      setError('Error de conexión, intentá de nuevo');
    } finally {
      setSubmitting(false);
    }
  }

  if (confirmedOrder) {
    const payment = settings?.payment;
    const whatsappUrl = formatWhatsAppUrl(
      settings?.contact.whatsapp || siteConfig.whatsapp,
      `Hola, acabo de hacer el pedido ${confirmedOrder.orderNumber} y quiero enviar el comprobante de pago.`
    );

    return (
      <section className="section">
        <div className="container-main max-w-lg text-center">
          <CheckCircle2 className="mx-auto h-14 w-14 text-success" />
          <h1 className="mt-4 font-display text-h1 uppercase text-arctic">¡Pedido recibido!</h1>
          <p className="mt-2 font-body text-body text-steel-300">
            Tu número de pedido es <span className="font-mono font-bold text-arctic">{confirmedOrder.orderNumber}</span>
          </p>
          <p className="mt-1 font-display text-h3 text-arctic">{formatPrice(confirmedOrder.total)}</p>

          {confirmedOrder.paymentMethod === 'transferencia' && payment && (
            <div className="card mt-8 space-y-3 p-5 text-left">
              <h2 className="font-display text-h4 uppercase text-arctic">Datos para transferencia</h2>
              {payment.qrImageUrl && (
                <img src={payment.qrImageUrl} alt="QR de pago" className="mx-auto h-40 w-40 object-contain" />
              )}
              {payment.bankName && <p className="font-body text-body-sm text-steel-300"><strong>Banco:</strong> {payment.bankName}</p>}
              {payment.accountHolder && <p className="font-body text-body-sm text-steel-300"><strong>Titular:</strong> {payment.accountHolder}</p>}
              {payment.accountNumber && (
                <p className="flex items-center gap-2 font-body text-body-sm text-steel-300">
                  <strong>Cuenta:</strong> {payment.accountNumber} {payment.accountType && `(${payment.accountType})`}
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(payment.accountNumber)}
                    className="text-steel-500 hover:text-arctic"
                    aria-label="Copiar número de cuenta"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </p>
              )}
              <p className="font-body text-body-sm text-steel-500">{payment.instructions}</p>
            </div>
          )}

          {confirmedOrder.paymentMethod === 'efectivo' && (
            <p className="mt-8 font-body text-body-sm text-steel-300">
              Pagás en efectivo al recibir tu pedido. Nos pondremos en contacto para coordinar la entrega.
            </p>
          )}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="btn-primary">
              Enviar comprobante por WhatsApp
            </a>
            <Link href="/tienda" className="btn-secondary">Seguir comprando</Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <div className="border-b border-steel-900/40">
        <div className="container-main flex items-center gap-2 py-3 font-body text-caption text-steel-500">
          <Link href="/" className="hover:text-arctic">Inicio</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/carrito" className="hover:text-arctic">Carrito</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-arctic">Checkout</span>
        </div>
      </div>

      <section className="section">
        <div className="container-main">
          <h1 className="mb-8 font-display text-h1 uppercase text-arctic">Finalizar compra</h1>

          {!hydrated ? null : items.length === 0 ? (
            <div className="py-16 text-center">
              <p className="font-body text-body text-steel-300">Tu carrito está vacío.</p>
              <Link href="/tienda" className="btn-primary mt-4 inline-flex">Ir a la tienda</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              {/* Datos del cliente */}
              <div className="space-y-4 lg:col-span-2">
                <div className="card space-y-4 p-5">
                  <h2 className="font-display text-h4 uppercase text-arctic">Tus datos</h2>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <input required placeholder="Nombre completo" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" />
                    <input required type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input" />
                    <input required placeholder="Teléfono" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input" />
                    <input placeholder="Ciudad" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="input" />
                  </div>
                  <input required placeholder="Dirección de entrega" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="input" />
                  <textarea placeholder="Notas (opcional)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="input min-h-[80px]" />
                </div>

                <div className="card space-y-3 p-5">
                  <h2 className="font-display text-h4 uppercase text-arctic">Método de pago</h2>
                  {(settings?.payment.bankTransferEnabled ?? true) && (
                    <label className="flex cursor-pointer items-center gap-3 rounded-md border border-steel-900/40 p-3 has-[:checked]:border-blue">
                      <input type="radio" name="payment" checked={paymentMethod === 'transferencia'} onChange={() => setPaymentMethod('transferencia')} />
                      <span className="font-body text-body-sm text-cloud">Transferencia bancaria (QR)</span>
                    </label>
                  )}
                  {(settings?.payment.cashOnDeliveryEnabled ?? true) && (
                    <label className="flex cursor-pointer items-center gap-3 rounded-md border border-steel-900/40 p-3 has-[:checked]:border-blue">
                      <input type="radio" name="payment" checked={paymentMethod === 'efectivo'} onChange={() => setPaymentMethod('efectivo')} />
                      <span className="font-body text-body-sm text-cloud">Efectivo contra entrega</span>
                    </label>
                  )}
                  {settings?.payment.gatewayEnabled && (
                    <label className="flex cursor-pointer items-center gap-3 rounded-md border border-steel-900/40 p-3 has-[:checked]:border-blue">
                      <input type="radio" name="payment" disabled />
                      <span className="font-body text-body-sm text-steel-500">Pago con tarjeta (próximamente)</span>
                    </label>
                  )}
                </div>

                {error && <p className="font-body text-body-sm text-danger-light">{error}</p>}
              </div>

              {/* Resumen */}
              <div className="card h-fit space-y-2 p-5">
                <h2 className="mb-2 font-display text-h4 uppercase text-arctic">Resumen</h2>
                {items.map((item) => (
                  <div key={item.productId} className="flex justify-between font-body text-caption text-steel-300">
                    <span className="truncate pr-2">{item.quantity}x {item.name}</span>
                    <span className="shrink-0">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
                <div className="mt-2 border-t border-steel-900/40 pt-2">
                  <div className="flex justify-between font-body text-body-sm text-steel-300">
                    <span>Subtotal</span>
                    <span>{formatPrice(sub)}</span>
                  </div>
                  <div className="flex justify-between font-body text-body-sm text-steel-300">
                    <span>Envío</span>
                    <span>{shipping === 0 ? 'Gratis' : formatPrice(shipping)}</span>
                  </div>
                  <div className="mt-1 flex justify-between font-display text-h4 text-arctic">
                    <span>Total</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                </div>
                <button type="submit" disabled={submitting} className="btn-primary mt-3 w-full justify-center disabled:opacity-50">
                  {submitting ? 'Enviando...' : 'Confirmar pedido'}
                </button>
              </div>
            </form>
          )}
        </div>
      </section>
    </>
  );
}
