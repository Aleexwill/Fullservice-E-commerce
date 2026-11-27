'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { fmtFecha } from '@/lib/rrhh/shared';

interface V { id: string; origen: 'DOCUMENTO' | 'EPP' | 'CAPACITACION'; funcionarioId: string; funcionario: string; detalle: string; vence: string; estado: 'VENCIDO' | 'POR_VENCER' }
const ORIGEN = { DOCUMENTO: 'Documento', EPP: 'EPP', CAPACITACION: 'Capacitación' };

export default function VencimientosPage() {
  const [items, setItems] = useState<V[] | null>(null);
  const [dias, setDias] = useState(30);
  const [filtro, setFiltro] = useState<'TODOS' | V['origen']>('TODOS');
  const [error, setError] = useState('');
  useEffect(() => { fetch('/api/rrhh/vencimientos', { cache: 'no-store' }).then(async r => { const j = await r.json(); if (!r.ok) throw new Error(j.error ?? 'Error'); setItems(j.items); setDias(j.alertaDias); }).catch(e => setError(e.message)); }, []);
  const vis = (items ?? []).filter(i => filtro === 'TODOS' || i.origen === filtro);
  return (
    <div className="p-4 sm:p-6">
      <h1 className="font-display text-h1 text-arctic">Vencimientos</h1>
      <p className="mb-4 font-body text-body-sm text-steel-400">Documentos, EPP por reponer y capacitaciones vencidos o que vencen en los próximos {dias} días. Los días de aviso se cambian en Parámetros RRHH.</p>
      <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Filtrar por tipo">
        {(['TODOS', 'DOCUMENTO', 'EPP', 'CAPACITACION'] as const).map(f => (
          <button key={f} aria-pressed={filtro === f} onClick={() => setFiltro(f)} className={`min-h-9 rounded-full border px-3 text-body-sm ${filtro === f ? 'border-blue bg-blue-muted text-blue-bright' : 'border-steel-700 text-steel-300'}`}>{f === 'TODOS' ? 'Todos' : ORIGEN[f]}</button>
        ))}
      </div>
      {error && <p role="alert" className="mb-3 text-danger-bright">{error}</p>}
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[640px] text-left font-body text-body-sm text-steel-100">
          <thead><tr className="border-b border-steel-700 text-caption text-steel-400">{['Funcionario', 'Tipo', 'Detalle', 'Vence', 'Estado'].map(h => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr></thead>
          <tbody>
            {!items && <tr><td colSpan={5} className="px-4 py-6 text-steel-400">Cargando…</td></tr>}
            {items && vis.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-steel-400">No hay vencimientos pendientes.</td></tr>}
            {vis.map(v => (
              <tr key={v.origen + v.id} className="border-b border-steel-700/60">
                <td className="px-4 py-3"><Link href={`/admin/funcionarios/${v.funcionarioId}`} className="text-arctic hover:underline">{v.funcionario}</Link></td>
                <td className="px-4 py-3 text-steel-300">{ORIGEN[v.origen]}</td><td className="px-4 py-3 text-steel-300">{v.detalle}</td>
                <td className="px-4 py-3 text-steel-100">{fmtFecha(v.vence)}</td>
                <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-caption ${v.estado === 'VENCIDO' ? 'bg-danger-light/20 text-danger-bright' : 'bg-orange-muted text-orange-bright'}`}>{v.estado === 'VENCIDO' ? 'Vencido' : 'Por vencer'}</span></td>
              </tr>))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
