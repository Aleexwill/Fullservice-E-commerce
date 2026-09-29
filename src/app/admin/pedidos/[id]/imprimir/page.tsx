'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import OrderReceipt, { type PrintOrder } from '@/components/print/OrderReceipt';

export default function AdminPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [order, setOrder] = useState<PrintOrder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/pedidos/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) { router.push('/admin/pedidos'); return; }
        setOrder(data);
      })
      .finally(() => setLoading(false));
  }, [id, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-[#2D8FCC]" />
      </div>
    );
  }

  if (!order) return null;

  return <OrderReceipt order={order} autoPrint />;
}
