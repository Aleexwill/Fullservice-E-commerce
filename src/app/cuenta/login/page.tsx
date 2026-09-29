'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, LogIn } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/customer/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Credenciales incorrectas');
        return;
      }
      router.push('/cuenta');
      router.refresh();
    } catch {
      setError('Error de conexión, intentá de nuevo');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="border-b border-gray-200">
        <div className="container-main flex items-center gap-2 py-3 font-body text-caption text-[#8094B4]">
          <Link href="/" className="hover:text-[#0B1120]">Inicio</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-[#0B1120]">Iniciar sesión</span>
        </div>
      </div>

      <section className="section">
        <div className="container-main max-w-md">
          <div className="mb-8 text-center">
            <LogIn className="mx-auto mb-3 h-10 w-10 text-[#2D8FCC]" />
            <h1 className="font-display text-h2 uppercase text-[#0B1120]">Mi cuenta</h1>
            <p className="mt-2 font-body text-body-sm text-[#4A5E80]">Ingresá para ver tus pedidos</p>
          </div>

          <form onSubmit={handleSubmit} className="card space-y-4 p-6">
            <div>
              <label className="mb-1 block font-body text-caption font-medium text-[#0B1120]">Email</label>
              <input
                type="email"
                required
                className="input-field w-full"
                placeholder="tu@email.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 block font-body text-caption font-medium text-[#0B1120]">Contraseña</label>
              <input
                type="password"
                required
                className="input-field w-full"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>

            {error && (
              <p className="rounded-md bg-red-50 px-3 py-2 font-body text-caption text-red-600">{error}</p>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>

          <p className="mt-4 text-center font-body text-caption text-[#4A5E80]">
            ¿Hiciste un pedido y todavía no activaste tu cuenta?{' '}
            <Link href="/cuenta/registro" className="font-medium text-[#2D8FCC] hover:underline">
              Crear contraseña
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
