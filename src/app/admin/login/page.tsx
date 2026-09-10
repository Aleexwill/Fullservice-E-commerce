'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

/* ─── Robot animated head ─────────────────────────────────────────────────── */
function RobotHead({ message }: { message: string }) {
  const headRef = useRef<HTMLDivElement>(null);
  const eyeLRef = useRef<HTMLSpanElement>(null);
  const eyeRRef = useRef<HTMLSpanElement>(null);
  const visualRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const el = visualRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - (rect.left + rect.width / 2)) / rect.width;
      const y = (e.clientY - (rect.top + rect.height / 2)) / rect.height;
      const rx = Math.max(-10, Math.min(10, -y * 18));
      const ry = Math.max(-14, Math.min(14, x * 24));
      if (headRef.current) headRef.current.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
      const ex = Math.max(-5, Math.min(5, x * 9));
      const ey = Math.max(-3, Math.min(3, y * 6));
      if (eyeLRef.current) eyeLRef.current.style.transform = `translate(${ex}px,${ey}px)`;
      if (eyeRRef.current) eyeRRef.current.style.transform = `translate(${ex}px,${ey}px)`;
    };
    const onLeave = () => {
      if (headRef.current) headRef.current.style.transform = 'rotateX(0) rotateY(0)';
      if (eyeLRef.current) eyeLRef.current.style.transform = 'translate(0,0)';
      if (eyeRRef.current) eyeRRef.current.style.transform = 'translate(0,0)';
    };
    window.addEventListener('pointermove', onMove);
    visualRef.current?.addEventListener('pointerleave', onLeave);
    return () => {
      window.removeEventListener('pointermove', onMove);
      visualRef.current?.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  return (
    <div ref={visualRef} style={styles.visual}>
      {/* inner border */}
      <div style={styles.visualInner} />
      {/* glow */}
      <div style={styles.glow} />

      <div style={styles.robotWrap}>
        {/* Speech bubble */}
        <div style={styles.bubble} role="status" aria-live="polite">
          {message}
        </div>

        {/* Antenna */}
        <div style={styles.antenna} aria-hidden="true">
          <span style={styles.antennaRod} />
          <span style={styles.antennaTip} />
        </div>

        {/* Head */}
        <div style={styles.head3d} aria-hidden="true">
          <div ref={headRef} style={styles.head}>
            <span style={styles.visor} />
            <span style={{ ...styles.ear, ...styles.earL }} />
            <span style={{ ...styles.ear, ...styles.earR }} />
            <span ref={eyeLRef} style={{ ...styles.eye, ...styles.eyeL }} />
            <span ref={eyeRRef} style={{ ...styles.eye, ...styles.eyeR }} />
            <span style={styles.mouth} />
            <span style={{ ...styles.cheek, left: 54 }} />
            <span style={{ ...styles.cheek, right: 54 }} />
          </div>
        </div>

        {/* Brand */}
        <div style={styles.brand} aria-hidden="true">
          <span style={styles.brandLine} />
          <span style={styles.brandText}>FULL SERVICE &amp; CLEAN</span>
          <span style={styles.brandLine} />
        </div>
      </div>
    </div>
  );
}

