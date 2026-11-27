'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { ESTADOS, ESTADO_LABEL, PRIORIDADES, PRIORIDAD_LABEL } from '@/lib/ti/etiquetas';
import { EstadoChip, PrioChip, TipoChip, fechaCorta } from '@/components/admin/ti/chips';
import { ListaAdjuntos, SelectorAdjuntos } from '@/components/admin/ti/adjuntos';
import type { Adjunto } from '@/components/admin/ti/adjuntos';

interface Det {
  id: string; numero: number; tipo: string; titulo: string; descripcion: string; modulo: string; pantalla: string; pasos: string; esperado: string; prioridad: string; estado: string;
  solicitante: string; asignadoId: string | null; asignado: string; adjuntos: Adjunto[]; navegador: string; resolucion: string; createdAt: string; esTI: boolean; esMio: boolean;
  comentarios: { id: string; autor: string; texto: string; interno: boolean; adjuntos: Adjunto[]; createdAt: string }[];
  eventos: { id: string; tipo: string; detalle: string; autor: string; createdAt: string }[];
}
const L = 'mb-1 block font-body text-caption text-steel-400';
const Dato = ({ t, v }: { t: string; v?: string }) => v ? <div><dt className="text-caption text-steel-500">{t}</dt><dd className="whitespace-pre-wrap text-body-sm text-steel-100">{v}</dd></div> : null;

