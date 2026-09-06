'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Search, RefreshCw, Plus, Trash2, X, Send, User, Mail, Phone,
  Building, MapPin, MessageSquare, Clock, Calendar, Loader2,
  FileText, ChevronRight, AlertTriangle, Wrench, HardHat,
  Factory, Calculator, GitBranch, Printer, BarChart2, List,
  Archive, ClipboardList, TrendingUp, DollarSign, CheckCircle2,
  XCircle, PauseCircle, Globe, Shield
} from 'lucide-react';
import { fetchJson } from '@/lib/utils';
import { PresupuestoCalculo, type CalculationData } from '@/components/admin/presupuesto-calculo';
import { imprimirPresupuesto, type PdfDetallOpts } from '@/lib/presupuesto-pdf';

interface Presupuesto {
  id: string; code: string; status: string; serviceType: string; serviceTitle: string;
  customer: { name: string; email: string; phone: string; company: string; address: string };
  description: string; details: string; estimatedValue: number | null; finalValue: number | null;
  estimatedDuration: string; priority: string; source: string; assignedTo: string;
  scheduledDate: string; calculationData: CalculationData | null; createdBy: string;
  notes: { id: string; text: string; createdAt: string }[];
  createdAt: string; updatedAt: string;
}

const STATUS_MAP: Record<string, { label: string; badge: string; color: string }> = {
  borrador:     { label: 'Borrador',    badge: 'badge-neutral', color: '#6B7280' },
  nuevo:        { label: 'Nuevo',       badge: 'badge-blue',    color: '#3B82F6' },
  en_revision:  { label: 'En revisión', badge: 'badge-yellow',  color: '#F59E0B' },
  cotizado:     { label: 'Cotizado',    badge: 'badge-yellow',  color: '#F59E0B' },
  aprobado:     { label: 'Aprobado',    badge: 'badge-green',   color: '#48BB78' },
  en_ejecucion: { label: 'En ejecución',badge: 'badge-green',   color: '#48BB78' },
  completado:   { label: 'Completado',  badge: 'badge-neutral', color: '#9CA3AF' },
  rechazado:    { label: 'Rechazado',   badge: 'badge-red',     color: '#FC8181' },
};

const TYPE_MAP: Record<string, { label: string; icon: any; color: string }> = {
  mantenimiento: { label: 'Mantenimiento',     icon: Wrench,   color: 'text-blue-bright' },
  civil:         { label: 'Construcción civil', icon: HardHat,  color: 'text-yellow-bright' },
  metalurgica:   { label: 'Metalúrgica',        icon: Factory,  color: 'text-[#48BB78]' },
  otro:          { label: 'Otro',               icon: FileText, color: 'text-steel-300' },
};

const PRIORITY_MAP: Record<string, { label: string; color: string }> = {
  baja:    { label: 'Baja',    color: 'text-steel-500' },
  media:   { label: 'Media',   color: 'text-yellow-bright' },
  alta:    { label: 'Alta',    color: 'text-[#FC8181]' },
  urgente: { label: 'Urgente', color: 'text-[#FC8181]' },
};

const ACTIVE_STATUSES = ['nuevo', 'en_revision', 'cotizado', 'aprobado', 'en_ejecucion', 'borrador'];
const ARCHIVE_STATUSES = ['completado', 'rechazado'];

