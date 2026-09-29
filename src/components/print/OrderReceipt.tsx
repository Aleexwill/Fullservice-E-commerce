'use client';

import { useEffect } from 'react';
import { siteConfig } from '@/config/site';

export interface PrintOrderItem {
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface PrintOrder {
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  customer: { name: string; email: string; phone: string; address: string; city: string; notes: string };
  items: PrintOrderItem[];
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  adminNotes?: string;
  createdAt: string;
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendiente', confirmed: 'Confirmado', processing: 'En proceso',
  shipped: 'Enviado', delivered: 'Entregado', cancelled: 'Cancelado',
};
const PAYMENT_LABEL: Record<string, string> = {
  pending: 'Pago pendiente', receipt_submitted: 'Comprobante enviado',
  paid: 'Pagado', refunded: 'Reembolsado', failed: 'Fallido',
};
const METHOD_LABEL: Record<string, string> = {
  transferencia: 'Transferencia bancaria', efectivo: 'Efectivo',
  tarjeta: 'Tarjeta', cheque: 'Cheque', pending: 'A confirmar',
};

const gs = (n: number) => 'Gs. ' + n.toLocaleString('es-PY');

interface Props {
  order: PrintOrder;
  autoPrint?: boolean;
}

export default function OrderReceipt({ order, autoPrint }: Props) {
  useEffect(() => {
    if (autoPrint) {
      const t = setTimeout(() => window.print(), 400);
      return () => clearTimeout(t);
    }
  }, [autoPrint]);

  const date = new Date(order.createdAt).toLocaleDateString('es-PY', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  return (
    <>
      {/* Print-only styles injected globally */}
      <style>{`
        @media print {
          body { margin: 0; }
          .no-print { display: none !important; }
          .print-page { box-shadow: none !important; border: none !important; }
        }
        @page { size: A4; margin: 18mm 16mm; }
      `}</style>

      {/* Toolbar — hidden on print */}
      <div className="no-print sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-gray-200 bg-white px-6 py-3 shadow-sm">
        <p className="font-body text-body-sm font-medium text-[#0B1120]">Comprobante — {order.orderNumber}</p>
        <div className="flex gap-2">
          <button
            onClick={() => window.history.back()}
            className="rounded-lg border border-gray-200 px-4 py-2 font-body text-caption text-[#4A5E80] hover:bg-gray-50"
          >
            ← Volver
          </button>
          <button
            onClick={() => window.print()}
            className="rounded-lg bg-[#0B1120] px-4 py-2 font-body text-caption font-semibold text-white hover:bg-[#1a2740]"
          >
            Imprimir / Guardar PDF
          </button>
        </div>
      </div>

      {/* Receipt */}
      <div className="print-page mx-auto max-w-[680px] bg-white p-8 font-body text-[#0B1120] shadow-md print:shadow-none print:p-0 print:max-w-full">

        {/* Header */}
        <div className="mb-8 flex items-start justify-between border-b border-gray-200 pb-6">
          <div>
            <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-[#0B1120]">
              {siteConfig.name}
            </h1>
            <p className="mt-1 text-sm text-[#8094B4]">{siteConfig.address.street}, {siteConfig.address.city}</p>
            <p className="text-sm text-[#8094B4]">{siteConfig.phone} · {siteConfig.email}</p>
          </div>
          <div className="text-right">
            <p className="text-[0.65rem] font-bold uppercase tracking-widest text-[#8094B4]">Comprobante</p>
            <p className="mt-1 font-mono text-xl font-bold text-[#0B1120]">{order.orderNumber}</p>
            <p className="mt-0.5 text-sm text-[#8094B4]">{date}</p>
          </div>
        </div>

        {/* Status badges */}
        <div className="mb-6 flex flex-wrap gap-2">
          <span className="rounded border border-gray-200 px-2.5 py-0.5 text-[0.7rem] font-semibold uppercase tracking-wide text-[#4A5E80]">
            {STATUS_LABEL[order.status] ?? order.status}
          </span>
          <span className="rounded border border-gray-200 px-2.5 py-0.5 text-[0.7rem] font-semibold uppercase tracking-wide text-[#4A5E80]">
            {PAYMENT_LABEL[order.paymentStatus] ?? order.paymentStatus}
          </span>
          <span className="rounded border border-gray-200 px-2.5 py-0.5 text-[0.7rem] font-semibold uppercase tracking-wide text-[#4A5E80]">
            {METHOD_LABEL[order.paymentMethod] ?? order.paymentMethod}
          </span>
        </div>

        {/* Two-column: customer + delivery */}
        <div className="mb-6 grid grid-cols-2 gap-6">
          <div>
            <p className="mb-2 text-[0.6rem] font-bold uppercase tracking-widest text-[#8094B4]">Cliente</p>
            <p className="font-semibold text-[#0B1120]">{order.customer.name}</p>
            {order.customer.email && <p className="text-sm text-[#4A5E80]">{order.customer.email}</p>}
            {order.customer.phone && <p className="text-sm text-[#4A5E80]">{order.customer.phone}</p>}
          </div>
          {(order.customer.address || order.customer.city) && (
            <div>
              <p className="mb-2 text-[0.6rem] font-bold uppercase tracking-widest text-[#8094B4]">Dirección de entrega</p>
              {order.customer.address && <p className="text-sm text-[#4A5E80]">{order.customer.address}</p>}
              {order.customer.city && <p className="text-sm text-[#4A5E80]">{order.customer.city}</p>}
            </div>
          )}
        </div>

        {/* Items table */}
        <table className="mb-1 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-[#0B1120]">
              <th className="pb-2 text-left text-[0.6rem] font-bold uppercase tracking-widest text-[#8094B4]">Producto</th>
              <th className="pb-2 text-center text-[0.6rem] font-bold uppercase tracking-widest text-[#8094B4]">SKU</th>
              <th className="pb-2 text-center text-[0.6rem] font-bold uppercase tracking-widest text-[#8094B4]">Cant.</th>
              <th className="pb-2 text-right text-[0.6rem] font-bold uppercase tracking-widest text-[#8094B4]">Precio unit.</th>
              <th className="pb-2 text-right text-[0.6rem] font-bold uppercase tracking-widest text-[#8094B4]">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {order.items.map((item, i) => (
              <tr key={i}>
                <td className="py-2.5 pr-4 text-[#0B1120]">{item.productName}</td>
                <td className="py-2.5 text-center font-mono text-[0.72rem] text-[#8094B4]">{item.sku}</td>
                <td className="py-2.5 text-center text-[#4A5E80]">{item.quantity}</td>
                <td className="py-2.5 text-right font-mono text-[#4A5E80]">{gs(item.unitPrice)}</td>
                <td className="py-2.5 text-right font-mono font-semibold text-[#0B1120]">{gs(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="ml-auto w-56 space-y-1.5 border-t border-gray-200 pt-3 text-sm">
          <div className="flex justify-between text-[#4A5E80]">
            <span>Subtotal</span><span className="font-mono">{gs(order.subtotal)}</span>
          </div>
          {order.shipping > 0 && (
            <div className="flex justify-between text-[#4A5E80]">
              <span>Envío</span><span className="font-mono">{gs(order.shipping)}</span>
            </div>
          )}
          {order.discount > 0 && (
            <div className="flex justify-between text-green-700">
              <span>Descuento</span><span className="font-mono">-{gs(order.discount)}</span>
            </div>
          )}
          <div className="flex justify-between border-t-2 border-[#0B1120] pt-2 font-bold text-[#0B1120]">
            <span className="text-base uppercase tracking-wide">Total</span>
            <span className="font-mono text-lg">{gs(order.total)}</span>
          </div>
        </div>

        {/* Notes */}
        {order.customer.notes && (
          <div className="mt-6 rounded border border-gray-200 p-3">
            <p className="mb-1 text-[0.6rem] font-bold uppercase tracking-widest text-[#8094B4]">Notas del cliente</p>
            <p className="text-sm text-[#4A5E80]">{order.customer.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-10 border-t border-gray-100 pt-4 text-center text-[0.65rem] text-[#C0CEDF]">
          {siteConfig.name} · {siteConfig.url} · {siteConfig.phone}
        </div>
      </div>
    </>
  );
}
