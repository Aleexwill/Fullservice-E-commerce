/* eslint-disable @next/next/no-img-element */
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FaceCapture } from '@/components/marcacion/face-capture';
import { MarcacionHeader } from '@/components/marcacion/header';
import { api, comprimirImagen, hora, obtenerPosicion, seguirPosicion } from '@/lib/marcacion/client';
import type { Posicion } from '@/lib/marcacion/client';
import {
  EPP_ITEMS, ESTADO_LABEL, MARCAS_FLUJO, MARCA_ACTUAL, TIPO_LABEL, formatDist, haversineM,
} from '@/lib/marcacion/shared';
import type { EppMap, EstadoResponse, JornadaDTO, SitioDTO, TipoMarca } from '@/lib/marcacion/shared';

export default function MarcacionPage() {
  const [data, setData] = useState<EstadoResponse | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [face, setFace] = useState<TipoMarca | null>(null);
  const [pos, setPos] = useState<Posicion | null>(null);
  const [posErr, setPosErr] = useState('');
  const [sitioId, setSitioId] = useState('');
  const [otRef, setOtRef] = useState('');
  const [foto, setFoto] = useState<string | null>(null);
  const [decl, setDecl] = useState<EppMap>({});
  const cargando = useRef(false);

  const cargar = useCallback(async () => {
    if (cargando.current) return;
    cargando.current = true;
    try { setData(await api<EstadoResponse>('/api/marcacion/estado')); setError(''); }
    catch (e) { setError(e instanceof Error ? e.message : 'Error'); }
    finally { cargando.current = false; }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const j = data?.jornada ?? null;
  const estado = j?.estado ?? 'FUERA';
  const epp = j?.epp ?? null;
  const esperando = estado === 'EN_LUGAR' && epp?.estado === 'PENDIENTE';

  // Mientras se espera al encargado, consulta cada 6 s y al volver a la app
  useEffect(() => {
    if (!esperando) return;
    const t = setInterval(cargar, 6000);
    const v = () => document.visibilityState === 'visible' && cargar();
    document.addEventListener('visibilitychange', v);
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', v); };
  }, [esperando, cargar]);

  // GPS en vivo durante los traslados
  const viajando = estado === 'EN_TRASLADO_IDA' || estado === 'EN_TRASLADO_VUELTA';
  useEffect(() => {
    if (!viajando) { setPos(null); setPosErr(''); return; }
    return seguirPosicion(p => { setPos(p); setPosErr(''); }, setPosErr);
  }, [viajando]);

  const meta: SitioDTO | null = estado === 'EN_TRASLADO_IDA' ? data?.destino ?? null : data?.oficina ?? null;
  const dist = useMemo(() => (pos && meta ? haversineM(pos, meta) : null), [pos, meta]);
  const dentro = dist !== null && meta !== null && dist <= meta.radioM;

  async function marcar(tipo: TipoMarca, extra: Record<string, unknown> = {}, fotoRostro?: string) {
    setBusy(true); setError('');
    try {
      // En traslado ya hay un GPS en vivo reciente: se reutiliza en vez de pedir otro fix
      const p = viajando && pos && Date.now() - pos.t < 15000 ? pos : await obtenerPosicion();
      const r = await api<{ jornada: JornadaDTO }>('/api/marcacion/marcas', {
        method: 'POST', body: JSON.stringify({ tipo, lat: p.lat, lng: p.lng, precisionM: p.precisionM, foto: fotoRostro, ...extra }),
      });
      setData(d => d && { ...d, jornada: r.jornada });
      await cargar();
    } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo marcar'); }
    finally { setBusy(false); }
  }

  async function elegirFoto(f: File | undefined) {
    if (!f) return;
    try { setFoto(await comprimirImagen(f)); setError(''); } catch { setError('No se pudo leer la foto'); }
  }

  async function enviarEpp() {
    setBusy(true); setError('');
    try {
      await api('/api/marcacion/epp', { method: 'POST', body: JSON.stringify({ foto, declarado: decl }) });
      setFoto(null); setDecl({});
      await cargar();
    } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo enviar'); }
    finally { setBusy(false); }
  }

  if (!data) {
    return <div className="mc-app"><div className="mc-main"><p className="mc-mut" style={{ marginTop: 40 }}>{error || 'Cargando jornada…'}</p></div></div>;
  }

  const m = MARCA_ACTUAL[estado];
  const sinOficina = !data.oficina;
  const chipTono = estado === 'CERRADA' ? 'g' : estado === 'EN_LUGAR' ? 'o' : 'b';

  // --- Contenido central según el estado ---
  let cuerpo: React.ReactNode;
  let boton: React.ReactNode;

  if (estado === 'FUERA') {
    cuerpo = (<>
      <h1 className="mc-h">Buen día, {data.user.name.split(' ')[0]}</h1>
      <p className="mc-mut">Para marcar tu ingreso se toma tu rostro y se verifica que estés en {data.oficina?.nombre ?? 'la oficina'}.</p>
      {sinOficina && <div className="mc-err">No hay una oficina configurada. Pedile al administrador que la cargue en Sitios.</div>}
    </>);
    boton = <button className="mc-btn" disabled={busy || sinOficina} onClick={() => setFace('INGRESO')}>Marcar ingreso con rostro</button>;
  } else if (estado === 'EN_OFICINA') {
    cuerpo = (<>
      <h1 className="mc-h">Ingreso marcado</h1>
      <p className="mc-mut">Elegí a dónde vas. El traslado se registra solo con GPS, sin rostro.</p>
      <div className="mc-field"><label htmlFor="sitio">Lugar de trabajo</label>
        <select id="sitio" className="mc-input" value={sitioId} onChange={e => setSitioId(e.target.value)}>
          <option value="">Elegí un lugar…</option>
          {data.sitios.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
        </select>
        {data.sitios.length === 0 && <p className="mc-mut" style={{ marginTop: 6 }}>No hay lugares cargados. Un administrador puede agregarlos en Sitios.</p>}
      </div>
      <div className="mc-field"><label htmlFor="ot">Orden de trabajo (opcional)</label>
        <input id="ot" className="mc-input" maxLength={60} value={otRef} onChange={e => setOtRef(e.target.value)} placeholder="Ej: OT-2184" />
      </div>
    </>);
    boton = <button className="mc-btn" disabled={busy || !sitioId} onClick={() => marcar('TRASLADO_IDA', { sitioId, otRef })}>Iniciar traslado</button>;
  } else if (viajando) {
    const ida = estado === 'EN_TRASLADO_IDA';
    const pct = dist !== null && meta ? Math.max(4, Math.min(100, 100 - (dist / Math.max(dist, 6000)) * 100)) : 4;
    cuerpo = (<>
      <h1 className="mc-h">{ida ? `En camino a ${j?.sitioNombre}` : 'Regresando a la oficina'}</h1>
      <div className="mc-stats">
        <div><b>{dist !== null ? formatDist(dist) : '—'}</b><span>Distancia a {meta?.nombre ?? 'destino'}</span></div>
        <div><b>{dist !== null ? `${Math.max(1, Math.ceil(dist / 580))} min` : '—'}</b><span>Tiempo estimado</span></div>
      </div>
      <div className="mc-bar-prog" aria-hidden="true"><i style={{ width: `${dentro ? 100 : pct}%` }} /></div>
      <div className={`mc-geo ${posErr ? 'off' : ''}`}><i />{posErr || (pos ? `GPS activo · ±${Math.round(pos.precisionM)} m` : 'Buscando señal GPS…')}</div>
      {dentro && <div className="mc-card"><h4>Ya estás en el radio</h4><span className="mc-mut">Confirmá tu llegada.</span></div>}
    </>);
    boton = (
      <button className="mc-btn" disabled={busy || !dentro} onClick={() => marcar(ida ? 'LLEGADA_LUGAR' : 'LLEGADA_OFICINA')}>
        {dentro ? (ida ? 'Llegué al lugar' : 'Llegué a la oficina') : `Acercate a ${meta?.radioM ?? 100} m${dist !== null ? ` · faltan ${formatDist(dist)}` : ''}`}
      </button>
    );
  } else if (estado === 'EN_LUGAR') {
    const c1 = epp?.estado === 'PENDIENTE' ? 'd' : epp?.estado === 'RECHAZADA' ? 'x' : 'c';
    const c2 = esperando ? 'c' : '';
    cuerpo = (<>
      <h1 className="mc-h">Verificá tu equipo</h1>
      <ol className="mc-steps">
        <li className="d"><b className="n">✓</b><div>Llegada confirmada<span>{j?.sitioNombre}</span></div></li>
        <li className={c1}><b className="n">{c1 === 'd' ? '✓' : c1 === 'x' ? '✕' : '2'}</b><div>Foto del equipo de seguridad<span>Cuerpo completo, de frente</span></div></li>
        <li className={c2}><b className="n">3</b><div>Aprobación del encargado<span>Sin aprobación no se inicia el trabajo</span></div></li>
      </ol>
      {esperando ? (
        <div className="mc-wait"><div className="mc-ring" /><b>Esperando al encargado</b><span className="mc-mut">Se actualiza solo cuando revise tu foto.</span></div>
      ) : (<>
        {epp?.estado === 'RECHAZADA' && <div className="mc-err"><b>Foto rechazada{epp.revisorName ? ` por ${epp.revisorName}` : ''}:</b> {epp.motivo}. Corregí y volvé a enviarla.</div>}
        <div className={`mc-photo ${foto ? 'f' : ''}`}>
          {foto /* eslint-disable-next-line @next/next/no-img-element */ ? <img src={foto} alt="Tu foto del equipo de seguridad" /> : <span>Mostrá casco, chaleco, botas, guantes y lentes</span>}
        </div>
        <div className="mc-two" style={{ gridTemplateColumns: '1fr' }}>
          <label className="mc-pick">{foto ? 'Tomar otra foto' : 'Tomar foto'}
            <input type="file" accept="image/*" capture="environment" onChange={e => elegirFoto(e.target.files?.[0])} />
          </label>
        </div>
        <p className="mc-mut" style={{ marginTop: 6 }}>Marcá lo que llevás puesto</p>
        {EPP_ITEMS.map(it => (
          <label key={it.key} className="mc-chk"><input type="checkbox" checked={!!decl[it.key]} onChange={e => setDecl(d => ({ ...d, [it.key]: e.target.checked }))} />{it.label}</label>
        ))}
      </>)}
    </>);
    boton = esperando
      ? <button className="mc-btn" disabled>Esperando al encargado…</button>
      : <button className="mc-btn or" disabled={busy || !foto} onClick={enviarEpp}>Enviar a aprobación</button>;
  } else if (estado === 'TRABAJANDO') {
    cuerpo = (<>
      <h1 className="mc-h">Trabajando en el lugar</h1>
      <p className="mc-mut">{j?.sitioNombre}{j?.otRef ? ` · ${j.otRef}` : ''}</p>
      <div className="mc-card"><h4>Equipo aprobado</h4><span className="mc-mut">Aprobado por {epp?.revisorName || 'el encargado'}.</span></div>
      <p className="mc-mut">Al terminar, marcá la salida del lugar para empezar el regreso.</p>
    </>);
    boton = <button className="mc-btn" disabled={busy} onClick={() => marcar('SALIDA_LUGAR')}>Salir del lugar</button>;
  } else if (estado === 'EN_OFICINA_FIN') {
    cuerpo = (<>
      <h1 className="mc-h">Llegaste a la oficina</h1>
      <p className="mc-mut">Falta cerrar la jornada con tu rostro.</p>
    </>);
    boton = <button className="mc-btn" disabled={busy} onClick={() => setFace('SALIDA')}>Marcar salida con rostro</button>;
  } else {
    const a = j?.marcas[0], z = j?.marcas[j.marcas.length - 1];
    cuerpo = (<>
      <h1 className="mc-h">Jornada cerrada</h1>
      <div className="mc-stats"><div><b>{a ? hora(a.createdAt) : '—'}</b><span>Ingreso</span></div><div><b>{z ? hora(z.createdAt) : '—'}</b><span>Salida</span></div></div>
    </>);
    boton = <button className="mc-btn" disabled>Jornada cerrada</button>;
  }

  return (
    <div className="mc-app">
      <MarcacionHeader nombre={data.user.name} rol="Marcación de jornada" aprueba={data.user.aprueba} administra={data.user.administra} chip={{ texto: ESTADO_LABEL[estado], tono: chipTono }} />
      <div className="mc-dots" aria-label={`Marca ${Math.min(m + 1, 6)} de 6`}>{MARCAS_FLUJO.map((x, i) => <i key={x.label} className={i < m ? 'd' : i === m ? 'c' : ''} />)}</div>
      <div className="mc-main">
        {cuerpo}
        {error && <div className="mc-err" role="alert">{error}</div>}
        {j && j.marcas.length > 0 && (<>
          <h2 className="mc-h4">Marcaciones de hoy</h2>
          <ul className="mc-log">
            {j.marcas.map(mk => (
              <li key={mk.id}><span className="mc-mono">{hora(mk.createdAt)}</span>
                <div>{TIPO_LABEL[mk.tipo]}<span className="s">{mk.metodo === 'ROSTRO' ? 'Rostro + GPS' : 'GPS'}{mk.sitioNombre ? ` · ${mk.sitioNombre}` : ''}{mk.distanciaM !== null ? ` · a ${formatDist(mk.distanciaM)}` : ''}{mk.fueraDeRango ? ' · fuera de rango' : ''}</span></div>
              </li>
            ))}
          </ul>
        </>)}
      </div>
      <div className="mc-act">{boton}</div>
      {face && (
        <FaceCapture
          titulo={face === 'INGRESO' ? 'Ingreso de jornada' : 'Salida de jornada'}
          onCancel={() => setFace(null)}
          onCapture={f => { const t = face; setFace(null); marcar(t, {}, f); }}
        />
      )}
    </div>
  );
}
