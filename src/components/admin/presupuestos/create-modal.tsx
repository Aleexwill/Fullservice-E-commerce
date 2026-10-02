'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Clock, FileText, Search, Loader2 } from 'lucide-react';
import type { AsistenteResult } from '@/components/admin/presupuesto-asistente';

export const DRAFT_KEY = 'presupuesto_draft';
export const EMPTY_FORM = { customerName: '', customerEmail: '', customerPhone: '', customerCompany: '', customerAddress: '', serviceTitle: '', serviceType: 'mantenimiento', description: '', details: '', estimatedValue: '', finalValue: '', estimatedDuration: '', scheduledDate: '', assignedTo: '', priority: 'media' };

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
          className="flex-1 bg-transparent font-body text-body-sm text-arctic outline-none placeholder:text-steel-500"
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
              <span className="shrink-0 font-mono text-[0.6rem] text-steel-500">{c.jobsCount} trabajo{c.jobsCount !== 1 ? 's' : ''}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function CreatePresupuestoModal({ onClose, onCreated, initialData, aiResult }: { onClose: () => void; onCreated: (id?: string) => void; initialData?: Record<string, string>; aiResult?: AsistenteResult }) {
  const [saving, setSaving] = useState<null | 'falta_presupuestar' | 'enviado'>(null);
  const [autoSaved, setAutoSaved] = useState(false);
  const [restored, setRestored] = useState(false);
  const [saveError, setSaveError] = useState('');

  const [f, setF] = useState(() => {
    if (aiResult) return {
      ...EMPTY_FORM,
      serviceTitle: aiResult.serviceTitle || '',
      serviceType: aiResult.serviceType || 'mantenimiento',
      description: aiResult.description || '',
      details: aiResult.details || '',
      estimatedDuration: aiResult.estimatedDuration || '',
      priority: aiResult.priority || 'media',
      estimatedValue: aiResult.estimatedValue ? String(aiResult.estimatedValue) : '',
    };
    if (initialData) return { ...EMPTY_FORM, ...initialData };
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) { setRestored(true); return { ...EMPTY_FORM, ...JSON.parse(saved) }; }
    } catch (_) {}
    return EMPTY_FORM;
  });

  useEffect(() => {
    const t = setTimeout(() => {
      try { localStorage.setItem(DRAFT_KEY, JSON.stringify(f)); setAutoSaved(true); setTimeout(() => setAutoSaved(false), 1500); } catch (_) {}
    }, 800);
    return () => clearTimeout(t);
  }, [f]);

  const clearDraft = () => { try { localStorage.removeItem(DRAFT_KEY); } catch (_) {} };

  const fillFromCliente = (c: any) => setF((prev: typeof EMPTY_FORM) => ({
    ...prev, customerName: c.name || prev.customerName, customerEmail: c.email || prev.customerEmail,
    customerPhone: c.phone || prev.customerPhone, customerCompany: c.company || prev.customerCompany,
    customerAddress: c.address || prev.customerAddress,
  }));

  const guardar = async (status: 'falta_presupuestar' | 'enviado') => {
    if (!f.serviceTitle.trim()) return;
    setSaving(status); setSaveError('');
    try {
      const res = await fetch('/api/presupuestos', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: { name: f.customerName || 'Sin nombre', email: f.customerEmail, phone: f.customerPhone, company: f.customerCompany, address: f.customerAddress },
          serviceTitle: f.serviceTitle, serviceType: f.serviceType, description: f.description, details: f.details,
          estimatedValue: f.estimatedValue ? Number(f.estimatedValue) : null,
          finalValue: f.finalValue ? Number(f.finalValue) : null,
          estimatedDuration: f.estimatedDuration, scheduledDate: f.scheduledDate, assignedTo: f.assignedTo,
          priority: f.priority, source: 'admin', status,
          ...(aiResult?.calculationData ? { calculationData: aiResult.calculationData } : {}),
        }),
      });
      if (res.ok) { clearDraft(); const d = await res.json(); onCreated(d?.id); }
      else { const err = await res.json().catch(() => ({})); setSaveError(err?.error || `Error ${res.status}`); }
    } catch { setSaveError('Error de red. Intentá de nuevo.'); }
    finally { setSaving(null); }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-carbon/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex w-full max-w-2xl flex-col rounded-lg border border-steel-900/60 bg-carbon-light shadow-2xl" style={{ maxHeight: '92vh' }}>
        <div className="shrink-0 border-b border-steel-900/40">
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <h2 className="font-display text-h2 text-arctic">Nuevo presupuesto</h2>
              <p className="mt-0.5 font-body text-caption text-steel-500">Los datos se guardan automáticamente</p>
            </div>
            <div className="flex items-center gap-3">
              {autoSaved && <span className="flex items-center gap-1 font-body text-caption text-success-bright animate-pulse"><span className="h-1.5 w-1.5 rounded-full bg-success-bright" /> Auto-guardado</span>}
              <button onClick={onClose} className="rounded-md p-1.5 text-steel-500 hover:bg-steel-900"><X className="h-5 w-5" /></button>
            </div>
          </div>
          {restored && (
            <div className="mx-6 mb-3 flex items-center justify-between gap-3 rounded-md border border-blue/30 bg-blue/10 px-4 py-2.5">
              <p className="font-body text-caption text-blue-bright"><span className="font-semibold">Datos recuperados</span> — se restauró el borrador pendiente.</p>
              <button onClick={() => { setF(EMPTY_FORM); clearDraft(); setRestored(false); }} className="shrink-0 font-body text-caption text-steel-500 hover:text-arctic underline">Empezar de cero</button>
            </div>
          )}
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-5 p-6">
            <div className="card p-4">
              <h3 className="mb-3 font-display text-h4 text-arctic">Servicio</h3>
              <div className="grid grid-cols-2 gap-3">
                <input type="text" placeholder="Título del servicio *" value={f.serviceTitle} onChange={(e) => setF({ ...f, serviceTitle: e.target.value })} className="input col-span-2" />
                <select value={f.serviceType} onChange={(e) => setF({ ...f, serviceType: e.target.value })} className="input">
                  <option value="mantenimiento">Mantenimiento</option>
                  <option value="civil">Construcción civil</option>
                  <option value="metalurgica">Metalúrgica</option>
                  <option value="otro">Otro</option>
                </select>
                <select value={f.priority} onChange={(e) => setF({ ...f, priority: e.target.value })} className="input">
                  <option value="baja">Prioridad baja</option>
                  <option value="media">Prioridad media</option>
                  <option value="alta">Prioridad alta</option>
                  <option value="urgente">Urgente</option>
                </select>
              </div>
              <textarea placeholder="Descripción del trabajo a realizar" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} className="input mt-3 resize-none" rows={3} />
              <textarea placeholder="Detalles adicionales, observaciones..." value={f.details} onChange={(e) => setF({ ...f, details: e.target.value })} className="input mt-2 resize-none" rows={2} />
            </div>
            <div className="card p-4">
              <h3 className="mb-3 font-display text-h4 text-arctic">Valores y programación</h3>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label mb-1 block">Valor estimado (Gs.)</label><input type="number" placeholder="0" value={f.estimatedValue} onChange={(e) => setF({ ...f, estimatedValue: e.target.value })} className="input font-mono" /></div>
                <div><label className="label mb-1 block">Valor cotizado (Gs.)</label><input type="number" placeholder="0" value={f.finalValue} onChange={(e) => setF({ ...f, finalValue: e.target.value })} className="input font-mono" /></div>
                <div><label className="label mb-1 block">Duración estimada</label><input type="text" placeholder="ej: 3 días" value={f.estimatedDuration} onChange={(e) => setF({ ...f, estimatedDuration: e.target.value })} className="input" /></div>
                <div><label className="label mb-1 block">Fecha programada</label><input type="date" value={f.scheduledDate} onChange={(e) => setF({ ...f, scheduledDate: e.target.value })} className="input" /></div>
                <div className="col-span-2"><label className="label mb-1 block">Responsable / Equipo</label><input type="text" placeholder="Nombre del técnico o equipo" value={f.assignedTo} onChange={(e) => setF({ ...f, assignedTo: e.target.value })} className="input" /></div>
              </div>
            </div>
            <div className="card p-4">
              <h3 className="mb-3 font-display text-h4 text-arctic">Cliente</h3>
              <ClienteBuscador onSelect={fillFromCliente} />
              <p className="mb-3 mt-1.5 font-body text-caption text-steel-500">O completá los datos manualmente:</p>
              <div className="grid grid-cols-2 gap-3">
                <input type="text" placeholder="Nombre del cliente" value={f.customerName} onChange={(e) => setF({ ...f, customerName: e.target.value })} className="input" />
                <input type="text" placeholder="Empresa" value={f.customerCompany} onChange={(e) => setF({ ...f, customerCompany: e.target.value })} className="input" />
                <input type="email" placeholder="Email" value={f.customerEmail} onChange={(e) => setF({ ...f, customerEmail: e.target.value })} className="input" />
                <input type="text" placeholder="Teléfono" value={f.customerPhone} onChange={(e) => setF({ ...f, customerPhone: e.target.value })} className="input" />
                <input type="text" placeholder="Dirección" value={f.customerAddress} onChange={(e) => setF({ ...f, customerAddress: e.target.value })} className="input col-span-2" />
              </div>
            </div>
          </div>
        </div>
        <div className="shrink-0 border-t border-steel-900/40 bg-carbon-light px-6 py-4">
          {saveError && <div className="mb-3 rounded-md border border-red-500/30 bg-red-500/10 px-4 py-2.5 font-body text-caption text-red-400">{saveError}</div>}
          <p className="mb-3 font-body text-caption text-steel-500"><span className="text-steel-500">Falta presupuestar:</span> guardá y continuá después. <span className="text-steel-500">Enviado:</span> va al Archivo como presupuesto enviado al cliente.</p>
          <div className="flex gap-3">
            <button onClick={() => guardar('falta_presupuestar')} disabled={!!saving || !f.serviceTitle.trim()} className="btn-secondary flex-1 justify-center gap-2 disabled:opacity-50">
              {saving === 'falta_presupuestar' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Clock className="h-4 w-4" />} Falta presupuestar
            </button>
            <button onClick={() => guardar('enviado')} disabled={!!saving || !f.serviceTitle.trim()} className="btn-primary flex-1 justify-center gap-2 disabled:opacity-50">
              {saving === 'enviado' ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />} Crear presupuesto
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
