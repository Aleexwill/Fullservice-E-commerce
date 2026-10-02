'use client';

import { useState, useEffect } from 'react';
import { Search, List, Plus } from 'lucide-react';
import type { Presupuesto } from './types';
import { STATUS_MAP, TYPE_MAP, ARCHIVE_STATUSES, PRES_PAGE_SIZE } from './types';
import { PresupuestoRow } from './presupuesto-row';

export function SolicitudesTab({ items, loading, search, setSearch, filterStatus, setFilterStatus, filterType, setFilterType, onOpen, onDelete, onNew, onSendToApproval }: {
  items: Presupuesto[]; loading: boolean;
  search: string; setSearch: (v: string) => void;
  filterStatus: string; setFilterStatus: (v: string) => void;
  filterType: string; setFilterType: (v: string) => void;
  onOpen: (id: string) => void; onDelete: (id: string) => void; onNew: () => void;
  onSendToApproval?: (id: string) => void;
}) {
  const [page, setPage] = useState(0);
  useEffect(() => { setPage(0); }, [search, filterStatus, filterType, items.length]);
  const activeStatuses = Object.entries(STATUS_MAP).filter(([k]) => !ARCHIVE_STATUSES.includes(k));
  const totalPages = Math.ceil(items.length / PRES_PAGE_SIZE);
  const pageItems = items.slice(page * PRES_PAGE_SIZE, (page + 1) * PRES_PAGE_SIZE);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[240px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-steel-500" />
          <input type="text" placeholder="Buscar por código, cliente, servicio..." value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-10" />
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="input max-w-[160px]">
          <option value="">Todo estado</option>
          {activeStatuses.map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="input max-w-[160px]">
          <option value="">Todo tipo</option>
          {Object.entries(TYPE_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>
      {loading ? (
        <div className="space-y-3">{Array.from({length:4}).map((_,i) => <div key={i} className="card animate-pulse p-4"><div className="h-16 rounded bg-steel-900" /></div>)}</div>
      ) : items.length === 0 ? (
        <div className="card p-12 text-center">
          <List className="mx-auto h-12 w-12 text-steel-500" />
          <h3 className="mt-4 font-display text-h3 text-arctic">Sin solicitudes activas</h3>
          <p className="mt-2 font-body text-body-sm text-steel-500">Las solicitudes de presupuesto activas aparecerán aquí.</p>
          <button onClick={onNew} className="btn-primary mt-6 inline-flex"><Plus className="h-4 w-4" /> Nueva solicitud</button>
        </div>
      ) : (
        <div className="space-y-2">
          {pageItems.map(item => <PresupuestoRow key={item.id} item={item} onOpen={() => onOpen(item.id)} onDelete={() => onDelete(item.id)} onSendToApproval={() => onSendToApproval?.(item.id)} />)}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-4">
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="btn-secondary disabled:opacity-40">Anterior</button>
              <span className="font-body text-caption text-steel-500">Página {page + 1} de {totalPages} · {items.length} registros</span>
              <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="btn-secondary disabled:opacity-40">Siguiente</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