/* ─── Login form ──────────────────────────────────────────────────────────── */
function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('Hola. Soy el guardián de este panel.');
  const [showPwd, setShowPwd] = useState(false);

  const setBubble = useCallback((msg: string) => setMessage(msg), []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username || !password) {
      setError('Completá ambos campos.');
      setBubble('Faltan datos. No puedo abrir la puerta.');
      return;
    }
    setLoading(true);
    setError('');
    setBubble('Verificando credenciales…');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg = data.error || 'Credenciales inválidas';
        setError(msg);
        setBubble('Acceso denegado. Verificá los datos.');
        setLoading(false);
        return;
      }
      setBubble('¡Acceso confirmado! Bienvenido.');
      const redirectTo = searchParams.get('redirect') || '/admin';
      router.push(redirectTo);
      router.refresh();
    } catch {
      setError('Error de conexión');
      setBubble('No pude conectarme. Intentá de nuevo.');
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <RobotHead message={message} />

      <section style={styles.loginSection}>
        <div style={styles.badge}>ACCESO SEGURO</div>

        <div style={styles.kicker}>
          <span style={styles.kickerDot} />
          Panel Administrativo
        </div>

        <h1 style={styles.h1}>Bienvenido<br />de nuevo.</h1>
        <p style={styles.subtitle}>
          Ingresá tus credenciales para continuar. El asistente reacciona mientras escribís.
        </p>

        <form onSubmit={handleSubmit} noValidate>
          {/* Usuario */}
          <div style={styles.field}>
            <label style={styles.label} htmlFor="username">Usuario</label>
            <div style={{ position: 'relative' }}>
              <input
                id="username"
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                onFocus={() => setBubble('Primero el usuario. Estoy mirando.')}
                onInput={() => setBubble(username.length > 1 ? 'Bien, seguí.' : 'Esperando...')}
                placeholder="Nombre de usuario"
                autoComplete="username"
                required
                style={styles.input}
              />
              <span style={styles.inputIcon}>👤</span>
            </div>
          </div>

          {/* Contraseña */}
          <div style={styles.field}>
            <label style={styles.label} htmlFor="password">Contraseña</label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                type={showPwd ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                onFocus={() => setBubble('Modo contraseña. Escudo de privacidad activado.')}
                onInput={() => {
                  if (!password) setBubble('Te espero.');
                  else if (password.length < 6) setBubble('Un poco más larga sería mejor.');
                  else setBubble('Bien. Eso se ve sólido.');
                }}
                placeholder="Contraseña"
                autoComplete="current-password"
                required
                style={{ ...styles.input, paddingRight: 80 }}
              />
              <button
                type="button"
                onClick={() => setShowPwd(v => !v)}
                style={styles.togglePwd}
                tabIndex={-1}
                aria-label={showPwd ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPwd ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={styles.errorBox} role="alert">{error}</div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{ ...styles.btn, ...(loading ? styles.btnDisabled : {}) }}
            onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1.1)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.filter = 'none'; }}
          >
            {loading ? 'Ingresando…' : 'Ingresar al panel'}
          </button>
        </form>
      </section>
    </div>
  );
}

/* ─── Styles ──────────────────────────────────────────────────────────────── */
// Full Service & Clean palette
const C = {
  carbon:    '#0B1120',
  carbonL:   '#131B2E',
  steel900:  '#1A2640',
  steel700:  '#2A3A5C',
  steel500:  '#4A5E80',
  steel300:  '#8094B4',
  blue:      '#2D8FCC',
  blueB:     '#3CAAE0',
  blueD:     '#1E6FA0',
  blueMuted: '#132A3D',
  orange:    '#E8862B',
  orangeB:   '#F5993D',
  arctic:    '#F4F7FB',
  cloud:     '#C0CEDF',
  danger:    '#FC8181',
  dangerBg:  '#3D1A1A',
};

