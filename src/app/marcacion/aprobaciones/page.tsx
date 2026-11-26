/* eslint-disable @next/next/no-img-element */
'use client';

import { useCallback, useEffect, useState } from 'react';
import { MarcacionHeader } from '@/components/marcacion/header';
import { api, hora } from '@/lib/marcacion/client';
import { EPP_ITEMS, MOTIVOS_RECHAZO, formatDist } from '@/lib/marcacion/shared';
import type { EppDTO, EppMap } from '@/lib/marcacion/shared';

type Item = EppDTO & { trabajador: string; sitio: string; otRef: string; llegada: string | null; distanciaM: number | null; revisadoAt: string | null };
interface Cola { pendientes: Item[]; revisadas: Item[] }

export default function AprobacionesPage() {
  const [cola, setCola] = useState<Cola | null>(null);
  const [error, setError] = useState('');
  const [rev, setRev] = useState<EppMap>({});
  const [motivo, setMotivo] = useState('');
  const [busy, setBusy] = useState(false);

  const cargar = useCallback(async () => {
    try { setCola(await api<Cola>('/api/marcacion/aprobaciones')); setError(''); }
    catch (e) { setError(e instanceof Error ? e.message : 'Error'); }
  }, []);

  useEffect(() => {
    cargar();
    const t = setInterval(cargar, 10000);
    return () => clearInterval(t);
  }, [cargar]);

  const actual = cola?.pendientes[0] ?? null;

  // Al cambiar de solicitud, la revisión parte de lo que declaró el trabajador
  useEffect(() => { setRev(actual ? { ...actual.declarado } : {}); setMotivo(''); }, [actual?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const faltan = EPP_ITEMS.filter(i => !rev[i.key]);

  async function resolver(accion: 'aprobar' | 'rechazar') {
    if (!actual) return;
    setBusy(true); setError('');
    try {
      await api(`/api/marcacion/aprobaciones/${actual.id}`, { method: 'POST', body: JSON.stringify({ accion, revisado: rev, motivo }) });
      await cargar();
    } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo resolver'); await cargar(); }
    finally { setBusy(false); }
  }

  return (
    <div className="mc-root mc-dark" style={{ minHeight: '100dvh' }}>
      <div className="mc-app">
        <MarcacionHeader titulo="Aprobación de equipo" chip={{ texto: cola?.pendientes.length ? `${cola.pendientes.length} pendiente${cola.pendientes.length > 1 ? 's' : ''}` : 'Al día', tono: cola?.pendientes.length ? 'o' : 'g' }} />
        <div className="mc-main">
          {error && <div className="mc-err" role="alert">{error}</div>}
          {!cola ? <p className="mc-mut">Cargando…</p> : actual ? (<>
            <h1 className="mc-h">Revisar equipo</h1>
            <div className="mc-card">
              <div className="mc-row"><b>{actual.trabajador}</b><span className="mc-chip o">Pendiente</span></div>
              <span className="mc-mut">{actual.sitio}{actual.otRef ? ` · ${actual.otRef}` : ''}{actual.llegada ? ` · llegó ${hora(actual.llegada)}` : ''}{actual.distanciaM !== null ? ` · a ${formatDist(actual.distanciaM)} del punto` : ''}</span>
            </div>
            <div className="mc-photo f">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={actual.fotoUrl} alt={`Foto del equipo de ${actual.trabajador}`} /></div>
            <p className="mc-mut" style={{ margin: '10px 0 2px' }}>Marcá lo que ves en la foto</p>
            {EPP_ITEMS.map(it => (
              <label key={it.key} className="mc-chk">
                <input type="checkbox" checked={!!rev[it.key]} onChange={e => setRev(r => ({ ...r, [it.key]: e.target.checked }))} />
                {it.label}{actual.declarado[it.key] ? '' : <span className="mc-mut"> · no declarado</span>}
              </label>
            ))}
            {faltan.length > 0 && (<>
              <p className="mc-mut" style={{ margin: '6px 0' }}>Motivo del rechazo</p>
              <div className="mc-why">{MOTIVOS_RECHAZO.map(w => <button key={w} aria-pressed={motivo === w} onClick={() => setMotivo(motivo === w ? '' : w)}>{w}</button>)}</div>
            </>)}
            <div className="mc-two" style={{ marginTop: 12 }}>
              <button className="mc-btn bad sm" disabled={busy} onClick={() => resolver('rechazar')}>Rechazar</button>
              <button className="mc-btn ok sm" disabled={busy || faltan.length > 0} onClick={() => resolver('aprobar')}>Aprobar</button>
            </div>
            {cola.pendientes.length > 1 && <p className="mc-mut">Después de esta hay {cola.pendientes.length - 1} más en espera.</p>}
          </>) : (
            <div className="mc-empty"><h1 className="mc-h">Solicitudes</h1>No hay fotos pendientes.<br />Cuando un trabajador llegue al lugar, aparecerá acá.</div>
          )}
          <h2 className="mc-h4">Revisadas hoy</h2>
          {cola && cola.revisadas.length === 0 && <p className="mc-mut">Todavía no hay revisiones hoy.</p>}
          <ul className="mc-log">
            {cola?.revisadas.map(x => (
              <li key={x.id}><span className="mc-mono">{x.revisadoAt ? hora(x.revisadoAt) : ''}</span>
                <div>{x.trabajador} <span className={`mc-chip ${x.estado === 'APROBADA' ? 'g' : 'r'}`} style={{ marginLeft: 4 }}>{x.estado === 'APROBADA' ? 'Aprobada' : 'Rechazada'}</span>
                  {x.motivo && <span className="s">{x.motivo}</span>}<span className="s">{x.sitio}{x.revisorName ? ` · ${x.revisorName}` : ''}</span></div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
