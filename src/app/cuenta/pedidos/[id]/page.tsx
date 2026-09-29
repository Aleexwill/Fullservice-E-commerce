'use client';

import Link from 'next/link';
import NextImage from 'next/image';
import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, Upload, CheckCircle2, Package, AlertCircle, Printer } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

interface OrderItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface OrderDetail {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  total: number;
  subtotal: number;
  shipping: number;
  discount: number;
  paymentMethod: string;
  items: OrderItem[];
  customer: { name: string; email: string; phone: string; address: string; city: string; notes: string };
  transferReceiptUrl?: string;
  transferReceiptAt?: string;
  paymentConfirmedAt?: string;
  createdAt: string;
}

const PAYMENT_LABEL: Record<string, string> = {
  pending: 'Pago pendiente',
  receipt_submitted: 'Comprobante enviado',
  paid: 'Pago confirmado',
  refunded: 'Reembolsado',
  failed: 'Fallido',
};

const PAYMENT_COLOR: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  receipt_submitted: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700',
  refunded: 'bg-gray-100 text-gray-600',
  failed: 'bg-red-100 text-red-600',
};

export default function PedidoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [receiptUrl, setReceiptUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [receiptError, setReceiptError] = useState('');
  const [receiptDone, setReceiptDone] = useState(false);

  useEffect(() => {
    fetch('/api/customer/orders').then((r) => (r.ok ? r.json() : null)).then((data) => {
      if (!data?.orders) { router.push('/cuenta/login'); return; }
      const found = data.orders.find((o: OrderDetail) => o.id === id);
      if (!found) { router.push('/cuenta'); return; }
      setOrder(found);
      setLoading(false);
    }).catch(() => { router.push('/cuenta/login'); });
  }, [id, router]);

  async function submitReceipt(e: React.FormEvent) {
    e.preventDefault();
    setReceiptError('');
    if (!receiptUrl.trim()) { setReceiptError('Ingresá la URL de la imagen'); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/customer/orders/${id}/receipt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiptUrl: receiptUrl.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setReceiptError(data.error || 'No se pudo guardar'); return; }
      setReceiptDone(true);
      setOrder((prev) => prev ? { ...prev, paymentStatus: data.paymentStatus, transferReceiptUrl: receiptUrl.trim() } : prev);
    } catch {
      setReceiptError('Error de conexión');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <section className="section">
        <div className="container-main text-center">
          <p className="font-body text-body text-[#8094B4]">Cargando...</p>
        </div>
      </section>
    );
  }

  if (!order) return null;

  const canUploadReceipt = order.paymentMethod === 'transferencia' && order.paymentStatus === 'pending';
  const receiptSubmitted = order.paymentStatus === 'receipt_submitted' || !!order.transferReceiptUrl;

  return (
    <>
      <div className="border-b border-gray-200">
        <div className="container-main flex items-center gap-2 py-3 font-body text-caption text-[#8094B4]">
          <Link href="/" className="hover:text-[#0B1120]">Inicio</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/cuenta" className="hover:text-[#0B1120]">Mi cuenta</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-[#0B1120]">{order.orderNumber}</span>
        </div>
      </div>

      <section className="section">
        <div className="container-main max-w-2xl space-y-6">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="font-display text-h3 text-[#0B1120]">{order.orderNumber}</h1>
              <p className="font-body text-caption text-[#8094B4]">
                {new Date(order.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}
              </p>
            </div>
            <span className={`rounded-full px-3 py-1 font-body text-caption font-medium ${PAYMENT_COLOR[order.paymentStatus] ?? 'bg-gray-100 text-gray-600'}`}>
              {PAYMENT_LABEL[order.paymentStatus] ?? order.paymentStatus}
            </span>
          </div>

          {/* Items */}
          <div className="card overflow-hidden">
            <div className="border-b border-gray-100 px-4 py-3">
              <h2 className="font-body text-body-sm font-semibold text-[#0B1120]">Productos</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {order.items.map((item, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#F4F7FB]">
                    <Package className="h-5 w-5 text-[#C0CEDF]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-body text-body-sm text-[#0B1120]">{item.productName}</p>
                    <p className="font-mono text-[0.7rem] text-[#8094B4]">{item.sku} × {item.quantity}</p>
                  </div>
                  <p className="shrink-0 font-display text-body-sm font-bold text-[#0B1120]">{formatPrice(item.total)}</p>
                </div>
              ))}
            </div>
            <div className="space-y-1.5 border-t border-gray-100 px-4 py-3">
              {order.shipping > 0 && (
                <div className="flex justify-between font-body text-caption text-[#4A5E80]">
                  <span>Envío</span><span>{formatPrice(order.shipping)}</span>
                </div>
              )}
              {order.discount > 0 && (
                <div className="flex justify-between font-body text-caption text-green-600">
                  <span>Descuento</span><span>-{formatPrice(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-gray-100 pt-2 font-display text-body font-bold text-[#0B1120]">
                <span>Total</span><span>{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Transfer receipt section */}
          {order.paymentMethod === 'transferencia' && (
            <div className="card p-5">
              <h2 className="mb-3 font-body text-body-sm font-semibold text-[#0B1120]">Comprobante de transferencia</h2>

              {receiptSubmitted ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-blue-600">
                    <CheckCircle2 className="h-5 w-5" />
                    <p className="font-body text-body-sm">Comprobante recibido, esperando confirmación.</p>
                  </div>
                  {order.transferReceiptUrl && (
                    <a href={order.transferReceiptUrl} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-lg border border-gray-200">
                      <NextImage
                        src={order.transferReceiptUrl}
                        alt="Comprobante de pago"
                        width={600}
                        height={400}
                        className="max-h-64 w-full object-contain"
                        unoptimized
                      />
                    </a>
                  )}
                  {order.paymentConfirmedAt && (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="h-5 w-5" />
                      <p className="font-body text-body-sm font-medium">Pago confirmado por el vendedor.</p>
                    </div>
                  )}
                </div>
              ) : canUploadReceipt ? (
                <div>
                  {receiptDone ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="h-5 w-5" />
                      <p className="font-body text-body-sm font-medium">Comprobante enviado correctamente.</p>
                    </div>
                  ) : (
                    <form onSubmit={submitReceipt} className="space-y-3">
                      <p className="font-body text-caption text-[#4A5E80]">
                        Pegá el link de la imagen de tu comprobante (Google Drive, Imgur, etc.)
                      </p>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          required
                          className="input-field min-w-0 flex-1"
                          placeholder="https://..."
                          value={receiptUrl}
                          onChange={(e) => setReceiptUrl(e.target.value)}
                        />
                        <button type="submit" disabled={submitting} className="btn-primary flex shrink-0 items-center gap-2">
                          <Upload className="h-4 w-4" />
                          {submitting ? 'Enviando...' : 'Enviar'}
                        </button>
                      </div>
                      {receiptError && (
                        <div className="flex items-center gap-2 text-red-600">
                          <AlertCircle className="h-4 w-4" />
                          <p className="font-body text-caption">{receiptError}</p>
                        </div>
                      )}
                    </form>
                  )}
                </div>
              ) : (
                <p className="font-body text-caption text-[#8094B4]">El pago ya fue procesado.</p>
              )}
            </div>
          )}

          {/* Customer info */}
          <div className="card p-5">
            <h2 className="mb-3 font-body text-body-sm font-semibold text-[#0B1120]">Datos de entrega</h2>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 font-body text-caption">
              <div><dt className="text-[#8094B4]">Nombre</dt><dd className="text-[#0B1120]">{order.customer.name}</dd></div>
              <div><dt className="text-[#8094B4]">Email</dt><dd className="break-all text-[#0B1120]">{order.customer.email}</dd></div>
              {order.customer.phone && <div><dt className="text-[#8094B4]">Teléfono</dt><dd className="text-[#0B1120]">{order.customer.phone}</dd></div>}
              {order.customer.city && <div><dt className="text-[#8094B4]">Ciudad</dt><dd className="text-[#0B1120]">{order.customer.city}</dd></div>}
              {order.customer.address && <div className="col-span-2"><dt className="text-[#8094B4]">Dirección</dt><dd className="text-[#0B1120]">{order.customer.address}</dd></div>}
            </dl>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link href="/cuenta" className="inline-flex items-center gap-1 font-body text-caption text-[#2D8FCC] hover:underline">
              <ChevronRight className="h-3 w-3 rotate-180" />
              Volver a mis pedidos
            </Link>
            <Link
              href={`/cuenta/pedidos/${id}/imprimir`}
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 font-body text-caption text-[#4A5E80] transition-colors hover:bg-gray-50"
            >
              <Printer className="h-3.5 w-3.5" />
              Imprimir / PDF
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
