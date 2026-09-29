'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, UserPlus, CheckCircle2 } from 'lucide-react';

export default function RegistroPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', name: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) {
      setError('Las contraseñas no coinciden');
      return;
    }
    if (form.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/customer/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, name: form.name, password: form.password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'No se pudo crear la cuenta');
        return;
      }
      if (data.token) {
        // auto-login si el servidor devuelve token
        router.push('/cuenta');
        router.refresh();
      } else {
        setDone(true);
      }
    } catch {
      setError('Error de conexión, intentá de nuevo');
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <section className="section">
        <div className="container-main max-w-md text-center">
          <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-green-500" />
          <h1 className="font-display text-h2 uppercase text-[#0B1120]">¡Cuenta activada!</h1>
          <p className="mt-3 font-body text-body-sm text-[#4A5E80]">Ya podés ingresar con tu email y contraseña.</p>
          <Link href="/cuenta/login" className="btn-primary mt-6 inline-block">Ingresar</Link>
        </div>
      </section>
    );
  }

  return (
    <>
      <div className="border-b border-gray-200">
        <div className="container-main flex items-center gap-2 py-3 font-body text-caption text-[#8094B4]">
          <Link href="/" className="hover:text-[#0B1120]">Inicio</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-[#0B1120]">Crear cuenta</span>
        </div>
      </div>

      <section className="section">
        <div className="container-main max-w-md">
          <div className="mb-8 text-center">
            <UserPlus className="mx-auto mb-3 h-10 w-10 text-[#2D8FCC]" />
            <h1 className="font-display text-h2 uppercase text-[#0B1120]">Crear cuenta</h1>
            <p className="mt-2 font-body text-body-sm text-[#4A5E80]">
              ¿Ya hiciste un pedido? Usá el mismo email para vincular tu historial.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="card space-y-4 p-6">
            <div>
              <label className="mb-1 block font-body text-caption font-medium text-[#0B1120]">Nombre</label>
              <input
                type="text"
                required
                className="input-field w-full"
                placeholder="Tu nombre completo"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
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
                placeholder="Mínimo 6 caracteres"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 block font-body text-caption font-medium text-[#0B1120]">Confirmar contraseña</label>
              <input
                type="password"
                required
                className="input-field w-full"
                placeholder="Repetí la contraseña"
                value={form.confirm}
                onChange={(e) => setForm({ ...form, confirm: e.target.value })}
              />
            </div>

            {error && (
              <p className="rounded-md bg-red-50 px-3 py-2 font-body text-caption text-red-600">{error}</p>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>

          <p className="mt-4 text-center font-body text-caption text-[#4A5E80]">
            ¿Ya tenés contraseña?{' '}
            <Link href="/cuenta/login" className="font-medium text-[#2D8FCC] hover:underline">Ingresar</Link>
          </p>
        </div>
      </section>
    </>
  );
}