export default function TicketDetalle() {
  const { id } = useParams<{ id: string }>();
  const [t, setT] = useState<Det | null>(null);
  const [err, setErr] = useState('');
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);
  const [texto, setTexto] = useState(''); const [interno, setInterno] = useState(false); const [adj, setAdj] = useState<Adjunto[]>([]);
  const [resol, setResol] = useState('');

  const cargar = useCallback(async () => {
    const r = await fetch(`/api/ti/tickets/${id}`); const j = await r.json();
    if (!r.ok) return setErr(j.error || 'Error al cargar'); setT(j); setResol(j.resolucion ?? '');
  }, [id]);
  useEffect(() => { cargar(); }, [cargar]);
  useEffect(() => { if (t?.esTI && !users.length) fetch('/api/ti/usuarios').then(r => r.json()).then(u => Array.isArray(u) && setUsers(u)).catch(() => {}); }, [t?.esTI, users.length]);

  async function patch(body: object) {
    setErr(''); const r = await fetch(`/api/ti/tickets/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({})); if (!r.ok) return setErr(j.error || 'No se pudo guardar'); cargar();
  }
  async function comentar(e: React.FormEvent) {
    e.preventDefault(); setErr('');
    const r = await fetch(`/api/ti/tickets/${id}/comentarios`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ texto, interno, adjuntos: adj }) });
    const j = await r.json().catch(() => ({})); if (!r.ok) return setErr(j.error || 'No se pudo comentar');
    setTexto(''); setInterno(false); setAdj([]); cargar();
  }

  if (err && !t) return <div className="p-6"><p role="alert" className="text-danger-bright">{err}</p><Link href="/admin/ti/tickets" className="text-blue-bright">Volver</Link></div>;
  if (!t) return <div className="p-6 text-steel-400">Cargando…</div>;
  const cerrado = t.estado === 'CERRADO' || t.estado === 'RECHAZADO';

  return (
    <div className="p-4 sm:p-6">
      <Link href="/admin/ti/tickets" className="mb-3 inline-flex items-center gap-1 text-caption text-steel-400 hover:text-arctic"><ArrowLeft className="h-3 w-3" />Tickets</Link>
      <div className="mb-4 flex flex-wrap items-center gap-2"><h1 className="font-display text-h1 text-arctic">#{t.numero} · {t.titulo}</h1></div>
      <div className="mb-5 flex flex-wrap gap-2"><TipoChip v={t.tipo} /><PrioChip v={t.prioridad} /><EstadoChip v={t.estado} /></div>
      {err && <p role="alert" className="mb-3 rounded-md bg-danger-light/10 px-3 py-2 text-caption text-danger-bright">{err}</p>}

      {t.esMio && t.estado === 'RESUELTO' && (
        <div className="mb-4 rounded-lg border border-success/40 bg-success-light/10 p-4"><p className="text-body-sm text-success-bright"><b>TI marcó este ticket como resuelto.</b> ¿Quedó bien?{t.resolucion && <span className="text-steel-100"> {t.resolucion}</span>}</p>
          <div className="mt-2 flex gap-2"><button onClick={() => patch({ estado: 'CERRADO' })} className="btn-primary">Sí, cerrar</button><button onClick={() => patch({ estado: 'EN_CURSO' })} className="btn-secondary">No, reabrir</button></div></div>)}
      {t.esMio && t.estado === 'CERRADO' && <div className="mb-4"><button onClick={() => patch({ estado: 'EN_CURSO' })} className="btn-secondary">Reabrir</button></div>}
      {t.esMio && t.estado === 'NUEVO' && <div className="mb-4"><button onClick={() => { if (confirm('¿Cancelar este ticket?')) patch({ estado: 'RECHAZADO' }); }} className="btn-ghost">Cancelar ticket</button></div>}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <section className="card p-4" aria-label="Detalle">
            <dl className="space-y-3"><Dato t="Descripción" v={t.descripcion} /><Dato t="Pasos para repetirlo" v={t.pasos} /><Dato t="Lo esperado" v={t.esperado} /><Dato t="Pantalla" v={t.pantalla} />{t.esTI && <Dato t="Navegador" v={t.navegador} />}{t.resolucion && t.estado !== 'RESUELTO' && <Dato t="Resolución" v={t.resolucion} />}</dl>
            <ListaAdjuntos items={t.adjuntos} />
          </section>
          <section className="card p-4" aria-label="Comentarios">
            <h2 className="mb-3 font-display text-h3 text-arctic">Conversación</h2>
            {t.comentarios.length === 0 && <p className="mb-3 text-body-sm text-steel-400">Todavía no hay comentarios.</p>}
            <ul className="mb-4 space-y-3">{t.comentarios.map(c => (
              <li key={c.id} className={`rounded-lg p-3 ${c.interno ? 'border border-orange-bright/40 bg-orange-muted' : 'bg-steel-900/60'}`}>
                <p className="text-caption text-steel-400"><b className="text-arctic">{c.autor}</b> · {fechaCorta(c.createdAt)}{c.interno && <span className="ml-2 text-orange-bright">Nota interna (solo TI)</span>}</p>
                <p className="mt-1 whitespace-pre-wrap text-body-sm text-steel-100">{c.texto}</p><ListaAdjuntos items={c.adjuntos} /></li>))}</ul>
            {!cerrado || t.esTI ? (
              <form onSubmit={comentar} className="space-y-2"><label htmlFor="c-t" className={L}>Agregar un comentario</label><textarea id="c-t" required rows={3} maxLength={3000} value={texto} onChange={e => setTexto(e.target.value)} className="input w-full" />
                <SelectorAdjuntos valor={adj} onChange={setAdj} />
                <div className="flex flex-wrap items-center gap-3"><button className="btn-primary">Comentar</button>{t.esTI && <label className="flex items-center gap-2 text-body-sm text-steel-100"><input type="checkbox" checked={interno} onChange={e => setInterno(e.target.checked)} className="h-4 w-4" />Nota interna (el solicitante no la ve)</label>}</div></form>
            ) : <p className="text-body-sm text-steel-400">El ticket está cerrado. Reabrilo para seguir la conversación.</p>}
          </section>
        </div>
        <div className="space-y-4">
          <section className="card p-4" aria-label="Datos">
            <dl className="space-y-3"><Dato t="Pedido por" v={t.solicitante} /><Dato t="Fecha" v={fechaCorta(t.createdAt)} /><Dato t="Módulo" v={t.modulo} />{!t.esTI && <Dato t="Asignado a" v={t.asignado || 'Sin asignar'} />}</dl>
          </section>
          {t.esTI && (
            <section className="card space-y-3 p-4" aria-label="Gestión de TI">
              <h2 className="font-display text-h3 text-arctic">Gestión</h2>
              <div><label htmlFor="g-e" className={L}>Estado</label><select id="g-e" value={t.estado} onChange={e => patch({ estado: e.target.value })} className="input w-full">{ESTADOS.map(e => <option key={e} value={e}>{ESTADO_LABEL[e]}</option>)}</select></div>
              <div><label htmlFor="g-p" className={L}>Prioridad</label><select id="g-p" value={t.prioridad} onChange={e => patch({ prioridad: e.target.value })} className="input w-full">{PRIORIDADES.map(e => <option key={e} value={e}>{PRIORIDAD_LABEL[e]}</option>)}</select></div>
              <div><label htmlFor="g-a" className={L}>Asignado a</label><select id="g-a" value={t.asignadoId ?? ''} onChange={e => patch({ asignadoId: e.target.value || null })} className="input w-full"><option value="">Sin asignar</option>{users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select></div>
              <div><label htmlFor="g-r" className={L}>Resolución (la ve el solicitante)</label><textarea id="g-r" rows={3} maxLength={3000} value={resol} onChange={e => setResol(e.target.value)} className="input w-full" /><button onClick={() => patch({ resolucion: resol })} className="btn-secondary mt-1">Guardar resolución</button></div>
            </section>)}
          <section className="card p-4" aria-label="Historial">
            <h2 className="mb-2 font-display text-h3 text-arctic">Historial</h2>
            <ol className="space-y-2 text-caption text-steel-400">{t.eventos.map(e => <li key={e.id}><span className="text-steel-500">{fechaCorta(e.createdAt)}</span> · {e.autor} · <span className="text-steel-100">{e.tipo === 'CREADO' ? 'Creó el ticket' : e.tipo === 'COMENTARIO' ? 'Comentó' : e.tipo === 'COMENTARIO_INTERNO' ? 'Nota interna' : e.detalle}</span></li>)}</ol>
          </section>
        </div>
      </div>
    </div>
  );
}
