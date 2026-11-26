'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';

function Form() {
  const params = useSearchParams();
  const [username, setU] = useState('');
  const [password, setP] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError('');
    try {
      const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { setError(d.error ?? 'No se pudo iniciar sesión'); return; }
      const r = params.get('redirect');
      // Solo rutas internas de la PWA; cambio de contraseña obligatorio sale del alcance a propósito
      window.location.href = d.mustChangePassword ? '/admin/cambiar-password' : r && r.startsWith('/marcacion') ? r : '/marcacion';
    } catch { setError('Sin conexión'); } finally { setBusy(false); }
  }

  return (
    <div className="mc-app mc-login">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/marcacion/isotipo.png" alt="Full Service" />
      <h1 className="mc-h">Marcación</h1>
      <p className="mc-mut">Ingresá con tu usuario de Full Service.</p>
      <form onSubmit={entrar}>
        <div className="mc-field"><label htmlFor="u">Usuario o correo</label><input id="u" className="mc-input" type="text" autoComplete="username" autoCapitalize="none" required value={username} onChange={e => setU(e.target.value)} /></div>
        <div className="mc-field"><label htmlFor="p">Contraseña</label><input id="p" className="mc-input" type="password" autoComplete="current-password" required value={password} onChange={e => setP(e.target.value)} /></div>
        {error && <div className="mc-err" role="alert">{error}</div>}
        <button className="mc-btn" disabled={busy}>{busy ? 'Ingresando…' : 'Ingresar'}</button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return <Suspense><Form /></Suspense>;
}
