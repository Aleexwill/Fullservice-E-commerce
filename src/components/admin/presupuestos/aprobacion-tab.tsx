'use client';

import { useState } from 'react';
import { ShieldCheck, ThumbsUp, ThumbsDown, Calculator, Printer } from 'lucide-react';
import { imprimirPresupuesto } from '@/lib/presupuesto-pdf';
import type { Presupuesto } from './types';
import { TYPE_MAP, PRIORITY_MAP, formatGs, formatDate } from './types';

export function AprobacionTab({ items, loading, onOpen, onApprove, onReject, onPrint }: {
  items: Presupuesto[];
  loading: boolean;
  onOpen: (id: string) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onPrint: (item: Presupuesto) => void;
}) {
  const [confirmId, setConfirmId] = useState<{ id: string; action: 'approve' | 'reject' } | null>(null);

  const handleConfirm = () => {
    if (!confirmId) return;
    if (confirmId.action === 'approve') onApprove(confirmId.id);
    else onReject(confirmId.id);
    setConfirmId(null);
  };

  if (loading) return <div className="space-y-3">{Array.from({length:3}).map((_,i) => <div key={i} className="card animate-pulse p-5 h-24 bg-steel-900/40" />)}</div>;

  return (
    <div className="space-y-4">
      {/* Header info */}
      <div className="flex items-center gap-3 rounded-lg border border-yellow-bright/20 bg-yellow-bright/5 px-4 py-3">
        <ShieldCheck className="h-5 w-5 shrink-0 text-yellow-bright" />
        <p className="font-body text-body-sm text-steel-300">
          {items.length === 0
            ? 'No hay presupuestos pendientes de aprobación.'
            : `${items.length} presupuesto${items.length !== 1 ? 's' : ''} esperando aprobación del administrador.`}
        </p>
      </div>

      {items.length === 0 ? (
        <div className="card p-12 text-center">
          <ShieldCheck className="mx-auto h-12 w-12 text-steel-500" />
          <h3 className="mt-4 font-display text-h3 text-arctic">Todo al día</h3>
          <p className="mt-2 font-body text-body-sm text-steel-500">No hay presupuestos pendientes de aprobación.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => {
            const tp = TYPE_MAP[item.serviceType] || TYPE_MAP.otro;
            const pr = PRIORITY_MAP[item.priority] || PRIORITY_MAP.media;
            const TpIcon = tp.icon;
            const valor = item.finalValue ?? item.estimatedValue;
            return (
              <div key={item.id} className="card overflow-hidden">
                {/* Accent bar */}
                <div className="h-[3px] w-full bg-gradient-to-r from-yellow-bright/60 to-yellow-bright/10" />
                <div className="flex items-start gap-4 p-4">
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-steel-900 ${tp.color}`}><TpIcon className="h-5 w-5" /></div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-caption text-blue-bright">{item.code}</span>
                      <span className="badge-yellow">Pendiente aprobación</span>
                      {(item.priority === 'alta' || item.priority === 'urgente') && (
                        <span className={`font-mono text-[0.6rem] font-bold ${pr.color}`}>{pr.label.toUpperCase()}</span>
                      )}
                    </div>
                    <p className="mt-0.5 font-body text-body-sm font-semibold text-arctic">{item.serviceTitle}</p>
                    <p className="font-body text-caption text-steel-500">{item.customer.name}{item.customer.company ? ` — ${item.customer.company}` : ''}</p>
                    {item.description && (
                      <p className="mt-1 line-clamp-2 font-body text-caption text-steel-500">{item.description}</p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-3 text-caption text-steel-500">
                      {valor && <span className="font-mono text-arctic">{formatGs(Number(valor))}</span>}
                      {item.estimatedDuration && <span>⏱ {item.estimatedDuration}</span>}
                      {item.assignedTo && <span>👷 {item.assignedTo}</span>}
                      <span className="font-mono text-[0.6rem]">{formatDate(item.updatedAt)}</span>
                    </div>
                  </div>
                  {/* Actions */}
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onPrint(item)}
                        className="rounded p-1.5 text-steel-500 hover:bg-steel-900 hover:text-arctic"
                        title="Imprimir"
                      ><Printer className="h-4 w-4" /></button>
                      <button
                        onClick={() => onOpen(item.id)}
                        className="flex items-center gap-1 rounded px-2 py-1 text-[10px] font-medium text-blue-bright hover:bg-blue-muted transition-colors"
                      ><Calculator className="h-3 w-3" /> Ver planilla</button>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setConfirmId({ id: item.id, action: 'reject' })}
                        className="flex items-center gap-1.5 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-1.5 font-body text-[11px] font-medium text-red-400 transition-colors hover:bg-red-500/20"
                      ><ThumbsDown className="h-3.5 w-3.5" /> Rechazar</button>
                      <button
                        onClick={() => setConfirmId({ id: item.id, action: 'approve' })}
                        className="flex items-center gap-1.5 rounded-md border border-success-bright/30 bg-success-bright/10 px-3 py-1.5 font-body text-[11px] font-medium text-success-bright transition-colors hover:bg-success-bright/20"
                      ><ThumbsUp className="h-3.5 w-3.5" /> Aprobar</button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirm dialog */}
      {confirmId && (() => {
        const item = items.find(i => i.id === confirmId.id);
        const isApprove = confirmId.action === 'approve';
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setConfirmId(null)}>
            <div className="card w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
              <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${isApprove ? 'bg-success-bright/15' : 'bg-red-500/15'}`}>
                {isApprove
                  ? <ThumbsUp className="h-6 w-6 text-success-bright" />
                  : <ThumbsDown className="h-6 w-6 text-red-400" />}
              </div>
              <h3 className="mt-4 text-center font-display text-h3 text-arctic">
                {isApprove ? '¿Aprobar presupuesto?' : '¿Rechazar presupuesto?'}
              </h3>
              <p className="mt-2 text-center font-body text-body-sm text-steel-500">
                {item?.code} — {item?.serviceTitle}
              </p>
              <p className="mt-1 text-center font-body text-caption text-steel-500">
                {isApprove
                  ? 'El presupuesto pasará a estado Aprobado y quedará listo para ejecución.'
                  : 'El presupuesto pasará a estado De baja. Esta acción se puede revertir cambiando el estado manualmente.'}
              </p>
              <div className="mt-6 flex gap-3">
                <button onClick={() => setConfirmId(null)} className="btn-secondary flex-1">Cancelar</button>
                <button
                  onClick={handleConfirm}
                  className={`flex-1 rounded-md px-4 py-2 font-body text-body-sm font-semibold text-white transition-colors ${isApprove ? 'bg-success-bright hover:bg-success-bright/80' : 'bg-red-500 hover:bg-red-600'}`}
                >
                  {isApprove ? 'Sí, aprobar' : 'Sí, rechazar'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
