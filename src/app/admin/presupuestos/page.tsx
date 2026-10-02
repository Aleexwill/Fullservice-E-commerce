'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { RefreshCw, Plus, BarChart2, Archive, ClipboardList, TrendingUp, ShieldCheck } from 'lucide-react';
import { fetchJson } from '@/lib/utils';
import { imprimirPresupuesto } from '@/lib/presupuesto-pdf';
import { PresupuestoAsistente, type AsistenteResult } from '@/components/admin/presupuesto-asistente';
import type { Presupuesto } from '@/components/admin/presupuestos/types';
import { ACTIVE_STATUSES, ARCHIVE_STATUSES } from '@/components/admin/presupuestos/types';
import { ArchivoTab } from '@/components/admin/presupuestos/archivo-tab';
import { AprobacionTab } from '@/components/admin/presupuestos/aprobacion-tab';
import { PlanificacionTab } from '@/components/admin/presupuestos/planificacion-tab';
import { CreatePresupuestoModal } from '@/components/admin/presupuestos/create-modal';

type Tab = 'archivo' | 'planificacion' | 'aprobacion';

function AdminPresupuestosPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [items, setItems] = useState<Presupuesto[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('archivo');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showAsistente, setShowAsistente] = useState(false);
  const [currentRole, setCurrentRole] = useState<string>('');
  const [canAprobar, setCanAprobar] = useState(false);
  const [leadPrefill, setLeadPrefill] = useState<Record<string, string> | null>(null);
  const [aiPrefill, setAiPrefill] = useState<AsistenteResult | null>(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    fetchJson<any>('/api/presupuestos?limit=200').then((d) => {
      setItems(d?.presupuestos || []);
      setLoading(false);
    });
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Load current user role once on mount
  useEffect(() => {
    fetch('/api/auth/me').then(r => r.ok ? r.json() : null).then(d => {
      if (d) { setCurrentRole(d.role); setCanAprobar(!!d.canAprobarPresupuestos); }
    }).catch(() => {});
  }, []);

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
    try {
      const res = await fetch(`/api/presupuestos/${id}`, { method: 'DELETE' });
      if (!res.ok) { alert('No se pudo eliminar el presupuesto'); return; }
      fetchData();
    } catch { alert('Error de conexión'); }
  };

  const changeStatus = async (id: string, status: string) => {
    const prev = items.find(i => i.id === id)?.status;
    setItems(items => items.map(i => i.id === id ? { ...i, status: status as any } : i));
    try {
      const res = await fetch(`/api/presupuestos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
    } catch {
      // Revert optimistic update on failure
      if (prev !== undefined) setItems(items => items.map(i => i.id === id ? { ...i, status: prev as any } : i));
    }
  };

  // Solicitudes = llegan desde el sitio web público (source distinto de 'admin')
  // Archivo = creados desde el panel admin (source === 'admin') o con estado archivado
  const isFromAdmin = (i: Presupuesto) => i.source === 'admin' || i.source === 'importacion';
  const allActive = items.filter(i => !isFromAdmin(i) && ACTIVE_STATUSES.includes(i.status));
  const allArchive = items.filter(i => isFromAdmin(i) || ARCHIVE_STATUSES.includes(i.status));

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


  const pendingApproval = items.filter(i => i.status === 'pendiente_aprobacion');

  // Navigate to approval tab when coming from notification bell link
  useEffect(() => {
    if (searchParams.get('tab') === 'aprobacion' && canAprobar) {
      setActiveTab('aprobacion');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canAprobar]);

  const tabs: { key: Tab; label: string; icon: any; count?: number }[] = [
    { key: 'archivo',      label: 'Archivo',        icon: Archive,      count: allArchive.length },
    { key: 'planificacion',label: 'Planificación',  icon: ClipboardList },
    ...(canAprobar ? [{ key: 'aprobacion' as Tab, label: 'Aprobación', icon: ShieldCheck, count: pendingApproval.length }] : []),
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
          <button onClick={() => setShowCreate(true)} className="btn-primary"><Plus className="h-4 w-4" /> Nuevo presupuesto</button>
        </div>
      </div>

      {/* Tab nav */}
      <div className="mb-6 flex gap-1 border-b border-steel-900/50">
        <button onClick={() => router.push('/admin/presupuestos/dashboard')}
          className="flex items-center gap-1.5 px-4 py-2.5 font-body text-body-sm font-medium transition-colors border-b-2 -mb-px border-transparent text-steel-500 hover:text-steel-300">
          <BarChart2 className="h-3.5 w-3.5" />Tablero de control
        </button>
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
        <button onClick={() => router.push('/admin/presupuestos/seguimiento')}
          className="flex items-center gap-1.5 px-4 py-2.5 font-body text-body-sm font-medium transition-colors border-b-2 -mb-px border-transparent text-steel-500 hover:text-steel-300">
          <TrendingUp className="h-3.5 w-3.5" />Seguimiento 1·2·3·5·7
        </button>
        <div className="ml-auto flex items-center pb-1">
          <button onClick={fetchData} className="rounded p-1.5 text-steel-500 hover:text-arctic transition-colors"><RefreshCw className="h-3.5 w-3.5" /></button>
        </div>
      </div>

      {/* Archivo tab */}
      {activeTab === 'archivo' && (
        <ArchivoTab
          items={filteredArchivo} loading={loading}
          search={search} setSearch={setSearch}
          onOpen={(id) => router.push(`/admin/presupuestos/${id}`)}
          onDelete={del}
          onStatusChange={changeStatus}
          onSendToApproval={!canAprobar ? (id) => changeStatus(id, 'pendiente_aprobacion') : undefined}
        />
      )}

      {/* Aprobación tab */}
      {activeTab === 'aprobacion' && (
        <AprobacionTab
          items={pendingApproval} loading={loading}
          onOpen={(id) => router.push(`/admin/presupuestos/${id}`)}
          onApprove={(id) => changeStatus(id, 'aprobado')}
          onReject={(id) => changeStatus(id, 'de_baja')}
          onPrint={(item) => imprimirPresupuesto({ code: item.code, serviceTitle: item.serviceTitle, serviceType: item.serviceType, description: item.description, scheduledDate: item.scheduledDate, estimatedDuration: item.estimatedDuration, assignedTo: item.assignedTo, customer: item.customer, calculationData: item.calculationData, costosData: item.costosData ?? null, createdAt: item.createdAt })}
        />
      )}

      {/* Planificación tab */}
      {activeTab === 'planificacion' && (
        <PlanificacionTab items={items.filter(i => ['aprobado','en_ejecucion','nuevo','en_revision','enviado','pendiente_aprobacion','pendiente_relevo','falta_presupuestar'].includes(i.status))} loading={loading} onOpen={(id) => router.push(`/admin/presupuestos/${id}`)} />
      )}

      {/* Create modal */}
      {showCreate && (
        <CreatePresupuestoModal
          initialData={leadPrefill ?? undefined}
          aiResult={aiPrefill ?? undefined}
          onClose={() => { setShowCreate(false); setLeadPrefill(null); setAiPrefill(null); }}
          onCreated={async (id) => {
            setShowCreate(false);
            setLeadPrefill(null);
            setAiPrefill(null);
            fetchData();
            if (id) router.push(`/admin/presupuestos/${id}`);
          }}
        />
      )}

      {/* Asistente IA modal */}
      {showAsistente && (
        <PresupuestoAsistente
          onCerrar={() => setShowAsistente(false)}
          onUsar={(r) => {
            setAiPrefill(r);
            setShowAsistente(false);
            setShowCreate(true);
          }}
        />
      )}

      {/* FAB — Asistente IA */}
      {!showAsistente && (
        <button
          onClick={() => setShowAsistente(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-blue-600 px-4 py-3 font-body text-body-sm font-semibold text-white shadow-[0_4px_20px_rgba(37,99,235,0.5)] transition-transform hover:scale-105 hover:bg-blue-700 hover:shadow-[0_6px_24px_rgba(37,99,235,0.65)]"
          title="Asistente IA de presupuestos"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>
          </svg>
          Asistente IA
        </button>
      )}
    </div>
  );
}

export default function AdminPresupuestosPage() {
  return (
    <Suspense>
      <AdminPresupuestosPageInner />
    </Suspense>
  );
}
