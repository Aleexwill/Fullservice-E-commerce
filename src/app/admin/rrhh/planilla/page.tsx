'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Plus } from 'lucide-react';
import { fmtGs, periodoLabel } from '@/lib/rrhh/shared';

interface P { id: string; periodo: string; tipo: 'MENSUAL' | 'AGUINALDO'; estado: 'BORRADOR' | 'CERRADA'; recibos: number; totalHaberes: number; totalDescuentos: number; neto: number; aportePatronal: number; cerradaPor: string }

export default function PlanillasPage() {
  const [items, setItems] = useState<P[] | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const hoy = new Date();
  const [periodo, setPeriodo] = useState(`${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`);
  const [tipo, setTipo] = useState<'MENSUAL' | 'AGUINALDO'>('MENSUAL');

  const cargar = useCallback(async () => {
    try { const r = await fetch('/api/rrhh/planillas', { cache: 'no-store' }); const j = await r.json(); if (!r.ok) throw new Error(j.error ?? 'Error'); setItems(j); }
    catch (e) { setError(e instanceof Error ? e.message : 'Error'); }
  }, []);
  useEffect(() => { cargar(); }, [cargar]);

  async function crear(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError('');
    try {
      const r = await fetch('/api/rrhh/planillas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ periodo, tipo }) });
      const j = await r.json(); if (!r.ok) throw new Error(j.error ?? 'No se pudo crear');
      window.location.href = `/admin/rrhh/planilla/${j.id}`;
    } catch (er) { setError(er instanceof Error ? er.message : 'Error'); setBusy(false); }
  }

  return (
    <div className="p-4 sm:p-6">
      <h1 className="font-display text-h1 text-arctic">Planilla de sueldos</h1>
      <p className="mb-4 font-body text-body-sm text-steel-400">Liquidación mensual y aguinaldo con recibos de sueldo en PDF. La asistencia sale de la marcación y el salario, del legajo.</p>
      <div className="mb-5 flex gap-3 rounded-lg border border-orange/40 bg-orange-muted/40 p-4 text-body-sm text-orange-bright">
        <AlertTriangle className="mt-0.5 h-5 w-5 flex-none" />
        <p>Las reglas de cálculo (IPS, recargos, divisor del jornal) son valores de referencia. <Link href="/admin/rrhh/parametros" className="underline">Revisalas con contabilidad</Link> antes de liquidar sueldos reales.</p>
      </div>
      {error && <p role="alert" className="mb-3 rounded-md bg-danger-light/10 px-3 py-2 text-caption text-danger-bright">{error}</p>}

      <form onSubmit={crear} className="card mb-6 flex flex-wrap items-end gap-3 p-4">
        <div><label htmlFor="pl-tipo" className="mb-1 block text-caption text-steel-400">Tipo</label><select id="pl-tipo" value={tipo} onChange={e => setTipo(e.target.value as 'MENSUAL' | 'AGUINALDO')} className="input"><option value="MENSUAL">Sueldos del mes</option><option value="AGUINALDO">Aguinaldo</option></select></div>
        <div><label htmlFor="pl-per" className="mb-1 block text-caption text-steel-400">{tipo === 'AGUINALDO' ? 'Año' : 'Mes'}</label>
          {tipo === 'AGUINALDO'
            ? <input id="pl-per" type="number" min={2020} max={2100} value={periodo.slice(0, 4)} onChange={e => setPeriodo(`${e.target.value}-12`)} className="input w-28" />
            : <input id="pl-per" type="month" value={periodo} onChange={e => setPeriodo(e.target.value)} className="input" />}</div>
        <button disabled={busy} className="btn-primary disabled:opacity-50"><Plus className="h-4 w-4" />{busy ? 'Calculando…' : 'Crear y calcular'}</button>
      </form>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[760px] text-left font-body text-body-sm text-steel-100">
          <thead><tr className="border-b border-steel-700 text-caption text-steel-400">{['Planilla', 'Estado', 'Recibos', 'Haberes', 'Neto a pagar', 'Aporte patronal', ''].map(h => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr></thead>
          <tbody>
            {!items && <tr><td colSpan={7} className="px-4 py-6 text-steel-400">Cargando…</td></tr>}
            {items && items.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-steel-400">Todavía no hay planillas. Creá la primera con el formulario de arriba.</td></tr>}
            {items?.map(p => (
              <tr key={p.id} className="border-b border-steel-700/60">
                <td className="px-4 py-3 text-arctic">{p.tipo === 'AGUINALDO' ? `Aguinaldo ${p.periodo.slice(0, 4)}` : `Sueldos de ${periodoLabel(p.periodo)}`}</td>
                <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-caption ${p.estado === 'CERRADA' ? 'bg-success-light/20 text-success-bright' : 'bg-orange-muted text-orange-bright'}`}>{p.estado === 'CERRADA' ? 'Cerrada' : 'Borrador'}</span></td>
                <td className="px-4 py-3">{p.recibos}</td><td className="px-4 py-3">{fmtGs(p.totalHaberes)}</td><td className="px-4 py-3 font-medium text-arctic">{fmtGs(p.neto)}</td><td className="px-4 py-3 text-steel-300">{fmtGs(p.aportePatronal)}</td>
                <td className="px-4 py-3 text-right"><Link href={`/admin/rrhh/planilla/${p.id}`} className="text-blue-bright hover:underline">Abrir</Link></td>
              </tr>))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
