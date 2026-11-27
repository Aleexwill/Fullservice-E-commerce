'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MODULOS, PRIORIDADES, PRIORIDAD_LABEL, TIPOS, TIPO_LABEL } from '@/lib/ti/etiquetas';
import { SelectorAdjuntos } from '@/components/admin/ti/adjuntos';
import type { Adjunto } from '@/components/admin/ti/adjuntos';

const L = 'mb-1 block font-body text-caption text-steel-400';
const AYUDA: Record<string, string> = {
  ERROR: 'Algo no funciona o da un resultado equivocado. Contá qué hiciste, qué pasó y qué esperabas que pasara.',
  CORRECCION: 'Un dato, texto o cálculo que está mal y hay que corregir.',
  MEJORA: 'Una función nueva o un cambio que haría el trabajo más fácil.',
};

function Form() {
  const r = useRouter();
  const sp = useSearchParams();
  const [d, setD] = useState({ tipo: 'ERROR', titulo: '', descripcion: '', modulo: '', pantalla: sp.get('desde') ?? '', pasos: '', esperado: '', prioridad: 'MEDIA' });
  const [adj, setAdj] = useState<Adjunto[]>([]);
  const [err, setErr] = useState('');
  const [enviando, setEnviando] = useState(false);
  const set = (k: string, v: string) => setD(x => ({ ...x, [k]: v }));
  const esError = d.tipo === 'ERROR';

  async function enviar(e: React.FormEvent) {
    e.preventDefault(); setErr(''); setEnviando(true);
    const res = await fetch('/api/ti/tickets', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...d, adjuntos: adj, navegador: navigator.userAgent.slice(0, 280) }) });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) { setErr(j.error || 'No se pudo crear el ticket'); setEnviando(false); return; }
    r.push(`/admin/ti/tickets/${j.id}`);
  }

  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-6">
      <h1 className="font-display text-h1 text-arctic">Nuevo ticket</h1>
      <p className="mb-5 font-body text-body-sm text-steel-400">Reportá un error, pedí una corrección o proponé una mejora. TI recibe un aviso.</p>
      <form onSubmit={enviar} className="card space-y-4 p-4 sm:p-5">
        <fieldset><legend className={L}>¿Qué querés pedir?</legend>
          <div className="flex flex-wrap gap-2">{TIPOS.map(t => <label key={t} className={`cursor-pointer rounded-lg border px-3 py-2 text-body-sm ${d.tipo === t ? 'border-blue-bright bg-blue-muted text-blue-bright' : 'border-steel-700 text-steel-100'}`}><input type="radio" name="tipo" value={t} checked={d.tipo === t} onChange={() => set('tipo', t)} className="sr-only" />{TIPO_LABEL[t]}</label>)}</div>
          <p className="mt-1 text-caption text-steel-500">{AYUDA[d.tipo]}</p></fieldset>
        <div><label htmlFor="n-titulo" className={L}>Título</label><input id="n-titulo" required minLength={5} maxLength={140} value={d.titulo} onChange={e => set('titulo', e.target.value)} className="input w-full" placeholder="Resumen en una línea" /></div>
        <div><label htmlFor="n-desc" className={L}>{d.tipo === 'MEJORA' ? '¿Qué necesitás y para qué?' : '¿Qué pasa?'}</label><textarea id="n-desc" required minLength={10} maxLength={5000} rows={5} value={d.descripcion} onChange={e => set('descripcion', e.target.value)} className="input w-full" /></div>
        {esError && <>
          <div><label htmlFor="n-pasos" className={L}>Pasos para repetirlo (opcional)</label><textarea id="n-pasos" rows={3} maxLength={3000} value={d.pasos} onChange={e => set('pasos', e.target.value)} className="input w-full" placeholder="1. Entré a… 2. Hice clic en… 3. Apareció…" /></div>
          <div><label htmlFor="n-esp" className={L}>¿Qué esperabas que pasara? (opcional)</label><input id="n-esp" maxLength={2000} value={d.esperado} onChange={e => set('esperado', e.target.value)} className="input w-full" /></div></>}
        <div className="grid gap-4 sm:grid-cols-3">
          <div><label htmlFor="n-mod" className={L}>Módulo</label><select id="n-mod" value={d.modulo} onChange={e => set('modulo', e.target.value)} className="input w-full"><option value="">—</option>{MODULOS.map(m => <option key={m}>{m}</option>)}</select></div>
          <div><label htmlFor="n-pri" className={L}>Urgencia</label><select id="n-pri" value={d.prioridad} onChange={e => set('prioridad', e.target.value)} className="input w-full">{PRIORIDADES.map(p => <option key={p} value={p}>{PRIORIDAD_LABEL[p]}</option>)}</select></div>
          <div><label htmlFor="n-pan" className={L}>Pantalla</label><input id="n-pan" maxLength={300} value={d.pantalla} onChange={e => set('pantalla', e.target.value)} className="input w-full" /></div>
        </div>
        <SelectorAdjuntos valor={adj} onChange={setAdj} />
        {err && <p role="alert" className="rounded-md bg-danger-light/10 px-3 py-2 text-caption text-danger-bright">{err}</p>}
        <div className="flex gap-2"><button disabled={enviando} className="btn-primary">{enviando ? 'Enviando…' : 'Enviar ticket'}</button><button type="button" onClick={() => r.back()} className="btn-ghost">Cancelar</button></div>
      </form>
    </div>
  );
}

export default function NuevoTicket() { return <Suspense fallback={<div className="p-6 text-steel-400">Cargando…</div>}><Form /></Suspense>; }
