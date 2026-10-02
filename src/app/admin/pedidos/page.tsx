'use client';

import { useEffect, useState, useCallback } from 'react';
import { fetchJson } from '@/lib/utils';
import { useToast } from '@/components/admin/toast';
import NextImage from 'next/image';
import Link from 'next/link';
import {
  Search,
  RefreshCw,
  ChevronDown,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
  Settings2,
  Eye,
  X,
  Plus,
  DollarSign,
  User,
  MapPin,
  Phone,
  Mail,
  FileText,
  Loader2,
  ShoppingCart,
  Trash2,
  Upload,
  BadgeCheck,
  Receipt,
  Printer,
} from 'lucide-react';

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  customer: { name: string; email: string; phone: string; address: string; city: string; notes: string };
  items: { productName: string; sku: string; quantity: number; unitPrice: number; total: number }[];
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  paymentMethod: string;
  adminNotes: string;
  transferReceiptUrl?: string;
  transferReceiptAt?: string;
  paymentConfirmedAt?: string;
  paymentConfirmedBy?: string;
  adminReceiptUrl?: string;
  createdAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  pending: { label: 'Pendiente', icon: Clock, color: 'text-yellow-bright', bg: 'bg-yellow-muted' },
  confirmed: { label: 'Confirmado', icon: CheckCircle2, color: 'text-blue-bright', bg: 'bg-blue-muted' },
  processing: { label: 'En proceso', icon: Settings2, color: 'text-blue-bright', bg: 'bg-blue-muted' },
  shipped: { label: 'Enviado', icon: Truck, color: 'text-success-bright', bg: 'bg-success-light' },
  delivered: { label: 'Entregado', icon: CheckCircle2, color: 'text-success-bright', bg: 'bg-success-light' },
  cancelled: { label: 'Cancelado', icon: XCircle, color: 'text-danger-bright', bg: 'bg-danger-light' },
};

const PAYMENT_CONFIG: Record<string, { label: string; badge: string }> = {
  pending: { label: 'Pendiente', badge: 'badge-yellow' },
  receipt_submitted: { label: 'Comprobante enviado', badge: 'badge-blue' },
  paid: { label: 'Pagado', badge: 'badge-green' },
  refunded: { label: 'Reembolsado', badge: 'badge-neutral' },
  failed: { label: 'Fallido', badge: 'badge-red' },
};

