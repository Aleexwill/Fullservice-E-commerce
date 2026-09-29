'use client';

import Link from 'next/link';
import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

function ActivarForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) setError('El enlace de activación no es válido.');
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password !== confirm) { setError('Las contraseñas no coinciden'); return; }
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/customer/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error || 'No se pudo activar la cuenta'); return; }
      setDone(true);
      setTimeout(() => router.push('/cuenta'), 2000);
    } catch {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="text-center">
        <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-green-500" />
        <h1 className="font-display text-h2 uppercase text-[#0B1120]">¡Cuenta activada!</h1>
        <p className="mt-3 font-body text-body-sm text-[#4A5E80]">Redirigiendo a tu cuenta...</p>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="text-center">
        <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-400" />
        <h1 className="font-display text-h2 uppercase text-[#0B1120]">Enlace inválido</h1>
        <p className="mt-3 font-body text-body-sm text-[#4A5E80]">El enlace expiró o no es válido.</p>
        <Link href="/cuenta/registro" className="btn-primary mt-6 inline-block">Crear cuenta</Link>
      </div>
    );
  }

  return (
    <>
      <div className="mb-8 text-center">
        <h1 className="font-display text-h2 uppercase text-[#0B1120]">Activá tu cuenta</h1>
        <p className="mt-2 font-body text-body-sm text-[#4A5E80]">Elegí una contraseña para acceder a tus pedidos.</p>
      </div>
      <form onSubmit={handleSubmit} className="card space-y-4 p-6">
        <div>
          <label className="mb-1 block font-body text-caption font-medium text-[#0B1120]">Nueva contraseña</label>
          <input
            type="password"
            required
            className="input-field w-full"
            placeholder="Mínimo 6 caracteres"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block font-body text-caption font-medium text-[#0B1120]">Confirmar contraseña</label>
          <input
            type="password"
            required
            className="input-field w-full"
            placeholder="Repetí la contraseña"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>
        {error && (
          <div className="flex items-center gap-2 rounded-md bg-red-50 px-3 py-2 text-red-600">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <p className="font-body text-caption">{error}</p>
          </div>
        )}
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Activando...</> : 'Activar cuenta'}
        </button>
      </form>
    </>
  );
}

export default function ActivarPage() {
  return (
    <section className="section">
      <div className="container-main max-w-md">
        <Suspense fallback={<div className="text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-[#2D8FCC]" /></div>}>
          <ActivarForm />
        </Suspense>
      </div>
    </section>
  );
}
