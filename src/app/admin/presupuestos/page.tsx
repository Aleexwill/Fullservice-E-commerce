'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Search, RefreshCw, Plus, Trash2, X, Send, User, Mail, Phone, Building, MapPin, MessageSquare, Clock, Calendar, Loader2, FileText, ChevronRight, AlertTriangle, Wrench, HardHat, Factory, Calculator, GitBranch } from 'lucide-react';
import { fetchJson } from '@/lib/utils';
import { PresupuestoCalculo, type CalculationData } from '@/components/admin/presupuesto-calculo';

interface Presupuesto {
  id: string; code: string; status: string; serviceType: string; serviceTitle: string;
  customer: { name: string; email: string; phone: string; company: string; address: string };
  description: string; details: string; estimatedValue: number | null; finalValue: number | null;
  estimatedDuration: string; priority: string; source: string; assignedTo: string; scheduledDate: string;
  calculationData: CalculationData | null;
  notes: { id: string; text: string; createdAt: string }[];
  createdAt: string; updatedAt: string;
}

const STATUS_MAP: Record<string, { label: string; badge: string }> = {
  borrador: { label: 'Borrador', badge: 'badge-neutral' },
  nuevo: { label: 'Nuevo', badge: 'badge-blue' },
  en_revision: { label: 'En revision', badge: 'badge-yellow' },
  cotizado: { label: 'Cotizado', badge: 'badge-yellow' },
  aprobado: { label: 'Aprobado', badge: 'badge-green' },
  en_ejecucion: { label: 'En ejecucion', badge: 'badge-green' },
  completado: { label: 'Completado', badge: 'badge-neutral' },
  rechazado: { label: 'Rechazado', badge: 'badge-red' },
};

const TYPE_MAP: Record<string, { label: string; icon: any; color: string }> = {
  mantenimiento: { label: 'Mantenimiento', icon: Wrench, color: 'text-blue-bright' },
  civil: { label: 'Construccion civil', icon: HardHat, color: 'text-yellow-bright' },
  metalurgica: { label: 'Metalurgica', icon: Factory, color: 'text-[#48BB78]' },
  otro: { label: 'Otro', icon: FileText, color: 'text-steel-300' },
};

const PRIORITY_MAP: Record<string, { label: string; color: string }> = {
  baja: { label: 'Baja', color: 'text-steel-500' }, media: { label: 'Media', color: 'text-yellow-bright' },
  alta: { label: 'Alta', color: 'text-[#FC8181]' }, urgente: { label: 'Urgente', color: 'text-[#FC8181]' },
};

