'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, TrendingUp, Clock, AlertTriangle, DollarSign, CheckCircle2, XCircle, PauseCircle, RotateCcw } from 'lucide-react';

// ─── Seguimiento 1·2·3·5·7 ───────────────────────────────────
// Logic mirrors the TWG Full Service design file exactly.
// Data is persisted in the database via seguimientoData JSON field.

interface Presupuesto {
  id: string; code: string; serviceTitle: string; status: string;
  customer: { name: string; company: string };
  finalValue: number | null; estimatedValue: number | null;
  createdAt: string;
}

interface SegEntry {
  id: string;        // presupuesto id
  envio: string;     // ISO date when sent
  hechos: Record<string, string>; // paso n -> date done
  cerrado: '' | 'aprobado' | 'perdido' | 'pausado';
  pospuesto: number; // days added globally
}

interface SegData {
  seg: SegEntry[];
}

const PASOS = [
  { n: 1, off: 0,  label: 'Enviar el presupuesto' },
  { n: 2, off: 1,  label: 'Enviar sondeo' },
  { n: 3, off: 2,  label: 'Sondear' },
  { n: 5, off: 4,  label: 'Sondear' },
  { n: 7, off: 6,  label: 'Llamar' },
];

const iso = (d: Date) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
const deIso = (s: string) => { const p = String(s||'').split('-'); return new Date(+p[0], +p[1]-1, +p[2]); };
const sumarDias = (s: string, n: number) => { const d = deIso(s); d.setDate(d.getDate() + n); return iso(d); };
const difDias = (a: string, b: string) => Math.round((deIso(a).getTime() - deIso(b).getTime()) / 86400000);
const formatGs = (n: number) => 'Gs. ' + Math.round(n).toLocaleString('es-PY');
const fmtDate = (s: string) => { const d = deIso(s); return d.getDate() + '/' + (d.getMonth() + 1); };

function proximo(entry: SegEntry, hoy: string) {
  for (const paso of PASOS) {
    if ((entry.hechos || {})[paso.n]) continue;
    const fecha = sumarDias(entry.envio, paso.off + (entry.pospuesto || 0));
    return { paso, fecha, atraso: difDias(hoy, fecha) };
  }
  return null;
}

