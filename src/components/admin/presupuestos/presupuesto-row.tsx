'use client';

import { AlertTriangle, Send, Calculator, Globe, Printer, Trash2, MessageSquare } from 'lucide-react';
import { imprimirPresupuesto } from '@/lib/presupuesto-pdf';
import type { Presupuesto } from './types';
import { STATUS_MAP, TYPE_MAP, PRIORITY_MAP, formatGs, formatDate, formatScheduledDate } from './types';

export function PresupuestoRow({ item, onOpen, onDelete, onStatusChange, onSendToApproval, hideWebBadge }: {
  item: Presupuesto; onOpen: () => void; onDelete: () => void;
  onStatusChange?: (status: string) => void;
  onSendToApproval?: () => void;
  hideWebBadge?: boolean;
}) {
  const canSendToApproval = onSendToApproval && !['pendiente_aprobacion','aprobado','en_ejecucion','finalizado','de_baja'].includes(item.status);
  const st = STATUS_MAP[item.status] || STATUS_MAP.nuevo;
  const tp = TYPE_MAP[item.serviceType] || TYPE_MAP.otro;
  const pr = PRIORITY_MAP[item.priority] || PRIORITY_MAP.media;
  const TpIcon = tp.icon;
  const isWeb = !hideWebBadge && (item.source === 'web' || item.source === 'website' || item.createdBy === 'Web');
  return (
    <div className="card-interactive flex items-center gap-4 p-4" onClick={onOpen}>
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-steel-900 ${tp.color}`}><TpIcon className="h-5 w-5" /></div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-caption text-blue-bright">{item.code}</span>
          {(item.priority === 'alta' || item.priority === 'urgente') && <AlertTriangle className={`h-3.5 w-3.5 ${pr.color}`} />}
          {isWeb ? (
            <span className="flex items-center gap-1 rounded-full border border-blue/30 bg-blue/10 px-2 py-0.5 font-mono text-[0.55rem] text-blue-bright"><Globe className="h-2.5 w-2.5" />Web</span>
          ) : null}
        </div>
        <p className="mt-0.5 font-body text-body-sm font-medium text-arctic">{item.serviceTitle}</p>
        <p className="truncate font-body text-caption text-steel-500">{item.customer.name}{item.customer.company ? ` — ${item.customer.company}` : ''}</p>
      </div>
      <div className="hidden shrink-0 text-right md:block">
        {(item.finalValue || item.estimatedValue) && (
          <p className="font-mono text-body-sm text-arctic">{formatGs(Number(item.finalValue ?? item.estimatedValue))}</p>
        )}
        {item.scheduledDate ? (
          <p className="font-body text-caption text-blue-bright/70">📅 {formatScheduledDate(item.scheduledDate)}</p>
        ) : (
          <p className="font-body text-caption text-steel-500">{formatDate(item.createdAt)}</p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {item.notes.length > 0 && <span className="flex items-center gap-0.5 font-mono text-caption text-steel-500"><MessageSquare className="h-3 w-3" />{item.notes.length}</span>}
        {onStatusChange ? (
          <select
            value={item.status}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => { e.stopPropagation(); onStatusChange(e.target.value); }}
            className="rounded border border-steel-800 bg-steel-900/60 px-2 py-1 font-mono text-[10px] text-arctic focus:outline-none focus:ring-1 focus:ring-blue-bright/40 cursor-pointer"
          >
            {Object.entries(STATUS_MAP).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        ) : (
          <span className={st.badge}>{st.label}</span>
        )}
        <button onClick={(e) => { e.stopPropagation(); onOpen(); }} className="flex items-center gap-1 rounded px-2 py-1 text-[10px] font-medium text-blue-bright hover:bg-blue-muted transition-colors">
          <Calculator className="h-3 w-3" /> Planilla
        </button>
        {canSendToApproval && (
          <button
            onClick={(e) => { e.stopPropagation(); onSendToApproval!(); }}
            className="flex items-center gap-1 rounded px-2 py-1 text-[10px] font-medium text-yellow-bright hover:bg-yellow-bright/10 transition-colors"
            title="Enviar a aprobación"
          >
            <Send className="h-3 w-3" /> Enviar a aprobación
          </button>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); imprimirPresupuesto({ code: item.code, serviceTitle: item.serviceTitle, serviceType: item.serviceType, description: item.description, scheduledDate: item.scheduledDate, estimatedDuration: item.estimatedDuration, assignedTo: item.assignedTo, customer: item.customer, calculationData: item.calculationData, costosData: item.costosData ?? null, createdAt: item.createdAt }); }}
          aria-label="Imprimir presupuesto"
          className="rounded p-1.5 text-steel-500 hover:bg-steel-900 hover:text-arctic"
        ><Printer className="h-4 w-4" /></button>
        <button onClick={(e) => { e.stopPropagation(); onDelete(); }} aria-label="Eliminar" className="rounded p-1.5 text-steel-500 hover:bg-red-500/10 hover:text-red-400"><Trash2 className="h-4 w-4" /></button>
      </div>
    </div>
  );
}
