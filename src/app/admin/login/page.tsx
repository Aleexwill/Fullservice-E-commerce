'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Lock } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Credenciales inválidas');
        setLoading(false);
        return;
      }
      const redirectTo = searchParams.get('redirect') || '/admin';
      router.push(redirectTo);
      router.refresh();
    } catch {
      setError('Error de conexión');
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-steel-900 px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-lg bg-steel-800 p-8 shadow-lg">
        <div className="mb-6 flex items-center gap-2">
          <Lock className="h-5 w-5 text-blue" />
          <h1 className="text-lg font-semibold text-arctic">Acceso administrador</h1>
        </div>

        {error && (
          <div className="mb-4 rounded bg-danger-light/10 px-3 py-2 text-sm text-danger-light">{error}</div>
        )}

        <label className="mb-1 block text-sm text-steel-300">Usuario</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          className="mb-4 w-full rounded border border-steel-600 bg-steel-900 px-3 py-2 text-arctic"
        />

        <label className="mb-1 block text-sm text-steel-300">Contraseña</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="mb-6 w-full rounded border border-steel-600 bg-steel-900 px-3 py-2 text-arctic"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-blue px-4 py-2 font-medium text-arctic disabled:opacity-50"
        >
          {loading ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