const styles: Record<string, React.CSSProperties> = {
  page: {
    display: 'grid',
    gridTemplateColumns: '1.05fr .95fr',
    width: 'min(1120px, 100%)',
    minHeight: 680,
    borderRadius: 28,
    border: '1px solid rgba(255,255,255,.10)',
    background: `rgba(19,27,46,.96)`,
    boxShadow: '0 28px 80px rgba(0,0,0,.5)',
    overflow: 'hidden',
    backdropFilter: 'blur(18px)',
  },

  /* ── visual panel ── */
  visual: {
    position: 'relative',
    minHeight: 680,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '52px 40px',
    background: `radial-gradient(circle at 48% 38%, rgba(60,170,224,.09), transparent 32%),
                 linear-gradient(145deg, #172035, #0B1120 72%)`,
    isolation: 'isolate',
  },
  visualInner: {
    position: 'absolute',
    inset: 20,
    border: '1px solid rgba(255,255,255,.06)',
    borderRadius: 22,
    pointerEvents: 'none',
  },
  glow: {
    position: 'absolute',
    width: 340,
    height: 340,
    borderRadius: '50%',
    background: `radial-gradient(circle, rgba(45,143,204,.28), rgba(232,134,43,.07) 38%, transparent 70%)`,
    filter: 'blur(14px)',
    zIndex: -1,
    animation: 'fscPulse 4.5s ease-in-out infinite',
  },
  robotWrap: {
    position: 'relative',
    width: 330,
    height: 390,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },

  /* bubble */
  bubble: {
    position: 'absolute',
    top: -36,
    left: '50%',
    transform: 'translateX(-50%)',
    width: 'max-content',
    maxWidth: 300,
    padding: '13px 17px',
    border: `1px solid ${C.steel700}`,
    borderRadius: 14,
    background: `rgba(10,16,32,.92)`,
    boxShadow: '0 10px 28px rgba(0,0,0,.35)',
    color: C.arctic,
    fontSize: 13.5,
    lineHeight: 1.38,
    letterSpacing: '.01em',
    animation: 'fscBubbleIn .6s .4s both',
    zIndex: 10,
    whiteSpace: 'nowrap',
  },

  /* antenna */
  antenna: {
    position: 'absolute',
    top: 46,
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    zIndex: 3,
  },
  antennaRod: {
    display: 'block',
    width: 8,
    height: 50,
    background: `linear-gradient(180deg, ${C.steel300}, ${C.steel700})`,
    borderRadius: 8,
  },
  antennaTip: {
    display: 'block',
    position: 'absolute' as const,
    top: -12,
    width: 24,
    height: 24,
    borderRadius: '50%',
    background: `radial-gradient(circle at 35% 30%, #dffcff 0 16%, ${C.blueB} 32%, ${C.blueD} 76%)`,
    boxShadow: `0 0 26px rgba(60,170,224,.7)`,
    animation: 'fscTipBlink 2.7s infinite',
  },

  /* head */
  head3d: {
    position: 'absolute',
    top: 90,
    left: '50%',
    transform: 'translateX(-50%)',
    width: 260,
    height: 260,
    perspective: 1000,
  },
  head: {
    position: 'absolute',
    inset: 0,
    margin: 'auto',
    width: 240,
    height: 240,
    borderRadius: '46% 46% 42% 42% / 44% 44% 52% 52%',
    background: `linear-gradient(145deg, #1f3255 0%, #152340 52%, #0B1120 100%)`,
    border: `2px solid rgba(45,143,204,.22)`,
    boxShadow: `
      inset 12px 12px 22px rgba(60,170,224,.05),
      inset -16px -18px 26px rgba(0,0,0,.32),
      0 22px 40px rgba(0,0,0,.45)`,
    transformStyle: 'preserve-3d',
    transition: 'transform .14s ease-out',
  },
  visor: {
    position: 'absolute',
    left: 28,
    right: 28,
    top: 54,
    height: 108,
    borderRadius: 32,
    background: 'linear-gradient(180deg,#090d18,#060911)',
    border: '1px solid rgba(255,255,255,.07)',
    boxShadow: 'inset 0 0 30px rgba(0,0,0,.8)',
  },
  eye: {
    position: 'absolute',
    top: 93,
    width: 38,
    height: 18,
    borderRadius: '50%',
    background: `radial-gradient(circle at 50% 50%, #fff 0 14%, #a8e8ff 28%, ${C.blueB} 52%, rgba(60,170,224,.2) 70%, transparent 76%)`,
    filter: `drop-shadow(0 0 7px rgba(60,170,224,.95))`,
    zIndex: 2,
    transition: 'transform .12s ease-out',
  },
  eyeL: { left: 66 },
  eyeR: { right: 66 },
  mouth: {
    position: 'absolute',
    left: '50%',
    top: 133,
    width: 46,
    height: 15,
    transform: 'translateX(-50%)',
    borderBottom: `3px solid ${C.steel500}`,
    borderRadius: '0 0 50px 50px',
    opacity: .75,
    zIndex: 2,
  },
  ear: {
    position: 'absolute',
    top: 86,
    width: 34,
    height: 64,
    borderRadius: 18,
    background: `linear-gradient(180deg, ${C.steel700}, #0B1120)`,
    border: '1px solid rgba(255,255,255,.09)',
    zIndex: -1,
  },
  earL: { left: -18 },
  earR: { right: -18 },
  cheek: {
    position: 'absolute',
    top: 142,
    width: 20,
    height: 8,
    borderRadius: 999,
    background: `rgba(232,134,43,.3)`,
    filter: 'blur(.3px)',
    zIndex: 2,
  },

  /* brand label below head */
  brand: {
    position: 'absolute',
    bottom: 16,
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    whiteSpace: 'nowrap',
  },
  brandLine: {
    display: 'block',
    width: 28,
    height: 1,
    background: `linear-gradient(90deg, transparent, ${C.blueB})`,
  },
  brandText: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '.16em',
    color: C.steel300,
    textTransform: 'uppercase' as const,
  },

  /* ── login panel ── */
  loginSection: {
    position: 'relative',
    minHeight: 680,
    padding: '64px 56px',
    background: `linear-gradient(180deg, rgba(26,36,64,.97), rgba(11,17,32,.99))`,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute' as const,
    right: 24,
    top: 24,
    fontSize: 11,
    color: C.steel300,
    padding: '7px 12px',
    border: `1px solid ${C.steel700}`,
    borderRadius: 999,
    letterSpacing: '.1em',
  },
  kicker: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    color: C.blueB,
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: '.14em',
    textTransform: 'uppercase' as const,
    marginBottom: 16,
  },
  kickerDot: {
    display: 'inline-block',
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: C.orange,
    boxShadow: `0 0 12px rgba(232,134,43,.7)`,
  },
  h1: {
    margin: '0 0 12px',
    fontSize: 'clamp(34px,4.5vw,54px)',
    lineHeight: .97,
    letterSpacing: '-.04em',
    color: C.arctic,
    fontWeight: 800,
  },
  subtitle: {
    margin: '0 0 30px',
    color: C.steel300,
    lineHeight: 1.6,
    fontSize: 14.5,
    maxWidth: 400,
  },
  field: { marginBottom: 16 },
  label: {
    display: 'block',
    fontSize: 13,
    color: C.cloud,
    marginBottom: 7,
    fontWeight: 650,
  },
  input: {
    width: '100%',
    height: 52,
    borderRadius: 12,
    border: `1px solid ${C.steel700}`,
    background: C.steel900,
    color: C.arctic,
    padding: '0 48px 0 16px',
    outline: 'none',
    fontSize: 15,
    boxSizing: 'border-box' as const,
    transition: 'border-color .2s, box-shadow .2s',
  },
  inputIcon: {
    position: 'absolute' as const,
    right: 14,
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: 16,
    pointerEvents: 'none',
  },
  togglePwd: {
    position: 'absolute' as const,
    right: 12,
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: 17,
    padding: '0 4px',
    width: 'auto',
    height: 'auto',
    color: C.steel300,
    boxShadow: 'none',
  },
  errorBox: {
    marginBottom: 14,
    borderRadius: 10,
    background: 'rgba(197,48,48,.15)',
    border: '1px solid rgba(252,129,129,.2)',
    padding: '10px 14px',
    fontSize: 13.5,
    color: C.danger,
  },
  btn: {
    width: '100%',
    height: 52,
    border: 0,
    borderRadius: 12,
    background: `linear-gradient(135deg, ${C.blue}, ${C.blueD})`,
    color: C.arctic,
    fontSize: 15,
    fontWeight: 800,
    cursor: 'pointer',
    boxShadow: `0 10px 26px rgba(45,143,204,.3)`,
    transition: 'filter .2s, transform .15s',
    letterSpacing: '.02em',
  },
  btnDisabled: {
    opacity: .55,
    cursor: 'not-allowed',
  },
};

