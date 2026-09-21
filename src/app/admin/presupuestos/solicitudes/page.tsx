'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search, RefreshCw, Plus, Globe, FileText, Wrench, HardHat, Factory,
  List, ChevronRight,
} from 'lucide-react';
import { fetchJson } from '@/lib/utils';

interface Presupuesto {
  id: string; code: string; status: string; serviceType: string; serviceTitle: string;
  customer: { name: string; email: string; phone: string; company: string; address: string };
  description: string; finalValue: number | null; estimatedValue: number | null;
  priority: string; source: string;
  createdAt: string;
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  falta_presupuestar:   { label: 'Sin presupuestar',    color: '#9B7FE8' },
  pendiente_relevo:     { label: 'Pendiente relevo',    color: '#C2813A' },
  nuevo:                { label: 'Nuevo',               color: '#4A90D9' },
  en_revision:          { label: 'En revisión',         color: '#C9922A' },
  enviado:              { label: 'Enviado',              color: '#C9A020' },
  pendiente_aprobacion: { label: 'Pendiente aprobación',color: '#D4802A' },
  aprobado:             { label: 'Aprobado',             color: '#48BB78' },
  en_ejecucion:         { label: 'En ejecución',         color: '#3B8FCC' },
  finalizado:           { label: 'Finalizado',           color: '#3A8C62' },
  de_baja:              { label: 'De baja',              color: '#A09A92' },
};

const TYPE_MAP: Record<string, { label: string; icon: any }> = {
  mantenimiento: { label: 'Mantenimiento',     icon: Wrench },
  civil:         { label: 'Construcción civil', icon: HardHat },
  metalurgica:   { label: 'Metalúrgica',        icon: Factory },
  otro:          { label: 'Otro',               icon: FileText },
};

const PAGE_SIZE = 20;

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('es-PY', { day: '2-digit', month: 'short', year: 'numeric' });

export default function SolicitudesWebPage() {
  const router = useRouter();
  const [items, setItems] = useState<Presupuesto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(0);

  const fetchData = useCallback(() => {
    setLoading(true);
    fetchJson<any>('/api/presupuestos?limit=500').then((d) => {
      const all: Presupuesto[] = d?.presupuestos || [];
      // Solicitudes web = NOT from admin or importacion
      const web = all.filter(p => p.source !== 'admin' && p.source !== 'importacion');
      setItems(web);
      setLoading(false);
    });
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = items.filter(p => {
    const matchSearch = !search || [p.code, p.customer.name, p.customer.company, p.serviceTitle]
      .join(' ').toLowerCase().includes(search.toLowerCase());
    const matchStatus = !filterStatus || p.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageItems = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  useEffect(() => { setPage(0); }, [search, filterStatus]);

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-blue-bright" />
            <h1 className="font-display text-h1 uppercase text-arctic">Solicitudes web</h1>
          </div>
          <p className="mt-1 font-body text-body-sm text-steel-400">
            Pedidos de presupuesto recibidos desde el sitio web
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchData} className="btn-secondary gap-2">
            <RefreshCw className="h-4 w-4" /> Actualizar
          </button>
          <button onClick={() => router.push('/admin/presupuestos')} className="btn-primary gap-2">
            <Plus className="h-4 w-4" /> Nuevo presupuesto
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[240px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-steel-500" />
          <input
            type="text"
            placeholder="Buscar por código, cliente, servicio..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="input max-w-[180px]"
        >
          <option value="">Todo estado</option>
          {Object.entries(STATUS_MAP).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
        <span className="font-body text-caption text-steel-500">
          {filtered.length} solicitud{filtered.length !== 1 ? 'es' : ''}
        </span>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="card animate-pulse p-4">
              <div className="h-16 rounded bg-steel-900/60" />
            </div>
          ))}
        </div>
      ) : pageItems.length === 0 ? (
        <div className="card p-12 text-center">
          <List className="mx-auto h-12 w-12 text-steel-500" />
          <h3 className="mt-4 font-display text-h3 text-arctic">Sin solicitudes</h3>
          <p className="mt-2 font-body text-body-sm text-steel-500">
            {search || filterStatus
              ? 'No hay solicitudes que coincidan con los filtros.'
              : 'Aún no se recibieron solicitudes desde el sitio web.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {pageItems.map((item) => {
            const status = STATUS_MAP[item.status];
            const typeInfo = TYPE_MAP[item.serviceType] || TYPE_MAP['otro'];
            const TypeIcon = typeInfo.icon;
            return (
              <div
                key={item.id}
                className="card-interactive flex items-center gap-4 p-4"
                onClick={() => router.push(`/admin/presupuestos/${item.id}`)}
              >
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-steel-900/60">
                  <TypeIcon className="h-4 w-4 text-steel-400" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-caption text-steel-500">{item.code}</span>
                    <span
                      className="rounded-full px-2 py-0.5 font-body text-[0.6rem] font-medium uppercase tracking-wide text-white"
                      style={{ backgroundColor: status?.color + '33', color: status?.color }}
                    >
                      {status?.label || item.status}
                    </span>
                    {item.source && item.source !== 'admin' && item.source !== 'importacion' && (
                      <span className="flex items-center gap-1 rounded-full bg-blue-muted px-2 py-0.5 font-body text-[0.6rem] text-blue-bright">
                        <Globe className="h-2.5 w-2.5" /> {item.source}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 truncate font-body text-body-sm font-medium text-arctic">
                    {item.customer.company || item.customer.name}
                    {item.serviceTitle && (
                      <span className="ml-2 font-normal text-steel-400">— {item.serviceTitle}</span>
                    )}
                  </p>
                  <p className="font-body text-caption text-steel-500">
                    {typeInfo.label} · {formatDate(item.createdAt)}
                  </p>
                </div>

                {item.finalValue !== null && (
                  <div className="flex-shrink-0 text-right">
                    <p className="font-mono text-body-sm font-semibold text-arctic">
                      Gs. {Math.round(item.finalValue).toLocaleString('es-PY')}
                    </p>
                  </div>
                )}

                <ChevronRight className="h-4 w-4 flex-shrink-0 text-steel-600" />
              </div>
            );
          })}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-4">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="btn-secondary disabled:opacity-40"
              >
                Anterior
              </button>
              <span className="font-body text-caption text-steel-500">
                Página {page + 1} de {totalPages} · {filtered.length} registros
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="btn-secondary disabled:opacity-40"
              >
                Siguiente
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
