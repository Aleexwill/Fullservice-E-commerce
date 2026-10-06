'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, Mail, KeyRound, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/customer/otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'No se pudo enviar el código');
        return;
      }
      setStep('code');
    } catch {
      setError('Error de conexión, intentá de nuevo');
    } finally {
      setLoading(false);
    }
  }

  async function handleCodeSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/customer/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), code: code.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Código incorrecto');
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
            {step === 'email' ? (
              <Mail className="mx-auto mb-3 h-10 w-10 text-[#2D8FCC]" />
            ) : (
              <KeyRound className="mx-auto mb-3 h-10 w-10 text-[#2D8FCC]" />
            )}
            <h1 className="font-display text-h2 uppercase text-[#0B1120]">Mi cuenta</h1>
            <p className="mt-2 font-body text-body-sm text-[#4A5E80]">
              {step === 'email'
                ? 'Ingresá tu email para recibir un código de acceso'
                : `Ingresá el código que enviamos a ${email}`}
            </p>
          </div>

          {step === 'email' ? (
            <form onSubmit={handleEmailSubmit} className="card space-y-4 p-6">
              <div>
                <label className="mb-1 block font-body text-caption font-medium text-[#0B1120]">Email</label>
                <input
                  type="email"
                  required
                  autoFocus
                  className="input-field w-full"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              {error && (
                <p className="rounded-md bg-red-50 px-3 py-2 font-body text-caption text-red-600">{error}</p>
              )}
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? <><Loader2 className="mr-2 inline h-4 w-4 animate-spin" />Enviando...</> : 'Enviar código'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleCodeSubmit} className="card space-y-4 p-6">
              <div>
                <label className="mb-1 block font-body text-caption font-medium text-[#0B1120]">Código de 6 dígitos</label>
                <input
                  type="text"
                  required
                  autoFocus
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  className="input-field w-full text-center text-xl tracking-widest"
                  placeholder="000000"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                />
              </div>
              {error && (
                <p className="rounded-md bg-red-50 px-3 py-2 font-body text-caption text-red-600">{error}</p>
              )}
              <button type="submit" disabled={loading || code.length !== 6} className="btn-primary w-full">
                {loading ? <><Loader2 className="mr-2 inline h-4 w-4 animate-spin" />Verificando...</> : 'Ingresar'}
              </button>
              <button
                type="button"
                onClick={() => { setStep('email'); setCode(''); setError(''); }}
                className="w-full text-center font-body text-caption text-[#4A5E80] hover:text-[#0B1120]"
              >
                ← Cambiar email
              </button>
            </form>
          )}
        </div>
      </section>
    </>
  );
}