/* ─── Keyframe injection ─────────────────────────────────────────────────── */
const KEYFRAMES = `
  @keyframes fscPulse {
    0%,100% { transform: scale(.95); opacity: .72; }
    50%      { transform: scale(1.08); opacity: 1; }
  }
  @keyframes fscBubbleIn {
    from { opacity: 0; transform: translate(-50%, 10px); }
    to   { opacity: 1; transform: translate(-50%, 0); }
  }
  @keyframes fscTipBlink {
    0%,92%,100% { filter: brightness(1); }
    96%         { filter: brightness(1.9); }
  }

  /* Responsive */
  @media (max-width: 860px) {
    .fsc-login-page { grid-template-columns: 1fr !important; }
    .fsc-visual     { min-height: 420px !important; }
    .fsc-login-sec  { min-height: auto !important; padding: 44px 28px 52px !important; }
    .fsc-robot-wrap { transform: scale(.82); }
  }
  @media (max-width: 480px) {
    .fsc-visual  { min-height: 360px !important; padding: 32px 16px !important; }
    .fsc-robot-wrap { transform: scale(.7); }
    .fsc-login-sec  { padding: 36px 18px 44px !important; }
  }

  input:focus {
    border-color: rgba(60,170,224,.75) !important;
    box-shadow: 0 0 0 3px rgba(45,143,204,.14) !important;
    background: #1a2640 !important;
  }
`;

function StyleInjector() {
  return <style dangerouslySetInnerHTML={{ __html: KEYFRAMES }} />;
}

/* ─── Page wrapper ───────────────────────────────────────────────────────── */
function LoginPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: 24,
        background: `
          radial-gradient(circle at 50% -8%, rgba(45,143,204,.15), transparent 34%),
          linear-gradient(180deg, #0f1b2d 0%, #0B1120 100%)`,
        fontFamily: 'IBM Plex Sans, ui-sans-serif, system-ui, sans-serif',
        overflowX: 'hidden',
      }}
    >
      <StyleInjector />
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  );
}

export default LoginPage;
