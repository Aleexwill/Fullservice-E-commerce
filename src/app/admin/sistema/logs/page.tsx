'use client';

import { useState, useEffect, useCallback } from 'react';
import { History, Settings2, ChevronDown, ChevronRight, Search, RefreshCw, Filter, Save, CheckCircle2, AlertCircle } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface FieldChange { field: string; label: string; from: string; to: string }
interface AuditLog {
  id: string; entity: string; entityId: string; entityName: string;
  action: 'create' | 'update' | 'delete';
  userId: string | null; userName: string; userIp: string;
  changes: FieldChange[]; createdAt: string;
}
interface AuditField { key: string; label: string; tracked: boolean }

const ACTION_COLORS = {
  create: 'bg-green-50 text-green-700 border-green-200',
  update: 'bg-blue-50 text-blue-700 border-blue-200',
  delete: 'bg-red-50 text-red-700 border-red-200',
};
const ACTION_LABELS = { create: 'Creado', update: 'Editado', delete: 'Eliminado' };

const ENTITIES = ['Product', 'Pedido', 'Presupuesto', 'Cliente', 'Lead'];
const ENTITY_LABELS: Record<string, string> = {
  Product: 'Producto', Pedido: 'Pedido', Presupuesto: 'Presupuesto', Cliente: 'Cliente', Lead: 'Lead',
};

// ── Logs tab ──────────────────────────────────────────────────────────────────

