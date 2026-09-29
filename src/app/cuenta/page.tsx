'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, Package, LogOut, User } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

interface CustomerOrder {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  total: number;
  createdAt: string;
  transferReceiptUrl?: string;
  paymentConfirmedAt?: string;
}

interface CustomerInfo {
  id: string;
  name: string;
  email: string;
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  processing: 'En proceso',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};

const PAYMENT_LABEL: Record<string, string> = {
  pending: 'Pago pendiente',
  receipt_submitted: 'Comprobante enviado',
  paid: 'Pagado',
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

export default function CuentaPage() {
  const router = useRouter();
  const [customer, setCustomer] = useState<CustomerInfo | null>(null);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/customer/me').then((r) => (r.ok ? r.json() : null)),
      fetch('/api/customer/orders').then((r) => (r.ok ? r.json() : null)),
    ]).then(([me, ord]) => {
      if (!me) {
        router.push('/cuenta/login');
        return;
      }
      setCustomer(me.customer);
      setOrders(ord?.orders ?? []);
    }).finally(() => setLoading(false));
  }, [router]);

  async function handleLogout() {
    await fetch('/api/customer/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
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

  if (!customer) return null;

  return (
    <>
      <div className="border-b border-gray-200">
        <div className="container-main flex items-center gap-2 py-3 font-body text-caption text-[#8094B4]">
          <Link href="/" className="hover:text-[#0B1120]">Inicio</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-[#0B1120]">Mi cuenta</span>
        </div>
      </div>

      <section className="section">
        <div className="container-main max-w-2xl">
          {/* Header */}
          <div className="mb-8 flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#EBF4FB]">
                <User className="h-6 w-6 text-[#2D8FCC]" />
              </div>
              <div>
                <h1 className="font-display text-h3 text-[#0B1120]">{customer.name}</h1>
                <p className="font-body text-caption text-[#8094B4]">{customer.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 font-body text-caption text-[#4A5E80] transition-colors hover:bg-gray-50"
            >
              <LogOut className="h-4 w-4" />
              Salir
            </button>
          </div>

          {/* Orders */}
          <h2 className="mb-4 font-display text-h4 uppercase text-[#0B1120]">Mis pedidos</h2>

          {orders.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-gray-200 py-12 text-center">
              <Package className="h-10 w-10 text-[#C0CEDF]" />
              <p className="font-body text-body-sm text-[#4A5E80]">Todavía no tenés pedidos.</p>
              <Link href="/tienda" className="btn-primary mt-1">Ir a la tienda</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <Link
                  key={order.id}
                  href={`/cuenta/pedidos/${order.id}`}
                  className="card flex items-center justify-between gap-4 p-4 transition-shadow hover:shadow-md"
                >
                  <div className="min-w-0">
                    <p className="font-mono text-body-sm font-bold text-[#0B1120]">{order.orderNumber}</p>
                    <p className="font-body text-caption text-[#8094B4]">
                      {new Date(order.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-0.5 font-body text-[0.7rem] font-medium ${PAYMENT_COLOR[order.paymentStatus] ?? 'bg-gray-100 text-gray-600'}`}>
                      {PAYMENT_LABEL[order.paymentStatus] ?? order.paymentStatus}
                    </span>
                    <span className="rounded-full bg-gray-100 px-2.5 py-0.5 font-body text-[0.7rem] font-medium text-gray-600">
                      {STATUS_LABEL[order.status] ?? order.status}
                    </span>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="font-display text-body font-bold text-[#0B1120]">{formatPrice(order.total)}</p>
                    <ChevronRight className="ml-auto h-4 w-4 text-[#8094B4]" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
