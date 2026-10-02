'use client';

import { X } from 'lucide-react';
import type { Presupuesto, SeguimientoData } from './types';
import { estadoDe, setEstadoFields, flagColor, N, money, ALERTA_OPTS, ESTADO_OPTS, PRIORIDAD_SEG_OPTS } from './tablero-helpers';

export function TableroPresupuestosTable({ items, arrastres, getSD, patchSeg, onDelete }: {
  items: Presupuesto[]; arrastres: Presupuesto[];
  getSD: (i: Presupuesto) => SeguimientoData;
  patchSeg: (id: string, fields: Partial<SeguimientoData>) => void;
  onDelete?: (id: string) => void;
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
            {ALERTA_OPTS.map(o => <option key={o} value={o}>{o || '—'}</option>)}
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
                'FALTA VISTO BUENO':'#FB923C','EN PRESUPUESTO':'#F97316','PENDIENTE RELEVO':'#A78BFA','DE BAJA':'#FC8181',
              };
              return c[estado] || '#6B7280';
            })() }}>
            {ESTADO_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        {/* PRIORIDAD */}
        <div className="px-1">
          <select value={sd.prioridad||''} onChange={e => patchSeg(item.id, {prioridad: e.target.value})}
            className={inputCls}>
            {PRIORIDAD_SEG_OPTS.map(o => <option key={o} value={o}>{o||'—'}</option>)}
          </select>
        </div>
        {/* TÉCNICO */}
        <div className="px-1">
          <input value={sd.tecnico||''} onChange={e => patchSeg(item.id, {tecnico: e.target.value})}
            className={inputCls} placeholder="—" />
        </div>
        {/* × */}
        <div className="px-1 flex justify-center">
          <button onClick={() => onDelete?.(item.id)} className="p-1 text-steel-500 hover:text-danger-bright" title="Eliminar"><X className="h-3 w-3" /></button>
        </div>
      </div>
    );
  };

  return (
    <div className="rounded-lg border border-steel-800 overflow-x-auto theme-table-bg">
      <div className="theme-table-bg" style={{minWidth:'1560px'}}>
        {/* Header */}
        <div style={{ display:'grid', gridTemplateColumns: colStyle }}
          className="border-b border-steel-800 theme-table-head">
          {hdrs.map(h => <div key={h} className="px-2 py-2 font-mono text-[0.6rem] font-semibold uppercase tracking-wider text-steel-500 whitespace-nowrap">{h}</div>)}
        </div>
        {items.length === 0 && arrastres.length === 0 && (
          <p className="p-6 text-center font-body text-caption text-steel-500">Sin presupuestos para este mes</p>
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
