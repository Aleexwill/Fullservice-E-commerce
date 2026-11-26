'use client';

import { useCallback, useEffect, useState } from 'react';
import { MarcacionHeader } from '@/components/marcacion/header';
import { api, obtenerPosicion } from '@/lib/marcacion/client';
import type { EstadoResponse, SitioDTO } from '@/lib/marcacion/shared';

/** Alta de oficina y lugares de trabajo con su radio. Solo roles con permiso de configuración. */
export default function SitiosPage() {
  const [yo, setYo] = useState<EstadoResponse['user'] | null>(null);
  const [sitios, setSitios] = useState<SitioDTO[]>([]);
  const [error, setError] = useState('');
  const [f, setF] = useState({ nombre: '', tipo: 'OBRA', lat: '', lng: '', radioM: '100' });
  const [busy, setBusy] = useState(false);

  const cargar = useCallback(async () => {
    try { setSitios(await api<SitioDTO[]>('/api/marcacion/sitios')); } catch (e) { setError(e instanceof Error ? e.message : 'Error'); }
  }, []);
  useEffect(() => { api<EstadoResponse>('/api/marcacion/estado').then(d => setYo(d.user)).catch(() => {}); cargar(); }, [cargar]);

  async function usarMiUbicacion() {
    setError('');
    try { const p = await obtenerPosicion(); setF(s => ({ ...s, lat: p.lat.toFixed(6), lng: p.lng.toFixed(6) })); }
    catch (e) { setError(e instanceof Error ? e.message : 'Sin ubicación'); }
  }
  async function crear(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError('');
    try {
      await api('/api/marcacion/sitios', { method: 'POST', body: JSON.stringify({ ...f, lat: Number(f.lat), lng: Number(f.lng), radioM: Number(f.radioM) }) });
      setF({ nombre: '', tipo: 'OBRA', lat: '', lng: '', radioM: '100' }); await cargar();
    } catch (er) { setError(er instanceof Error ? er.message : 'Error'); } finally { setBusy(false); }
  }
  async function quitar(id: string) {
    setError('');
    try { await api(`/api/marcacion/sitios?id=${encodeURIComponent(id)}`, { method: 'DELETE' }); await cargar(); }
    catch (er) { setError(er instanceof Error ? er.message : 'Error'); }
  }

  const puede = yo?.administra;
  return (
    <div className="mc-app">
      <MarcacionHeader nombre={yo?.name ?? ''} rol="Oficina y lugares de trabajo" aprueba={yo?.aprueba} administra={yo?.administra} />
      <div className="mc-main">
        <h1 className="mc-h">Sitios</h1>
        {error && <div className="mc-err" role="alert">{error}</div>}
        <ul className="mc-log">
          {sitios.map(s => (
            <li key={s.id} style={{ gridTemplateColumns: '1fr auto' }}>
              <div>{s.nombre} <span className={`mc-chip ${s.tipo === 'OFICINA' ? 'b' : ''}`}>{s.tipo === 'OFICINA' ? 'Oficina' : 'Lugar'}</span>
                <span className="s">{s.lat.toFixed(5)}, {s.lng.toFixed(5)} · radio {s.radioM} m</span></div>
              {puede && <button className="mc-link" style={{ width: 'auto' }} onClick={() => quitar(s.id)}>Quitar</button>}
            </li>
          ))}
        </ul>
        {puede ? (
          <form onSubmit={crear}>
            <h2 className="mc-h4">Agregar sitio</h2>
            <div className="mc-field"><label htmlFor="n">Nombre</label><input id="n" className="mc-input" required maxLength={80} value={f.nombre} onChange={e => setF({ ...f, nombre: e.target.value })} /></div>
            <div className="mc-field"><label htmlFor="t">Tipo</label>
              <select id="t" className="mc-input" value={f.tipo} onChange={e => setF({ ...f, tipo: e.target.value })}><option value="OBRA">Lugar de trabajo</option><option value="OFICINA">Oficina</option></select></div>
            <div className="mc-two">
              <div className="mc-field"><label htmlFor="la">Latitud</label><input id="la" className="mc-input" required inputMode="decimal" value={f.lat} onChange={e => setF({ ...f, lat: e.target.value })} /></div>
              <div className="mc-field"><label htmlFor="lo">Longitud</label><input id="lo" className="mc-input" required inputMode="decimal" value={f.lng} onChange={e => setF({ ...f, lng: e.target.value })} /></div>
            </div>
            <button type="button" className="mc-pick" style={{ width: '100%' }} onClick={usarMiUbicacion}>Usar mi ubicación actual</button>
            <div className="mc-field"><label htmlFor="r">Radio de llegada (metros)</label><input id="r" className="mc-input" required type="number" min={30} max={1000} value={f.radioM} onChange={e => setF({ ...f, radioM: e.target.value })} /></div>
            <button className="mc-btn" disabled={busy}>Guardar sitio</button>
          </form>
        ) : <p className="mc-mut">Solo un administrador puede agregar o quitar sitios.</p>}
      </div>
    </div>
  );
}
