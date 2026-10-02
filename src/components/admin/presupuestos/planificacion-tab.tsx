'use client';

import { Calendar, Clock, ClipboardList, ChevronRight } from 'lucide-react';
import type { Presupuesto } from './types';
import { STATUS_MAP, TYPE_MAP, formatGs } from './types';

export function PlanificacionTab({ items, loading, onOpen }: { items: Presupuesto[]; loading: boolean; onOpen: (id: string) => void }) {
  const withDate = items.filter(i => i.scheduledDate).sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));
  const withoutDate = items.filter(i => !i.scheduledDate);

  if (loading) return <div className="card animate-pulse p-6 h-40 bg-steel-900/40" />;

  return (
    <div className="space-y-6">
      {withDate.length > 0 && (
        <div>
          <h3 className="mb-3 font-display text-h4 uppercase text-steel-500 tracking-wider flex items-center gap-2">
            <Calendar className="h-4 w-4" /> Con fecha programada
          </h3>
          <div className="space-y-2">
            {withDate.map(item => {
              const st = STATUS_MAP[item.status] || STATUS_MAP.nuevo;
              const tp = TYPE_MAP[item.serviceType] || TYPE_MAP.otro;
              const TpIcon = tp.icon;
              return (
                <div key={item.id} className="card-interactive flex items-center gap-4 p-4" onClick={() => onOpen(item.id)}>
                  <div className="shrink-0 text-center w-14">
                    <p className="font-mono text-[0.6rem] text-steel-500 uppercase">{new Date(item.scheduledDate + 'T00:00:00').toLocaleDateString('es-PY', { month: 'short' })}</p>
                    <p className="font-display text-2xl font-bold text-arctic">{new Date(item.scheduledDate + 'T00:00:00').getDate()}</p>
                  </div>
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-steel-900 ${tp.color}`}><TpIcon className="h-4 w-4" /></div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-caption text-blue-bright">{item.code}</span>
                      <span className={st.badge}>{st.label}</span>
                    </div>
                    <p className="font-body text-body-sm font-medium text-arctic">{item.serviceTitle}</p>
                    <p className="font-body text-caption text-steel-500">{item.customer.name}{item.assignedTo ? ` — ${item.assignedTo}` : ''}</p>
                  </div>
                  {(item.finalValue || item.estimatedValue) && (
                    <p className="shrink-0 font-mono text-body-sm text-arctic hidden md:block">{formatGs(Number(item.finalValue ?? item.estimatedValue))}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
      {withoutDate.length > 0 && (
        <div>
          <h3 className="mb-3 font-display text-h4 uppercase text-steel-500 tracking-wider flex items-center gap-2">
            <Clock className="h-4 w-4" /> Sin fecha asignada
          </h3>
          <div className="space-y-2">
            {withoutDate.map(item => {
              const st = STATUS_MAP[item.status] || STATUS_MAP.nuevo;
              return (
                <div key={item.id} className="card-interactive flex items-center gap-4 p-3" onClick={() => onOpen(item.id)}>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-caption text-blue-bright">{item.code}</span>
                      <span className={st.badge}>{st.label}</span>
                    </div>
                    <p className="font-body text-body-sm text-arctic">{item.serviceTitle} — {item.customer.name}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-steel-500 shrink-0" />
                </div>
              );
            })}
          </div>
        </div>
      )}
      {withDate.length === 0 && withoutDate.length === 0 && (
        <div className="card p-12 text-center">
          <ClipboardList className="mx-auto h-12 w-12 text-steel-500" />
          <h3 className="mt-4 font-display text-h3 text-arctic">Sin solicitudes activas</h3>
        </div>
      )}
    </div>
  );
}
