'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Plus, Search } from 'lucide-react';
import { ESTADOS, ESTADO_LABEL, PRIORIDADES, PRIORIDAD_LABEL, TIPOS, TIPO_LABEL } from '@/lib/ti/etiquetas';
import { EstadoChip, PrioChip, TipoChip, fechaCorta } from '@/components/admin/ti/chips';

interface Item { id: string; numero: number; tipo: string; titulo: string; modulo: string; prioridad: string; estado: string; solicitante: string; asignado: string; updatedAt: string }

function Lista() {
  const sp = useSearchParams();
  const [f, setF] = useState({ estado: sp.get('estado') ?? 'abiertos', tipo: sp.get('tipo') ?? '', prioridad: sp.get('prioridad') ?? '', q: '', sinAsignar: false });
  const [items, setItems] = useState<Item[] | null>(null);
  const [esTI, setEsTI] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    const t = setTimeout(() => {
      const qs = new URLSearchParams();
      if (f.estado) qs.set('estado', f.estado); if (f.tipo) qs.set('tipo', f.tipo); if (f.prioridad) qs.set('prioridad', f.prioridad);
      if (f.q.trim()) qs.set('q', f.q.trim()); if (f.sinAsignar) qs.set('sinAsignar', '1');
      fetch(`/api/ti/tickets?${qs}`).then(async r => { const j = await r.json(); if (!r.ok) throw new Error(j.error); setItems(j.items); setEsTI(j.esTI); setErr(''); }).catch(e => setErr(e.message || 'Error al cargar'));
    }, f.q ? 300 : 0);
    return () => clearTimeout(t);
  }, [f]);

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-h1 text-arctic">Tickets de TI</h1>
          <p className="font-body text-body-sm text-steel-400">{esTI ? 'Todos los errores, correcciones y mejoras pedidos.' : 'Tus pedidos de corrección, errores y mejoras.'}</p>
        </div>
        <Link href="/admin/ti/tickets/nuevo" className="btn-primary inline-flex items-center gap-2"><Plus className="h-4 w-4" />Nuevo ticket</Link>
      </div>
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="relative"><label htmlFor="t-q" className="sr-only">Buscar</label><Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-steel-500" /><input id="t-q" value={f.q} onChange={e => setF({ ...f, q: e.target.value })} placeholder="Buscar por título o #número" className="input pl-8" /></div>
        <div><label htmlFor="t-e" className="sr-only">Estado</label><select id="t-e" value={f.estado} onChange={e => setF({ ...f, estado: e.target.value })} className="input"><option value="abiertos">Abiertos</option><option value="">Todos los estados</option>{ESTADOS.map(e => <option key={e} value={e}>{ESTADO_LABEL[e]}</option>)}</select></div>
        <div><label htmlFor="t-t" className="sr-only">Tipo</label><select id="t-t" value={f.tipo} onChange={e => setF({ ...f, tipo: e.target.value })} className="input"><option value="">Todos los tipos</option>{TIPOS.map(e => <option key={e} value={e}>{TIPO_LABEL[e]}</option>)}</select></div>
        <div><label htmlFor="t-p" className="sr-only">Prioridad</label><select id="t-p" value={f.prioridad} onChange={e => setF({ ...f, prioridad: e.target.value })} className="input"><option value="">Toda prioridad</option>{PRIORIDADES.map(e => <option key={e} value={e}>{PRIORIDAD_LABEL[e]}</option>)}</select></div>
        {esTI && <label className="flex items-center gap-2 pb-2 text-body-sm text-steel-100"><input type="checkbox" checked={f.sinAsignar} onChange={e => setF({ ...f, sinAsignar: e.target.checked })} className="h-4 w-4" />Sin asignar</label>}
      </div>
      {err && <p role="alert" className="mb-3 rounded-md bg-danger-light/10 px-3 py-2 text-caption text-danger-bright">{err}</p>}
      <div className="card overflow-x-auto">
        <table className="w-full text-left text-body-sm text-steel-100">
          <thead className="text-caption text-steel-400"><tr><th className="px-4 py-2">#</th><th className="px-4 py-2">Título</th><th className="px-4 py-2">Tipo</th><th className="px-4 py-2">Prioridad</th><th className="px-4 py-2">Estado</th>{esTI && <th className="px-4 py-2">Pedido por</th>}<th className="px-4 py-2">Asignado</th><th className="px-4 py-2">Actualizado</th></tr></thead>
          <tbody>
            {items === null && !err && <tr><td colSpan={8} className="px-4 py-6 text-steel-400">Cargando…</td></tr>}
            {items?.length === 0 && <tr><td colSpan={8} className="px-4 py-8 text-center text-steel-400">No hay tickets con esos filtros.</td></tr>}
            {items?.map(t => (
              <tr key={t.id} className="border-t border-steel-700/60 hover:bg-steel-900/40">
                <td className="px-4 py-2 text-steel-500">{t.numero}</td>
                <td className="px-4 py-2"><Link href={`/admin/ti/tickets/${t.id}`} className="text-arctic hover:text-blue-bright">{t.titulo}</Link>{t.modulo && <div className="text-caption text-steel-500">{t.modulo}</div>}</td>
                <td className="px-4 py-2"><TipoChip v={t.tipo} /></td><td className="px-4 py-2"><PrioChip v={t.prioridad} /></td><td className="px-4 py-2"><EstadoChip v={t.estado} /></td>
                {esTI && <td className="px-4 py-2">{t.solicitante}</td>}<td className="px-4 py-2 text-steel-400">{t.asignado || '—'}</td><td className="px-4 py-2 text-steel-400">{fechaCorta(t.updatedAt)}</td>
              </tr>))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function TicketsPage() { return <Suspense fallback={<div className="p-6 text-steel-400">Cargando…</div>}><Lista /></Suspense>; }
