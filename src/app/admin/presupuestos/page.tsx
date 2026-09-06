'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
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

interface SeguimientoData {
  mes?: string;
  mesHistorial?: string[];
  alerta?: string;
  vendido?: number;
  avance?: string;
  os?: string;
  informe?: string;
  facturado?: string;
  nroFactura?: string;
  tecnico?: string;
  prioridad?: string;
  obs?: string;
  pct?: number;
  dias?: number;
  local?: string;
}

interface Presupuesto {
  id: string; code: string; status: string; serviceType: string; serviceTitle: string;
  customer: { name: string; email: string; phone: string; company: string; address: string };
  description: string; details: string; estimatedValue: number | null; finalValue: number | null;
  estimatedDuration: string; priority: string; source: string; assignedTo: string;
  scheduledDate: string; calculationData: CalculationData | null; createdBy: string;
  notes: { id: string; text: string; createdAt: string }[];
  createdAt: string; updatedAt: string;
  seguimientoData?: SeguimientoData;
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
    { key: 'dashboard',    label: 'Tablero de control', icon: BarChart2 },
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
        <TableroDashboard items={items} loading={loading} onRefresh={fetchData} />
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

// ─── Tablero de Control constants ─────────────────────────────
const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const ALERTA_OPTS = ['','FALTA RELEVAR','FALTA PRESUPUESTAR','ENVIADO','APROBADO','DE BAJA'];
const AVANCE_OPTS = ['Pendiente','En Proceso','En Espera / Bloqueado','Finalizado'];
const CICLO_OS = ['NO','SI','NA'];
const PLAN2_KEY = 'fsc-plan2-tareas-v1';
const ESTADO_OPTS = ['SIN CARGAR','PENDIENTE RELEVO','EN PRESUPUESTO','PENDIENTE APROBACION','EN EJECUCION','FINALIZADO','DE BAJA'];
const PRIORIDAD_SEG_OPTS = ['','Normal','Alta','Urgente'];

function estadoDe(alerta?: string, avance?: string): string {
  if (alerta === 'DE BAJA') return 'DE BAJA';
  if (alerta === 'APROBADO' && avance === 'Finalizado') return 'FINALIZADO';
  if (alerta === 'APROBADO') return 'EN EJECUCION';
  if (alerta === 'ENVIADO') return 'PENDIENTE APROBACION';
  if (alerta === 'FALTA PRESUPUESTAR') return 'EN PRESUPUESTO';
  if (alerta === 'FALTA RELEVAR') return 'PENDIENTE RELEVO';
  return 'SIN CARGAR';
}

function setEstadoFields(estado: string): Partial<SeguimientoData> {
  const map: Record<string, Partial<SeguimientoData>> = {
    'FINALIZADO':            { alerta: 'APROBADO',            avance: 'Finalizado' },
    'EN EJECUCION':          { alerta: 'APROBADO',            avance: 'En Proceso' },
    'PENDIENTE APROBACION':  { alerta: 'ENVIADO',             avance: 'Pendiente' },
    'EN PRESUPUESTO':        { alerta: 'FALTA PRESUPUESTAR',  avance: 'Pendiente' },
    'PENDIENTE RELEVO':      { alerta: 'FALTA RELEVAR',       avance: 'Pendiente' },
    'DE BAJA':               { alerta: 'DE BAJA',             avance: 'Pendiente' },
    'SIN CARGAR':            { alerta: '',                    avance: '' },
  };
  return map[estado] || { alerta: '', avance: '' };
}

function chipEstado(estado: string): string {
  const map: Record<string, string> = {
    'FINALIZADO': 'bg-[#48BB78]/15 text-[#48BB78] border border-[#48BB78]/30',
    'EN EJECUCION': 'bg-blue-bright/15 text-blue-bright border border-blue-bright/30',
    'PENDIENTE APROBACION': 'bg-yellow-bright/15 text-yellow-bright border border-yellow-bright/30',
    'EN PRESUPUESTO': 'bg-[#F97316]/15 text-[#F97316] border border-[#F97316]/30',
    'PENDIENTE RELEVO': 'bg-purple-500/15 text-purple-300 border border-purple-500/30',
    'DE BAJA': 'bg-[#FC8181]/15 text-[#FC8181] border border-[#FC8181]/30',
    'SIN CARGAR': 'bg-steel-900 text-steel-500 border border-steel-800',
  };
  return map[estado] || map['SIN CARGAR'];
}

function flagColor(alerta?: string): string {
  const map: Record<string, string> = {
    'APROBADO': '#48BB78', 'ENVIADO': '#F59E0B',
    'FALTA PRESUPUESTAR': '#F97316', 'FALTA RELEVAR': '#A78BFA',
    'DE BAJA': '#FC8181',
  };
  return alerta ? (map[alerta] || '#6B7280') : '#6B7280';
}

const N = (v: unknown): number => Number(v) || 0;
const money = (n: number) => 'Gs. ' + Math.round(n).toLocaleString('es-PY');
const ciclo = (v: string) => CICLO_OS[(CICLO_OS.indexOf(v) + 1) % 3];
const prevMonth = (ym: string) => { const [y,m] = ym.split('-').map(Number); return m === 1 ? `${y-1}-12` : `${y}-${String(m-1).padStart(2,'0')}`; };
const nextMonthStr = (ym: string) => { const [y,m] = ym.split('-').map(Number); return m === 12 ? `${y+1}-01` : `${y}-${String(m+1).padStart(2,'0')}`; };
const monthLabel = (ym: string) => { const [y,m] = ym.split('-').map(Number); return `${MONTH_NAMES[m-1]} ${y}`; };

interface Plan2Tarea {
  id: string; nro?: string; cliente: string; local: string; descripcion: string; tecnico: string;
  avance: string; pct?: number; dias: number; obs: string; scheduledDate?: string;
}

// ─── TableroDashboard ─────────────────────────────────────────
function TableroDashboard({ items, loading, onRefresh }: {
  items: Presupuesto[]; loading: boolean; onRefresh: () => void;
}) {
  const now = new Date();
  const currentYM = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;

  const [subTab, setSubTab] = useState<'dashboard'|'presupuestos'|'planificacion'>('dashboard');
  const [selectedMes, setSelectedMes] = useState(currentYM);
  const [yearView, setYearView] = useState(now.getFullYear());
  const [overrides, setOverrides] = useState<Map<string, Partial<SeguimientoData>>>(new Map());
  const [periodo, setPeriodo] = useState<'dia'|'semana'|'mes'|'anio'|'todo'>('mes');
  const [ancla, setAncla] = useState(currentYM.slice(0,7) + '-' + String(now.getDate()).padStart(2,'0'));
  const [plan2, setPlan2] = useState<Plan2Tarea[]>([]);
  const [plan2Edit, setPlan2Edit] = useState<string|null>(null);
  const [plan2Form, setPlan2Form] = useState<Partial<Plan2Tarea>>({});
  const [searchPres, setSearchPres] = useState('');
  const [carpeta, setCarpeta] = useState<'plan1'|'plan2'>('plan1');
  const [planClientFilter, setPlanClientFilter] = useState('');
  const [soloPendientes, setSoloPendientes] = useState(false);
  const [planCarpLabel, setPlanCarpLabel] = useState('');

  useEffect(() => {
    try { const d = localStorage.getItem(PLAN2_KEY); if (d) setPlan2(JSON.parse(d)); } catch {}
  }, []);

  const savePlan2 = (list: Plan2Tarea[]) => {
    setPlan2(list);
    try { localStorage.setItem(PLAN2_KEY, JSON.stringify(list)); } catch {}
  };

  const getSD = (item: Presupuesto): SeguimientoData => ({
    ...((item.seguimientoData as SeguimientoData) || {}),
    ...(overrides.get(item.id) || {}),
  });

  const getMes = (item: Presupuesto) => {
    const sd = getSD(item);
    return sd.mes || item.createdAt.slice(0, 7);
  };

  const patchSeg = async (id: string, fields: Partial<SeguimientoData>) => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    const currentSD = getSD(item);
    const merged = { ...currentSD, ...fields };
    setOverrides(prev => { const m = new Map(prev); m.set(id, { ...(m.get(id) || {}), ...fields }); return m; });
    try {
      await fetch(`/api/presupuestos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seguimientoData: merged }),
      });
    } catch {}
  };

  // Items for selected month
  const mesItems = useMemo(() => items.filter(i => getMes(i) === selectedMes), [items, selectedMes, overrides]);
  const vivos = mesItems.filter(i => getSD(i).alerta !== 'DE BAJA');
  const aprobados = mesItems.filter(i => getSD(i).alerta === 'APROBADO');
  const facturadas = aprobados.filter(i => getSD(i).facturado === 'SI');

  // KPIs
  const cotizado = vivos.reduce((s, i) => s + N(i.finalValue || i.estimatedValue), 0);
  const aprobadoMonto = aprobados.reduce((s, i) => s + N(i.finalValue || i.estimatedValue), 0);
  const facturadoMonto = facturadas.reduce((s, i) => s + N(i.finalValue || i.estimatedValue), 0);
  const porFacturar = aprobadoMonto - facturadoMonto;
  const tasaCierre = cotizado > 0 ? Math.round((aprobadoMonto / cotizado) * 100) : 0;

  // Cierre administrativo
  const cierreAdm = [
    { label: 'Orden de servicio', n: aprobados.filter(i => getSD(i).os === 'SI').length, total: aprobados.length },
    { label: 'Informe al cliente', n: aprobados.filter(i => getSD(i).informe === 'SI').length, total: aprobados.length },
    { label: 'Facturado', n: facturadas.length, total: aprobados.length },
  ];

  // Monto por cliente (top 6)
  const porCliente = useMemo(() => {
    const map: Record<string, number> = {};
    aprobados.forEach(i => { map[i.customer.name] = (map[i.customer.name] || 0) + N(i.finalValue || i.estimatedValue); });
    return Object.entries(map).sort((a,b) => b[1]-a[1]).slice(0,6);
  }, [aprobados]);

  // Months for year tabs
  const yearMonths = Array.from({length:12},(_,i) => {
    const m = String(i+1).padStart(2,'0');
    return { ym: `${yearView}-${m}`, label: MONTH_NAMES[i].slice(0,3) };
  });

  // Pasar no aprobados al mes siguiente
  const pasarPendientes = async () => {
    const pendientes = mesItems.filter(i => { const a = getSD(i).alerta; return a !== 'APROBADO' && a !== 'DE BAJA'; });
    if (!pendientes.length) return;
    const next = nextMonthStr(selectedMes);
    await Promise.all(pendientes.map(i => {
      const sd = getSD(i);
      return patchSeg(i.id, { mes: next, mesHistorial: [...(sd.mesHistorial || []), selectedMes] });
    }));
    setSelectedMes(next);
  };

  // Plan 1: all APROBADO presupuestos across all months (period filtered)
  const planRanges = useMemo((): [string,string]|null => {
    const d = new Date(ancla);
    if (periodo === 'todo') return null;
    if (periodo === 'dia') return [ancla, ancla];
    if (periodo === 'semana') {
      const dow = d.getDay(); const mon = new Date(d); mon.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1));
      const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
      return [mon.toISOString().slice(0,10), sun.toISOString().slice(0,10)];
    }
    if (periodo === 'mes') { const y = ancla.slice(0,4), m = ancla.slice(5,7); const last = new Date(Number(y), Number(m), 0).getDate(); return [`${y}-${m}-01`, `${y}-${m}-${last}`]; }
    if (periodo === 'anio') { const y = ancla.slice(0,4); return [`${y}-01-01`, `${y}-12-31`]; }
    return null;
  }, [periodo, ancla]);

  const plan1Items = useMemo(() => {
    const all = items.filter(i => getSD(i).alerta === 'APROBADO');
    if (!planRanges) return all;
    const [from, to] = planRanges;
    return all.filter(i => {
      const d = i.scheduledDate || getSD(i).local || i.createdAt.slice(0,10);
      return d >= from && d <= to;
    });
  }, [items, planRanges, overrides]);

  // Arrastres: items whose mesHistorial contains a month < selectedMes
  const arrastres = mesItems.filter(i => {
    const h = getSD(i).mesHistorial || [];
    return h.some(m => m < selectedMes);
  });
  const regularItems = mesItems.filter(i => !arrastres.includes(i));

  const subTabs = [
    { key: 'dashboard' as const, label: 'Dashboard' },
    { key: 'presupuestos' as const, label: 'Presupuestos' },
    { key: 'planificacion' as const, label: 'Planificación' },
  ];

  if (loading) return <div className="space-y-4">{Array.from({length:4}).map((_,i) => <div key={i} className="card animate-pulse p-4 h-16 bg-steel-900/40" />)}</div>;

  return (
    <div className="space-y-4">
      {/* Sub-tab nav + month selector */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-lg bg-steel-900/60 p-1">
          {subTabs.map(t => (
            <button key={t.key} onClick={() => setSubTab(t.key)}
              className={`px-4 py-1.5 rounded-md font-body text-body-sm font-medium transition-colors ${subTab === t.key ? 'bg-blue-bright text-white' : 'text-steel-400 hover:text-arctic'}`}>
              {t.label}
            </button>
          ))}
        </div>
        {subTab !== 'planificacion' && (
          <div className="flex items-center gap-2">
            <button onClick={() => setYearView(y => y-1)} className="p-1 text-steel-500 hover:text-arctic">‹</button>
            <span className="font-mono text-caption text-steel-400 w-10 text-center">{yearView}</span>
            <button onClick={() => setYearView(y => y+1)} className="p-1 text-steel-500 hover:text-arctic">›</button>
            <div className="flex gap-1 flex-wrap">
              {yearMonths.map(({ ym, label }) => {
                const hasData = items.some(i => getMes(i) === ym);
                return (
                  <button key={ym} onClick={() => setSelectedMes(ym)}
                    className={`px-2.5 py-1 rounded font-mono text-[0.65rem] font-medium transition-colors border ${
                      selectedMes === ym ? 'border-blue-bright bg-blue-bright/15 text-blue-bright' :
                      hasData ? 'border-steel-700 bg-steel-900/50 text-steel-300 hover:border-steel-500' :
                      'border-steel-900 text-steel-700 hover:text-steel-500'
                    }`}>{label}</button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── DASHBOARD sub-tab ── */}
      {subTab === 'dashboard' && (
        <div className="space-y-5">
          <h2 className="font-display text-h3 text-arctic">{monthLabel(selectedMes)}</h2>
          {/* KPI tiles */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              { label: 'Cotizado', value: money(cotizado), color: 'text-steel-300' },
              { label: 'Aprobado', value: money(aprobadoMonto), color: 'text-[#48BB78]' },
              { label: 'Facturado', value: money(facturadoMonto), color: 'text-blue-bright' },
              { label: 'Por facturar', value: money(porFacturar), color: 'text-yellow-bright' },
            ].map(k => (
              <div key={k.label} className="card p-4">
                <span className="font-body text-caption text-steel-500">{k.label}</span>
                <p className={`font-mono text-base font-bold mt-1 ${k.color}`}>{k.value}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              { label: 'Total presupuestos', value: mesItems.length, color: 'text-steel-300' },
              { label: 'Aprobados', value: aprobados.length, color: 'text-[#48BB78]' },
              { label: 'Tasa de cierre', value: `${tasaCierre}%`, color: 'text-blue-bright' },
              { label: 'Arrastres', value: arrastres.length, color: 'text-yellow-bright' },
            ].map(k => (
              <div key={k.label} className="card p-4">
                <span className="font-body text-caption text-steel-500">{k.label}</span>
                <p className={`font-display text-2xl font-bold mt-1 ${k.color}`}>{k.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Cierre administrativo */}
            <div className="card p-5">
              <h3 className="mb-4 font-display text-h4 text-arctic">Cierre administrativo</h3>
              <div className="space-y-3">
                {cierreAdm.map(c => {
                  const pct = c.total > 0 ? Math.round((c.n / c.total) * 100) : 0;
                  return (
                    <div key={c.label}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-body text-caption text-steel-400">{c.label}</span>
                        <span className="font-mono text-caption text-steel-300">{c.n}/{c.total}</span>
                      </div>
                      <div className="h-2 rounded-full bg-steel-900/60">
                        <div className="h-2 rounded-full bg-blue-bright transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            {/* Monto por cliente */}
            <div className="card p-5">
              <h3 className="mb-4 font-display text-h4 text-arctic">Monto por cliente</h3>
              <div className="space-y-2">
                {porCliente.length === 0 && <p className="font-body text-caption text-steel-600">Sin datos para este mes</p>}
                {porCliente.map(([nombre, monto]) => {
                  const pct = aprobadoMonto > 0 ? Math.round((monto / aprobadoMonto) * 100) : 0;
                  return (
                    <div key={nombre} className="flex items-center gap-3">
                      <span className="w-28 shrink-0 font-body text-caption text-steel-400 truncate">{nombre}</span>
                      <div className="flex-1 h-2 rounded-full bg-steel-900/60">
                        <div className="h-2 rounded-full bg-[#48BB78]/70 transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="shrink-0 font-mono text-caption text-steel-300">{money(monto)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── PRESUPUESTOS sub-tab ── */}
      {subTab === 'presupuestos' && (
        <div className="space-y-3">
          {/* Toolbar — igual al ejemplo: título | pasar | buscador | contador */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="mr-auto">
              <p className="font-display text-h4 text-arctic">Panel de control — {monthLabel(selectedMes)}</p>
              <p className="font-body text-[0.65rem] text-steel-500">Cambiá el Estado a EN EJECUCION o FINALIZADO para que pase a Planificación</p>
            </div>
            <button
              onClick={pasarPendientes}
              className="shrink-0 rounded border border-blue-bright/40 bg-blue-bright/10 px-3 py-1.5 font-body text-caption font-medium text-blue-bright hover:bg-blue-bright/20 transition-colors"
            >
              Pasar no aprobados al mes siguiente
            </button>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-steel-600 pointer-events-none" />
              <input
                value={searchPres} onChange={e => setSearchPres(e.target.value)}
                placeholder="Buscar cliente, local, trabajo o N°"
                className="w-56 rounded border border-steel-800 bg-steel-950 pl-7 pr-3 py-1.5 font-mono text-caption text-arctic placeholder:text-steel-700"
              />
            </div>
            <span className="shrink-0 font-mono text-caption text-steel-500 tabular-nums">
              {mesItems.length} de {items.length}
            </span>
          </div>
          <TableroPresupuestosTable
            items={regularItems.filter(i => !searchPres || [i.code, i.customer.name, i.serviceTitle, i.customer.company, getSD(i).tecnico||''].join(' ').toLowerCase().includes(searchPres.toLowerCase()))}
            arrastres={arrastres.filter(i => !searchPres || [i.code, i.customer.name, i.serviceTitle].join(' ').toLowerCase().includes(searchPres.toLowerCase()))}
            getSD={getSD} patchSeg={patchSeg}
          />
          {/* Footer totals */}
          <div className="card p-3 flex flex-wrap gap-6">
            {[
              { label: 'Presupuestado', value: money(mesItems.reduce((s,i) => s + N(i.estimatedValue), 0)) },
              { label: 'Cotizado vivo', value: money(cotizado) },
              { label: 'Aprobado', value: money(aprobadoMonto) },
              { label: 'Vendido', value: money(mesItems.reduce((s,i) => s + N(getSD(i).vendido), 0)) },
            ].map(f => (
              <div key={f.label}>
                <span className="font-body text-caption text-steel-500">{f.label}: </span>
                <span className="font-mono text-caption text-arctic">{f.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── PLANIFICACIÓN sub-tab ── */}
      {subTab === 'planificacion' && (() => {
        // carpeta label defaults
        const carpLabel = planCarpLabel || (carpeta === 'plan1' ? 'Plan 1 — Aprobados' : 'Plan 2 — Tareas manuales');

        // unique clients for filter
        const allClients = Array.from(new Set([
          ...plan1Items.map(i => i.customer.name),
          ...plan2.map(t => t.cliente),
        ])).filter(Boolean).sort();

        // apply client + pendientes filter
        const filteredPlan1 = plan1Items.filter(i => {
          if (planClientFilter && i.customer.name !== planClientFilter) return false;
          if (soloPendientes) { const a = getSD(i).avance; return !a || a === 'Pendiente' || a === 'En Proceso'; }
          return true;
        });
        const filteredPlan2 = plan2.filter(t => {
          if (planClientFilter && t.cliente !== planClientFilter) return false;
          if (soloPendientes) return !t.avance || t.avance === 'Pendiente' || t.avance === 'En Proceso';
          return true;
        });
        const hayFuera1 = plan1Items.length - plan1Items.filter(i => {
          if (planClientFilter && i.customer.name !== planClientFilter) return false;
          if (soloPendientes) { const a = getSD(i).avance; return !a || a === 'Pendiente' || a === 'En Proceso'; }
          return true;
        }).length;
        const hayFuera2 = plan2.length - filteredPlan2.length;
        const hayFuera = carpeta === 'plan1' ? hayFuera1 : hayFuera2;

        return (
          <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Carpeta selector */}
              <div className="flex gap-1 rounded-lg bg-steel-900/60 p-1">
                {(['plan1','plan2'] as const).map(p => (
                  <button key={p} onClick={() => setCarpeta(p)}
                    className={`px-4 py-1.5 rounded-md font-body text-body-sm font-medium transition-colors ${carpeta === p ? 'bg-blue-bright text-white' : 'text-steel-400 hover:text-arctic'}`}>
                    {p === 'plan1' ? 'Plan 1' : 'Plan 2'}
                  </button>
                ))}
              </div>
              {/* Editable carpeta label */}
              <input value={planCarpLabel} onChange={e => setPlanCarpLabel(e.target.value)}
                placeholder={carpeta === 'plan1' ? 'Plan 1 — Aprobados' : 'Plan 2 — Tareas manuales'}
                className="rounded border border-steel-800 bg-transparent px-2 py-1 font-body text-caption text-steel-300 placeholder:text-steel-700 w-52" />
              {/* Period filter */}
              <div className="flex gap-1 rounded-lg bg-steel-900/60 p-1">
                {(['dia','semana','mes','anio','todo'] as const).map(p => (
                  <button key={p} onClick={() => setPeriodo(p)}
                    className={`px-3 py-1 rounded font-body text-caption font-medium transition-colors ${periodo === p ? 'bg-blue-bright text-white' : 'text-steel-400 hover:text-arctic'}`}>
                    {p === 'dia' ? 'Día' : p === 'semana' ? 'Semana' : p === 'mes' ? 'Mes' : p === 'anio' ? 'Año' : 'Todo'}
                  </button>
                ))}
              </div>
              {periodo !== 'todo' && (
                <input type="date" value={ancla} onChange={e => setAncla(e.target.value)}
                  className="rounded border border-steel-800 bg-steel-950 px-2 py-1 font-mono text-caption text-arctic" />
              )}
              {/* Cliente filter */}
              <select value={planClientFilter} onChange={e => setPlanClientFilter(e.target.value)}
                className="rounded border border-steel-800 bg-steel-950 px-2 py-1 font-body text-caption text-arctic">
                <option value="">Todos los clientes</option>
                {allClients.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              {/* + Agregar (plan2 only) */}
              {carpeta === 'plan2' && (
                <button onClick={() => { setPlan2Form({}); setPlan2Edit('new'); }}
                  className="rounded border border-blue-bright/40 bg-blue-bright/10 px-3 py-1.5 font-body text-caption font-medium text-blue-bright hover:bg-blue-bright/20 transition-colors">
                  + Agregar tarea
                </button>
              )}
              {/* Ver solo pendientes toggle */}
              <button onClick={() => setSoloPendientes(v => !v)}
                className={`rounded border px-3 py-1.5 font-body text-caption font-medium transition-colors ${soloPendientes ? 'border-blue-bright/60 bg-blue-bright/15 text-blue-bright' : 'border-steel-800 text-steel-500 hover:text-arctic'}`}>
                Ver solo pendientes
              </button>
              {/* Imprimir */}
              <button onClick={() => window.print()}
                className="rounded border border-steel-800 px-3 py-1.5 font-body text-caption text-steel-500 hover:text-arctic transition-colors flex items-center gap-1.5">
                <Printer className="h-3.5 w-3.5" /> Imprimir
              </button>
            </div>

            {/* hayFuera banner */}
            {hayFuera > 0 && (
              <div className="flex items-center gap-3 rounded border border-yellow-bright/20 bg-yellow-bright/5 px-4 py-2">
                <span className="font-body text-caption text-yellow-bright">
                  {hayFuera} tarea{hayFuera !== 1 ? 's' : ''} fuera de este filtro
                </span>
                <button onClick={() => { setPlanClientFilter(''); setSoloPendientes(false); setPeriodo('todo'); }}
                  className="font-body text-caption text-yellow-bright underline">ver todas</button>
              </div>
            )}

            {/* Plan 1 */}
            {carpeta === 'plan1' && (
              <div>
                <TableroPlantab items={filteredPlan1} getSD={getSD} patchSeg={patchSeg} showCierre />
                <div className="mt-2 card p-3 flex flex-wrap gap-6">
                  {[
                    { label: 'Días', value: filteredPlan1.reduce((s,i) => s + N(getSD(i).dias), 0) },
                    { label: 'Avance total', value: `${filteredPlan1.filter(i => getSD(i).avance === 'Finalizado').length}/${filteredPlan1.length}` },
                    { label: 'Facturado', value: money(filteredPlan1.filter(i => getSD(i).facturado === 'SI').reduce((s,i) => s + N(i.finalValue||i.estimatedValue), 0)) },
                    { label: 'Por facturar', value: money(filteredPlan1.filter(i => getSD(i).facturado !== 'SI').reduce((s,i) => s + N(i.finalValue||i.estimatedValue), 0)) },
                  ].map(f => (
                    <div key={f.label}>
                      <span className="font-body text-caption text-steel-500">{f.label}: </span>
                      <span className="font-mono text-caption text-arctic">{f.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Plan 2 */}
            {carpeta === 'plan2' && (
              <div>
                <Plan2TableNew
                  tareas={filteredPlan2}
                  onEdit={(t) => { setPlan2Form(t); setPlan2Edit(t.id); }}
                  onDelete={id => savePlan2(plan2.filter(t => t.id !== id))}
                  onField={(id, fields) => savePlan2(plan2.map(t => t.id === id ? { ...t, ...fields } : t))}
                />
                {plan2Edit && (
                  <Plan2Form
                    form={plan2Form} setForm={setPlan2Form}
                    onSave={() => {
                      if (plan2Edit === 'new') {
                        savePlan2([...plan2, { ...plan2Form, id: crypto.randomUUID() } as Plan2Tarea]);
                      } else {
                        savePlan2(plan2.map(t => t.id === plan2Edit ? { ...t, ...plan2Form } : t));
                      }
                      setPlan2Edit(null);
                    }}
                    onCancel={() => setPlan2Edit(null)}
                  />
                )}
                <div className="mt-2 card p-3 flex flex-wrap gap-6">
                  {[
                    { label: 'Días', value: filteredPlan2.reduce((s,t) => s + N(t.dias), 0) },
                    { label: 'Avance total', value: `${filteredPlan2.filter(t => t.avance === 'Finalizado').length}/${filteredPlan2.length}` },
                  ].map(f => (
                    <div key={f.label}>
                      <span className="font-body text-caption text-steel-500">{f.label}: </span>
                      <span className="font-mono text-caption text-arctic">{f.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}

// ─── Presupuestos inline table ─────────────────────────────────
// Columns: N° PRESU · FECHA · CLIENTE · LOCAL · TRABAJO · PRECIO DE VENTA · VENDIDO · ALERTA · ESTADO · PRIORIDAD · TÉCNICO · ×
function TableroPresupuestosTable({ items, arrastres, getSD, patchSeg }: {
  items: Presupuesto[]; arrastres: Presupuesto[];
  getSD: (i: Presupuesto) => SeguimientoData;
  patchSeg: (id: string, fields: Partial<SeguimientoData>) => void;
}) {
  const colStyle = '132px 92px 150px 150px minmax(180px,1fr) 140px 140px 156px 170px 96px 130px 30px';
  const hdrs = ['N° PRESU','FECHA','CLIENTE','LOCAL','TRABAJO','PRECIO DE VENTA','VENDIDO','ALERTA','ESTADO','PRIORIDAD','TÉCNICO',''];

  const inputCls = 'w-full rounded bg-transparent border border-steel-800 px-1 py-0.5 font-mono text-[0.6rem] text-steel-300';

  const renderRow = (item: Presupuesto, isArrastre?: boolean) => {
    const sd = getSD(item);
    const estado = estadoDe(sd.alerta, sd.avance);
    const fechaCarga = item.createdAt.slice(0, 10);
    const precioVenta = N(item.finalValue || item.estimatedValue);
    return (
      <div key={item.id}
        className={`grid items-center border-b border-steel-900/40 hover:bg-steel-900/20 ${isArrastre ? 'opacity-80' : ''}`}
        style={{ display:'grid', gridTemplateColumns: colStyle }}>
        {/* N° PRESU */}
        <div className="px-2 py-1.5 font-mono text-caption text-blue-bright whitespace-nowrap">
          {item.code}
          {isArrastre && <span className="ml-1 text-yellow-bright">↩</span>}
        </div>
        {/* FECHA */}
        <div className="px-2 font-mono text-[0.6rem] text-steel-500 tabular-nums whitespace-nowrap">{fechaCarga}</div>
        {/* CLIENTE */}
        <div className="px-1 font-body text-caption text-steel-300 truncate">{item.customer.name}</div>
        {/* LOCAL */}
        <div className="px-1">
          <input value={sd.local||''} onChange={e => patchSeg(item.id, {local: e.target.value})}
            className={inputCls} placeholder={item.customer.address || '—'} />
        </div>
        {/* TRABAJO */}
        <div className="px-2 py-1 min-w-0">
          <p className="font-body text-caption text-steel-300 truncate">{item.serviceTitle}</p>
        </div>
        {/* PRECIO DE VENTA */}
        <div className="px-2 font-mono text-[0.6rem] text-steel-300 tabular-nums text-right whitespace-nowrap">
          {precioVenta > 0 ? money(precioVenta) : '—'}
        </div>
        {/* VENDIDO */}
        <div className="px-1">
          <input type="number" value={sd.vendido||''} onChange={e => patchSeg(item.id, {vendido: Number(e.target.value)})}
            className={inputCls + ' tabular-nums'} placeholder="0" />
        </div>
        {/* ALERTA */}
        <div className="px-1">
          <select value={sd.alerta||''} onChange={e => patchSeg(item.id, {alerta: e.target.value})}
            className={inputCls} style={{ color: flagColor(sd.alerta) }}>
            {ALERTA_OPTS.map(o => <option key={o} value={o} className="bg-[#0f1117] text-white">{o || '—'}</option>)}
          </select>
        </div>
        {/* ESTADO — editable select */}
        <div className="px-1">
          <select value={estado}
            onChange={e => patchSeg(item.id, setEstadoFields(e.target.value))}
            className={`${inputCls} font-semibold`}
            style={{ color: (() => {
              const c: Record<string,string> = {
                'FINALIZADO':'#48BB78','EN EJECUCION':'#60A5FA','PENDIENTE APROBACION':'#F59E0B',
                'EN PRESUPUESTO':'#F97316','PENDIENTE RELEVO':'#A78BFA','DE BAJA':'#FC8181',
              };
              return c[estado] || '#6B7280';
            })() }}>
            {ESTADO_OPTS.map(o => <option key={o} value={o} className="bg-[#0f1117] text-white">{o}</option>)}
          </select>
        </div>
        {/* PRIORIDAD */}
        <div className="px-1">
          <select value={sd.prioridad||''} onChange={e => patchSeg(item.id, {prioridad: e.target.value})}
            className={inputCls}>
            {PRIORIDAD_SEG_OPTS.map(o => <option key={o} value={o} className="bg-[#0f1117]">{o||'—'}</option>)}
          </select>
        </div>
        {/* TÉCNICO */}
        <div className="px-1">
          <input value={sd.tecnico||''} onChange={e => patchSeg(item.id, {tecnico: e.target.value})}
            className={inputCls} placeholder="—" />
        </div>
        {/* × */}
        <div className="px-1 flex justify-center">
          <button className="p-1 text-steel-700 hover:text-[#FC8181]"><X className="h-3 w-3" /></button>
        </div>
      </div>
    );
  };

  return (
    <div className="rounded-lg border border-steel-800 overflow-x-auto" style={{backgroundColor:'#0c0e14'}}>
      <div style={{minWidth:'1560px', backgroundColor:'#0c0e14'}}>
        {/* Header */}
        <div style={{ display:'grid', gridTemplateColumns: colStyle, backgroundColor:'#111420' }}
          className="border-b border-steel-800">
          {hdrs.map(h => <div key={h} className="px-2 py-2 font-mono text-[0.6rem] font-semibold uppercase tracking-wider text-steel-500 whitespace-nowrap">{h}</div>)}
        </div>
        {items.length === 0 && arrastres.length === 0 && (
          <p className="p-6 text-center font-body text-caption text-steel-600">Sin presupuestos para este mes</p>
        )}
        {items.map(i => renderRow(i))}
        {arrastres.length > 0 && (
          <>
            <div className="border-b border-dashed border-yellow-bright/20 py-1 px-3" style={{backgroundColor:'rgba(234,179,8,0.05)'}}>
              <span className="font-mono text-[0.6rem] text-yellow-bright">↩ Arrastres de meses anteriores</span>
            </div>
            {arrastres.map(i => renderRow(i, true))}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Plan 1 table (espejo aprobados) ──────────────────────────
// Columns: FECHA · N° PRESU · CLIENTE/LOCAL · TRABAJO · TÉCNICO · AVANCE · % · DÍAS · O.SERV. · INFORME · FACT. · N°FACTURA · OBSERVACIONES · ×
function TableroPlantab({ items, getSD, patchSeg, showCierre }: {
  items: Presupuesto[];
  getSD: (i: Presupuesto) => SeguimientoData;
  patchSeg: (id: string, fields: Partial<SeguimientoData>) => void;
  showCierre?: boolean;
}) {
  const inp = 'w-full rounded bg-transparent border border-steel-800 px-1 py-0.5 font-mono text-[0.6rem] text-steel-300';
  const colStyle = showCierre
    ? '122px 118px 150px minmax(170px,1fr) 118px 146px 74px 60px 66px 66px 66px 130px minmax(140px,0.8fr) 28px'
    : '122px 118px 150px minmax(170px,1fr) 118px 146px 74px 60px minmax(140px,0.8fr) 28px';
  const hdrs = showCierre
    ? ['FECHA','N° PRESU','CLIENTE / LOCAL','TRABAJO','TÉCNICO','AVANCE','%','DÍAS','O.SERV.','INFORME','FACT.','N°FACTURA','OBSERVACIONES','']
    : ['FECHA','N° PRESU','CLIENTE / LOCAL','TRABAJO','TÉCNICO','AVANCE','%','DÍAS','OBSERVACIONES',''];
  const minW = showCierre ? '1500px' : '900px';

  return (
    <div className="rounded-lg border border-steel-800 overflow-x-auto" style={{backgroundColor:'#0c0e14'}}>
      <div style={{minWidth:minW, backgroundColor:'#0c0e14'}}>
        <div style={{ display:'grid', gridTemplateColumns: colStyle, backgroundColor:'#111420' }} className="border-b border-steel-800">
          {hdrs.map(h => <div key={h} className="px-2 py-2 font-mono text-[0.6rem] font-semibold uppercase tracking-wider text-steel-500 whitespace-nowrap">{h}</div>)}
        </div>
        {items.length === 0 && <p className="p-6 text-center font-body text-caption text-steel-600">Sin items para el período</p>}
        {items.map(item => {
          const sd = getSD(item);
          const avanceColor: Record<string,string> = {
            'Finalizado':'#48BB78','En Proceso':'#60A5FA','En Espera / Bloqueado':'#F59E0B','Pendiente':'#6B7280',
          };
          return (
            <div key={item.id}
              className="items-center border-b border-steel-900/40 hover:bg-steel-900/20"
              style={{ display:'grid', gridTemplateColumns: colStyle }}>
              {/* FECHA */}
              <div className="px-2 py-1.5 font-mono text-[0.6rem] text-steel-500 whitespace-nowrap">{item.scheduledDate || item.createdAt.slice(0,10)}</div>
              {/* N° PRESU */}
              <div className="px-2 font-mono text-caption text-blue-bright">{item.code}</div>
              {/* CLIENTE / LOCAL */}
              <div className="px-1 min-w-0">
                <p className="font-body text-[0.6rem] text-steel-300 truncate">{item.customer.name}</p>
                {sd.local && <p className="font-mono text-[0.55rem] text-steel-600 truncate">{sd.local}</p>}
              </div>
              {/* TRABAJO */}
              <div className="px-1 font-body text-caption text-steel-300 truncate">{item.serviceTitle}</div>
              {/* TÉCNICO */}
              <div className="px-1">
                <input value={sd.tecnico||''} onChange={e => patchSeg(item.id, {tecnico: e.target.value})}
                  className={inp} placeholder="—" />
              </div>
              {/* AVANCE */}
              <div className="px-1">
                <select value={sd.avance||''} onChange={e => patchSeg(item.id, {avance: e.target.value})}
                  className={inp} style={{ color: avanceColor[sd.avance||''] || '#6B7280' }}>
                  <option value="" className="bg-[#0f1117] text-white">—</option>
                  {AVANCE_OPTS.map(o => <option key={o} value={o} className="bg-[#0f1117] text-white">{o}</option>)}
                </select>
              </div>
              {/* % */}
              <div className="px-1">
                <input type="number" value={sd.pct||''} onChange={e => patchSeg(item.id, {pct: Number(e.target.value)})}
                  className={inp + ' tabular-nums'} placeholder="0" />
              </div>
              {/* DÍAS */}
              <div className="px-1">
                <input type="number" value={sd.dias||''} onChange={e => patchSeg(item.id, {dias: Number(e.target.value)})}
                  className={inp + ' tabular-nums'} placeholder="0" />
              </div>
              {/* O.SERV / INFORME / FACT */}
              {showCierre && (['os','informe','facturado'] as const).map(f => (
                <div key={f} className="px-1">
                  <button onClick={() => patchSeg(item.id, {[f]: ciclo(sd[f]||'NO')})}
                    className={`w-full rounded px-1 py-0.5 font-mono text-[0.55rem] font-medium border transition-colors ${
                      sd[f]==='SI' ? 'bg-[#48BB78]/15 text-[#48BB78] border-[#48BB78]/30' :
                      sd[f]==='NA' ? 'bg-steel-800 text-steel-500 border-steel-700' :
                      'bg-transparent text-steel-600 border-steel-800'
                    }`}>{sd[f]||'NO'}</button>
                </div>
              ))}
              {/* N°FACTURA */}
              {showCierre && (
                <div className="px-1">
                  <input value={sd.nroFactura||''} onChange={e => patchSeg(item.id, {nroFactura: e.target.value})}
                    className={inp} placeholder="—" />
                </div>
              )}
              {/* OBSERVACIONES */}
              <div className="px-1">
                <input value={sd.obs||''} onChange={e => patchSeg(item.id, {obs: e.target.value})}
                  className={inp} placeholder="obs..." />
              </div>
              {/* × — sets alerta back to ENVIADO (removes from espejo) */}
              <div className="px-1 flex justify-center">
                <button onClick={() => patchSeg(item.id, { alerta: 'ENVIADO', avance: 'Pendiente' })}
                  className="p-1 text-steel-700 hover:text-steel-400"><X className="h-3 w-3" /></button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Plan 2 table (inline editable, no cierre columns) ─────────
// Columns: FECHA · N° PRESU · CLIENTE / LOCAL · TRABAJO · TÉCNICO · AVANCE · % · DÍAS · OBSERVACIONES · ×
function Plan2TableNew({ tareas, onEdit: _onEdit, onDelete, onField }: {
  tareas: Plan2Tarea[];
  onEdit: (t: Plan2Tarea) => void;
  onDelete: (id: string) => void;
  onField: (id: string, fields: Partial<Plan2Tarea>) => void;
}) {
  const inp = 'w-full rounded bg-transparent border border-steel-800 px-1 py-0.5 font-mono text-[0.6rem] text-steel-300';
  const colStyle = '122px 118px 150px minmax(170px,1fr) 118px 146px 74px 60px minmax(140px,0.8fr) 28px';
  const hdrs = ['FECHA','N° PRESU','CLIENTE / LOCAL','TRABAJO','TÉCNICO','AVANCE','%','DÍAS','OBSERVACIONES',''];
  const avanceColor: Record<string,string> = {
    'Finalizado':'#48BB78','En Proceso':'#60A5FA','En Espera / Bloqueado':'#F59E0B','Pendiente':'#6B7280',
  };

  return (
    <div className="rounded-lg border border-steel-800 overflow-x-auto" style={{backgroundColor:'#0c0e14'}}>
      <div style={{minWidth:'900px', backgroundColor:'#0c0e14'}}>
        <div style={{ display:'grid', gridTemplateColumns: colStyle, backgroundColor:'#111420' }} className="border-b border-steel-800">
          {hdrs.map(h => <div key={h} className="px-2 py-2 font-mono text-[0.6rem] font-semibold uppercase tracking-wider text-steel-500 whitespace-nowrap">{h}</div>)}
        </div>
        {tareas.length === 0 && <p className="p-6 text-center font-body text-caption text-steel-600">Sin tareas manuales</p>}
        {tareas.map(t => (
          <div key={t.id}
            className="items-center border-b border-steel-900/40 hover:bg-steel-900/20"
            style={{ display:'grid', gridTemplateColumns: colStyle }}>
            <div className="px-1">
              <input type="date" value={t.scheduledDate||''} onChange={e => onField(t.id, {scheduledDate: e.target.value})}
                className={inp} />
            </div>
            <div className="px-1">
              <input value={t.nro||''} onChange={e => onField(t.id, {nro: e.target.value})}
                className={inp} placeholder="—" />
            </div>
            <div className="px-1 min-w-0">
              <input value={t.cliente} onChange={e => onField(t.id, {cliente: e.target.value})}
                className={inp} placeholder="Cliente" />
              <input value={t.local||''} onChange={e => onField(t.id, {local: e.target.value})}
                className={inp + ' mt-0.5'} placeholder="Local" />
            </div>
            <div className="px-1">
              <input value={t.descripcion} onChange={e => onField(t.id, {descripcion: e.target.value})}
                className={inp} placeholder="Trabajo..." />
            </div>
            <div className="px-1">
              <input value={t.tecnico||''} onChange={e => onField(t.id, {tecnico: e.target.value})}
                className={inp} placeholder="—" />
            </div>
            <div className="px-1">
              <select value={t.avance||''} onChange={e => onField(t.id, {avance: e.target.value})}
                className={inp} style={{ color: avanceColor[t.avance||''] || '#6B7280' }}>
                <option value="" className="bg-[#0f1117] text-white">—</option>
                {AVANCE_OPTS.map(o => <option key={o} value={o} className="bg-[#0f1117] text-white">{o}</option>)}
              </select>
            </div>
            <div className="px-1">
              <input type="number" value={t.pct||''} onChange={e => onField(t.id, {pct: Number(e.target.value)})}
                className={inp + ' tabular-nums'} placeholder="0" />
            </div>
            <div className="px-1">
              <input type="number" value={t.dias||''} onChange={e => onField(t.id, {dias: Number(e.target.value)})}
                className={inp + ' tabular-nums'} placeholder="0" />
            </div>
            <div className="px-1">
              <input value={t.obs||''} onChange={e => onField(t.id, {obs: e.target.value})}
                className={inp} placeholder="obs..." />
            </div>
            <div className="px-1 flex justify-center">
              <button onClick={() => onDelete(t.id)} className="p-1 text-steel-700 hover:text-[#FC8181]"><X className="h-3 w-3" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Plan 2 form ───────────────────────────────────────────────
function Plan2Form({ form, setForm, onSave, onCancel }: {
  form: Partial<Plan2Tarea>; setForm: (f: Partial<Plan2Tarea>) => void;
  onSave: () => void; onCancel: () => void;
}) {
  const f = (k: keyof Plan2Tarea) => (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement>) =>
    setForm({ ...form, [k]: e.target.value });
  return (
    <div className="mt-3 card p-4 border border-blue-bright/20">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'N° Presu', key: 'nro' as const, type: 'text' },
          { label: 'Cliente', key: 'cliente' as const, type: 'text' },
          { label: 'Local', key: 'local' as const, type: 'text' },
          { label: 'Descripción', key: 'descripcion' as const, type: 'text' },
          { label: 'Técnico', key: 'tecnico' as const, type: 'text' },
          { label: 'Fecha', key: 'scheduledDate' as const, type: 'date' },
          { label: '%', key: 'pct' as const, type: 'number' },
          { label: 'Días', key: 'dias' as const, type: 'number' },
          { label: 'Obs', key: 'obs' as const, type: 'text' },
        ].map(({ label, key, type }) => (
          <div key={key}>
            <label className="block font-body text-caption text-steel-500 mb-1">{label}</label>
            <input type={type} value={(form[key] as string)||''} onChange={f(key)}
              className="w-full rounded border border-steel-800 bg-steel-950 px-2 py-1.5 font-mono text-caption text-arctic" />
          </div>
        ))}
        <div>
          <label className="block font-body text-caption text-steel-500 mb-1">Avance</label>
          <select value={form.avance||''} onChange={e => setForm({...form, avance: e.target.value})}
            className="w-full rounded border border-steel-800 bg-steel-950 px-2 py-1.5 font-mono text-caption text-arctic">
            <option value="">—</option>
            {AVANCE_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
      </div>
      <div className="mt-3 flex gap-2 justify-end">
        <button onClick={onCancel} className="btn-secondary text-xs">Cancelar</button>
        <button onClick={onSave} className="btn-primary text-xs">Guardar</button>
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
