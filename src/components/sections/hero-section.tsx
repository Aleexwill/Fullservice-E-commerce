import Link from 'next/link';
import { ArrowRight, ShoppingCart, Wrench, Droplets, HardHat, Zap, Clock, Shield, Star } from 'lucide-react';
import { HeroDiagonalCarousel } from '@/components/sections/hero-carousel';

const SERVICES = [
  { icon: Wrench,   label: 'Metalurgica',       sub: 'Soldadura & estructuras',   accent: '#2D8FCC' },
  { icon: HardHat,  label: 'Obra civil',         sub: 'Construcción & remodelación', accent: '#E8862B' },
  { icon: Droplets, label: 'Limpieza industrial',sub: 'Plantas, depósitos, oficinas', accent: '#48BB78' },
  { icon: Zap,      label: 'Instalaciones',      sub: 'Eléctrica & plomería',      accent: '#9F7AEA' },
];

const STATS = [
  { number: '150+', label: 'Clientes' },
  { number: '10+',  label: 'Años exp.' },
  { number: '24h',  label: 'Respuesta' },
  { number: '100%', label: 'Garantía' },
];

export function HeroSection() {
  return (
    <section className="relative min-h-[85vh] flex items-center overflow-hidden bg-gradient-hero">
      {/* Grid pattern background */}
      <svg className="absolute inset-0 h-full w-full opacity-[0.04]" aria-hidden="true">
        <defs>
          <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse">
            <path d="M 80 0 L 0 0 0 80" fill="none" stroke="#2D8FCC" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Accent lines */}
      <div className="absolute right-[15%] top-0 h-full w-px" style={{ background: 'linear-gradient(180deg, transparent, #2D8FCC20, transparent)' }} />
      <div className="absolute bottom-[20%] left-0 h-px w-full" style={{ background: 'linear-gradient(90deg, transparent, #E8862B10, transparent)' }} />

      <div className="container-main relative z-10 w-full">
        <div className="flex flex-col py-12 md:py-20 gap-12">

          {/* Two-column: texto | panel lateral */}
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">

            {/* Left — contenido principal */}
            <div>
              <div className="mb-6 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-success shadow-[0_0_8px_rgba(47,133,90,0.6)]" />
                <span className="overline text-steel-300">Atencion inmediata disponible</span>
              </div>

              <h1 className="font-display text-[clamp(2.5rem,5vw,4.5rem)] font-bold uppercase leading-[0.95] tracking-tight text-arctic">
                SERVICIO
                <br />
                <span className="text-blue">COMPLETO</span> Y
                <br />
                <span className="text-orange">LIMPIEZA</span> TOTAL
              </h1>

              <p className="mt-7 font-body text-body-lg text-steel-300 leading-[1.7]">
                Mantenimiento, limpieza profesional, obras civiles y metalurgica.
                Presupuesto claro, seguimiento del trabajo y garantia.
              </p>

              <div className="mt-9 flex flex-wrap gap-4">
                <Link href="/contacto?tipo=presupuesto" className="btn-primary px-8 py-4 text-[0.8rem]">
                  Pedir presupuesto
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/tienda"
                  className="inline-flex items-center justify-center gap-2 rounded border-[1.5px] border-steel-700 bg-transparent px-8 py-4 font-body text-[0.8rem] font-semibold uppercase tracking-[0.05em] text-steel-100 transition-all hover:border-steel-500 hover:bg-steel-900/50"
                >
                  <ShoppingCart className="h-4 w-4" />
                  Tienda online
                </Link>
              </div>
            </div>

            {/* Right — panel de servicios + stats */}
            <div className="flex flex-col gap-4">
              {/* Stats strip */}
              <div className="grid grid-cols-4 gap-2">
                {STATS.map(s => (
                  <div key={s.label} className="rounded-xl border border-steel-900/60 bg-carbon-light/60 backdrop-blur-sm px-3 py-3 text-center">
                    <div className="font-display text-[1.5rem] font-bold leading-none text-arctic">{s.number}</div>
                    <div className="mt-1 font-body text-[0.6rem] font-medium uppercase tracking-[0.08em] text-steel-500">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Service cards 2×2 */}
              <div className="grid grid-cols-2 gap-3">
                {SERVICES.map(({ icon: Icon, label, sub, accent }) => (
                  <div
                    key={label}
                    className="group relative overflow-hidden rounded-xl border border-steel-900/60 bg-carbon-light/60 p-4 backdrop-blur-sm transition-all duration-300 hover:border-[var(--accent)]/40 hover:bg-carbon-light"
                    style={{ '--accent': accent } as React.CSSProperties}
                  >
                    {/* Glow corner */}
                    <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-20" style={{ background: accent }} />
                    <div
                      className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg"
                      style={{ background: accent + '18', border: `1px solid ${accent}30` }}
                    >
                      <Icon className="h-4 w-4" style={{ color: accent }} />
                    </div>
                    <p className="font-display text-[0.8rem] font-bold uppercase leading-tight text-arctic">{label}</p>
                    <p className="mt-0.5 font-body text-[0.65rem] text-steel-500">{sub}</p>
                  </div>
                ))}
              </div>

              {/* Trust badge */}
              <div className="flex items-center gap-3 rounded-xl border border-steel-900/60 bg-carbon-light/60 px-4 py-3 backdrop-blur-sm">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-orange text-orange" />
                  ))}
                </div>
                <div className="h-4 w-px bg-steel-800" />
                <Clock className="h-3.5 w-3.5 shrink-0 text-blue" />
                <span className="font-body text-[0.65rem] text-steel-400">Presupuesto sin costo · Respuesta en 24h</span>
                <Shield className="ml-auto h-3.5 w-3.5 shrink-0 text-success" />
              </div>
            </div>
          </div>

          {/* Carrusel horizontal — full width */}
          <HeroDiagonalCarousel />

        </div>
      </div>
    </section>
  );
}
