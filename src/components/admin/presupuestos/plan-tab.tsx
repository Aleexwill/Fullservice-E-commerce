'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import type { Presupuesto, SeguimientoData } from './types';
import { ciclo, AVANCE_OPTS, type Plan2Tarea, PLAN2_KEY } from './tablero-helpers';

// ─── Plan 1 table (espejo aprobados) ──────────────────────────
export function TableroPlantab({ items, getSD, patchSeg, showCierre }: {
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
    <div className="rounded-lg border border-steel-800 overflow-x-auto theme-table-bg">
      <div className="theme-table-bg" style={{minWidth:minW}}>
        <div style={{ display:'grid', gridTemplateColumns: colStyle }} className="border-b border-steel-800 theme-table-head">
          {hdrs.map(h => <div key={h} className="px-2 py-2 font-mono text-[0.6rem] font-semibold uppercase tracking-wider text-steel-500 whitespace-nowrap">{h}</div>)}
        </div>
        {items.length === 0 && <p className="p-6 text-center font-body text-caption text-steel-500">Sin items para el período</p>}
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
                {sd.local && <p className="font-mono text-[0.55rem] text-steel-500 truncate">{sd.local}</p>}
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
                  <option value="">—</option>
                  {AVANCE_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
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
                      sd[f]==='SI' ? 'bg-success-bright/15 text-success-bright border-success-bright/30' :
                      sd[f]==='NA' ? 'bg-steel-800 text-steel-500 border-steel-700' :
                      'bg-transparent text-steel-500 border-steel-800'
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
                  className="p-1 text-steel-500 hover:text-steel-400"><X className="h-3 w-3" /></button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Plan 2 table (inline editable, no cierre columns) ─────────
export function Plan2TableNew({ tareas, onEdit: _onEdit, onDelete, onField }: {
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
    <div className="rounded-lg border border-steel-800 overflow-x-auto theme-table-bg">
      <div className="theme-table-bg" style={{minWidth:'900px'}}>
        <div style={{ display:'grid', gridTemplateColumns: colStyle }} className="border-b border-steel-800 theme-table-head">
          {hdrs.map(h => <div key={h} className="px-2 py-2 font-mono text-[0.6rem] font-semibold uppercase tracking-wider text-steel-500 whitespace-nowrap">{h}</div>)}
        </div>
        {tareas.length === 0 && <p className="p-6 text-center font-body text-caption text-steel-500">Sin tareas manuales</p>}
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
                <option value="">—</option>
                {AVANCE_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
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
              <button onClick={() => onDelete(t.id)} className="p-1 text-steel-500 hover:text-danger-bright"><X className="h-3 w-3" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Plan 2 form ───────────────────────────────────────────────
export function Plan2Form({ form, setForm, onSave, onCancel }: {
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

export { PLAN2_KEY };