export default function SeguimientoPage() {
  const router = useRouter();
  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([]);
  const [seg, setSeg] = useState<SegEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [verCerrados, setVerCerrados] = useState(false);
  const [nuevoId, setNuevoId] = useState('');
  const [aviso, setAviso] = useState('');

  const hoy = iso(new Date());

  // Load presupuestos + seguimiento data
  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/presupuestos?limit=200');
      const data = await res.json();
      const items: Presupuesto[] = data?.presupuestos || [];
      setPresupuestos(items);

      // Merge seguimientoData from all entries — find first one that has it
      // In practice we store a shared seg list on the first presupuesto that has seguimientoData
      // For simplicity: store as a special "global" key via a dedicated API endpoint
      // For now load from first presupuesto that has seguimientoData populated
      let foundSeg: SegEntry[] = [];
      for (const p of items) {
        const sd = (p as any).seguimientoData;
        if (sd && Array.isArray(sd.seg) && sd.seg.length > 0) {
          foundSeg = sd.seg;
          break;
        }
      }
      setSeg(foundSeg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  // Persist seguimientoData to the DB on the first presupuesto (as shared store)
  const persistir = useCallback(async (newSeg: SegEntry[]) => {
    if (presupuestos.length === 0) return;
    setSaving(true);
    const target = presupuestos[0];
    await fetch(`/api/presupuestos/${target.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seguimientoData: { seg: newSeg } }),
    });
    setSaving(false);
  }, [presupuestos]);

  const setSeg2 = useCallback((newSeg: SegEntry[]) => {
    setSeg(newSeg);
    persistir(newSeg);
  }, [persistir]);

  const parchear = (id: string, campos: Partial<SegEntry>) => {
    const next = seg.map(s => s.id === id ? { ...s, ...campos } : s);
    setSeg2(next);
  };

  const marcar = (id: string, n: number) => {
    const entry = seg.find(x => x.id === id);
    if (!entry) return;
    const hechos = { ...(entry.hechos || {}) };
    if (hechos[n]) delete hechos[n]; else hechos[n] = iso(new Date());
    parchear(id, { hechos });
  };

  const sumar = () => {
    if (!nuevoId) return;
    if (seg.find(s => s.id === nuevoId)) { setAviso('Ya está en seguimiento.'); return; }
    const next: SegEntry = { id: nuevoId, envio: hoy, hechos: {}, cerrado: '', pospuesto: 0 };
    setSeg2([...seg, next]);
    setNuevoId('');
    showAviso('Presupuesto sumado al seguimiento.');
  };

  const showAviso = (msg: string) => { setAviso(msg); setTimeout(() => setAviso(''), 3000); };

  const usados = new Set(seg.map(x => x.id));
  const disponibles = presupuestos.filter(p => !usados.has(p.id) && !['completado','rechazado'].includes(p.status));
  const activos = seg.filter(x => !x.cerrado);

  // Pendientes panel
  const pendientes = activos.flatMap(entry => {
    const px = proximo(entry, hoy);
    if (!px || px.atraso < 0) return [];
    const p = presupuestos.find(x => x.id === entry.id);
    return [{
      entry, px,
      cliente: p?.customer.name || '—',
      obra: p?.serviceTitle || '—',
      nro: p?.code || '—',
      monto: p ? formatGs(Number(p.finalValue ?? p.estimatedValue ?? 0)) : '—',
      vencido: px.atraso > 0,
    }];
  });

  // KPIs
  const tocaHoy = pendientes.filter(p => p.px.atraso === 0).length;
  const atrasados = pendientes.filter(p => p.px.atraso > 0).length;
  const montoTotal = activos.reduce((s, e) => {
    const p = presupuestos.find(x => x.id === e.id);
    return s + Number(p?.finalValue ?? p?.estimatedValue ?? 0);
  }, 0);

  const filas = seg.filter(x => verCerrados || !x.cerrado);

  if (loading) return (
    <div className="p-8">
      <div className="space-y-3">{Array.from({length:4}).map((_,i) => <div key={i} className="card animate-pulse h-14 bg-steel-900/40" />)}</div>
    </div>
  );

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/admin/presupuestos')} className="rounded-md p-1.5 text-steel-500 hover:bg-steel-900 hover:text-arctic transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="font-display text-h1 uppercase text-arctic">Seguimiento</h1>
            <p className="mt-0.5 font-mono text-[0.65rem] uppercase tracking-widest text-steel-600">Método 1 · 2 · 3 · 5 · 7 — {new Date().toLocaleDateString('es-PY', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {saving && <span className="flex items-center gap-1 font-mono text-caption text-steel-600"><RotateCcw className="h-3 w-3 animate-spin" />Guardando…</span>}
          <button onClick={() => setVerCerrados(v => !v)} className={`btn-secondary text-sm ${verCerrados ? 'border-blue/40 text-blue-bright' : ''}`}>
            {verCerrados ? 'Ocultar cerrados' : 'Mostrar cerrados'}
          </button>
        </div>
      </div>

      {/* Aviso toast */}
      {aviso && (
        <div className="mb-4 rounded-lg border border-[#48BB78]/30 bg-[#48BB78]/10 px-4 py-2.5 font-body text-body-sm text-[#48BB78]">{aviso}</div>
      )}

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'Toca hoy',       value: tocaHoy,         icon: Clock,         color: 'text-blue-bright' },
          { label: 'Atrasados',      value: atrasados,       icon: AlertTriangle,  color: 'text-[#FC8181]' },
          { label: 'En seguimiento', value: activos.length,  icon: TrendingUp,     color: 'text-arctic' },
          { label: 'Monto en juego', value: montoTotal > 0 ? formatGs(montoTotal) : '—', icon: DollarSign, color: 'text-[#48BB78]', isString: true },
        ].map(k => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[0.6rem] uppercase tracking-widest text-steel-600">{k.label}</span>
                <Icon className={`h-4 w-4 ${k.color}`} />
              </div>
              <p className={`font-mono text-2xl font-bold ${k.color}`}>{k.value}</p>
            </div>
          );
        })}
      </div>

      {/* Pendientes panel */}
      <div className="mb-6 rounded-xl overflow-hidden bg-carbon border border-steel-900/60">
        <div className="flex items-baseline justify-between gap-3 px-5 py-4 border-b border-steel-900/60">
          <span className="font-display text-h4 text-arctic">Lo que hay que hacer hoy</span>
          <span className="font-mono text-[0.65rem] text-steel-600">{pendientes.length === 0 ? 'Todo al día' : `${pendientes.length} acción${pendientes.length !== 1 ? 'es' : ''} pendiente${pendientes.length !== 1 ? 's' : ''}`}</span>
        </div>
        {pendientes.length === 0 ? (
          <div className="px-5 py-8 text-center font-body text-body-sm text-steel-600">Nada pendiente para hoy. Todo el seguimiento está al día.</div>
        ) : (
          pendientes.map(({ entry, px, cliente, obra, nro, monto, vencido }) => (
            <div key={entry.id} className="grid grid-cols-[1fr_auto] items-center gap-4 px-5 py-3.5 border-b border-steel-900/40 last:border-0">
              <div className="flex flex-col gap-1 min-w-0">
                <span className="font-body text-body-sm font-semibold text-arctic">{cliente}</span>
                <span className="truncate font-mono text-caption text-steel-600">{nro} · {obra} · {monto}</span>
                <div>
                  <span className={`font-body text-caption font-semibold ${vencido ? 'text-[#FC8181]' : 'text-blue-bright'}`}>
                    Día {px.paso.n} — {px.paso.label}
                  </span>
                  <span className="ml-2 font-mono text-[0.6rem] text-steel-600">
                    {vencido ? `Vencido hace ${px.atraso} día${px.atraso !== 1 ? 's' : ''}` : 'Corresponde hoy'}
                  </span>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => { marcar(entry.id, px.paso.n); showAviso('Paso marcado como hecho.'); }}
                  className="rounded-lg bg-[#48BB78] px-3 py-2 font-body text-caption font-semibold text-white hover:bg-[#3da766] transition-colors">
                  Hecho
                </button>
                <button onClick={() => parchear(entry.id, { pospuesto: (entry.pospuesto || 0) + 1 })}
                  title="Posponer un día"
                  className="rounded-lg bg-steel-900 px-3 py-2 font-mono text-caption text-steel-300 hover:bg-steel-800 transition-colors">
                  +1 día
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Main table */}
      <div className="card overflow-x-auto">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-steel-900/40">
          <div>
            <h2 className="font-display text-h4 text-arctic">Presupuestos en seguimiento</h2>
            <p className="mt-0.5 font-body text-caption text-steel-600">Día 1 enviar · día 2 sondeo · día 3 sondear · día 5 sondear · día 7 llamar. Tocá cada paso para marcarlo.</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <select value={nuevoId} onChange={(e) => setNuevoId(e.target.value)}
              className="input max-w-[280px] text-sm">
              <option value="">Sumar un presupuesto al seguimiento…</option>
              {disponibles.map(p => (
                <option key={p.id} value={p.id}>{p.code} — {p.customer.name}{p.customer.company ? ` (${p.customer.company})` : ''}</option>
              ))}
            </select>
            <button onClick={sumar} disabled={!nuevoId} className="btn-primary shrink-0 disabled:opacity-40">
              <Plus className="h-4 w-4" /> Sumar
            </button>
          </div>
        </div>

        {/* Table header */}
        <div className="grid min-w-[860px] border-b border-steel-900/40 bg-carbon px-5 font-mono text-[0.6rem] uppercase tracking-widest text-steel-600"
          style={{ gridTemplateColumns: 'minmax(140px,1.4fr) minmax(0,90px) minmax(0,120px) minmax(0,100px) minmax(0,200px) minmax(0,130px) minmax(0,120px)' }}>
          {['Cliente y obra','N°','Monto','Envío','1 · 2 · 3 · 5 · 7','Próximo paso','Cierre'].map(h => (
            <div key={h} className="px-2 py-2.5 first:pl-0 last:pr-0">{h}</div>
          ))}
        </div>

        {filas.length === 0 ? (
          <div className="px-5 py-10 text-center font-body text-body-sm text-steel-600">
            Todavía no hay presupuestos en seguimiento. Sumá uno desde el selector de arriba.
          </div>
        ) : filas.map(entry => {
          const p = presupuestos.find(x => x.id === entry.id);
          const px = proximo(entry, hoy);
          const monto = p ? Number(p.finalValue ?? p.estimatedValue ?? 0) : 0;
          const alerta = !entry.cerrado && px && px.atraso > 0;

          let proxLabel = 'Ciclo completo', proxCuando = 'Sin pasos pendientes', proxColor = 'text-steel-600';
          if (entry.cerrado) {
            proxLabel = entry.cerrado === 'aprobado' ? 'Aprobado' : (entry.cerrado === 'perdido' ? 'Perdido' : 'En pausa');
            proxCuando = 'Fuera del ciclo';
            proxColor = entry.cerrado === 'aprobado' ? 'text-[#48BB78]' : 'text-steel-600';
          } else if (px) {
            proxLabel = `Día ${px.paso.n} — ${px.paso.label}`;
            proxCuando = px.atraso > 0 ? `Vencido hace ${px.atraso}d` : (px.atraso === 0 ? 'Hoy' : `El ${fmtDate(px.fecha)}`);
            proxColor = px.atraso > 0 ? 'text-[#FC8181]' : (px.atraso === 0 ? 'text-blue-bright' : 'text-arctic');
          }

          return (
            <div key={entry.id}
              className={`grid min-w-[860px] border-b border-steel-900/30 last:border-0 px-5 transition-colors ${alerta ? 'bg-red-500/5' : 'hover:bg-steel-900/20'}`}
              style={{ gridTemplateColumns: 'minmax(140px,1.4fr) minmax(0,90px) minmax(0,120px) minmax(0,100px) minmax(0,200px) minmax(0,130px) minmax(0,120px)' }}>

              {/* Cliente */}
              <div className="flex flex-col gap-0.5 py-3 pr-2 min-w-0">
                <span className="font-body text-body-sm font-semibold text-arctic truncate">{p?.customer.name || '—'}</span>
                <span className="truncate font-body text-caption text-steel-600">{p?.serviceTitle || '—'}</span>
              </div>

              {/* N° */}
              <div className="flex items-center px-2 py-3">
                <span className="font-mono text-caption text-steel-400">{p?.code || '—'}</span>
              </div>

              {/* Monto */}
              <div className="flex items-center justify-end px-2 py-3">
                <span className="font-mono text-body-sm font-semibold text-arctic whitespace-nowrap">{monto > 0 ? formatGs(monto) : '—'}</span>
              </div>

              {/* Envío date */}
              <div className="flex items-center px-2 py-3">
                <input type="date" value={entry.envio}
                  onChange={(e) => parchear(entry.id, { envio: e.target.value })}
                  className="w-full bg-transparent font-mono text-[0.65rem] text-steel-400 border border-steel-900/60 rounded-md px-1.5 py-1 focus:outline-none focus:border-blue-bright/50" />
              </div>

              {/* Steps */}
              <div className="flex items-center gap-1.5 px-2 py-3">
                {PASOS.map(paso => {
                  const hecho = !!(entry.hechos || {})[paso.n];
                  const fecha = sumarDias(entry.envio, paso.off + (entry.pospuesto || 0));
                  const d = difDias(hoy, fecha);
                  const dd = deIso(fecha);
                  let bg = '#2a2926', border = '#3a3835', color = '#6B7280';
                  if (hecho)           { bg = '#2d5c3f'; border = '#48BB78'; color = '#48BB78'; }
                  else if (entry.cerrado) { bg = '#1e1d1b'; border = '#2a2926'; color = '#4B5563'; }
                  else if (d === 0)    { bg = '#1a2f4a'; border = '#3B82F6'; color = '#3B82F6'; }
                  else if (d > 0)      { bg = '#3d1a1a'; border = '#FC8181'; color = '#FC8181'; }
                  const title = `Día ${paso.n} — ${paso.label} · ${dd.getDate()}/${dd.getMonth()+1}${hecho ? ' · cumplido' : ''}`;
                  return (
                    <button key={paso.n} onClick={() => marcar(entry.id, paso.n)} title={title}
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg font-mono text-xs font-bold transition-all hover:opacity-80"
                      style={{ background: bg, border: `1px solid ${border}`, color }}>
                      {paso.n}
                    </button>
                  );
                })}
              </div>

              {/* Próximo */}
              <div className="flex flex-col justify-center gap-0.5 px-2 py-3">
                <span className={`font-body text-caption font-semibold ${proxColor}`}>{proxLabel}</span>
                <span className="font-mono text-[0.6rem] text-steel-700">{proxCuando}</span>
              </div>

              {/* Cierre */}
              <div className="flex items-center gap-1.5 py-3 pl-2">
                <select value={entry.cerrado}
                  onChange={(e) => parchear(entry.id, { cerrado: e.target.value as SegEntry['cerrado'] })}
                  className="flex-1 min-w-0 bg-carbon border border-steel-900/60 rounded-md px-2 py-1 font-body text-caption text-steel-300 focus:outline-none focus:border-blue-bright/50">
                  <option value="">Abierto</option>
                  <option value="aprobado">Aprobado</option>
                  <option value="perdido">Perdido</option>
                  <option value="pausado">En pausa</option>
                </select>
                <button onClick={() => { const next = seg.filter(s => s.id !== entry.id); setSeg2(next); }}
                  title="Quitar del seguimiento"
                  className="shrink-0 h-6 w-6 flex items-center justify-center rounded text-steel-700 hover:bg-red-500/20 hover:text-red-400 transition-colors text-lg leading-none">
                  ×
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap gap-6 rounded-lg border border-steel-900/40 bg-carbon px-5 py-4 font-body text-caption text-steel-500">
        <div className="flex-1 min-w-[220px]"><span className="font-semibold text-steel-300">Cómo se cuenta.</span> El día 1 es cuando enviás el presupuesto. Los demás pasos se calculan automáticamente.</div>
        <div className="flex-1 min-w-[220px]"><span className="font-semibold text-steel-300">Colores.</span> <span className="text-[#48BB78]">Verde</span>: cumplido. <span className="text-blue-bright">Azul</span>: toca hoy. <span className="text-[#FC8181]">Rojo</span>: vencido. Gris: todavía no corresponde.</div>
        <div className="flex-1 min-w-[220px]"><span className="font-semibold text-steel-300">Persistencia.</span> Los datos se guardan automáticamente en la base de datos.</div>
      </div>
    </div>
  );
}
