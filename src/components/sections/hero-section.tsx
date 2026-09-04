import Link from 'next/link';
import { ArrowRight, ShoppingCart, Wrench, Droplets, HardHat, Zap, Clock, Shield, Star } from 'lucide-react';
import { HeroDiagonalCarousel } from '@/components/sections/hero-carousel';

const SERVICES = [
  { icon: Wrench, label: 'Metalúrgica', sub: 'Soldadura & estructuras', accent: '#2D8FCC' },
  { icon: HardHat, label: 'Obra civil', sub: 'Construcción & remodelación', accent: '#E8862B' },
  { icon: Droplets, label: 'Limpieza industrial', sub: 'Plantas, depósitos, oficinas', accent: '#48BB78' },
  { icon: Zap, label: 'Instalaciones', sub: 'Eléctrica & plomería', accent: '#9F7AEA' },
];

const STATS = [
  { number: '150+', label: 'Clientes' },
  { number: '10+', label: 'Años exp.' },
  { number: '24h', label: 'Respuesta' },
  { number: '100%', label: 'Garantía' },
];

export function HeroSection() {
  return (
    <section className="relative isolate overflow-hidden bg-slate-50">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_20%,rgba(45,143,204,.13),transparent_34%),radial-gradient(circle_at_85%_80%,rgba(232,134,43,.10),transparent_30%)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue/30 to-transparent" />
      <div className="container-main relative">
        <div className="grid min-h-[78vh] items-center gap-12 py-12 md:py-20 lg:grid-cols-[1.08fr_.92fr] lg:gap-16">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue/15 bg-white/80 px-3 py-1.5 shadow-sm backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="font-body text-[.65rem] font-bold uppercase tracking-[.12em] text-slate-600">Atención inmediata disponible</span>
            </div>

            <h1 className="max-w-3xl font-display text-[clamp(3rem,6.5vw,5.6rem)] font-bold uppercase leading-[.88] tracking-[-.025em] text-[#0B1120]">
              SERVICIO <span className="text-blue">COMPLETO</span> Y <span className="text-orange">LIMPIEZA</span> TOTAL
            </h1>
            <div className="mt-6 flex items-center gap-2">
              <span className="h-1 w-16 rounded-full bg-blue" />
              <span className="h-1 w-8 rounded-full bg-orange" />
            </div>
            <p className="mt-7 max-w-xl font-body text-body-lg leading-8 text-slate-600">
              Mantenimiento, limpieza profesional, obras civiles y metalúrgica. Presupuesto claro, seguimiento del trabajo y garantía.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/contacto?tipo=presupuesto" className="btn-primary px-7 py-4">
                Pedir presupuesto <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/tienda" className="btn-secondary px-7 py-4">
                <ShoppingCart className="h-4 w-4" /> Tienda online
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-slate-200 pt-6">
              <div className="flex gap-1">{[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-orange text-orange" />)}</div>
              <span className="font-body text-xs font-medium text-slate-500">Presupuesto sin costo · Respuesta en 24h</span>
              <span className="inline-flex items-center gap-1.5 font-body text-xs font-semibold text-emerald-700"><Shield className="h-4 w-4" /> Garantía</span>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-5 rounded-[2rem] bg-blue/5 blur-2xl" />
            <div className="relative overflow-hidden rounded-[1.75rem] border border-white bg-white p-3 shadow-[0_30px_80px_rgba(15,23,42,.12)]">
              <div className="rounded-2xl bg-[#0B1120] p-5 sm:p-6">
                <div className="mb-5 flex items-end justify-between">
                  <div>
                    <span className="font-body text-[.65rem] font-bold uppercase tracking-[.14em] text-blue-300">Soluciones integrales</span>
                    <h2 className="mt-1 font-display text-2xl font-bold uppercase text-white">Todo en un solo lugar</h2>
                  </div>
                  <Clock className="h-6 w-6 text-orange" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {SERVICES.map(({ icon: Icon, label, sub, accent }) => (
                    <div key={label} className="group rounded-xl border border-white/10 bg-white/[.06] p-4 transition-all hover:-translate-y-1 hover:bg-white/[.10]">
                      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: `${accent}18`, border: `1px solid ${accent}45` }}>
                        <Icon className="h-5 w-5" style={{ color: accent }} />
                      </div>
                      <p className="font-display text-sm font-bold uppercase leading-tight text-white">{label}</p>
                      <p className="mt-1 font-body text-[.68rem] leading-4 text-slate-400">{sub}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 grid grid-cols-4 gap-2">
                  {STATS.map(s => (
                    <div key={s.label} className="rounded-xl border border-white/10 bg-white/[.04] px-2 py-3 text-center">
                      <div className="font-display text-lg font-bold leading-none text-white">{s.number}</div>
                      <div className="mt-1 font-body text-[.55rem] font-semibold uppercase tracking-wider text-slate-500">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="pb-10 md:pb-14"><HeroDiagonalCarousel /></div>
      </div>
    </section>
  );
}
