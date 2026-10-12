'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ChevronRight, CheckCircle2, Copy, Upload, ImageIcon, X, AlertCircle } from 'lucide-react';
import { useCartStore } from '@/lib/cart-store';
import { formatPrice, formatWhatsAppUrl } from '@/lib/utils';
import { siteConfig } from '@/config/site';
import type { SiteSettings } from '@/lib/settings-store';

type PaymentMethod = 'transferencia' | 'efectivo';

interface ConfirmedOrder {
  orderId: string;
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
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState('');
  const [receiptUploading, setReceiptUploading] = useState(false);
  const [receiptDone, setReceiptDone] = useState(false);
  const [receiptError, setReceiptError] = useState('');

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
      setConfirmedOrder({ orderId: order.id, orderNumber: order.orderNumber, total: order.total, paymentMethod });
      clear();
    } catch {
      setError('Error de conexión, intentá de nuevo');
    } finally {
      setSubmitting(false);
    }
  }

  function handleReceiptFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setReceiptFile(file);
    setReceiptError('');
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setReceiptPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setReceiptPreview('');
    }
  }

  async function uploadReceipt() {
    if (!receiptFile || !confirmedOrder) return;
    setReceiptUploading(true);
    setReceiptError('');
    try {
      const fd = new FormData();
      fd.append('file', receiptFile);
      const upRes = await fetch('/api/customer/upload', { method: 'POST', body: fd });
      const upData = await upRes.json().catch(() => ({}));
      if (!upRes.ok) { setReceiptError(upData.error || 'Error al subir la imagen'); return; }

      const res = await fetch(`/api/customer/orders/${confirmedOrder.orderId}/receipt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiptUrl: upData.url }),
      });
      if (!res.ok) { setReceiptError('No se pudo guardar el comprobante'); return; }
      setReceiptDone(true);
    } catch {
      setReceiptError('Error de conexión');
    } finally {
      setReceiptUploading(false);
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
          <h1 className="mt-4 font-display text-h1 uppercase text-[#0B1120]">¡Pedido recibido!</h1>
          <p className="mt-2 font-body text-body text-[#4A5E80]">
            Tu número de pedido es <span className="font-mono font-bold text-[#0B1120]">{confirmedOrder.orderNumber}</span>
          </p>
          <p className="mt-1 font-display text-h3 text-[#0B1120]">{formatPrice(confirmedOrder.total)}</p>

          {confirmedOrder.paymentMethod === 'transferencia' && payment && (
            <div className="card mt-8 space-y-3 p-5 text-left">
              <h2 className="font-display text-h4 uppercase text-[#0B1120]">Datos para transferencia</h2>
              {payment.qrImageUrl && (
                <img src={payment.qrImageUrl} alt="QR de pago" className="mx-auto h-40 w-40 object-contain" />
              )}
              {payment.bankName && <p className="font-body text-body-sm text-[#4A5E80]"><strong>Banco:</strong> {payment.bankName}</p>}
              {payment.accountHolder && <p className="font-body text-body-sm text-[#4A5E80]"><strong>Titular:</strong> {payment.accountHolder}</p>}
              {payment.accountNumber && (
                <p className="flex items-center gap-2 font-body text-body-sm text-[#4A5E80]">
                  <strong>Cuenta:</strong> {payment.accountNumber} {payment.accountType && `(${payment.accountType})`}
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(payment.accountNumber)}
                    className="text-[#8094B4] hover:text-[#0B1120]"
                    aria-label="Copiar número de cuenta"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </p>
              )}
              <p className="font-body text-body-sm text-[#8094B4]">{payment.instructions}</p>
            </div>
          )}

          {confirmedOrder.paymentMethod === 'transferencia' && (
            <div className="card mt-6 p-5 text-left">
              <h3 className="mb-3 font-display text-h4 uppercase text-[#0B1120]">Subir comprobante</h3>
              {receiptDone ? (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-5 w-5 shrink-0" />
                  <p className="font-body text-body-sm font-medium">¡Comprobante recibido! Lo revisaremos a la brevedad.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="font-body text-caption text-[#4A5E80]">
                    Adjuntá la foto o captura de tu transferencia para agilizar la confirmación.
                  </p>
                  {receiptPreview ? (
                    <div className="relative overflow-hidden rounded-lg border border-gray-200">
                      <img src={receiptPreview} alt="Vista previa" className="max-h-48 w-full object-contain" />
                      <button
                        type="button"
                        onClick={() => { setReceiptFile(null); setReceiptPreview(''); setReceiptError(''); }}
                        className="absolute right-2 top-2 rounded-full bg-white/90 p-1 text-gray-600 shadow hover:bg-white hover:text-red-500"
                        aria-label="Quitar imagen"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-gray-200 px-4 py-5 transition hover:border-[#2D8FCC] hover:bg-[#F4F9FF]">
                      <ImageIcon className="h-7 w-7 text-[#C0CEDF]" />
                      <span className="font-body text-body-sm text-[#4A5E80]">Tocá para seleccionar imagen</span>
                      <span className="font-body text-caption text-[#8094B4]">JPG, PNG o WEBP · máx 8MB</span>
                      <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={handleReceiptFile} />
                    </label>
                  )}
                  {receiptError && (
                    <div className="flex items-center gap-2 text-red-600">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <p className="font-body text-caption">{receiptError}</p>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={uploadReceipt}
                    disabled={!receiptFile || receiptUploading}
                    className="btn-primary w-full justify-center disabled:opacity-50"
                  >
                    <Upload className="h-4 w-4" />
                    {receiptUploading ? 'Subiendo...' : 'Enviar comprobante'}
                  </button>
                </div>
              )}
            </div>
          )}

          {confirmedOrder.paymentMethod === 'efectivo' && (
            <p className="mt-8 font-body text-body-sm text-[#4A5E80]">
              Pagás en efectivo al recibir tu pedido. Nos pondremos en contacto para coordinar la entrega.
            </p>
          )}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/cuenta" className="btn-secondary">Ver mis pedidos</Link>
            <Link href="/tienda" className="btn-ghost">Seguir comprando</Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <div className="border-b border-gray-200">
        <div className="container-main flex items-center gap-2 py-3 font-body text-caption text-[#8094B4]">
          <Link href="/" className="hover:text-[#0B1120]">Inicio</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/carrito" className="hover:text-[#0B1120]">Carrito</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-[#0B1120]">Checkout</span>
        </div>
      </div>

      <section className="section">
        <div className="container-main">
          <h1 className="mb-8 font-display text-h1 uppercase text-[#0B1120]">Finalizar compra</h1>

          {!hydrated ? (
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 animate-pulse">
              <div className="space-y-4 lg:col-span-2">
                <div className="card h-64 bg-gray-100 p-5" />
                <div className="card h-32 bg-gray-100 p-5" />
              </div>
              <div className="card h-64 bg-gray-100 p-5" />
            </div>
          ) : items.length === 0 ? (
            <div className="py-16 text-center">
              <p className="font-body text-body text-[#4A5E80]">Tu carrito está vacío.</p>
              <Link href="/tienda" className="btn-primary mt-4 inline-flex">Ir a la tienda</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              {/* Datos del cliente */}
              <div className="space-y-4 lg:col-span-2">
                <div className="card space-y-4 p-5">
                  <h2 className="font-display text-h4 uppercase text-[#0B1120]">Tus datos</h2>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <label className="flex flex-col gap-1 font-body text-body-sm text-[#4A5E80]">
                      Nombre completo *
                      <input id="checkout-name" required placeholder="Juan Pérez" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" />
                    </label>
                    <label className="flex flex-col gap-1 font-body text-body-sm text-[#4A5E80]">
                      Email *
                      <input id="checkout-email" required type="email" placeholder="juan@email.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input" />
                    </label>
                    <label className="flex flex-col gap-1 font-body text-body-sm text-[#4A5E80]">
                      Teléfono *
                      <input id="checkout-phone" required placeholder="+595 981 000 000" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input" />
                    </label>
                    <label className="flex flex-col gap-1 font-body text-body-sm text-[#4A5E80]">
                      Ciudad
                      <input id="checkout-city" placeholder="Asunción" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="input" />
                    </label>
                  </div>
                  <label className="flex flex-col gap-1 font-body text-body-sm text-[#4A5E80]">
                    Dirección de entrega *
                    <input id="checkout-address" required placeholder="Calle, número, barrio" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="input" />
                  </label>
                  <label className="flex flex-col gap-1 font-body text-body-sm text-[#4A5E80]">
                    Notas (opcional)
                    <textarea id="checkout-notes" placeholder="Instrucciones especiales para la entrega" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="input min-h-[80px]" />
                  </label>
                </div>

                <div className="card space-y-3 p-5">
                  <h2 className="font-display text-h4 uppercase text-[#0B1120]">Método de pago</h2>
                  {(settings?.payment.bankTransferEnabled ?? true) && (
                    <label className="flex cursor-pointer items-center gap-3 rounded-md border border-gray-200 p-3 has-[:checked]:border-blue">
                      <input type="radio" name="payment" checked={paymentMethod === 'transferencia'} onChange={() => setPaymentMethod('transferencia')} />
                      <span className="font-body text-body-sm text-[#0B1120]">Transferencia bancaria (QR)</span>
                    </label>
                  )}
                  {(settings?.payment.cashOnDeliveryEnabled ?? true) && (
                    <label className="flex cursor-pointer items-center gap-3 rounded-md border border-gray-200 p-3 has-[:checked]:border-blue">
                      <input type="radio" name="payment" checked={paymentMethod === 'efectivo'} onChange={() => setPaymentMethod('efectivo')} />
                      <span className="font-body text-body-sm text-[#0B1120]">Efectivo contra entrega</span>
                    </label>
                  )}
                  {settings?.payment.gatewayEnabled && (
                    <label className="flex cursor-pointer items-center gap-3 rounded-md border border-gray-200 p-3 has-[:checked]:border-blue">
                      <input type="radio" name="payment" disabled />
                      <span className="font-body text-body-sm text-[#8094B4]">Pago con tarjeta (próximamente)</span>
                    </label>
                  )}
                </div>

                {error && <p className="font-body text-body-sm text-danger-light">{error}</p>}
              </div>

              {/* Resumen */}
              <div className="card h-fit space-y-2 p-5">
                <h2 className="mb-2 font-display text-h4 uppercase text-[#0B1120]">Resumen</h2>
                {items.map((item) => (
                  <div key={item.productId} className="flex justify-between font-body text-caption text-[#4A5E80]">
                    <span className="truncate pr-2">{item.quantity}x {item.name}</span>
                    <span className="shrink-0">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
                <div className="mt-2 border-t border-gray-200 pt-2">
                  <div className="flex justify-between font-body text-body-sm text-[#4A5E80]">
                    <span>Subtotal</span>
                    <span>{formatPrice(sub)}</span>
                  </div>
                  <div className="flex justify-between font-body text-body-sm text-[#4A5E80]">
                    <span>Envío</span>
                    <span>{shipping === 0 ? 'Gratis' : formatPrice(shipping)}</span>
                  </div>
                  <div className="mt-1 flex justify-between font-display text-h4 text-[#0B1120]">
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