const formatGs = (n: number) => 'Gs. ' + Math.round(n).toLocaleString('es-PY');
const formatDate = (d: string) => new Date(d).toLocaleDateString('es-PY', { day: '2-digit', month: 'short', year: 'numeric' });
const formatDateFull = (d: string) => new Date(d).toLocaleDateString('es-PY', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const formatScheduledDate = (d: string) => {
  if (!d) return null;
  const [y, m, day] = d.split('-').map(Number);
  if (!y || !m || !day) return d;
  return new Date(y, m - 1, day).toLocaleDateString('es-PY', { day: '2-digit', month: 'short', year: 'numeric' });
};

type Tab = 'dashboard' | 'solicitudes' | 'archivo' | 'planificacion';

export default function AdminPresupuestosPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [items, setItems] = useState<Presupuesto[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [leadPrefill, setLeadPrefill] = useState<Record<string, string> | null>(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    fetchJson<any>('/api/presupuestos?limit=200').then((d) => {
      setItems(d?.presupuestos || []);
      setLoading(false);
    });
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const fromLead = searchParams.get('from_lead');
    if (!fromLead) return;
    setLeadPrefill({
      customerName: searchParams.get('name') || '',
      customerEmail: searchParams.get('email') || '',
      customerPhone: searchParams.get('phone') || '',
      customerCompany: searchParams.get('company') || '',
      serviceTitle: searchParams.get('subject') || '',
    });
    setShowCreate(true);
    const url = new URL(window.location.href);
    ['from_lead','name','email','phone','company','subject'].forEach(k => url.searchParams.delete(k));
    window.history.replaceState({}, '', url.toString());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const del = async (id: string) => {
    if (!confirm('¿Eliminar este presupuesto?')) return;
    await fetch(`/api/presupuestos/${id}`, { method: 'DELETE' });
    fetchData();
  };

  const allActive = items.filter(i => ACTIVE_STATUSES.includes(i.status));
  const allArchive = items.filter(i => ARCHIVE_STATUSES.includes(i.status));

  const filteredSolicitudes = allActive.filter(i => {
    const matchSearch = !search || [i.code, i.customer.name, i.serviceTitle, i.customer.company].join(' ').toLowerCase().includes(search.toLowerCase());
    const matchStatus = !filterStatus || i.status === filterStatus;
    const matchType = !filterType || i.serviceType === filterType;
    return matchSearch && matchStatus && matchType;
  });

  const filteredArchivo = allArchive.filter(i => {
    const matchSearch = !search || [i.code, i.customer.name, i.serviceTitle].join(' ').toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  // KPI calcs
  const totalCotizado = items.filter(i => ['cotizado','aprobado','en_ejecucion','completado'].includes(i.status)).reduce((s, i) => s + (Number(i.finalValue) || Number(i.estimatedValue) || 0), 0);
  const totalAprobado = items.filter(i => ['aprobado','en_ejecucion','completado'].includes(i.status)).reduce((s, i) => s + (Number(i.finalValue) || 0), 0);
  const totalCompletado = items.filter(i => i.status === 'completado').reduce((s, i) => s + (Number(i.finalValue) || 0), 0);
  const tasaCierre = allArchive.length > 0 ? Math.round((items.filter(i => i.status === 'completado').length / (items.filter(i => i.status === 'completado').length + items.filter(i => i.status === 'rechazado').length || 1)) * 100) : 0;

  const tabs: { key: Tab; label: string; icon: any; count?: number }[] = [
    { key: 'dashboard',    label: 'Dashboard',      icon: BarChart2 },
    { key: 'solicitudes',  label: 'Solicitudes',    icon: List,         count: allActive.length },
    { key: 'archivo',      label: 'Archivo',        icon: Archive,      count: allArchive.length },
    { key: 'planificacion',label: 'Planificación',  icon: ClipboardList },
  ];

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-h1 uppercase text-arctic">Presupuestos</h1>
          <p className="mt-1 font-body text-body-sm text-steel-300">Tablero de control — Full Service & Clean</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => router.push('/admin/presupuestos/seguimiento')} className="btn-secondary flex items-center gap-1.5">
            <TrendingUp className="h-4 w-4" /> Seguimiento 1·2·3·5·7
          </button>
          <button onClick={() => setShowCreate(true)} className="btn-primary"><Plus className="h-4 w-4" /> Nuevo presupuesto</button>
        </div>
      </div>

      {/* Tab nav */}
      <div className="mb-6 flex gap-1 border-b border-steel-900/50">
        {tabs.map(t => {
          const Icon = t.icon;
          const active = activeTab === t.key;
          return (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 font-body text-body-sm font-medium transition-colors border-b-2 -mb-px ${
                active ? 'border-blue-bright text-arctic' : 'border-transparent text-steel-500 hover:text-steel-300'
              }`}>
              <Icon className="h-3.5 w-3.5" />{t.label}
              {t.count !== undefined && (
                <span className={`flex h-4.5 min-w-[1.25rem] items-center justify-center rounded-full px-1 font-mono text-[0.6rem] ${active ? 'bg-blue-bright/20 text-blue-bright' : 'bg-steel-900 text-steel-500'}`}>{t.count}</span>
              )}
            </button>
          );
        })}
        <div className="ml-auto flex items-center pb-1">
          <button onClick={fetchData} className="rounded p-1.5 text-steel-600 hover:text-arctic transition-colors"><RefreshCw className="h-3.5 w-3.5" /></button>
        </div>
      </div>

      {/* Dashboard tab */}
      {activeTab === 'dashboard' && (
        <DashboardTab items={items} loading={loading}
          totalCotizado={totalCotizado} totalAprobado={totalAprobado}
          totalCompletado={totalCompletado} tasaCierre={tasaCierre}
          onNavigate={setActiveTab} />
      )}

      {/* Solicitudes tab */}
      {activeTab === 'solicitudes' && (
        <SolicitudesTab
          items={filteredSolicitudes} loading={loading}
          search={search} setSearch={setSearch}
          filterStatus={filterStatus} setFilterStatus={setFilterStatus}
          filterType={filterType} setFilterType={setFilterType}
          onOpen={(id) => router.push(`/admin/presupuestos/${id}`)}
          onDelete={del}
          onNew={() => setShowCreate(true)}
        />
      )}

      {/* Archivo tab */}
      {activeTab === 'archivo' && (
        <ArchivoTab
          items={filteredArchivo} loading={loading}
          search={search} setSearch={setSearch}
          onOpen={(id) => router.push(`/admin/presupuestos/${id}`)}
          onDelete={del}
        />
      )}

      {/* Planificación tab */}
      {activeTab === 'planificacion' && (
        <PlanificacionTab items={allActive} loading={loading} onOpen={(id) => router.push(`/admin/presupuestos/${id}`)} />
      )}

      {/* Create modal */}
      {showCreate && (
        <CreatePresupuestoModal
          initialData={leadPrefill ?? undefined}
          onClose={() => { setShowCreate(false); setLeadPrefill(null); }}
          onCreated={async (id) => {
            setShowCreate(false);
            setLeadPrefill(null);
            fetchData();
            if (id) router.push(`/admin/presupuestos/${id}`);
          }}
        />
      )}
    </div>
  );
}

// ─── Dashboard ───────────────────────────────────────────────
function DashboardTab({ items, loading, totalCotizado, totalAprobado, totalCompletado, tasaCierre, onNavigate }: {
  items: Presupuesto[]; loading: boolean;
  totalCotizado: number; totalAprobado: number; totalCompletado: number; tasaCierre: number;
  onNavigate: (tab: Tab) => void;
}) {
  const byStatus = (s: string) => items.filter(i => i.status === s).length;
  const kpis = [
    { label: 'Total solicitudes', value: items.length, icon: FileText, color: 'text-steel-300' },
    { label: 'Pend. aprobación', value: byStatus('cotizado'), icon: Clock, color: 'text-yellow-bright' },
    { label: 'En ejecución', value: byStatus('en_ejecucion'), icon: Wrench, color: 'text-blue-bright' },
    { label: 'Completados', value: byStatus('completado'), icon: CheckCircle2, color: 'text-[#48BB78]' },
    { label: 'Rechazados', value: byStatus('rechazado'), icon: XCircle, color: 'text-[#FC8181]' },
  ];
  const financial = [
    { label: 'Total cotizado', value: totalCotizado, icon: DollarSign, color: 'text-steel-300' },
    { label: 'Aprobado / Vendido', value: totalAprobado, icon: CheckCircle2, color: 'text-[#48BB78]' },
    { label: 'Facturado / Cobrado', value: totalCompletado, icon: TrendingUp, color: 'text-blue-bright' },
    { label: 'Por facturar', value: Math.max(0, totalAprobado - totalCompletado), icon: Clock, color: 'text-yellow-bright' },
  ];

  if (loading) return <div className="space-y-4">{Array.from({length:3}).map((_,i) => <div key={i} className="card animate-pulse p-4 h-20 bg-steel-900/40" />)}</div>;

  return (
    <div className="space-y-6">
      {/* Status KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {kpis.map(k => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-body text-caption text-steel-500">{k.label}</span>
                <Icon className={`h-4 w-4 ${k.color}`} />
              </div>
              <p className={`font-display text-3xl font-bold ${k.color}`}>{k.value}</p>
            </div>
          );
        })}
      </div>

      {/* Financial KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {financial.map(k => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="card p-4 bg-carbon">
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`h-4 w-4 ${k.color}`} />
                <span className="font-body text-caption text-steel-500">{k.label}</span>
              </div>
              <p className={`font-mono text-lg font-bold ${k.color}`}>{k.value > 0 ? formatGs(k.value) : '—'}</p>
            </div>
          );
        })}
      </div>

      {/* Tasa de cierre + by type */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <h3 className="mb-4 font-display text-h4 text-arctic flex items-center gap-2">
            <BarChart2 className="h-4 w-4 text-blue-bright" /> Estado de presupuestos
          </h3>
          <div className="space-y-2">
            {Object.entries(STATUS_MAP).map(([key, val]) => {
              const count = items.filter(i => i.status === key).length;
              const pct = items.length ? Math.round((count / items.length) * 100) : 0;
              return (
                <div key={key} className="flex items-center gap-3">
                  <span className="w-28 shrink-0 font-body text-caption text-steel-400">{val.label}</span>
                  <div className="flex-1 h-2 rounded-full bg-steel-900/60">
                    <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, background: val.color }} />
                  </div>
                  <span className="w-6 shrink-0 text-right font-mono text-caption text-steel-500">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="mb-4 font-display text-h4 text-arctic flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-[#48BB78]" /> Métricas de cierre
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-body text-caption text-steel-400">Tasa de cierre</span>
                <span className="font-mono text-body-sm text-[#48BB78] font-bold">{tasaCierre}%</span>
              </div>
              <div className="h-3 rounded-full bg-steel-900/60">
                <div className="h-3 rounded-full bg-[#48BB78] transition-all" style={{ width: `${tasaCierre}%` }} />
              </div>
            </div>
            {Object.entries(TYPE_MAP).map(([key, val]) => {
              const count = items.filter(i => i.serviceType === key).length;
              return (
                <div key={key} className="flex items-center justify-between">
                  <span className="font-body text-caption text-steel-400">{val.label}</span>
                  <span className="font-mono text-body-sm text-arctic">{count}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-4 border-t border-steel-900/40 flex gap-2">
            <button onClick={() => onNavigate('solicitudes')} className="btn-secondary flex-1 justify-center text-xs">Ver solicitudes</button>
            <button onClick={() => onNavigate('archivo')} className="btn-secondary flex-1 justify-center text-xs">Ver archivo</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Shared list row ───────────────────────────────────────────
function PresupuestoRow({ item, onOpen, onDelete }: { item: Presupuesto; onOpen: () => void; onDelete: () => void }) {
  const st = STATUS_MAP[item.status] || STATUS_MAP.nuevo;
  const tp = TYPE_MAP[item.serviceType] || TYPE_MAP.otro;
  const pr = PRIORITY_MAP[item.priority] || PRIORITY_MAP.media;
  const TpIcon = tp.icon;
  const isWeb = item.source === 'web' || item.createdBy === 'Web' || (!item.createdBy && item.source !== 'admin');
  return (
    <div className="card-interactive flex items-center gap-4 p-4" onClick={onOpen}>
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-steel-900 ${tp.color}`}><TpIcon className="h-5 w-5" /></div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-caption text-blue-bright">{item.code}</span>
          <span className={st.badge}>{st.label}</span>
          {(item.priority === 'alta' || item.priority === 'urgente') && <AlertTriangle className={`h-3.5 w-3.5 ${pr.color}`} />}
          {isWeb ? (
            <span className="flex items-center gap-1 rounded-full border border-blue/30 bg-blue/10 px-2 py-0.5 font-mono text-[0.55rem] text-blue-bright"><Globe className="h-2.5 w-2.5" />Web</span>
          ) : item.createdBy ? (
            <span className="flex items-center gap-1 rounded-full border border-steel-700/40 bg-steel-900/40 px-2 py-0.5 font-mono text-[0.55rem] text-steel-400"><Shield className="h-2.5 w-2.5" />{item.createdBy}</span>
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
          <p className="font-body text-caption text-steel-700">{formatDate(item.createdAt)}</p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {item.notes.length > 0 && <span className="flex items-center gap-0.5 font-mono text-caption text-steel-700"><MessageSquare className="h-3 w-3" />{item.notes.length}</span>}
        <button onClick={(e) => { e.stopPropagation(); onOpen(); }} className="flex items-center gap-1 rounded px-2 py-1 text-[10px] font-medium text-blue-bright hover:bg-blue-muted transition-colors">
          <Calculator className="h-3 w-3" /> Planilla
        </button>
        <button onClick={(e) => { e.stopPropagation(); onDelete(); }} aria-label="Eliminar" className="rounded p-1.5 text-steel-700 hover:bg-red-500/10 hover:text-red-400"><Trash2 className="h-4 w-4" /></button>
      </div>
    </div>
  );
}

// ─── Solicitudes tab ──────────────────────────────────────────
function SolicitudesTab({ items, loading, search, setSearch, filterStatus, setFilterStatus, filterType, setFilterType, onOpen, onDelete, onNew }: {
  items: Presupuesto[]; loading: boolean;
  search: string; setSearch: (v: string) => void;
  filterStatus: string; setFilterStatus: (v: string) => void;
  filterType: string; setFilterType: (v: string) => void;
  onOpen: (id: string) => void; onDelete: (id: string) => void; onNew: () => void;
}) {
  const activeStatuses = Object.entries(STATUS_MAP).filter(([k]) => !ARCHIVE_STATUSES.includes(k));
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
          <List className="mx-auto h-12 w-12 text-steel-700" />
          <h3 className="mt-4 font-display text-h3 text-arctic">Sin solicitudes activas</h3>
          <p className="mt-2 font-body text-body-sm text-steel-500">Las solicitudes de presupuesto activas aparecerán aquí.</p>
          <button onClick={onNew} className="btn-primary mt-6 inline-flex"><Plus className="h-4 w-4" /> Nueva solicitud</button>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map(item => <PresupuestoRow key={item.id} item={item} onOpen={() => onOpen(item.id)} onDelete={() => onDelete(item.id)} />)}
        </div>
      )}
    </div>
  );
}

// ─── Archivo tab ──────────────────────────────────────────────
function ArchivoTab({ items, loading, search, setSearch, onOpen, onDelete }: {
  items: Presupuesto[]; loading: boolean; search: string; setSearch: (v: string) => void;
  onOpen: (id: string) => void; onDelete: (id: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative min-w-[240px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-steel-500" />
          <input type="text" placeholder="Buscar en archivo..." value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-10" />
        </div>
      </div>
      {loading ? (
        <div className="space-y-3">{Array.from({length:3}).map((_,i) => <div key={i} className="card animate-pulse p-4"><div className="h-14 rounded bg-steel-900" /></div>)}</div>
      ) : items.length === 0 ? (
        <div className="card p-12 text-center">
          <Archive className="mx-auto h-12 w-12 text-steel-700" />
          <h3 className="mt-4 font-display text-h3 text-arctic">Archivo vacío</h3>
          <p className="mt-2 font-body text-body-sm text-steel-500">Los presupuestos completados y rechazados aparecerán aquí.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map(item => <PresupuestoRow key={item.id} item={item} onOpen={() => onOpen(item.id)} onDelete={() => onDelete(item.id)} />)}
        </div>
      )}
    </div>
  );
}

// ─── Planificación tab ────────────────────────────────────────
function PlanificacionTab({ items, loading, onOpen }: { items: Presupuesto[]; loading: boolean; onOpen: (id: string) => void }) {
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
                    <p className="font-mono text-[0.6rem] text-steel-600 uppercase">{new Date(item.scheduledDate + 'T00:00:00').toLocaleDateString('es-PY', { month: 'short' })}</p>
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
                  <ChevronRight className="h-4 w-4 text-steel-600 shrink-0" />
                </div>
              );
            })}
          </div>
        </div>
      )}
      {withDate.length === 0 && withoutDate.length === 0 && (
        <div className="card p-12 text-center">
          <ClipboardList className="mx-auto h-12 w-12 text-steel-700" />
          <h3 className="mt-4 font-display text-h3 text-arctic">Sin solicitudes activas</h3>
        </div>
      )}
    </div>
  );
}

