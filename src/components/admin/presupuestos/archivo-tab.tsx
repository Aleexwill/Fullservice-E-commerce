'use client';

import { useState, useEffect } from 'react';
import { Search, Archive } from 'lucide-react';
import type { Presupuesto } from './types';
import { STATUS_MAP, ARCHIVE_STATUSES, PRES_PAGE_SIZE } from './types';
import { PresupuestoRow } from './presupuesto-row';

export function ArchivoTab({ items, loading, search, setSearch, onOpen, onDelete, onStatusChange, onSendToApproval }: {
  items: Presupuesto[]; loading: boolean; search: string; setSearch: (v: string) => void;
  onOpen: (id: string) => void; onDelete: (id: string) => void;
  onStatusChange: (id: string, status: string) => void;
  onSendToApproval?: (id: string) => void;
}) {
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(0);
  const archiveStatuses = Object.entries(STATUS_MAP).filter(([k]) => ARCHIVE_STATUSES.includes(k));
  const filtered = filterStatus ? items.filter(i => i.status === filterStatus) : items;
  const totalPages = Math.ceil(filtered.length / PRES_PAGE_SIZE);
  const pageFiltered = filtered.slice(page * PRES_PAGE_SIZE, (page + 1) * PRES_PAGE_SIZE);
  useEffect(() => { setPage(0); }, [filterStatus, search, items.length]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[240px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-steel-500" />
          <input type="text" placeholder="Buscar en archivo..." value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-10" />
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="input max-w-[160px]">
          <option value="">Todo estado</option>
          {archiveStatuses.map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>
      {loading ? (
        <div className="space-y-3">{Array.from({length:3}).map((_,i) => <div key={i} className="card animate-pulse p-4"><div className="h-14 rounded bg-steel-900" /></div>)}</div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <Archive className="mx-auto h-12 w-12 text-steel-500" />
          <h3 className="mt-4 font-display text-h3 text-arctic">Archivo vacío</h3>
          <p className="mt-2 font-body text-body-sm text-steel-500">Los presupuestos creados aparecerán aquí. Podés cambiar el estado directamente desde la lista.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {pageFiltered.map(item => (
            <PresupuestoRow
              key={item.id}
              item={item}
              onOpen={() => onOpen(item.id)}
              onDelete={() => onDelete(item.id)}
              onStatusChange={(status) => onStatusChange(item.id, status)}
              onSendToApproval={() => onSendToApproval?.(item.id)}
              hideWebBadge
            />
          ))}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-4">
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="btn-secondary disabled:opacity-40">Anterior</button>
              <span className="font-body text-caption text-steel-500">Página {page + 1} de {totalPages} · {filtered.length} registros</span>
              <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="btn-secondary disabled:opacity-40">Siguiente</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