function LogsTab() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const LIMIT = 50;

  const [filterEntity, setFilterEntity] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [filterSearch, setFilterSearch] = useState('');

  const load = useCallback(async (p = 1) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), limit: String(LIMIT) });
    if (filterEntity) params.set('entity', filterEntity);
    if (filterAction) params.set('action', filterAction);
    if (filterFrom) params.set('from', new Date(filterFrom).toISOString());
    if (filterTo) { const d = new Date(filterTo); d.setHours(23,59,59); params.set('to', d.toISOString()); }
    try {
      const res = await fetch(`/api/audit-logs?${params}`);
      const data = await res.json();
      setLogs(data.logs ?? []);
      setTotal(data.total ?? 0);
    } finally { setLoading(false); }
  }, [filterEntity, filterAction, filterFrom, filterTo]);

  useEffect(() => { setPage(1); load(1); }, [load]);

  function toggleExpand(id: string) {
    setExpanded((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  }

  const visible = filterSearch
    ? logs.filter((l) =>
        l.entityName.toLowerCase().includes(filterSearch.toLowerCase()) ||
        l.userName.toLowerCase().includes(filterSearch.toLowerCase()) ||
        l.entityId.toLowerCase().includes(filterSearch.toLowerCase())
      )
    : logs;

  return (
    <div>
      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-steel-500" />
          <input type="text" placeholder="Buscar por nombre, usuario..." value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)} className="input pl-10" />
        </div>
        <select value={filterEntity} onChange={(e) => setFilterEntity(e.target.value)} className="input w-auto">
          <option value="">Todas las entidades</option>
          {ENTITIES.map((e) => <option key={e} value={e}>{ENTITY_LABELS[e] ?? e}</option>)}
        </select>
        <select value={filterAction} onChange={(e) => setFilterAction(e.target.value)} className="input w-auto">
          <option value="">Todas las acciones</option>
          <option value="create">Creado</option>
          <option value="update">Editado</option>
          <option value="delete">Eliminado</option>
        </select>
        <div className="flex items-center gap-2">
          <input type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} className="input w-auto" title="Desde" />
          <span className="text-steel-500 text-caption">→</span>
          <input type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} className="input w-auto" title="Hasta" />
        </div>
        <button onClick={() => load(page)} className="btn-secondary shrink-0">
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Count */}
      <p className="mb-3 font-body text-caption text-steel-500">
        {total} registro{total !== 1 ? 's' : ''}{filterSearch ? ` · ${visible.length} visibles` : ''}
      </p>

      {/* Table */}
      {loading ? (
        <div className="py-16 text-center font-body text-body-sm text-steel-500">Cargando…</div>
      ) : visible.length === 0 ? (
        <div className="card p-12 text-center font-body text-body-sm text-steel-500">Sin registros</div>
      ) : (
        <div className="space-y-1">
          {visible.map((log) => {
            const isOpen = expanded.has(log.id);
            return (
              <div key={log.id} className="overflow-hidden rounded-xl border border-steel-900/30 bg-white">
                <button
                  onClick={() => toggleExpand(log.id)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-[#F4F7FB]/60 transition-colors"
                >
                  {isOpen ? <ChevronDown className="h-4 w-4 shrink-0 text-steel-500" /> : <ChevronRight className="h-4 w-4 shrink-0 text-steel-500" />}
                  <span className={`shrink-0 rounded-full border px-2 py-0.5 font-body text-[0.65rem] font-semibold ${ACTION_COLORS[log.action]}`}>
                    {ACTION_LABELS[log.action]}
                  </span>
                  <span className="shrink-0 rounded-md bg-[#EBF5FB] px-1.5 py-0.5 font-body text-[0.65rem] text-blue">
                    {ENTITY_LABELS[log.entity] ?? log.entity}
                  </span>
                  <span className="flex-1 font-body text-body-sm font-semibold text-[#0B1120] truncate">
                    {log.entityName || log.entityId}
                  </span>
                  <span className="shrink-0 font-body text-caption text-steel-500">{log.userName}</span>
                  <span className="shrink-0 font-mono text-[0.65rem] text-steel-500">
                    {new Date(log.createdAt).toLocaleString('es-PY', { dateStyle: 'short', timeStyle: 'short' })}
                  </span>
                  {log.changes.length > 0 && (
                    <span className="shrink-0 rounded-full bg-[#EBF5FB] px-1.5 py-0.5 font-mono text-[0.65rem] text-blue">
                      {log.changes.length} campo{log.changes.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </button>

                {isOpen && (
                  <div className="border-t border-steel-900/20 px-4 pb-4 pt-3">
                    {log.userIp && (
                      <p className="mb-3 font-mono text-[0.65rem] text-steel-500">IP: {log.userIp}</p>
                    )}
                    {log.action === 'delete' ? (
                      <p className="font-body text-body-sm text-red-600">Registro eliminado</p>
                    ) : log.changes.length === 0 ? (
                      <p className="font-body text-caption text-steel-500">Sin campos rastreados modificados</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="border-b border-steel-900/20">
                              <th className="pb-2 pr-4 font-body text-caption font-semibold text-steel-500">Campo</th>
                              <th className="pb-2 pr-4 font-body text-caption font-semibold text-steel-500">Antes</th>
                              <th className="pb-2 font-body text-caption font-semibold text-steel-500">Después</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-steel-900/10">
                            {log.changes.map((ch) => (
                              <tr key={ch.field}>
                                <td className="py-2 pr-4 font-body text-caption font-semibold text-[#0B1120]">{ch.label}</td>
                                <td className="py-2 pr-4 font-mono text-[0.7rem] text-red-500 line-through">{ch.from}</td>
                                <td className="py-2 font-mono text-[0.7rem] text-green-600">{ch.to}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {total > LIMIT && (
        <div className="mt-4 flex items-center justify-center gap-3">
          <button onClick={() => { const p = page - 1; setPage(p); load(p); }} disabled={page === 1} className="btn-secondary py-1 px-3 text-body-sm disabled:opacity-40">
            Anterior
          </button>
          <span className="font-body text-caption text-steel-500">
            Pág. {page} / {Math.ceil(total / LIMIT)}
          </span>
          <button onClick={() => { const p = page + 1; setPage(p); load(p); }} disabled={page * LIMIT >= total} className="btn-secondary py-1 px-3 text-body-sm disabled:opacity-40">
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
}

// ── Config tab ────────────────────────────────────────────────────────────────

function ConfigTab() {
  const [configs, setConfigs] = useState<Record<string, AuditField[]>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  useEffect(() => {
    fetch('/api/audit-config')
      .then((r) => r.json())
      .then((d) => setConfigs(d))
      .finally(() => setLoading(false));
  }, []);

  function toggle(entity: string, key: string) {
    setConfigs((prev) => ({
      ...prev,
      [entity]: prev[entity].map((f) => f.key === key ? { ...f, tracked: !f.tracked } : f),
    }));
  }

  async function save(entity: string) {
    setSaving(entity);
    try {
      const res = await fetch('/api/audit-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entity, fields: configs[entity] }),
      });
      if (!res.ok) throw new Error();
      setToast({ msg: `Configuración de ${ENTITY_LABELS[entity] ?? entity} guardada`, ok: true });
    } catch {
      setToast({ msg: 'Error al guardar', ok: false });
    } finally {
      setSaving(null);
      setTimeout(() => setToast(null), 3000);
    }
  }

  if (loading) return <div className="py-16 text-center font-body text-body-sm text-steel-500">Cargando…</div>;

  return (
    <div className="space-y-6">
      {Object.entries(configs).map(([entity, fields]) => (
        <div key={entity} className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-h3 text-[#0B1120]">{ENTITY_LABELS[entity] ?? entity}</h3>
            <button onClick={() => save(entity)} disabled={saving === entity} className="btn-primary py-1.5 px-4 text-body-sm">
              <Save className="h-3.5 w-3.5" />
              {saving === entity ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {fields.map((f) => (
              <label key={f.key} className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 transition-colors ${f.tracked ? 'border-blue/40 bg-[#EBF5FB]' : 'border-steel-900/20 bg-white hover:bg-[#F4F7FB]'}`}>
                <input
                  type="checkbox"
                  checked={f.tracked}
                  onChange={() => toggle(entity, f.key)}
                  className="h-3.5 w-3.5 accent-blue"
                />
                <span className="font-body text-caption text-[#0B1120]">{f.label}</span>
              </label>
            ))}
          </div>
        </div>
      ))}

      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl px-4 py-3 shadow-lg font-body text-body-sm text-white ${toast.ok ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.ok ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {toast.msg}
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AuditLogsPage() {
  const [tab, setTab] = useState<'logs' | 'config'>('logs');

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-h2 text-arctic">Log de cambios</h1>
          <p className="mt-1 font-body text-body-sm text-steel-300">Historial de modificaciones con diff por campo</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-xl border border-steel-900/30 bg-[#F4F7FB] p-1 w-fit">
        <button
          onClick={() => setTab('logs')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 font-body text-body-sm font-semibold transition-all ${tab === 'logs' ? 'bg-white shadow text-[#0B1120]' : 'text-steel-500 hover:text-[#0B1120]'}`}
        >
          <History className="h-4 w-4" />
          Registros
        </button>
        <button
          onClick={() => setTab('config')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 font-body text-body-sm font-semibold transition-all ${tab === 'config' ? 'bg-white shadow text-[#0B1120]' : 'text-steel-500 hover:text-[#0B1120]'}`}
        >
          <Settings2 className="h-4 w-4" />
          Configurar campos
        </button>
      </div>

      {tab === 'logs' ? <LogsTab /> : <ConfigTab />}
    </div>
  );
}
