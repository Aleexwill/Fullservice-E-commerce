'use client';

import { useCallback, useEffect, useState } from 'react';
import { MarcacionHeader } from '@/components/marcacion/header';
import { api } from '@/lib/marcacion/client';
import { AUSENCIA_LABEL, TIPOS_AUSENCIA } from '@/lib/marcacion/reglas';
import type { TipoAusencia } from '@/lib/marcacion/reglas';
import type { MeDTO } from '@/lib/marcacion/shared';

interface Aus { id: string; userKey: string; userName: string; tipo: TipoAusencia; desde: string; hasta: string; motivo: string; estado: string; revisorName: string; revisorMotivo: string }
interface Resp { ausencias: Aus[]; vacaciones: { usados: number; total: number }; aprueba: boolean }
interface Persona { userKey: string; nombre: string }

const f = (x: string) => x.split('-').reverse().join('/');
const TONO: Record<string, string> = { PENDIENTE: 'o', APROBADA: 'g', RECHAZADA: 'r', CANCELADA: '' };
const hoyIso = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Asuncion' }).format(new Date());

export default function AusenciasPage() {
  const [me, setMe] = useState<MeDTO | null>(null);
  const [mias, setMias] = useState<Resp | null>(null);
  const [pend, setPend] = useState<Aus[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ tipo: 'VACACIONES' as TipoAusencia, desde: hoyIso(), hasta: hoyIso(), motivo: '', userKey: '' });
  const [rechazo, setRechazo] = useState<Record<string, string>>({});

  const cargar = useCallback(async () => {
    try {
      const m = await api<MeDTO>('/api/marcacion/me'); setMe(m);
      setMias(await api<Resp>('/api/marcacion/ausencias'));
      if (m.aprueba) {
        setPend((await api<Resp>('/api/marcacion/ausencias?scope=pendientes')).ausencias);
        if (m.reportes) setPersonas((await api<{ personas: Persona[] }>(`/api/marcacion/reportes?desde=${hoyIso()}&hasta=${hoyIso()}`)).personas);
      }
    } catch (e) { setError(e instanceof Error ? e.message : 'Error'); }
  }, []);
  useEffect(() => { cargar(); }, [cargar]);

  async function enviar(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError('');
    try {
      await api('/api/marcacion/ausencias', { method: 'POST', body: JSON.stringify({ ...form, userKey: form.userKey || undefined }) });
      setForm(s => ({ ...s, motivo: '' })); await cargar();
    } catch (er) { setError(er instanceof Error ? er.message : 'Error'); } finally { setBusy(false); }
  }
  async function accion(id: string, a: 'aprobar' | 'rechazar' | 'cancelar') {
    setError('');
    try { await api(`/api/marcacion/ausencias/${id}`, { method: 'POST', body: JSON.stringify({ accion: a, motivo: rechazo[id] ?? '' }) }); await cargar(); }
    catch (er) { setError(er instanceof Error ? er.message : 'Error'); await cargar(); }
  }

  return (
    <div className="mc-app">
      <MarcacionHeader titulo="Vacaciones y ausencias" />
      <div className="mc-main">
        <h1 className="mc-h">Ausencias</h1>
        {error && <div className="mc-err" role="alert">{error}</div>}
        {mias && (
          <div className="mc-stats"><div><b>{mias.vacaciones.total - mias.vacaciones.usados}</b><span>Días de vacaciones disponibles</span></div><div><b>{mias.vacaciones.usados}</b><span>Usados este año</span></div></div>
        )}

        {me?.aprueba && pend.length > 0 && (<>
          <h2 className="mc-h4">Por resolver ({pend.length})</h2>
          {pend.map(a => (
            <div className="mc-card" key={a.id}>
              <div className="mc-row"><b>{a.userName}</b><span className="mc-chip o">{AUSENCIA_LABEL[a.tipo]}</span></div>
              <span className="mc-mut">{f(a.desde)} al {f(a.hasta)}{a.motivo ? ` · ${a.motivo}` : ''}</span>
              <input className="mc-input" style={{ marginTop: 8 }} placeholder="Motivo (obligatorio para rechazar)" aria-label="Motivo del rechazo" value={rechazo[a.id] ?? ''} onChange={e => setRechazo(r => ({ ...r, [a.id]: e.target.value }))} />
              <div className="mc-two"><button className="mc-btn bad sm" onClick={() => accion(a.id, 'rechazar')}>Rechazar</button><button className="mc-btn ok sm" onClick={() => accion(a.id, 'aprobar')}>Aprobar</button></div>
            </div>
          ))}
        </>)}

        <form onSubmit={enviar}>
          <h2 className="mc-h4">{me?.aprueba ? 'Solicitar o registrar' : 'Solicitar'}</h2>
          {me?.aprueba && personas.length > 0 && (
            <div className="mc-field"><label htmlFor="who">Para</label>
              <select id="who" className="mc-input" value={form.userKey} onChange={e => setForm({ ...form, userKey: e.target.value })}><option value="">Para mí (queda pendiente)</option>{personas.map(p => <option key={p.userKey} value={p.userKey}>{p.nombre} (queda aprobada)</option>)}</select></div>
          )}
          <div className="mc-field"><label htmlFor="tp">Tipo</label>
            <select id="tp" className="mc-input" value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value as TipoAusencia })}>{TIPOS_AUSENCIA.map(t => <option key={t} value={t}>{AUSENCIA_LABEL[t]}</option>)}</select></div>
          <div className="mc-two">
            <div className="mc-field"><label htmlFor="ds">Desde</label><input id="ds" type="date" className="mc-input" required value={form.desde} onChange={e => setForm({ ...form, desde: e.target.value, hasta: e.target.value > form.hasta ? e.target.value : form.hasta })} /></div>
            <div className="mc-field"><label htmlFor="hs">Hasta</label><input id="hs" type="date" className="mc-input" required min={form.desde} value={form.hasta} onChange={e => setForm({ ...form, hasta: e.target.value })} /></div>
          </div>
          <div className="mc-field"><label htmlFor="mt">Motivo (opcional)</label><input id="mt" className="mc-input" maxLength={200} value={form.motivo} onChange={e => setForm({ ...form, motivo: e.target.value })} /></div>
          <button className="mc-btn" disabled={busy}>{busy ? 'Enviando…' : 'Enviar'}</button>
        </form>

        <h2 className="mc-h4">Mis solicitudes</h2>
        {mias && mias.ausencias.length === 0 && <p className="mc-mut">Todavía no cargaste ausencias.</p>}
        <ul className="mc-log">
          {mias?.ausencias.map(a => (
            <li key={a.id} style={{ gridTemplateColumns: '1fr auto' }}>
              <div>{AUSENCIA_LABEL[a.tipo]} <span className={`mc-chip ${TONO[a.estado]}`}>{a.estado.charAt(0) + a.estado.slice(1).toLowerCase()}</span>
                <span className="s">{f(a.desde)} al {f(a.hasta)}{a.motivo ? ` · ${a.motivo}` : ''}</span>
                {a.estado === 'RECHAZADA' && a.revisorMotivo && <span className="s">Motivo: {a.revisorMotivo}</span>}</div>
              {a.estado === 'PENDIENTE' && <button className="mc-link" style={{ width: 'auto' }} onClick={() => accion(a.id, 'cancelar')}>Cancelar</button>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