// ─── Create modal ─────────────────────────────────────────────
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

function CreatePresupuestoModal({ onClose, onCreated, initialData }: { onClose: () => void; onCreated: (id?: string) => void; initialData?: Record<string, string> }) {
  const [saving, setSaving] = useState<null | 'borrador' | 'nuevo'>(null);
  const [autoSaved, setAutoSaved] = useState(false);
  const [restored, setRestored] = useState(false);
  const [saveError, setSaveError] = useState('');

  const [f, setF] = useState(() => {
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

  const guardar = async (status: 'borrador' | 'nuevo') => {
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
              {autoSaved && <span className="flex items-center gap-1 font-body text-caption text-[#48BB78] animate-pulse"><span className="h-1.5 w-1.5 rounded-full bg-[#48BB78]" /> Auto-guardado</span>}
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
              <p className="mb-3 mt-1.5 font-body text-caption text-steel-700">O completá los datos manualmente:</p>
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
          <p className="mb-3 font-body text-caption text-steel-500"><span className="text-steel-700">Borrador:</span> guardá y continuá después. <span className="text-steel-700">Crear:</span> queda como solicitud activa.</p>
          <div className="flex gap-3">
            <button onClick={() => guardar('borrador')} disabled={!!saving || !f.serviceTitle.trim()} className="btn-secondary flex-1 justify-center gap-2 disabled:opacity-50">
              {saving === 'borrador' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Clock className="h-4 w-4" />} Guardar borrador
            </button>
            <button onClick={() => guardar('nuevo')} disabled={!!saving || !f.serviceTitle.trim()} className="btn-primary flex-1 justify-center gap-2 disabled:opacity-50">
              {saving === 'nuevo' ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />} Crear presupuesto
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
