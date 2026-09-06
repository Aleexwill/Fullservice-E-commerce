'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Search, RefreshCw, Plus, Trash2, X, Mail, Phone,
  MessageSquare, Clock, Calendar, Loader2,
  FileText, ChevronRight, AlertTriangle, Wrench, HardHat,
  Factory, Calculator, BarChart2, List,
  ClipboardList, TrendingUp, DollarSign, CheckCircle2,
  XCircle, Globe, Shield
} from 'lucide-react';
import { fetchJson } from '@/lib/utils';

interface SeguimientoData {
  local?: string;
  alerta?: string;
  estado?: string;
  avance?: string;
  pct?: number;
  dias?: number;
  os?: string;
  informe?: string;
  facturado?: string;
  nroFactura?: string;
  obs?: string;
  tecnico?: string;
  prioridad?: string;
  vendido?: number;
  [key: string]: unknown;
}

interface Presupuesto {
  id: string; code: string; status: string; serviceType: string; serviceTitle: string;
  customer: { name: string; email: string; phone: string; company: string; address: string };
  description: string; details: string; estimatedValue: number | null; finalValue: number | null;
  estimatedDuration: string; priority: string; source: string; assignedTo: string;
  scheduledDate: string; createdBy: string;
  notes: { id: string; text: string; createdAt: string }[];
  seguimientoData: SeguimientoData;
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

const formatGs = (n: number) => 'Gs. ' + Math.round(n).toLocaleString('es-PY');
const formatDate = (d: string) => new Date(d).toLocaleDateString('es-PY', { day: '2-digit', month: 'short', year: 'numeric' });

type Tab = 'dashboard' | 'presupuestos' | 'planificacion';

export default function AdminPresupuestosPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [items, setItems] = useState<Presupuesto[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
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

  const patchSeguimiento = async (id: string, patch: Partial<SeguimientoData>) => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    const merged = { ...item.seguimientoData, ...patch };
    setItems(prev => prev.map(i => i.id === id ? { ...i, seguimientoData: merged } : i));
    await fetch(`/api/presupuestos/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seguimientoData: merged }),
    });
  };

  const totalCotizado = items.filter(i => ['cotizado','aprobado','en_ejecucion','completado'].includes(i.status)).reduce((s, i) => s + (Number(i.finalValue) || Number(i.estimatedValue) || 0), 0);
  const totalAprobado = items.filter(i => ['aprobado','en_ejecucion','completado'].includes(i.status)).reduce((s, i) => s + (Number(i.finalValue) || 0), 0);
  const totalCompletado = items.filter(i => i.status === 'completado').reduce((s, i) => s + (Number(i.finalValue) || 0), 0);
  const tasaCierre = (items.filter(i => i.status === 'completado').length + items.filter(i => i.status === 'rechazado').length) > 0
    ? Math.round((items.filter(i => i.status === 'completado').length / (items.filter(i => i.status === 'completado').length + items.filter(i => i.status === 'rechazado').length)) * 100)
    : 0;

  const mesActual = new Date().toLocaleDateString('es-PY', { month: 'long', year: 'numeric' });

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: 'dashboard',     label: 'Dashboard',      icon: BarChart2 },
    { key: 'presupuestos',  label: 'Presupuestos',   icon: List },
    { key: 'planificacion', label: 'Planificación',  icon: ClipboardList },
  ];

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-h1 uppercase text-arctic">Tablero de Control</h1>
          <p className="mt-1 font-body text-body-sm text-steel-300">Presupuestos — Full Service &amp; Clean</p>
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
            </button>
          );
        })}
        <div className="ml-auto flex items-center pb-1">
          <button onClick={fetchData} className="rounded p-1.5 text-steel-600 hover:text-arctic transition-colors"><RefreshCw className="h-3.5 w-3.5" /></button>
        </div>
      </div>

      {activeTab === 'dashboard' && (
        <DashboardTab items={items} loading={loading}
          totalCotizado={totalCotizado} totalAprobado={totalAprobado}
          totalCompletado={totalCompletado} tasaCierre={tasaCierre}
          onNavigate={setActiveTab} />
      )}

      {activeTab === 'presupuestos' && (
        <PresupuestosTab
          items={items} loading={loading}
          mesActual={mesActual}
          onOpen={(id) => router.push(`/admin/presupuestos/${id}`)}
          onDelete={del}
          onPatch={patchSeguimiento}
          onNew={() => setShowCreate(true)}
        />
      )}

      {activeTab === 'planificacion' && (
        <PlanificacionTab
          items={items} loading={loading}
          onOpen={(id) => router.push(`/admin/presupuestos/${id}`)}
          onPatch={patchSeguimiento}
        />
      )}

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
  const pendientes = byStatus('nuevo') + byStatus('en_revision') + byStatus('cotizado') + byStatus('borrador');
  const ejecucion = byStatus('en_ejecucion');
  const finalizados = byStatus('completado');
  const baja = byStatus('rechazado');
  const totalAprobadoCount = byStatus('aprobado') + ejecucion;

  // Admin cierre: os = SI, informe = SI
  const conOs = items.filter(i => (i.seguimientoData as SeguimientoData)?.os === 'SI').length;
  const conInforme = items.filter(i => (i.seguimientoData as SeguimientoData)?.informe === 'SI').length;
  const aprobadosPlan = items.filter(i => ['aprobado','en_ejecucion'].includes(i.status));
  const factCount = items.filter(i => (i.seguimientoData as SeguimientoData)?.facturado === 'SI').length;

  // Top clientes por monto
  const clienteTotals: Record<string, number> = {};
  items.filter(i => ['aprobado','en_ejecucion','completado'].includes(i.status)).forEach(i => {
    const n = i.customer.name || 'Sin nombre';
    clienteTotals[n] = (clienteTotals[n] || 0) + (Number(i.finalValue) || 0);
  });
  const topClientes = Object.entries(clienteTotals).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maxCliente = topClientes[0]?.[1] || 1;

  if (loading) return <div className="space-y-4">{Array.from({length:3}).map((_,i) => <div key={i} className="card animate-pulse p-4 h-20 bg-steel-900/40" />)}</div>;

  return (
    <div className="space-y-5">
      {/* Row 1: status counts */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {[
          { label: 'Total', value: items.length, color: '#cbd5e1' },
          { label: 'Pendientes', value: pendientes, color: '#F59E0B' },
          { label: 'En ejecución', value: ejecucion, color: '#3B82F6' },
          { label: 'Finalizados', value: finalizados, color: '#48BB78' },
          { label: 'De baja', value: baja, color: '#6B7280' },
        ].map(k => (
          <div key={k.label} className="card p-4 text-center">
            <p className="font-mono text-[1.875rem] font-bold leading-none" style={{ color: k.color }}>{k.value}</p>
            <p className="mt-1.5 font-body text-caption text-steel-500">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Row 2: financial dark tiles */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="card bg-carbon p-5">
          <p className="font-body text-caption text-steel-500 mb-1">Total cotizado</p>
          <p className="font-mono text-body-sm font-bold text-arctic">{totalCotizado > 0 ? formatGs(totalCotizado) : '—'}</p>
        </div>
        <div className="card bg-carbon p-5">
          <p className="font-body text-caption text-steel-500 mb-1">Aprobado / Vendido</p>
          <p className="font-mono text-body-sm font-bold text-[#48BB78]">{totalAprobado > 0 ? formatGs(totalAprobado) : '—'}</p>
          <p className="font-body text-[0.65rem] text-steel-600 mt-1">Tasa de cierre: <span className="text-[#48BB78]">{tasaCierre}%</span></p>
        </div>
        <div className="card bg-carbon p-5">
          <p className="font-body text-caption text-steel-500 mb-1">Facturado</p>
          <p className="font-mono text-body-sm font-bold text-blue-bright">{totalCompletado > 0 ? formatGs(totalCompletado) : '—'}</p>
          <p className="font-body text-[0.65rem] text-steel-600 mt-1">{factCount} factura{factCount !== 1 ? 's' : ''} emitida{factCount !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Cierre administrativo */}
        <div className="card p-5">
          <h3 className="mb-4 font-display text-h4 text-arctic">Cierre administrativo</h3>
          <div className="space-y-3">
            {[
              { label: 'Orden de servicio', count: conOs, total: aprobadosPlan.length },
              { label: 'Informe al cliente', count: conInforme, total: aprobadosPlan.length },
            ].map(r => {
              const pct = r.total > 0 ? Math.round(r.count / r.total * 100) : 0;
              return (
                <div key={r.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-body text-caption text-steel-400">{r.label}</span>
                    <span className="font-mono text-caption text-steel-500">{r.count}/{r.total}</span>
                  </div>
                  <div className="h-2 rounded-full bg-steel-900/60">
                    <div className="h-2 rounded-full bg-blue-bright transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-4 border-t border-steel-900/40 flex gap-2">
            <button onClick={() => onNavigate('presupuestos')} className="btn-secondary flex-1 justify-center text-xs">Ir a Presupuestos</button>
            <button onClick={() => onNavigate('planificacion')} className="btn-secondary flex-1 justify-center text-xs">Ir a Planificación</button>
          </div>
        </div>

        {/* Monto por cliente */}
        <div className="card p-5">
          <h3 className="mb-4 font-display text-h4 text-arctic">Monto aprobado por cliente</h3>
          {topClientes.length === 0 ? (
            <p className="font-body text-caption text-steel-600">Sin datos aún</p>
          ) : (
            <div className="space-y-2.5">
              {topClientes.map(([nombre, monto]) => (
                <div key={nombre}>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="truncate font-body text-caption text-steel-300">{nombre}</span>
                    <span className="shrink-0 font-mono text-[0.65rem] text-steel-500 ml-2">{formatGs(monto)}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-steel-900/60">
                    <div className="h-1.5 rounded-full bg-[#48BB78] transition-all" style={{ width: `${Math.round(monto / maxCliente * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Presupuestos spreadsheet tab ─────────────────────────────
const ALERTA_OPTS = ['', 'FALTA RELEVAR', 'FALTA PRESUPUESTAR', 'ENVIADO', 'APROBADO', 'DE BAJA'];
const ESTADO_OPTS = ['SIN CARGAR', 'PENDIENTE RELEVO', 'EN PRESUPUESTO', 'PENDIENTE APROBACION', 'EN EJECUCION', 'FINALIZADO', 'DE BAJA'];
const PRIO_OPTS   = ['Normal', 'Alta', 'Urgente'];

function PresupuestosTab({ items, loading, mesActual, onOpen, onDelete, onPatch, onNew }: {
  items: Presupuesto[]; loading: boolean; mesActual: string;
  onOpen: (id: string) => void; onDelete: (id: string) => void;
  onPatch: (id: string, p: Partial<SeguimientoData>) => void; onNew: () => void;
}) {
  const [search, setSearch] = useState('');

  const visible = items.filter(i => {
    if (!search) return true;
    return [i.code, i.customer.name, i.serviceTitle, (i.seguimientoData as SeguimientoData)?.local || ''].join(' ').toLowerCase().includes(search.toLowerCase());
  });

  // Footer totals
  const presupuestado = items.reduce((s, i) => s + (Number(i.estimatedValue) || 0), 0);
  const cotizadoVivo = items.filter(i => !['rechazado','completado'].includes(i.status)).reduce((s, i) => s + (Number(i.finalValue) || Number(i.estimatedValue) || 0), 0);
  const aprobadoTotal = items.filter(i => ['aprobado','en_ejecucion','completado'].includes(i.status)).reduce((s, i) => s + (Number(i.finalValue) || 0), 0);
  const vendidoTotal = items.reduce((s, i) => {
    const sd = i.seguimientoData as SeguimientoData;
    return s + (Number(sd?.vendido) || 0);
  }, 0);

  const pasarNoAprobados = async () => {
    if (!confirm('¿Mover todos los presupuestos no aprobados a DE BAJA?')) return;
    for (const item of items) {
      const sd = item.seguimientoData as SeguimientoData;
      if (sd?.alerta !== 'APROBADO' && sd?.alerta !== 'DE BAJA') {
        onPatch(item.id, { alerta: 'DE BAJA' });
      }
    }
  };

  if (loading) return <div className="card animate-pulse p-6 h-40 bg-steel-900/40" />;

  return (
    <div className="space-y-3">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="font-mono text-body-sm text-steel-400 shrink-0">
          Panel de control — <span className="text-arctic capitalize">{mesActual}</span>
        </h2>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-steel-500" />
          <input type="text" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="input pl-10 py-1.5 text-sm" />
        </div>
        <button onClick={pasarNoAprobados} className="btn-secondary text-xs shrink-0">Pasar no aprobados</button>
        <button onClick={onNew} className="btn-primary text-xs shrink-0 flex items-center gap-1"><Plus className="h-3.5 w-3.5" /> Nuevo</button>
      </div>

      {/* Spreadsheet */}
      <div className="overflow-x-auto rounded-lg border border-steel-900/60">
        <table style={{ minWidth: 1560, borderCollapse: 'collapse' }} className="w-full font-body text-[0.78rem]">
          <thead>
            <tr className="bg-steel-900/60 text-left text-[0.65rem] font-mono uppercase tracking-widest text-steel-500">
              <th className="px-3 py-2" style={{ width: 132 }}>N° presu</th>
              <th className="px-2 py-2" style={{ width: 92 }}>Fecha</th>
              <th className="px-2 py-2" style={{ width: 150 }}>Cliente</th>
              <th className="px-2 py-2" style={{ width: 150 }}>Local</th>
              <th className="px-2 py-2" style={{ minWidth: 180 }}>Trabajo</th>
              <th className="px-2 py-2 text-right" style={{ width: 140 }}>Precio venta</th>
              <th className="px-2 py-2 text-right" style={{ width: 140 }}>Vendido</th>
              <th className="px-2 py-2" style={{ width: 156 }}>Alerta</th>
              <th className="px-2 py-2" style={{ width: 170 }}>Estado</th>
              <th className="px-2 py-2" style={{ width: 96 }}>Prioridad</th>
              <th className="px-2 py-2" style={{ width: 130 }}>Técnico</th>
              <th className="px-2 py-2" style={{ width: 30 }}></th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr><td colSpan={12} className="px-4 py-10 text-center text-steel-600 font-body text-caption">Sin presupuestos. <button onClick={onNew} className="text-blue-bright underline">Crear uno</button></td></tr>
            )}
            {visible.map((item, idx) => {
              const sd = item.seguimientoData as SeguimientoData;
              const precio = Number(item.finalValue ?? item.estimatedValue) || 0;
              const alertaColor: Record<string, string> = {
                'FALTA RELEVAR': 'text-[#FC8181]', 'FALTA PRESUPUESTAR': 'text-yellow-bright',
                'ENVIADO': 'text-blue-bright', 'APROBADO': 'text-[#48BB78]', 'DE BAJA': 'text-steel-600',
              };
              return (
                <tr key={item.id} className={`border-t border-steel-900/40 transition-colors hover:bg-steel-900/20 ${idx % 2 === 0 ? '' : 'bg-steel-900/10'}`}>
                  <td className="px-3 py-1.5">
                    <button onClick={() => onOpen(item.id)} className="font-mono text-[0.7rem] text-blue-bright hover:underline">{item.code}</button>
                  </td>
                  <td className="px-2 py-1.5 text-steel-400 text-[0.7rem]">{formatDate(item.createdAt)}</td>
                  <td className="px-2 py-1.5 text-arctic truncate max-w-[150px]">{item.customer.name}</td>
                  <td className="px-2 py-1.5">
                    <input
                      type="text" className="w-full bg-transparent text-steel-300 outline-none border-b border-transparent hover:border-steel-700 focus:border-blue-bright px-0.5 py-0.5 transition-colors text-[0.78rem]"
                      value={sd?.local || ''} placeholder="—"
                      onChange={e => onPatch(item.id, { local: e.target.value })}
                    />
                  </td>
                  <td className="px-2 py-1.5 text-steel-300 max-w-0 w-full">
                    <span className="block truncate">{item.serviceTitle}</span>
                  </td>
                  <td className="px-2 py-1.5 text-right font-mono text-arctic text-[0.72rem]">{precio > 0 ? Math.round(precio).toLocaleString('es-PY') : '—'}</td>
                  <td className="px-2 py-1.5 text-right">
                    <input type="number" className="w-full bg-transparent text-right font-mono text-[#48BB78] outline-none border-b border-transparent hover:border-steel-700 focus:border-[#48BB78] px-0.5 py-0.5 text-[0.72rem]"
                      value={sd?.vendido ?? ''} placeholder="—"
                      onChange={e => onPatch(item.id, { vendido: e.target.value ? Number(e.target.value) : undefined })}
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <select className={`w-full bg-transparent outline-none border-b border-transparent hover:border-steel-700 focus:border-blue-bright py-0.5 text-[0.72rem] font-mono ${alertaColor[sd?.alerta || ''] || 'text-steel-600'}`}
                      value={sd?.alerta || ''} onChange={e => onPatch(item.id, { alerta: e.target.value })}>
                      <option value="">— sin alerta —</option>
                      {ALERTA_OPTS.filter(Boolean).map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </td>
                  <td className="px-2 py-1.5">
                    <select className="w-full bg-transparent outline-none border-b border-transparent hover:border-steel-700 focus:border-blue-bright py-0.5 text-[0.72rem] text-steel-300"
                      value={sd?.estado || item.status.toUpperCase().replace('_',' ')} onChange={e => onPatch(item.id, { estado: e.target.value })}>
                      {ESTADO_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </td>
                  <td className="px-2 py-1.5">
                    <select className="w-full bg-transparent outline-none border-b border-transparent hover:border-steel-700 focus:border-blue-bright py-0.5 text-[0.72rem] text-steel-300"
                      value={sd?.prioridad || item.priority} onChange={e => onPatch(item.id, { prioridad: e.target.value })}>
                      {PRIO_OPTS.map(o => <option key={o} value={o.toLowerCase()}>{o}</option>)}
                    </select>
                  </td>
                  <td className="px-2 py-1.5">
                    <input type="text" className="w-full bg-transparent text-steel-300 outline-none border-b border-transparent hover:border-steel-700 focus:border-blue-bright px-0.5 py-0.5 text-[0.72rem]"
                      value={sd?.tecnico ?? item.assignedTo ?? ''} placeholder="—"
                      onChange={e => onPatch(item.id, { tecnico: e.target.value })}
                    />
                  </td>
                  <td className="px-1 py-1.5 text-center">
                    <button onClick={() => onDelete(item.id)} className="rounded p-0.5 text-steel-700 hover:text-red-400"><Trash2 className="h-3.5 w-3.5" /></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-steel-700/60 bg-steel-900/60">
              <td colSpan={5} className="px-3 py-2 font-mono text-[0.65rem] text-steel-500 uppercase tracking-wider">Totales</td>
              <td className="px-2 py-2 text-right font-mono text-[0.72rem] text-steel-300">
                <div><span className="text-steel-600 text-[0.6rem]">Presupuestado </span>{presupuestado > 0 ? Math.round(presupuestado).toLocaleString('es-PY') : '—'}</div>
                <div><span className="text-steel-600 text-[0.6rem]">Cotizado vivo </span><span className="text-blue-bright">{cotizadoVivo > 0 ? Math.round(cotizadoVivo).toLocaleString('es-PY') : '—'}</span></div>
              </td>
              <td className="px-2 py-2 text-right font-mono text-[0.72rem]">
                <div><span className="text-steel-600 text-[0.6rem]">Aprobado </span><span className="text-[#48BB78]">{aprobadoTotal > 0 ? Math.round(aprobadoTotal).toLocaleString('es-PY') : '—'}</span></div>
                <div><span className="text-steel-600 text-[0.6rem]">Vendido </span><span className="text-[#48BB78]">{vendidoTotal > 0 ? Math.round(vendidoTotal).toLocaleString('es-PY') : '—'}</span></div>
              </td>
              <td colSpan={5}></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

// ─── Planificación tab ─────────────────────────────────────────
const AVANCE_OPTS = ['Pendiente', 'En Proceso', 'En Espera/Bloqueado', 'Finalizado'];
const TOGGLE_OPTS = ['—', 'SI', 'NO', 'NA'];

function ToggleCell({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const v = value || '—';
  const color = v === 'SI' ? 'text-[#48BB78]' : v === 'NO' ? 'text-[#FC8181]' : v === 'NA' ? 'text-steel-600' : 'text-steel-700';
  const next = { '—': 'SI', 'SI': 'NO', 'NO': 'NA', 'NA': '—' } as Record<string, string>;
  return (
    <button onClick={() => onChange(next[v] || '—')} className={`font-mono text-[0.65rem] font-bold w-full text-center py-0.5 ${color} hover:opacity-80 transition-opacity`}>{v}</button>
  );
}

function PlanificacionTab({ items, loading, onOpen, onPatch }: {
  items: Presupuesto[]; loading: boolean;
  onOpen: (id: string) => void;
  onPatch: (id: string, p: Partial<SeguimientoData>) => void;
}) {
  const [periodFilter, setPeriodFilter] = useState('mes');
  const [clienteFilter, setClienteFilter] = useState('');
  const [carpeta2, setCarpeta2] = useState<string[]>([]);

  // Carpeta 1: auto from APROBADO / EN EJECUCION
  const plan1 = items.filter(i => ['aprobado','en_ejecucion'].includes(i.status));
  // Carpeta 2: manual selection from remaining
  const restante = items.filter(i => !['aprobado','en_ejecucion'].includes(i.status) && !['rechazado'].includes(i.status));

  const filteredPlan1 = plan1.filter(i => {
    if (!clienteFilter) return true;
    return i.customer.name.toLowerCase().includes(clienteFilter.toLowerCase());
  });
  const plan2Items = items.filter(i => carpeta2.includes(i.id));

  const footerFor = (list: Presupuesto[]) => {
    const dias = list.reduce((s, i) => s + (Number((i.seguimientoData as SeguimientoData)?.dias) || 0), 0);
    const avanceSum = list.reduce((s, i) => s + (Number((i.seguimientoData as SeguimientoData)?.pct) || 0), 0);
    const avancePct = list.length > 0 ? Math.round(avanceSum / list.length) : 0;
    const facturado = list.filter(i => (i.seguimientoData as SeguimientoData)?.facturado === 'SI').reduce((s, i) => s + (Number(i.finalValue) || 0), 0);
    const porFacturar = list.filter(i => (i.seguimientoData as SeguimientoData)?.facturado !== 'SI').reduce((s, i) => s + (Number(i.finalValue) || 0), 0);
    return { dias, avancePct, facturado, porFacturar };
  };

  if (loading) return <div className="card animate-pulse p-6 h-40 bg-steel-900/40" />;

  const PlanTable = ({ planItems, title, carpetaId }: { planItems: Presupuesto[]; title: string; carpetaId: 1 | 2 }) => {
    const foot = footerFor(planItems);
    return (
      <div className="rounded-lg border border-steel-900/60 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 bg-steel-900/60 border-b border-steel-900/60">
          <h3 className="font-mono text-[0.72rem] font-bold text-steel-300 uppercase tracking-wider">{title}</h3>
          {carpetaId === 2 && (
            <div className="flex items-center gap-2">
              <select className="bg-transparent font-body text-[0.72rem] text-steel-500 outline-none border border-steel-900/60 rounded px-2 py-0.5"
                onChange={e => { if (e.target.value) setCarpeta2(prev => [...prev, e.target.value]); e.target.value = ''; }}>
                <option value="">Agregar presupuesto...</option>
                {restante.filter(i => !carpeta2.includes(i.id)).map(i => <option key={i.id} value={i.id}>{i.code} — {i.customer.name}</option>)}
              </select>
            </div>
          )}
        </div>
        <div className="overflow-x-auto">
          <table style={{ minWidth: 1200, borderCollapse: 'collapse' }} className="w-full font-body text-[0.78rem]">
            <thead>
              <tr className="bg-steel-900/30 text-left text-[0.6rem] font-mono uppercase tracking-widest text-steel-600">
                <th className="px-3 py-2" style={{ width: 100 }}>Fecha</th>
                <th className="px-2 py-2" style={{ width: 110 }}>N° presu</th>
                <th className="px-2 py-2" style={{ width: 180 }}>Cliente / Local</th>
                <th className="px-2 py-2" style={{ minWidth: 160 }}>Trabajo</th>
                <th className="px-2 py-2" style={{ width: 110 }}>Técnico</th>
                <th className="px-2 py-2" style={{ width: 150 }}>Avance</th>
                <th className="px-2 py-2 text-center" style={{ width: 64 }}>%</th>
                <th className="px-2 py-2 text-center" style={{ width: 56 }}>Días</th>
                <th className="px-2 py-2 text-center" style={{ width: 52 }}>O.Serv</th>
                <th className="px-2 py-2 text-center" style={{ width: 52 }}>Informe</th>
                <th className="px-2 py-2 text-center" style={{ width: 52 }}>Fact.</th>
                <th className="px-2 py-2" style={{ width: 110 }}>N° Factura</th>
                <th className="px-2 py-2" style={{ minWidth: 140 }}>Observaciones</th>
                {carpetaId === 2 && <th className="px-2 py-2" style={{ width: 30 }}></th>}
              </tr>
            </thead>
            <tbody>
              {planItems.length === 0 && (
                <tr><td colSpan={carpetaId === 2 ? 14 : 13} className="px-4 py-8 text-center text-steel-600 font-body text-caption">
                  {carpetaId === 1 ? 'No hay presupuestos aprobados o en ejecución.' : 'Agregá presupuestos manualmente.'}
                </td></tr>
              )}
              {planItems.map((item, idx) => {
                const sd = item.seguimientoData as SeguimientoData;
                const avanceColor: Record<string, string> = {
                  'Pendiente': 'text-steel-500', 'En Proceso': 'text-blue-bright',
                  'En Espera/Bloqueado': 'text-yellow-bright', 'Finalizado': 'text-[#48BB78]'
                };
                return (
                  <tr key={item.id} className={`border-t border-steel-900/40 hover:bg-steel-900/20 ${idx % 2 === 0 ? '' : 'bg-steel-900/10'}`}>
                    <td className="px-3 py-1.5 text-steel-500 text-[0.7rem]">{item.scheduledDate || formatDate(item.createdAt)}</td>
                    <td className="px-2 py-1.5">
                      <button onClick={() => onOpen(item.id)} className="font-mono text-[0.7rem] text-blue-bright hover:underline">{item.code}</button>
                    </td>
                    <td className="px-2 py-1.5">
                      <div className="font-body text-[0.75rem] text-arctic leading-tight">{item.customer.name}</div>
                      <div className="font-body text-[0.65rem] text-steel-600 leading-tight">{sd?.local || item.customer.address || '—'}</div>
                    </td>
                    <td className="px-2 py-1.5 text-steel-300 max-w-0 w-full"><span className="block truncate">{item.serviceTitle}</span></td>
                    <td className="px-2 py-1.5">
                      <input type="text" className="w-full bg-transparent text-steel-300 outline-none border-b border-transparent hover:border-steel-700 focus:border-blue-bright px-0.5 py-0.5 text-[0.72rem]"
                        value={sd?.tecnico ?? item.assignedTo ?? ''} placeholder="—"
                        onChange={e => onPatch(item.id, { tecnico: e.target.value })}
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <select className={`w-full bg-transparent outline-none border-b border-transparent hover:border-steel-700 focus:border-blue-bright py-0.5 text-[0.72rem] ${avanceColor[sd?.avance || 'Pendiente'] || 'text-steel-500'}`}
                        value={sd?.avance || 'Pendiente'} onChange={e => onPatch(item.id, { avance: e.target.value })}>
                        {AVANCE_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      <input type="number" min="0" max="100" className="w-full bg-transparent text-center font-mono text-steel-300 outline-none border-b border-transparent hover:border-steel-700 focus:border-blue-bright py-0.5 text-[0.72rem]"
                        value={sd?.pct ?? ''} placeholder="0"
                        onChange={e => onPatch(item.id, { pct: e.target.value ? Number(e.target.value) : undefined })}
                      />
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      <input type="number" min="0" className="w-full bg-transparent text-center font-mono text-steel-300 outline-none border-b border-transparent hover:border-steel-700 focus:border-blue-bright py-0.5 text-[0.72rem]"
                        value={sd?.dias ?? ''} placeholder="0"
                        onChange={e => onPatch(item.id, { dias: e.target.value ? Number(e.target.value) : undefined })}
                      />
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      <ToggleCell value={sd?.os || '—'} onChange={v => onPatch(item.id, { os: v })} />
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      <ToggleCell value={sd?.informe || '—'} onChange={v => onPatch(item.id, { informe: v })} />
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      <ToggleCell value={sd?.facturado || '—'} onChange={v => onPatch(item.id, { facturado: v })} />
                    </td>
                    <td className="px-2 py-1.5">
                      <input type="text" className="w-full bg-transparent text-steel-300 outline-none border-b border-transparent hover:border-steel-700 focus:border-blue-bright px-0.5 py-0.5 text-[0.72rem]"
                        value={sd?.nroFactura || ''} placeholder="—"
                        onChange={e => onPatch(item.id, { nroFactura: e.target.value })}
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <input type="text" className="w-full bg-transparent text-steel-300 outline-none border-b border-transparent hover:border-steel-700 focus:border-blue-bright px-0.5 py-0.5 text-[0.72rem]"
                        value={sd?.obs || ''} placeholder="—"
                        onChange={e => onPatch(item.id, { obs: e.target.value })}
                      />
                    </td>
                    {carpetaId === 2 && (
                      <td className="px-1 py-1.5 text-center">
                        <button onClick={() => setCarpeta2(p => p.filter(x => x !== item.id))} className="text-steel-700 hover:text-red-400"><X className="h-3 w-3" /></button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-steel-700/60 bg-steel-900/60">
                <td colSpan={carpetaId === 2 ? 7 : 7} className="px-3 py-2 font-mono text-[0.65rem] text-steel-500">
                  Días: <span className="text-arctic">{foot.dias}</span> &nbsp;|&nbsp; Avance: <span className="text-blue-bright">{foot.avancePct}%</span>
                </td>
                <td colSpan={carpetaId === 2 ? 7 : 6} className="px-2 py-2 text-right font-mono text-[0.65rem] text-steel-500">
                  Facturado: <span className="text-[#48BB78]">{foot.facturado > 0 ? Math.round(foot.facturado).toLocaleString('es-PY') : '—'}</span>
                  &nbsp;|&nbsp; Por facturar: <span className="text-yellow-bright">{foot.porFacturar > 0 ? Math.round(foot.porFacturar).toLocaleString('es-PY') : '—'}</span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <select value={periodFilter} onChange={e => setPeriodFilter(e.target.value)} className="input max-w-[140px] py-1.5 text-sm">
          <option value="semana">Semana</option>
          <option value="2semanas">2 semanas</option>
          <option value="mes">Mes</option>
          <option value="trimestre">Trimestre</option>
          <option value="todo">Todo</option>
        </select>
        <div className="relative min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-steel-500" />
          <input type="text" placeholder="Filtrar por cliente..." value={clienteFilter} onChange={e => setClienteFilter(e.target.value)} className="input pl-10 py-1.5 text-sm" />
        </div>
      </div>

      <PlanTable planItems={filteredPlan1} title="Planificación 1 — Aprobados y en ejecución" carpetaId={1} />
      <PlanTable planItems={plan2Items} title="Planificación 2 — Manual" carpetaId={2} />
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
          placeholder="Buscar cliente existente..." />
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
