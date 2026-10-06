'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const PAGE_CSS = `
    :root {
        --bg: #0a0f1d;
        --panel-l: #0d1322;
        --panel-r: #131b34;
        --line: rgba(120, 150, 210, .18);
        --text: #e6ecfa;
        --muted: #8593b5;
        --blue: #3aa0e6;
        --blue-2: #2478b5;
        --orange: #ff8a1f;
        --danger: #ff7a7a;
        --ok: #5dffa4;
    }
    * { box-sizing: border-box; }
    html, body { margin: 0; min-height: 100%; }
    body {
        background: var(--bg); color: var(--text);
        font: 400 15px/1.5 'Inter', system-ui, -apple-system, sans-serif;
        -webkit-font-smoothing: antialiased;
    }
    .shell { min-height: 100vh; display: grid; grid-template-columns: 1fr 1fr; gap: 0; padding: 12px; }
    .stage {
        position: relative; display: flex; align-items: center; justify-content: center; padding: 32px 24px;
        border: 1px solid var(--line); border-radius: 26px; overflow: hidden;
        background:
            radial-gradient(circle at 50% 45%, rgba(58, 110, 200, .12), transparent 60%),
            linear-gradient(rgba(255,255,255,.028) 1px, transparent 1px) 0 0 / 34px 34px,
            linear-gradient(90deg, rgba(255,255,255,.028) 1px, transparent 1px) 0 0 / 34px 34px,
            var(--panel-l);
    }
    #fsc-robot { width: 100%; max-width: 330px; }
    .side { position: relative; display: flex; align-items: center; justify-content: center; padding: 56px 40px;
        background: linear-gradient(180deg, var(--panel-r), #0c1224); border-radius: 26px; }
    .secure { position: absolute; top: 18px; right: 18px; padding: 6px 14px; border: 1px solid var(--line); border-radius: 999px;
        font-size: 10px; font-weight: 500; letter-spacing: .16em; color: var(--muted); text-transform: uppercase; }
    .form-wrap { width: 100%; max-width: 380px; }
    .eyebrow { display: flex; align-items: center; gap: 8px; margin: 0 0 14px; font-size: 11px; font-weight: 700; letter-spacing: .16em; color: #4db3f0; text-transform: uppercase; }
    .eyebrow::before { content: ''; width: 8px; height: 8px; border-radius: 50%; background: var(--orange); box-shadow: 0 0 10px rgba(255,138,31,.7); }
    .fsc-h1 { margin: 0 0 14px; font: 400 clamp(44px, 6vw, 60px)/.95 'Anton', Impact, sans-serif; letter-spacing: -.005em; color: #fff; }
    .lead { margin: 0 0 28px; color: var(--muted); font-size: 14px; }
    label { display: block; margin: 0 0 8px; font-size: 13px; font-weight: 600; color: #dbe4fb; }
    .field { position: relative; margin-bottom: 20px; }
    .field input {
        width: 100%; height: 48px; padding: 0 46px 0 16px; border: 2px solid transparent; border-radius: 14px;
        background: #e8f0fe; color: #0b1020; font: 500 15px 'Inter', system-ui, sans-serif; outline: none;
        transition: border-color .15s, box-shadow .15s;
    }
    .field input::placeholder { color: #7b88a8; }
    .field input:focus { border-color: var(--blue); box-shadow: 0 0 0 4px rgba(58, 160, 230, .25); }
    .field .ico { position: absolute; right: 14px; top: 50%; width: 20px; height: 20px; transform: translateY(-50%); color: #5b3f9e; pointer-events: none; }
    .field button.ico { pointer-events: auto; border: 0; padding: 0; background: none; color: #6a7896; cursor: pointer; display: flex; align-items: center; justify-content: center; border-radius: 6px; }
    .field button.ico:hover { color: #2f3b5a; }
    .field button.ico svg, .field .ico svg { width: 100%; height: 100%; }
    .submit {
        width: 100%; height: 48px; margin-top: 4px; border: 0; border-radius: 14px; cursor: pointer; color: #fff;
        background: linear-gradient(180deg, var(--blue), var(--blue-2)); box-shadow: 0 12px 34px rgba(42, 140, 220, .35);
        font: 400 17px/1 'Anton', Impact, sans-serif; letter-spacing: .02em;
        transition: transform .1s, filter .15s;
    }
    .submit:hover:not(:disabled) { filter: brightness(1.08); }
    .submit:active:not(:disabled) { transform: translateY(1px); }
    .submit:disabled { cursor: progress; filter: saturate(.7); }
    .fsc-msg { min-height: 22px; margin: 14px 0 0; font-size: 13px; text-align: center; color: var(--danger); }
    @media (max-width: 860px) {
        .shell { grid-template-columns: 1fr; gap: 12px; padding: 8px; }
        .stage { padding: 20px 16px 12px; }
        #fsc-robot { max-width: 200px; }
        .side { padding: 44px 22px 32px; }
    }
    @media (prefers-reduced-motion: reduce) { * { transition: none !important; } }
`;

// ── OTP flow (for DB users) ──────────────────────────────────────────────────

function OtpFlow({ onFallback }: { onFallback: () => void }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);
  const botRef = useRef<{ loading: () => void; success: (u: string) => void; error: (m: string) => void; reset: () => void } | null>(null);
  const scriptLoaded = useRef(false);

  useEffect(() => {
    if (scriptLoaded.current) return;
    scriptLoaded.current = true;
    const script = document.createElement('script');
    script.src = '/fsc-login-bot.js';
    script.onload = () => {
      const w = window as Window & { FSCLoginBot?: { mount: (el: string, opts: object) => typeof botRef.current } };
      if (w.FSCLoginBot) botRef.current = w.FSCLoginBot.mount('#fsc-robot', { username: '#fsc-email' });
    };
    document.head.appendChild(script);
    return () => { if (document.head.contains(script)) document.head.removeChild(script); };
  }, []);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  async function requestCode(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!email.trim() || !email.includes('@')) {
      setError('Ingresá un email válido.');
      botRef.current?.error('Email inválido.');
      return;
    }
    setLoading(true);
    botRef.current?.loading();
    try {
      await fetch('/api/auth/otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      // Siempre avanzar (no revelar si el email existe)
      botRef.current?.reset();
      setStep('code');
      setCountdown(60);
    } catch {
      setError('Error de conexión. Intentá de nuevo.');
      botRef.current?.error('Error de conexión.');
    }
    setLoading(false);
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (code.trim().length !== 6) {
      setError('El código tiene 6 dígitos.');
      return;
    }
    setLoading(true);
    botRef.current?.loading();
    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), code: code.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg = data.error || 'Código incorrecto o vencido.';
        setError(msg);
        botRef.current?.error(msg);
        setLoading(false);
        return;
      }
      const data = await res.json().catch(() => ({}));
      botRef.current?.success(email.trim());
      if (data.mustChangePassword) {
        router.push('/admin/cambiar-password');
      } else {
        const r = searchParams.get('redirect');
        router.push(r?.startsWith('/admin') ? r : '/admin');
      }
      router.refresh();
    } catch {
      setError('Error de conexión. Intentá de nuevo.');
      botRef.current?.error('Error de conexión.');
      setLoading(false);
    }
  }

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link href="https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      {/* eslint-disable-next-line react/no-danger */}
      <style dangerouslySetInnerHTML={{ __html: PAGE_CSS }} />
      <main className="shell">
        <section className="stage" aria-label="Asistente de acceso">
          <div id="fsc-robot" />
        </section>
        <section className="side">
          <span className="secure">Acceso seguro</span>
          <div className="form-wrap">
            <p className="eyebrow">Panel administrativo</p>
            {step === 'email' ? (
              <>
                <h1 className="fsc-h1">Bienvenido<br />de nuevo.</h1>
                <p className="lead">Ingresá tu email y te enviamos un código de acceso de un solo uso.</p>
                <form onSubmit={requestCode} noValidate>
                  <label htmlFor="fsc-email">Email</label>
                  <div className="field">
                    <input
                      id="fsc-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      maxLength={254}
                      placeholder="tu@email.com"
                      autoCapitalize="none"
                      spellCheck={false}
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                    />
                    <span className="ico" aria-hidden="true">
                      <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 2-8 5-8-5h16zm0 12H4V9l8 5 8-5v9z"/></svg>
                    </span>
                  </div>
                  {error && <p className="fsc-msg" role="alert">{error}</p>}
                  <button className="submit" type="submit" disabled={loading}>
                    {loading ? 'Enviando…' : 'Enviar código →'}
                  </button>
                </form>
                <p style={{ marginTop: '20px', fontSize: '12px', color: 'var(--muted)', textAlign: 'center' }}>
                  ¿Admin con contraseña?{' '}
                  <button onClick={onFallback} style={{ background: 'none', border: 'none', color: 'var(--blue)', cursor: 'pointer', fontSize: '12px', padding: 0 }}>
                    Ingresar con contraseña
                  </button>
                </p>
              </>
            ) : (
              <>
                <h1 className="fsc-h1" style={{ fontSize: 'clamp(32px,5vw,46px)' }}>Revisá<br />tu email.</h1>
                <p className="lead">Enviamos un código de 6 dígitos a <strong style={{ color: 'var(--text)' }}>{email}</strong>. Vence en 10 minutos.</p>
                <form onSubmit={verifyCode} noValidate>
                  <label htmlFor="fsc-code">Código de verificación</label>
                  <div className="field">
                    <input
                      id="fsc-code"
                      name="code"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      placeholder="000000"
                      style={{ letterSpacing: '0.3em', fontSize: '22px', textAlign: 'center' }}
                      value={code}
                      onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      autoFocus
                    />
                  </div>
                  {error && <p className="fsc-msg" role="alert">{error}</p>}
                  <button className="submit" type="submit" disabled={loading || code.length < 6}>
                    {loading ? 'Verificando…' : 'Ingresar al panel'}
                  </button>
                </form>
                <p style={{ marginTop: '16px', fontSize: '12px', color: 'var(--muted)', textAlign: 'center' }}>
                  {countdown > 0 ? (
                    <>Podés reenviar en {countdown}s</>
                  ) : (
                    <button onClick={() => { setStep('email'); setCode(''); setError(''); }} style={{ background: 'none', border: 'none', color: 'var(--blue)', cursor: 'pointer', fontSize: '12px', padding: 0 }}>
                      ← Cambiar email o reenviar
                    </button>
                  )}
                </p>
              </>
            )}
          </div>
        </section>
      </main>
    </>
  );
}

// ── Password fallback (env admin) ────────────────────────────────────────────

function PasswordForm({ onBack }: { onBack: () => void }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const botRef = useRef<{ loading: () => void; success: (u: string) => void; error: (m: string) => void; reset: () => void } | null>(null);
  const scriptLoaded = useRef(false);

  useEffect(() => {
    if (scriptLoaded.current) return;
    scriptLoaded.current = true;
    const script = document.createElement('script');
    script.src = '/fsc-login-bot.js';
    script.onload = () => {
      const w = window as Window & { FSCLoginBot?: { mount: (el: string, opts: object) => typeof botRef.current } };
      if (w.FSCLoginBot) {
        botRef.current = w.FSCLoginBot.mount('#fsc-robot-pwd', {
          username: '#fsc-user',
          password: '#fsc-pass',
          toggle: '#fsc-toggle',
        });
      }
    };
    document.head.appendChild(script);
    return () => { if (document.head.contains(script)) document.head.removeChild(script); };
  }, []);

  const togglePwd = () => {
    const passEl = document.getElementById('fsc-pass') as HTMLInputElement | null;
    const show = !showPwd;
    setShowPwd(show);
    if (passEl) passEl.type = show ? 'text' : 'password';
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password) {
      setError('Completá usuario y contraseña.');
      botRef.current?.error('Completá usuario y contraseña.');
      return;
    }
    setLoading(true);
    botRef.current?.loading();
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg = data.error || 'Usuario o contraseña incorrectos.';
        setError(msg);
        botRef.current?.error(msg);
        setLoading(false);
        return;
      }
      const data = await res.json().catch(() => ({}));
      botRef.current?.success(username.trim());
      if (data.mustChangePassword) {
        router.push('/admin/cambiar-password');
      } else {
        const r = searchParams.get('redirect');
        router.push(r?.startsWith('/admin') ? r : '/admin');
      }
      router.refresh();
    } catch {
      setError('Error de conexión. Intentá de nuevo.');
      botRef.current?.error('Error de conexión.');
      setLoading(false);
    }
  }

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link href="https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      {/* eslint-disable-next-line react/no-danger */}
      <style dangerouslySetInnerHTML={{ __html: PAGE_CSS }} />
      <main className="shell">
        <section className="stage" aria-label="Asistente de acceso">
          <div id="fsc-robot-pwd" />
        </section>
        <section className="side">
          <span className="secure">Acceso seguro</span>
          <div className="form-wrap">
            <p className="eyebrow">Panel administrativo</p>
            <h1 className="fsc-h1">Bienvenido<br />de nuevo.</h1>
            <p className="lead">Ingresá tus credenciales para continuar.</p>
            <form onSubmit={handleSubmit} noValidate>
              <label htmlFor="fsc-user">Usuario</label>
              <div className="field">
                <input
                  id="fsc-user"
                  name="user"
                  type="text"
                  autoComplete="username"
                  maxLength={254}
                  placeholder="admin"
                  autoCapitalize="none"
                  spellCheck={false}
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                />
                <span className="ico" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="7.5" r="4.2"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7z"/></svg>
                </span>
              </div>
              <label htmlFor="fsc-pass">Contraseña</label>
              <div className="field">
                <input
                  id="fsc-pass"
                  name="pass"
                  type={showPwd ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button type="button" id="fsc-toggle" className="ico" aria-label="Mostrar contraseña" aria-pressed={showPwd} onClick={togglePwd}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                </button>
              </div>
              {error && <p className="fsc-msg" role="alert">{error}</p>}
              <button className="submit" type="submit" disabled={loading}>
                {loading ? 'Verificando…' : 'Ingresar al panel'}
              </button>
            </form>
            <p style={{ marginTop: '16px', fontSize: '12px', color: 'var(--muted)', textAlign: 'center' }}>
              <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--blue)', cursor: 'pointer', fontSize: '12px', padding: 0 }}>
                ← Usar código por email
              </button>
            </p>
          </div>
        </section>
      </main>
    </>
  );
}

function LoginForm() {
  const [mode, setMode] = useState<'otp' | 'password'>('otp');
  if (mode === 'password') return <PasswordForm onBack={() => setMode('otp')} />;
  return <OtpFlow onFallback={() => setMode('password')} />;
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
