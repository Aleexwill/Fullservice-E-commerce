'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Eye, EyeOff, CheckCircle } from 'lucide-react';
import { ROLE_LABELS } from '@/lib/roles';
import type { Role } from '@/lib/roles';

interface InvitationInfo {
  email: string;
  name: string;
  role: string;
}

export default function InvitacionPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [info, setInfo] = useState<InvitationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [invalid, setInvalid] = useState(false);
  const [done, setDone] = useState(false);

  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/invitaciones/${token}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((data: InvitationInfo) => {
        setInfo(data);
        setName(data.name || '');
        setLoading(false);
      })
      .catch(() => {
        setInvalid(true);
        setLoading(false);
      });
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/invitaciones/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, password }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Error al activar la cuenta');
        setSubmitting(false);
        return;
      }
      setDone(true);
    } catch {
      setError('Error de conexión');
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-carbon">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-steel-700 border-t-arctic" />
      </div>
    );
  }

  if (invalid) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-carbon px-4">
        <div className="card max-w-sm w-full p-8 text-center">
          <p className="font-display text-h4 text-arctic mb-2">Invitación inválida</p>
          <p className="font-body text-body-sm text-steel-400">
            Este enlace ya fue usado o expiró. Pedile al administrador que te reenvíe la invitación.
          </p>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-carbon px-4">
        <div className="card max-w-sm w-full p-8 text-center">
          <CheckCircle className="mx-auto mb-4 h-12 w-12 text-green-400" />
          <p className="font-display text-h4 text-arctic mb-2">¡Cuenta activada!</p>
          <p className="font-body text-body-sm text-steel-400 mb-6">
            Tu cuenta fue creada correctamente. Ya podés iniciar sesión.
          </p>
          <button
            onClick={() => router.push('/admin/login')}
            className="btn-primary w-full justify-center"
          >
            Ir al login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-carbon px-4">
      <div className="card max-w-sm w-full p-8">
        <p className="mb-1 font-body text-caption text-steel-500 uppercase tracking-widest">
          Full Service & Clean
        </p>
        <h1 className="mb-1 font-display text-h3 text-arctic">Activar cuenta</h1>
        <p className="mb-6 font-body text-body-sm text-steel-400">
          {info?.email} · <span className="text-blue-bright">{ROLE_LABELS[info?.role as Role] ?? info?.role}</span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block font-body text-caption text-steel-400">Nombre completo</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Tu nombre"
              className="input w-full"
              required
            />
          </div>

          <div>
            <label className="mb-1 block font-body text-caption text-steel-400">Contraseña</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                className="input w-full pr-10"
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                aria-label={showPw ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-steel-500 hover:text-arctic"
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1 block font-body text-caption text-steel-400">Confirmar contraseña</label>
            <input
              type={showPw ? 'text' : 'password'}
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="Repetí tu contraseña"
              className="input w-full"
              required
            />
          </div>

          {error && (
            <p className="rounded-md bg-danger-light/10 px-3 py-2 font-body text-caption text-danger-light">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full justify-center disabled:opacity-50"
          >
            {submitting ? 'Activando...' : 'Activar cuenta'}
          </button>
        </form>
      </div>
    </div>
  );
}
