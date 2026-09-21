'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { KeyRound, Eye, EyeOff, ShieldCheck } from 'lucide-react';

export default function CambiarPasswordPage() {
  const router = useRouter();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (next.length < 8) {
      setError('La nueva contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (next !== confirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Error al cambiar la contraseña.');
        setLoading(false);
        return;
      }
      router.push('/admin');
      router.refresh();
    } catch {
      setError('Error de conexión. Intentá de nuevo.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-carbon flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-blue-muted border border-blue-bright/20 mb-4">
            <KeyRound className="w-6 h-6 text-blue-bright" />
          </div>
          <h1 className="text-h2 font-display text-arctic">Cambiar contraseña</h1>
          <p className="text-steel-500 text-body-sm mt-2">
            Tu cuenta requiere que establezcas una nueva contraseña antes de continuar.
          </p>
        </div>

        {/* Card */}
        <div className="card p-8 border border-steel-900 rounded-lg bg-carbon-light">
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Contraseña actual (temporal) */}
            <div>
              <label className="label text-steel-100 block mb-2">Contraseña temporal</label>
              <div className="relative">
                <input
                  type={showCurrent ? 'text' : 'password'}
                  value={current}
                  onChange={e => setCurrent(e.target.value)}
                  placeholder="Ingresá la contraseña temporal"
                  autoComplete="current-password"
                  required
                  className="admin-input w-full pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-steel-500 hover:text-arctic transition-colors"
                  aria-label={showCurrent ? 'Ocultar' : 'Mostrar'}
                >
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Nueva contraseña */}
            <div>
              <label className="label text-steel-100 block mb-2">Nueva contraseña</label>
              <div className="relative">
                <input
                  type={showNext ? 'text' : 'password'}
                  value={next}
                  onChange={e => setNext(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  autoComplete="new-password"
                  required
                  className="admin-input w-full pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNext(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-steel-500 hover:text-arctic transition-colors"
                  aria-label={showNext ? 'Ocultar' : 'Mostrar'}
                >
                  {showNext ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {/* Indicador de fortaleza */}
              {next.length > 0 && (
                <div className="mt-2 flex gap-1">
                  {[1,2,3,4].map(i => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        next.length >= i * 3
                          ? next.length >= 12 ? 'bg-success-bright'
                            : next.length >= 8 ? 'bg-yellow-bright'
                            : 'bg-danger-bright'
                          : 'bg-steel-900'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Confirmar */}
            <div>
              <label className="label text-steel-100 block mb-2">Confirmar nueva contraseña</label>
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Repetí la nueva contraseña"
                autoComplete="new-password"
                required
                className={`admin-input w-full ${confirm && confirm !== next ? 'border-danger-bright/50' : ''}`}
              />
              {confirm && confirm !== next && (
                <p className="text-danger-bright text-caption mt-1">Las contraseñas no coinciden</p>
              )}
            </div>

            {/* Requisitos */}
            <div className="rounded-lg bg-steel-900/40 border border-steel-900 p-3 space-y-1">
              {[
                { ok: next.length >= 8, label: 'Al menos 8 caracteres' },
                { ok: /[A-Z]/.test(next), label: 'Una mayúscula' },
                { ok: /[0-9]/.test(next), label: 'Un número' },
              ].map(r => (
                <div key={r.label} className="flex items-center gap-2 text-caption">
                  <ShieldCheck className={`w-3.5 h-3.5 ${r.ok ? 'text-success-bright' : 'text-steel-500'}`} />
                  <span className={r.ok ? 'text-success-bright' : 'text-steel-500'}>{r.label}</span>
                </div>
              ))}
            </div>

            {error && (
              <div className="rounded-lg bg-danger-light border border-danger-bright/20 px-4 py-3 text-danger-bright text-body-sm" role="alert">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !current || !next || !confirm}
              className="w-full h-11 rounded-lg bg-blue text-arctic font-semibold text-body transition-opacity disabled:opacity-50"
            >
              {loading ? 'Guardando…' : 'Establecer nueva contraseña'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