const formatGs = (n: number) => 'Gs. ' + n.toLocaleString('es-PY');
const formatDate = (d: string) => new Date(d).toLocaleDateString('es-PY', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export default function AdminPresupuestosPage() {
  const [items, setItems] = useState<Presupuesto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [selected, setSelected] = useState<Presupuesto | null>(null);
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [editFinal, setEditFinal] = useState('');
  const [editingFinal, setEditingFinal] = useState(false);
  const [editSched, setEditSched] = useState('');
  const [editDuration, setEditDuration] = useState('');
  const [editAssigned, setEditAssigned] = useState('');
  const [savingFields, setSavingFields] = useState(false);
  const [activeTab, setActiveTab] = useState<'detalle' | 'calculo'>('detalle');

  const fetchData = useCallback(() => {
    setLoading(true);
    const p = new URLSearchParams();
    if (search) p.set('search', search);
    if (filterStatus) p.set('status', filterStatus);
    if (filterType) p.set('type', filterType);
    fetchJson<any>(`/api/presupuestos?${p}`).then((d) => { setItems(d?.presupuestos || []); setLoading(false); });
  }, [search, filterStatus, filterType]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const updateStatus = async (id: string, status: string) => {
    const res = await fetch(`/api/presupuestos/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    if (res.ok) { fetchData(); if (selected?.id === id) { const u = await res.json(); setSelected(u); } }
  };

  const updateField = async (id: string, field: string, value: any) => {
    const res = await fetch(`/api/presupuestos/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ [field]: value }) });
    if (res.ok && selected?.id === id) { const u = await res.json(); setSelected(u); }
  };

  const openDetail = (item: Presupuesto) => {
    setSelected(item);
    setEditFinal(item.finalValue ? String(item.finalValue) : '');
    setEditSched(item.scheduledDate || '');
    setEditDuration(item.estimatedDuration || '');
    setEditAssigned(item.assignedTo || '');
    setEditingFinal(false);
    setActiveTab('detalle');
  };

  const saveWorkFields = async () => {
    if (!selected) return;
    setSavingFields(true);
    const res = await fetch(`/api/presupuestos/${selected.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        finalValue: editFinal ? Number(editFinal) : null,
        scheduledDate: editSched,
        estimatedDuration: editDuration,
        assignedTo: editAssigned,
      }),
    });
    if (res.ok) { const u = await res.json(); setSelected(u); fetchData(); }
    setSavingFields(false);
  };

  const sendWhatsApp = () => {
    if (!selected) return;
    const phone = selected.customer.phone.replace(/\D/g, '');
    const value = editFinal ? Number(editFinal) : selected.finalValue;
    const valueText = value ? `un valor de *${formatGs(value)}*` : 'un valor a definir';
    const msg = `Hola ${selected.customer.name}, le comunicamos que el presupuesto *${selected.code}* para el servicio *"${selected.serviceTitle}"* tiene ${valueText}. ¿Lo aprobamos? Quedamos a su disposición. — Full Service & Clean`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const aprobar = async () => {
    if (!selected) return;
    if (!confirm('¿Marcar como aprobado y pasar a ejecución?')) return;
    await saveWorkFields();
    await updateStatus(selected.id, 'aprobado');
  };

  const crearNuevaVersion = async () => {
    if (!selected) return;
    if (!confirm(`¿Crear una nueva versión de ${selected.code}? Se copiará todo el contenido con estado Borrador.`)) return;
    // Detect current version suffix and increment
    const baseCode = selected.code.replace(/-v\d+$/, '');
    const currentV = selected.code.match(/-v(\d+)$/)?.[1];
    const nextV = currentV ? Number(currentV) + 1 : 2;
    const res = await fetch('/api/presupuestos', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer: selected.customer,
        serviceTitle: selected.serviceTitle,
        serviceType: selected.serviceType,
        description: selected.description,
        details: selected.details,
        estimatedValue: selected.estimatedValue,
        finalValue: null,
        estimatedDuration: selected.estimatedDuration,
        scheduledDate: selected.scheduledDate,
        assignedTo: selected.assignedTo,
        priority: selected.priority,
        source: 'admin',
        status: 'borrador',
        calculationData: selected.calculationData
          ? { ...selected.calculationData, previousFilas: selected.calculationData.filas }
          : null,
        _versionOf: baseCode,
        _versionNum: nextV,
      }),
    });
    if (res.ok) {
      const nuevo = await res.json();
      // Rename code to include version suffix
      await fetch(`/api/presupuestos/${nuevo.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ _forceCode: `${baseCode}-v${nextV}` }),
      });
      fetchData();
      setSelected(null);
    }
  };

  const addNote = async () => {
    if (!selected || !newNote.trim()) return;
    setAddingNote(true);
    const res = await fetch(`/api/presupuestos/${selected.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ _addNote: newNote.trim() }) });
    if (res.ok) { const u = await res.json(); setSelected(u); setNewNote(''); }
    setAddingNote(false);
  };

  const del = async (id: string) => { if (!confirm('¿Eliminar este presupuesto?')) return; await fetch(`/api/presupuestos/${id}`, { method: 'DELETE' }); fetchData(); if (selected?.id === id) setSelected(null); };

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-h1 uppercase text-arctic">Presupuestos</h1>
          <p className="mt-1 font-body text-body-sm text-steel-300">Solicitudes de presupuesto de servicios</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary"><Plus className="h-4 w-4" /> Nuevo presupuesto</button>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[240px] flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-steel-500" /><input type="text" placeholder="Buscar por codigo, cliente, servicio..." value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-10" /></div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="input max-w-[160px]"><option value="">Todo estado</option>{Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="input max-w-[160px]"><option value="">Todo tipo</option>{Object.entries(TYPE_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select>
        <button onClick={fetchData} className="btn-secondary"><RefreshCw className="h-4 w-4" /></button>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="card animate-pulse p-4"><div className="h-16 rounded bg-steel-900" /></div>)}</div>
      ) : items.length === 0 ? (
        <div className="card p-12 text-center">
          <FileText className="mx-auto h-12 w-12 text-steel-700" />
          <h3 className="mt-4 font-display text-h3 text-arctic">Sin presupuestos</h3>
          <p className="mt-2 font-body text-body-sm text-steel-500">Las solicitudes de presupuesto de servicios apareceran aqui.</p>
          <button onClick={() => setShowCreate(true)} className="btn-primary mt-6 inline-flex"><Plus className="h-4 w-4" /> Crear solicitud</button>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => {
            const st = STATUS_MAP[item.status] || STATUS_MAP.nuevo;
            const tp = TYPE_MAP[item.serviceType] || TYPE_MAP.otro;
            const pr = PRIORITY_MAP[item.priority] || PRIORITY_MAP.media;
            const TpIcon = tp.icon;
            return (
              <div key={item.id} className="card-interactive flex items-center gap-4 p-4" onClick={() => openDetail(item)}>
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-steel-900 ${tp.color}`}><TpIcon className="h-5 w-5" /></div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-caption text-blue-bright">{item.code}</span>
                    <span className={st.badge}>{st.label}</span>
                    {(item.priority === 'alta' || item.priority === 'urgente') && <AlertTriangle className={`h-3.5 w-3.5 ${pr.color}`} />}
                  </div>
                  <p className="mt-0.5 font-body text-body-sm font-medium text-arctic">{item.serviceTitle}</p>
                  <p className="truncate font-body text-caption text-steel-500">{item.customer.name}{item.customer.company ? ` — ${item.customer.company}` : ''}</p>
                </div>
                <div className="hidden shrink-0 text-right md:block">
                  {item.estimatedValue && <p className="font-mono text-body-sm text-arctic">{formatGs(item.estimatedValue)}</p>}
                  <p className="font-body text-caption text-steel-700">{formatDate(item.createdAt)}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {item.notes.length > 0 && <span className="flex items-center gap-0.5 font-mono text-caption text-steel-700"><MessageSquare className="h-3 w-3" />{item.notes.length}</span>}
                  <button onClick={(e) => { e.stopPropagation(); del(item.id); }} className="rounded p-1 text-steel-700 hover:bg-red-500/10 hover:text-red-400"><Trash2 className="h-3.5 w-3.5" /></button>
                  <ChevronRight className="h-4 w-4 text-steel-700" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail panel */}
      {selected && (
        <div className="fixed inset-0 z-[100] flex items-end justify-end">
          <div className="absolute inset-0 bg-carbon/60 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="relative h-full w-full max-w-7xl overflow-y-auto border-l border-steel-900/40 bg-carbon-light shadow-2xl">
            <div className="sticky top-0 z-10 border-b border-steel-900/40 bg-carbon-light">
              <div className="flex items-center justify-between px-6 pt-4 pb-3">
                <div><span className="font-mono text-caption text-blue-bright">{selected.code}</span><h2 className="font-display text-h3 text-arctic">{selected.serviceTitle}</h2></div>
                <button onClick={() => setSelected(null)} className="rounded-md p-1.5 text-steel-500 hover:bg-steel-900"><X className="h-5 w-5" /></button>
              </div>
              {/* Tabs */}
              <div className="flex gap-1 px-6 pb-0">
                <button onClick={() => setActiveTab('detalle')} className={`flex items-center gap-1.5 rounded-t-md px-4 py-2 font-body text-body-sm transition-colors ${activeTab === 'detalle' ? 'bg-steel-900 text-arctic' : 'text-steel-500 hover:text-arctic'}`}>
                  <FileText className="h-3.5 w-3.5" /> Detalle
                </button>
                <button onClick={() => setActiveTab('calculo')} className={`flex items-center gap-1.5 rounded-t-md px-4 py-2 font-body text-body-sm transition-colors ${activeTab === 'calculo' ? 'bg-steel-900 text-arctic' : 'text-steel-500 hover:text-arctic'}`}>
                  <Calculator className="h-3.5 w-3.5" /> Cálculo interno
                  {!!(selected.calculationData?.filas?.length) && (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#48BB78]/20 font-mono text-[0.5rem] text-[#48BB78]">
                      {selected.calculationData!.filas!.length}
                    </span>
                  )}
                </button>
              </div>
            </div>
            <div className="space-y-5 p-6">
              {/* ── PESTAÑA CÁLCULO INTERNO — siempre montado, solo oculto ── */}
              <div className={activeTab === 'calculo' ? '' : 'hidden'}>
                <PresupuestoCalculo
                  presupuestoId={selected.id}
                  serviceTitle={selected.serviceTitle}
                  customerName={selected.customer.name}
                  code={selected.code}
                  initial={selected.calculationData}
                  onSaved={(data) => setSelected((s) => s ? { ...s, calculationData: data } : s)}
                />
              </div>

              {/* ── PESTAÑA DETALLE ── */}
              {activeTab === 'detalle' && <>
              {/* Status + Priority */}
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label mb-1 block">Estado</label><select value={selected.status} onChange={(e) => updateStatus(selected.id, e.target.value)} className="input">{Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></div>
                <div><label className="label mb-1 block">Prioridad</label><select value={selected.priority} onChange={(e) => updateField(selected.id, 'priority', e.target.value)} className="input">{Object.entries(PRIORITY_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></div>
              </div>
              {/* Customer */}
              <div className="card p-4">
                <h3 className="mb-2 flex items-center gap-2 font-display text-h4 text-arctic"><User className="h-4 w-4 text-blue-bright" /> Cliente</h3>
                <div className="space-y-1 font-body text-body-sm">
                  <p className="font-medium text-arctic">{selected.customer.name}</p>
                  {selected.customer.company && <p className="flex items-center gap-1 text-steel-300"><Building className="h-3 w-3" />{selected.customer.company}</p>}
                  {selected.customer.email && <p className="flex items-center gap-1 text-steel-300"><Mail className="h-3 w-3" />{selected.customer.email}</p>}
                  {selected.customer.phone && <p className="flex items-center gap-1 text-steel-300"><Phone className="h-3 w-3" />{selected.customer.phone}</p>}
                  {selected.customer.address && <p className="flex items-center gap-1 text-steel-300"><MapPin className="h-3 w-3" />{selected.customer.address}</p>}
                </div>
              </div>
              {/* Description */}
              <div className="card p-4">
                <h3 className="mb-2 font-display text-h4 text-arctic">Descripcion del servicio</h3>
                <p className="whitespace-pre-line font-body text-body-sm text-steel-300">{selected.description || 'Sin descripcion'}</p>
                {selected.details && <><div className="my-2 border-t border-steel-900/30" /><p className="whitespace-pre-line font-body text-caption text-steel-500">{selected.details}</p></>}
              </div>
              {/* Values */}
              <div className="grid grid-cols-2 gap-3">
                <div className="card p-3 text-center"><p className="label">Estimado cliente</p><p className="mt-1 font-display text-h3 text-arctic">{selected.estimatedValue ? formatGs(selected.estimatedValue) : '—'}</p></div>
                <div className="card p-3">
                  <p className="label mb-1">Valor final cotizado</p>
                  {editingFinal ? (
                    <input type="number" value={editFinal} onChange={(e) => setEditFinal(e.target.value)} className="input font-mono text-[#48BB78]" placeholder="Monto en Gs." autoFocus onBlur={() => setEditingFinal(false)} onKeyDown={(e) => { if (e.key === 'Enter') setEditingFinal(false); }} />
                  ) : (
                    <button onClick={() => setEditingFinal(true)} className="mt-1 w-full text-left font-display text-h3 text-[#48BB78] hover:opacity-80">
                      {editFinal ? formatGs(Number(editFinal)) : <span className="text-steel-700 text-body">+ Agregar</span>}
                    </button>
                  )}
                </div>
              </div>

              {/* Resumen del cálculo interno */}
              {(() => {
                const cd = selected.calculationData;
                if (!cd?.filas?.length) return null;
                const titulos = cd.filas.filter((f: any) => f.tipo === 'titulo');
                const filasTot = cd.filas.filter((f: any) => f.tipo !== 'titulo');
                const subtotal = filasTot.reduce((s: number, f: any) => s + f.cantidad * f.precioVenta, 0);
                const iva = subtotal * ((cd.iva ?? 10) / 100);
                const total = subtotal + iva - (cd.descuento ?? 0);

                // section total for each titulo
                const secTotal = (tituloId: string) => {
                  let inside = false, t = 0;
                  for (const r of cd.filas) {
                    if (r.id === tituloId) { inside = true; continue; }
                    if (inside && r.tipo === 'titulo') break;
                    if (inside) t += r.cantidad * r.precioVenta;
                  }
                  return t;
                };

                return (
                  <div className="card p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="flex items-center gap-2 font-display text-h4 text-arctic">
                        <Calculator className="h-4 w-4 text-blue-bright" /> Resumen del presupuesto
                      </h3>
                      <button onClick={() => setActiveTab('calculo')} className="font-body text-caption text-blue-bright hover:underline">Ver detalle →</button>
                    </div>
                    <div className="space-y-1">
                      {titulos.length > 0 ? titulos.map((t: any) => {
                        const st = secTotal(t.id);
                        return (
                          <div key={t.id} className="flex items-center justify-between gap-3 rounded-md bg-steel-900/30 px-3 py-2">
                            <span className="font-body text-body-sm text-arctic">{t.descripcion || 'Sin título'}</span>
                            <span className="shrink-0 font-mono text-body-sm text-[#48BB78]">{formatGs(st)}</span>
                          </div>
                        );
                      }) : filasTot.map((f: any) => (
                        <div key={f.id} className="flex items-center justify-between gap-3 rounded-md bg-steel-900/30 px-3 py-2">
                          <span className="font-body text-caption text-steel-300">{f.descripcion}</span>
                          <span className="shrink-0 font-mono text-caption text-[#48BB78]">{formatGs(f.cantidad * f.precioVenta)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 space-y-1 border-t border-steel-900/40 pt-3 font-body text-body-sm">
                      <div className="flex justify-between text-steel-500"><span>Subtotal</span><span className="font-mono">{formatGs(subtotal)}</span></div>
                      <div className="flex justify-between text-steel-500"><span>IVA ({cd.iva ?? 10}%)</span><span className="font-mono">{formatGs(iva)}</span></div>
                      {cd.descuento > 0 && <div className="flex justify-between text-[#FC8181]"><span>Descuento</span><span className="font-mono">-{formatGs(cd.descuento)}</span></div>}
                      <div className="flex justify-between font-semibold text-arctic"><span>TOTAL</span><span className="font-mono text-[#48BB78]">{formatGs(total)}</span></div>
                    </div>
                  </div>
                );
              })()}
              {/* Scheduling fields */}
              <div className="card p-4 space-y-3">
                <h3 className="font-display text-h4 text-arctic flex items-center gap-2"><Calendar className="h-4 w-4 text-blue-bright" /> Programación</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="label mb-1 block">Fecha programada</label><input type="text" value={editSched} onChange={(e) => setEditSched(e.target.value)} className="input" placeholder="ej: 15/09/2025" /></div>
                  <div><label className="label mb-1 block">Duración estimada</label><input type="text" value={editDuration} onChange={(e) => setEditDuration(e.target.value)} className="input" placeholder="ej: 2 días" /></div>
                </div>
                <div><label className="label mb-1 block">Responsable / Equipo</label><input type="text" value={editAssigned} onChange={(e) => setEditAssigned(e.target.value)} className="input" placeholder="Nombre del técnico o equipo" /></div>
                <button onClick={saveWorkFields} disabled={savingFields} className="btn-secondary w-full justify-center gap-2">
                  {savingFields ? <><Loader2 className="h-4 w-4 animate-spin" />Guardando...</> : 'Guardar cambios'}
                </button>
              </div>
              {/* Action buttons */}
              <div className="grid grid-cols-1 gap-2">
                {selected.customer.phone && (
                  <button onClick={sendWhatsApp} className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#25D366] px-4 py-2.5 font-body text-body-sm font-semibold text-white hover:bg-[#1ebe5d] transition-colors">
                    <MessageSquare className="h-4 w-4" /> Enviar presupuesto al cliente por WhatsApp
                  </button>
                )}
                {selected.status !== 'aprobado' && selected.status !== 'completado' && (
                  <button onClick={aprobar} className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#48BB78]/20 border border-[#48BB78]/40 px-4 py-2.5 font-body text-body-sm font-semibold text-[#48BB78] hover:bg-[#48BB78]/30 transition-colors">
                    <ChevronRight className="h-4 w-4" /> Aprobar y pasar a ejecución
                  </button>
                )}
                {(selected.status === 'cotizado' || selected.status === 'en_revision') && (
                  <button onClick={crearNuevaVersion} className="flex w-full items-center justify-center gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-2.5 font-body text-body-sm font-semibold text-yellow-400 hover:bg-yellow-500/20 transition-colors">
                    <GitBranch className="h-4 w-4" /> Modificar presupuesto (nueva versión)
                  </button>
                )}
              </div>
              {/* Notes */}
              <div>
                <h3 className="mb-3 flex items-center gap-2 font-display text-h4 text-arctic"><MessageSquare className="h-4 w-4 text-blue-bright" /> Seguimiento</h3>
                {selected.notes.length > 0 && <div className="mb-3 space-y-2">{selected.notes.map((n) => (<div key={n.id} className="rounded-md border border-steel-900/30 bg-carbon p-3"><p className="font-body text-body-sm text-steel-300">{n.text}</p><p className="mt-1 font-mono text-[0.6rem] text-steel-700">{formatDate(n.createdAt)}</p></div>))}</div>}
                <div className="flex gap-2"><input type="text" value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Agregar nota de seguimiento..." className="input flex-1" onKeyDown={(e) => e.key === 'Enter' && addNote()} /><button onClick={addNote} disabled={addingNote || !newNote.trim()} className="btn-primary shrink-0 px-3 disabled:opacity-50">{addingNote ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}</button></div>
              </div>
              <p className="font-mono text-[0.6rem] text-steel-700">Creado: {formatDate(selected.createdAt)} | Actualizado: {formatDate(selected.updatedAt)}</p>
              </>}
            </div>
          </div>
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <CreatePresupuestoModal
          onClose={() => setShowCreate(false)}
          onCreated={(id) => {
            setShowCreate(false);
            fetchData();
          }}
        />
      )}
    </div>
  );
}

function ClienteBuscador({ onSelect }: { onSelect: (c: any) => void }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!q || q.length < 2) { setResults([]); setOpen(false); return; }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/clientes?q=${encodeURIComponent(q)}&limit=8`);
        if (res.ok) { const d = await res.json(); setResults(d.clientes || []); setOpen(true); }
      } finally { setLoading(false); }
    }, 300);
  }, [q]);

  return (
    <div className="relative">
      <div className="flex items-center gap-2 rounded-md border border-blue/30 bg-carbon px-3 py-2">
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-bright shrink-0" /> : <Search className="h-3.5 w-3.5 text-blue-bright shrink-0" />}
        <input value={q} onChange={(e) => setQ(e.target.value)} onFocus={() => results.length > 0 && setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 150)}
          className="flex-1 bg-transparent font-body text-body-sm text-arctic outline-none placeholder:text-steel-700"
          placeholder="Buscar cliente existente por nombre, empresa o teléfono..." />
      </div>
      {open && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-steel-900/60 bg-carbon shadow-xl">
          {results.map((c: any) => (
            <button key={c.id} onMouseDown={() => { onSelect(c); setQ(''); setResults([]); setOpen(false); }}
              className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left hover:bg-steel-900/60">
              <div>
                <p className="font-body text-body-sm font-medium text-arctic">{c.name}</p>
                <p className="font-body text-caption text-steel-500">{[c.company, c.phone, c.email].filter(Boolean).join(' · ')}</p>
              </div>
              <span className="shrink-0 font-mono text-[0.6rem] text-steel-700">{c.jobsCount} trabajo{c.jobsCount !== 1 ? 's' : ''}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const DRAFT_KEY = 'presupuesto_draft';
const EMPTY_FORM = { customerName: '', customerEmail: '', customerPhone: '', customerCompany: '', customerAddress: '', serviceTitle: '', serviceType: 'mantenimiento', description: '', details: '', estimatedValue: '', finalValue: '', estimatedDuration: '', scheduledDate: '', assignedTo: '', priority: 'media' };

function CreatePresupuestoModal({ onClose, onCreated }: { onClose: () => void; onCreated: (id?: string) => void }) {
  const [saving, setSaving] = useState<null | 'borrador' | 'nuevo'>(null);
  const [autoSaved, setAutoSaved] = useState(false);
  const [restored, setRestored] = useState(false);

  const [f, setF] = useState(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) { setRestored(true); return { ...EMPTY_FORM, ...JSON.parse(saved) }; }
    } catch (_) {}
    return EMPTY_FORM;
  });

  // Auto-save to localStorage on every change
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(f));
        setAutoSaved(true);
        setTimeout(() => setAutoSaved(false), 1500);
      } catch (_) {}
    }, 800);
    return () => clearTimeout(t);
  }, [f]);

  const clearDraft = () => { try { localStorage.removeItem(DRAFT_KEY); } catch (_) {} };

  const fillFromCliente = (c: any) => setF((prev: typeof EMPTY_FORM) => ({
    ...prev,
    customerName: c.name || prev.customerName,
    customerEmail: c.email || prev.customerEmail,
    customerPhone: c.phone || prev.customerPhone,
    customerCompany: c.company || prev.customerCompany,
    customerAddress: c.address || prev.customerAddress,
  }));

  const guardar = async (status: 'borrador' | 'nuevo') => {
    if (!f.serviceTitle.trim()) return;
    setSaving(status);
    const res = await fetch('/api/presupuestos', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer: { name: f.customerName || 'Sin nombre', email: f.customerEmail, phone: f.customerPhone, company: f.customerCompany, address: f.customerAddress },
        serviceTitle: f.serviceTitle, serviceType: f.serviceType, description: f.description, details: f.details,
        estimatedValue: f.estimatedValue ? Number(f.estimatedValue) : null,
        finalValue: f.finalValue ? Number(f.finalValue) : null,
        estimatedDuration: f.estimatedDuration, scheduledDate: f.scheduledDate, assignedTo: f.assignedTo,
        priority: f.priority, source: 'admin', status,
      }),
    });
    setSaving(null);
    if (res.ok) { clearDraft(); const d = await res.json(); onCreated(d?.id); }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-carbon/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex w-full max-w-2xl flex-col rounded-lg border border-steel-900/60 bg-carbon-light shadow-2xl" style={{ maxHeight: '92vh' }}>
        {/* Header */}
        <div className="shrink-0 border-b border-steel-900/40">
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <h2 className="font-display text-h2 text-arctic">Nuevo presupuesto</h2>
              <p className="mt-0.5 font-body text-caption text-steel-500">Los datos se guardan automaticamente</p>
            </div>
            <div className="flex items-center gap-3">
              {autoSaved && (
                <span className="flex items-center gap-1 font-body text-caption text-[#48BB78] animate-pulse">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#48BB78]" /> Auto-guardado
                </span>
              )}
              <button onClick={onClose} className="rounded-md p-1.5 text-steel-500 hover:bg-steel-900"><X className="h-5 w-5" /></button>
            </div>
          </div>
          {restored && (
            <div className="mx-6 mb-3 flex items-center justify-between gap-3 rounded-md border border-blue/30 bg-blue/10 px-4 py-2.5">
              <p className="font-body text-caption text-blue-bright">
                <span className="font-semibold">Datos recuperados</span> — se restauro el borrador que habia quedado pendiente.
              </p>
              <button
                onClick={() => { setF(EMPTY_FORM); clearDraft(); setRestored(false); }}
                className="shrink-0 font-body text-caption text-steel-500 hover:text-arctic underline"
              >
                Empezar de cero
              </button>
            </div>
          )}
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-5 p-6">
            {/* Servicio */}
            <div className="card p-4">
              <h3 className="mb-3 font-display text-h4 text-arctic">Servicio</h3>
              <div className="grid grid-cols-2 gap-3">
                <input type="text" placeholder="Titulo del servicio *" value={f.serviceTitle} onChange={(e) => setF({ ...f, serviceTitle: e.target.value })} className="input col-span-2" />
                <select value={f.serviceType} onChange={(e) => setF({ ...f, serviceType: e.target.value })} className="input">
                  <option value="mantenimiento">Mantenimiento</option>
                  <option value="civil">Construccion civil</option>
                  <option value="metalurgica">Metalurgica</option>
                  <option value="otro">Otro</option>
                </select>
                <select value={f.priority} onChange={(e) => setF({ ...f, priority: e.target.value })} className="input">
                  <option value="baja">Prioridad baja</option>
                  <option value="media">Prioridad media</option>
                  <option value="alta">Prioridad alta</option>
                  <option value="urgente">Urgente</option>
                </select>
              </div>
              <textarea placeholder="Descripcion del trabajo a realizar" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} className="input mt-3 resize-none" rows={3} />
              <textarea placeholder="Detalles adicionales, observaciones..." value={f.details} onChange={(e) => setF({ ...f, details: e.target.value })} className="input mt-2 resize-none" rows={2} />
            </div>

            {/* Valores y programacion */}
            <div className="card p-4">
              <h3 className="mb-3 font-display text-h4 text-arctic">Valores y programacion</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label mb-1 block">Valor estimado (Gs.)</label>
                  <input type="number" placeholder="0" value={f.estimatedValue} onChange={(e) => setF({ ...f, estimatedValue: e.target.value })} className="input font-mono" />
                </div>
                <div>
                  <label className="label mb-1 block">Valor cotizado (Gs.)</label>
                  <input type="number" placeholder="0" value={f.finalValue} onChange={(e) => setF({ ...f, finalValue: e.target.value })} className="input font-mono" />
                </div>
                <div>
                  <label className="label mb-1 block">Duracion estimada</label>
                  <input type="text" placeholder="ej: 3 dias" value={f.estimatedDuration} onChange={(e) => setF({ ...f, estimatedDuration: e.target.value })} className="input" />
                </div>
                <div>
                  <label className="label mb-1 block">Fecha programada</label>
                  <input type="text" placeholder="ej: 20/09/2025" value={f.scheduledDate} onChange={(e) => setF({ ...f, scheduledDate: e.target.value })} className="input" />
                </div>
                <div className="col-span-2">
                  <label className="label mb-1 block">Responsable / Equipo</label>
                  <input type="text" placeholder="Nombre del tecnico o equipo asignado" value={f.assignedTo} onChange={(e) => setF({ ...f, assignedTo: e.target.value })} className="input" />
                </div>
              </div>
            </div>

            {/* Cliente */}
            <div className="card p-4">
              <h3 className="mb-3 font-display text-h4 text-arctic">Cliente</h3>
              <ClienteBuscador onSelect={fillFromCliente} />
              <p className="mb-3 mt-1.5 font-body text-caption text-steel-700">O completá los datos manualmente:</p>
              <div className="grid grid-cols-2 gap-3">
                <input type="text" placeholder="Nombre del cliente" value={f.customerName} onChange={(e) => setF({ ...f, customerName: e.target.value })} className="input" />
                <input type="text" placeholder="Empresa" value={f.customerCompany} onChange={(e) => setF({ ...f, customerCompany: e.target.value })} className="input" />
                <input type="email" placeholder="Email" value={f.customerEmail} onChange={(e) => setF({ ...f, customerEmail: e.target.value })} className="input" />
                <input type="text" placeholder="Telefono" value={f.customerPhone} onChange={(e) => setF({ ...f, customerPhone: e.target.value })} className="input" />
                <input type="text" placeholder="Direccion" value={f.customerAddress} onChange={(e) => setF({ ...f, customerAddress: e.target.value })} className="input col-span-2" />
              </div>
            </div>
          </div>
        </div>

        {/* Footer con botones */}
        <div className="shrink-0 border-t border-steel-900/40 bg-carbon-light px-6 py-4">
          <p className="mb-3 font-body text-caption text-steel-500">
            <span className="text-steel-700">Borrador:</span> guarda y podés continuar después. <span className="text-steel-700">Crear:</span> queda como solicitud nueva activa.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => guardar('borrador')}
              disabled={!!saving || !f.serviceTitle.trim()}
              className="btn-secondary flex-1 justify-center gap-2 disabled:opacity-50"
            >
              {saving === 'borrador' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Clock className="h-4 w-4" />}
              Guardar borrador
            </button>
            <button
              onClick={() => guardar('nuevo')}
              disabled={!!saving || !f.serviceTitle.trim()}
              className="btn-primary flex-1 justify-center gap-2 disabled:opacity-50"
            >
              {saving === 'nuevo' ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
              Crear presupuesto
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