const formatGs = (n: number) => 'Gs. ' + n.toLocaleString('es-PY');
const formatDate = (d: string) => new Date(d).toLocaleDateString('es-PY', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export default function AdminPedidosPage() {
  const { showToast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [total, setTotal] = useState(0);
  const [adminReceiptUrl, setAdminReceiptUrl] = useState('');
  const [confirmingPayment, setConfirmingPayment] = useState(false);
  const [savingReceipt, setSavingReceipt] = useState(false);

  const fetchOrders = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (filterStatus) params.set('status', filterStatus);
    fetchJson<any>(`/api/pedidos?${params}`)
      .then((d) => { setOrders(d?.orders || []); setTotal(d?.total || 0); setLoading(false); })
      .catch(() => setLoading(false));
  }, [search, filterStatus]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/pedidos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) { showToast('No se pudo actualizar el estado', 'error'); return; }
      fetchOrders();
      if (selectedOrder?.id === id) setSelectedOrder({ ...selectedOrder, status });
    } catch { showToast('Error de conexión', 'error'); }
  };

  const updatePayment = async (id: string, paymentStatus: string) => {
    try {
      const res = await fetch(`/api/pedidos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus }),
      });
      if (!res.ok) { showToast('No se pudo actualizar el pago', 'error'); return; }
      fetchOrders();
      if (selectedOrder?.id === id) setSelectedOrder({ ...selectedOrder, paymentStatus });
    } catch { showToast('Error de conexión', 'error'); }
  };

  const confirmPayment = async (id: string) => {
    setConfirmingPayment(true);
    try {
      const res = await fetch(`/api/pedidos/${id}/confirm-payment`, { method: 'POST' });
      if (!res.ok) { showToast('Error al confirmar pago', 'error'); return; }
      const data = await res.json();
      showToast('Pago confirmado', 'success');
      fetchOrders();
      if (selectedOrder?.id === id) setSelectedOrder({ ...selectedOrder, paymentStatus: data.paymentStatus, status: data.status, paymentConfirmedAt: new Date().toISOString() });
    } catch { showToast('Error de conexión', 'error'); }
    finally { setConfirmingPayment(false); }
  };

  const saveAdminReceipt = async (id: string) => {
    if (!adminReceiptUrl.trim()) return;
    setSavingReceipt(true);
    try {
      const res = await fetch(`/api/pedidos/${id}/admin-receipt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiptUrl: adminReceiptUrl.trim() }),
      });
      if (!res.ok) { showToast('Error al guardar comprobante', 'error'); return; }
      showToast('Comprobante guardado', 'success');
      setAdminReceiptUrl('');
      fetchOrders();
      if (selectedOrder?.id === id) setSelectedOrder({ ...selectedOrder, adminReceiptUrl: adminReceiptUrl.trim() });
    } catch { showToast('Error de conexión', 'error'); }
    finally { setSavingReceipt(false); }
  };

  const deleteOrder = async (id: string) => {
    if (!confirm('¿Eliminar este pedido?')) return;
    try {
      const res = await fetch(`/api/pedidos/${id}`, { method: 'DELETE' });
      if (!res.ok) { showToast('No se pudo eliminar el pedido', 'error'); return; }
      fetchOrders();
      if (selectedOrder?.id === id) setSelectedOrder(null);
    } catch { showToast('Error de conexión', 'error'); }
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-h1 uppercase text-arctic">Pedidos</h1>
          <p className="mt-1 font-body text-body-sm text-steel-300">{total} pedido{total !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn-primary">
          <Plus className="h-4 w-4" /> Nuevo pedido
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[240px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-steel-500" />
          <input type="text" placeholder="Buscar por N° pedido, cliente..." value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-10" />
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="input max-w-[180px]">
          <option value="">Todos los estados</option>
          {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <button onClick={fetchOrders} className="btn-secondary"><RefreshCw className="h-4 w-4" /></button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="card animate-pulse p-4"><div className="h-12 rounded bg-steel-900" /></div>)}</div>
      ) : orders.length === 0 ? (
        <div className="card p-12 text-center">
          <ShoppingCart className="mx-auto h-12 w-12 text-steel-500" />
          <h3 className="mt-4 font-display text-h3 text-arctic">No hay pedidos</h3>
          <p className="mt-2 font-body text-body-sm text-steel-500">{search || filterStatus ? 'No se encontraron pedidos con esos filtros.' : 'Los pedidos apareceran aqui cuando los clientes compren o los crees manualmente.'}</p>
          <button onClick={() => setShowCreateModal(true)} className="btn-primary mt-6 inline-flex"><Plus className="h-4 w-4" /> Crear pedido manual</button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-steel-900/40">
          <table className="w-full">
            <thead>
              <tr className="border-b border-steel-900/40 bg-carbon-light">
                {['Pedido', 'Cliente', 'Estado', 'Pago', 'Total', 'Fecha', 'Acciones'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-body text-caption uppercase tracking-[0.06em] text-steel-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-steel-900/20">
              {orders.map((o) => {
                const sc = STATUS_CONFIG[o.status] || STATUS_CONFIG.pending;
                const pc = PAYMENT_CONFIG[o.paymentStatus] || PAYMENT_CONFIG.pending;
                const Icon = sc.icon;
                return (
                  <tr key={o.id} className="group transition-colors hover:bg-steel-900/20">
                    <td className="px-4 py-3 font-mono text-body-sm font-medium text-blue-bright">{o.orderNumber}</td>
                    <td className="px-4 py-3">
                      <p className="font-body text-body-sm text-arctic">{o.customer.name}</p>
                      <p className="font-body text-caption text-steel-500">{o.customer.email || o.customer.phone}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase ${sc.bg} ${sc.color}`}>
                        <Icon className="h-3 w-3" />{sc.label}
                      </span>
                    </td>
                    <td className="px-4 py-3"><span className={pc.badge}>{pc.label}</span></td>
                    <td className="px-4 py-3 font-mono text-body-sm text-arctic">{formatGs(o.total)}</td>
                    <td className="px-4 py-3 font-body text-caption text-steel-500">{formatDate(o.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => { setSelectedOrder(o); setAdminReceiptUrl(''); }} className="rounded p-1.5 text-steel-500 hover:bg-blue-muted hover:text-blue-bright" title="Ver detalle"><Eye className="h-4 w-4" /></button>
                        <button onClick={() => deleteOrder(o.id)} className="rounded p-1.5 text-steel-500 hover:bg-red-500/10 hover:text-red-400" title="Eliminar"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-carbon/80 backdrop-blur-sm" onClick={() => setSelectedOrder(null)} />
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg border border-steel-900/60 bg-carbon-light shadow-2xl">
            <div className="flex items-center justify-between border-b border-steel-900/40 px-6 py-4">
              <div>
                <h2 className="font-display text-h2 text-arctic">{selectedOrder.orderNumber}</h2>
                <p className="font-body text-caption text-steel-500">{formatDate(selectedOrder.createdAt)}</p>
              </div>
              <div className="flex items-center gap-1">
                <Link
                  href={`/admin/pedidos/${selectedOrder.id}/imprimir`}
                  target="_blank"
                  className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 font-body text-caption text-steel-400 transition-colors hover:bg-steel-900 hover:text-arctic"
                  title="Imprimir comprobante"
                >
                  <Printer className="h-4 w-4" />
                  <span className="hidden sm:inline">Imprimir</span>
                </Link>
                <button onClick={() => { setSelectedOrder(null); setAdminReceiptUrl(''); }} className="rounded-md p-1.5 text-steel-500 hover:bg-steel-900 hover:text-arctic"><X className="h-5 w-5" /></button>
              </div>
            </div>
            <div className="space-y-5 p-6">
              {/* Status controls */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label mb-1.5 block">Estado del pedido</label>
                  <select value={selectedOrder.status} onChange={(e) => updateStatus(selectedOrder.id, e.target.value)} className="input">
                    {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label mb-1.5 block">Estado del pago</label>
                  <select value={selectedOrder.paymentStatus} onChange={(e) => updatePayment(selectedOrder.id, e.target.value)} className="input">
                    {Object.entries(PAYMENT_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
              </div>
              {/* Customer */}
              <div className="card p-4">
                <h3 className="mb-3 flex items-center gap-2 font-display text-h4 text-arctic"><User className="h-4 w-4 text-blue-bright" /> Cliente</h3>
                <div className="grid grid-cols-2 gap-2 font-body text-body-sm">
                  <p className="text-arctic">{selectedOrder.customer.name}</p>
                  {selectedOrder.customer.email && <p className="flex items-center gap-1 text-steel-300"><Mail className="h-3 w-3" />{selectedOrder.customer.email}</p>}
                  {selectedOrder.customer.phone && <p className="flex items-center gap-1 text-steel-300"><Phone className="h-3 w-3" />{selectedOrder.customer.phone}</p>}
                  {selectedOrder.customer.address && <p className="flex items-center gap-1 text-steel-300"><MapPin className="h-3 w-3" />{selectedOrder.customer.address}{selectedOrder.customer.city && `, ${selectedOrder.customer.city}`}</p>}
                </div>
              </div>
              {/* Items */}
              <div className="card p-4">
                <h3 className="mb-3 flex items-center gap-2 font-display text-h4 text-arctic"><Package className="h-4 w-4 text-blue-bright" /> Productos</h3>
                {selectedOrder.items.length === 0 ? (
                  <p className="text-body-sm text-steel-500">Sin productos</p>
                ) : (
                  <div className="space-y-2">
                    {selectedOrder.items.map((item, i) => (
                      <div key={i} className="flex items-center justify-between rounded-md bg-carbon p-2.5">
                        <div>
                          <p className="font-body text-body-sm text-arctic">{item.productName}</p>
                          <p className="font-mono text-caption text-steel-500">{item.sku} x{item.quantity}</p>
                        </div>
                        <p className="font-mono text-body-sm text-arctic">{formatGs(item.total)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {/* Totals */}
              <div className="card p-4">
                <div className="space-y-2 font-body text-body-sm">
                  <div className="flex justify-between"><span className="text-steel-300">Subtotal</span><span className="font-mono text-arctic">{formatGs(selectedOrder.subtotal)}</span></div>
                  <div className="flex justify-between"><span className="text-steel-300">Envio</span><span className="font-mono text-arctic">{formatGs(selectedOrder.shipping)}</span></div>
                  {selectedOrder.discount > 0 && <div className="flex justify-between"><span className="text-steel-300">Descuento</span><span className="font-mono text-success-bright">-{formatGs(selectedOrder.discount)}</span></div>}
                  <div className="flex justify-between border-t border-steel-900/40 pt-2"><span className="font-display text-h4 text-arctic">Total</span><span className="font-display text-h3 text-arctic">{formatGs(selectedOrder.total)}</span></div>
                </div>
              </div>

              {/* Comprobante del cliente */}
              {selectedOrder.paymentMethod === 'transferencia' && (
                <div className="card p-4 space-y-3">
                  <h3 className="flex items-center gap-2 font-display text-h4 text-arctic">
                    <Receipt className="h-4 w-4 text-blue-bright" /> Comprobante del cliente
                  </h3>
                  {selectedOrder.transferReceiptUrl ? (
                    <div className="space-y-2">
                      <a href={selectedOrder.transferReceiptUrl} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-lg border border-steel-900/40 hover:border-blue-bright/40 transition-colors">
                        <NextImage
                          src={selectedOrder.transferReceiptUrl}
                          alt="Comprobante de transferencia"
                          width={600}
                          height={400}
                          className="max-h-56 w-full object-contain bg-carbon"
                          unoptimized
                        />
                      </a>
                      {selectedOrder.transferReceiptAt && (
                        <p className="font-body text-caption text-steel-500">Recibido: {formatDate(selectedOrder.transferReceiptAt)}</p>
                      )}
                      {selectedOrder.paymentStatus !== 'paid' && !selectedOrder.paymentConfirmedAt && (
                        <button
                          onClick={() => confirmPayment(selectedOrder.id)}
                          disabled={confirmingPayment}
                          className="btn-primary w-full justify-center gap-2"
                        >
                          {confirmingPayment ? <Loader2 className="h-4 w-4 animate-spin" /> : <BadgeCheck className="h-4 w-4" />}
                          Confirmar pago recibido
                        </button>
                      )}
                      {selectedOrder.paymentConfirmedAt && (
                        <div className="flex items-center gap-2 rounded-md bg-success-light px-3 py-2 text-success-bright">
                          <CheckCircle2 className="h-4 w-4" />
                          <span className="font-body text-caption font-medium">Pago confirmado {selectedOrder.paymentConfirmedBy ? `por ${selectedOrder.paymentConfirmedBy}` : ''}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="font-body text-caption text-steel-500">El cliente aún no envió el comprobante.</p>
                  )}
                </div>
              )}

              {/* Comprobante del admin */}
              <div className="card p-4 space-y-3">
                <h3 className="flex items-center gap-2 font-display text-h4 text-arctic">
                  <Upload className="h-4 w-4 text-blue-bright" /> Comprobante del vendedor
                </h3>
                {selectedOrder.adminReceiptUrl && (
                  <a href={selectedOrder.adminReceiptUrl} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-lg border border-steel-900/40 hover:border-blue-bright/40 transition-colors">
                    <NextImage
                      src={selectedOrder.adminReceiptUrl}
                      alt="Comprobante vendedor"
                      width={600}
                      height={400}
                      className="max-h-48 w-full object-contain bg-carbon"
                      unoptimized
                    />
                  </a>
                )}
                <div className="flex gap-2">
                  <input
                    type="url"
                    className="input min-w-0 flex-1"
                    placeholder="URL del comprobante (imagen)"
                    value={adminReceiptUrl}
                    onChange={(e) => setAdminReceiptUrl(e.target.value)}
                  />
                  <button
                    onClick={() => saveAdminReceipt(selectedOrder.id)}
                    disabled={savingReceipt || !adminReceiptUrl.trim()}
                    className="btn-secondary shrink-0 gap-1.5"
                  >
                    {savingReceipt ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    Guardar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Order Modal */}
      {showCreateModal && <CreateOrderModal onClose={() => setShowCreateModal(false)} onCreated={() => { setShowCreateModal(false); fetchOrders(); }} />}
    </div>
  );
}

/* ============================================================
   CREATE ORDER MODAL
   ============================================================ */
function CreateOrderModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ customerName: '', customerEmail: '', customerPhone: '', customerAddress: '', customerCity: '', paymentMethod: 'efectivo', adminNotes: '' });
  const [items, setItems] = useState([{ productName: '', sku: '', quantity: '1', unitPrice: '' }]);

  const addItem = () => setItems([...items, { productName: '', sku: '', quantity: '1', unitPrice: '' }]);
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: string, value: string) => { const copy = [...items]; (copy[i] as any)[field] = value; setItems(copy); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: { name: form.customerName, email: form.customerEmail, phone: form.customerPhone, address: form.customerAddress, city: form.customerCity, notes: '' },
          items: items.filter((i) => i.productName).map((i) => ({ productName: i.productName, sku: i.sku, quantity: Number(i.quantity), unitPrice: Number(i.unitPrice) })),
          paymentMethod: form.paymentMethod,
          adminNotes: form.adminNotes,
          shipping: 0,
          discount: 0,
        }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        showToast(e.error || 'Error al crear el pedido', 'error');
        return;
      }
      showToast('Pedido creado', 'success');
      onCreated();
    } catch {
      showToast('Error al crear el pedido', 'error');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-carbon/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg border border-steel-900/60 bg-carbon-light shadow-2xl">
        <div className="flex items-center justify-between border-b border-steel-900/40 px-6 py-4">
          <h2 className="font-display text-h2 text-arctic">Nuevo pedido manual</h2>
          <button onClick={onClose} className="rounded-md p-1.5 text-steel-500 hover:bg-steel-900"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          <div className="card p-4">
            <h3 className="mb-3 font-display text-h4 text-arctic">Datos del cliente</h3>
            <div className="grid grid-cols-2 gap-3">
              <input type="text" placeholder="Nombre *" value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} className="input" required />
              <input type="email" placeholder="Email" value={form.customerEmail} onChange={(e) => setForm({ ...form, customerEmail: e.target.value })} className="input" />
              <input type="text" placeholder="Telefono" value={form.customerPhone} onChange={(e) => setForm({ ...form, customerPhone: e.target.value })} className="input" />
              <input type="text" placeholder="Ciudad" value={form.customerCity} onChange={(e) => setForm({ ...form, customerCity: e.target.value })} className="input" />
              <input type="text" placeholder="Direccion" value={form.customerAddress} onChange={(e) => setForm({ ...form, customerAddress: e.target.value })} className="input col-span-2" />
            </div>
          </div>
          <div className="card p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-h4 text-arctic">Productos</h3>
              <button type="button" onClick={addItem} className="btn-ghost py-1 text-caption"><Plus className="h-3 w-3" /> Agregar</button>
            </div>
            <div className="space-y-2">
              {items.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input type="text" placeholder="Producto" value={item.productName} onChange={(e) => updateItem(i, 'productName', e.target.value)} className="input flex-[2]" />
                  <input type="text" placeholder="SKU" value={item.sku} onChange={(e) => updateItem(i, 'sku', e.target.value)} className="input flex-1 font-mono" />
                  <input type="number" placeholder="Cant" value={item.quantity} onChange={(e) => updateItem(i, 'quantity', e.target.value)} className="input w-16 font-mono" min="1" />
                  <input type="number" placeholder="Precio" value={item.unitPrice} onChange={(e) => updateItem(i, 'unitPrice', e.target.value)} className="input w-28 font-mono" min="0" />
                  {items.length > 1 && <button type="button" onClick={() => removeItem(i)} className="p-1 text-steel-500 hover:text-red-400"><X className="h-4 w-4" /></button>}
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label mb-1 block">Metodo de pago</label>
              <select value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })} className="input">
                <option value="efectivo">Efectivo</option>
                <option value="transferencia">Transferencia</option>
                <option value="tarjeta">Tarjeta</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>
            <div>
              <label className="label mb-1 block">Notas internas</label>
              <input type="text" value={form.adminNotes} onChange={(e) => setForm({ ...form, adminNotes: e.target.value })} className="input" placeholder="Notas para el equipo" />
            </div>
          </div>
          <button type="submit" disabled={saving || !form.customerName} className="btn-primary w-full justify-center gap-2 py-3">
            {saving ? <><Loader2 className="h-4 w-4 animate-spin" />Guardando...</> : <><ShoppingCart className="h-4 w-4" />Crear pedido</>}
          </button>
        </form>
      </div>
    </div>
  );
}
