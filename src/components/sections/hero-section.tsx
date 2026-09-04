import Link from 'next/link';
import { ArrowRight, ShoppingCart, Wrench, Droplets, HardHat, Zap, Clock, Shield, Star } from 'lucide-react';
import { HeroDiagonalCarousel } from '@/components/sections/hero-carousel';

const SERVICES = [
  { icon: Wrench,   label: 'Metalúrgica',       sub: 'Soldadura & estructuras',    accent: '#2D8FCC' },
  { icon: HardHat,  label: 'Obra civil',         sub: 'Construcción & remodelación', accent: '#E8862B' },
  { icon: Droplets, label: 'Limpieza industrial',sub: 'Plantas, depósitos, oficinas', accent: '#48BB78' },
  { icon: Zap,      label: 'Instalaciones',      sub: 'Eléctrica & plomería',       accent: '#9F7AEA' },
];

const STATS = [
  { number: '150+', label: 'Clientes' },
  { number: '10+',  label: 'Años exp.' },
  { number: '24h',  label: 'Respuesta' },
  { number: '100%', label: 'Garantía' },
];

export function HeroSection() {
  return (
    <section className="relative flex min-h-[85vh] items-center overflow-hidden bg-white">
      {/* Subtle grid pattern */}
      <svg className="absolute inset-0 h-full w-full" aria-hidden="true">
        <defs>
          <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#2D8FCC" strokeWidth="0.4" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" opacity="0.045" />
      </svg>

      {/* Orange vertical accent bar — right side */}
      <div
        className="absolute right-0 top-0 h-full w-1.5"
        style={{ background: 'linear-gradient(180deg, #E8862B 0%, #2D8FCC 100%)' }}
      />

      {/* Blue radial wash — top left */}
      <div
        className="absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full opacity-[0.06]"
        style={{ background: 'radial-gradient(circle, #2D8FCC, transparent 70%)' }}
      />

      <div className="container-main relative z-10 w-full">
        <div className="flex flex-col gap-12 py-12 md:py-20">

          {/* Two-column: texto | panel lateral */}
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">

            {/* Left — contenido principal */}
            <div>
              <div className="mb-6 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-[#2F855A] shadow-[0_0_8px_rgba(47,133,90,0.5)]" />
                <span className="font-body text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-[#4A5E80]">
                  Atención inmediata disponible
                </span>
              </div>

              <h1 className="font-display text-[clamp(2.5rem,5vw,4.5rem)] font-bold uppercase leading-[0.92] tracking-tight text-[#0B1120]">
                SERVICIO
                <br />
                <span className="text-[#2D8FCC]">COMPLETO</span> Y
                <br />
                <span className="text-[#E8862B]">LIMPIEZA</span> TOTAL
              </h1>

              {/* Decorative line under heading */}
              <div className="mt-5 flex gap-1.5">
                <div className="h-[3px] w-16 rounded-sm bg-[#2D8FCC]" />
                <div className="h-[3px] w-8 rounded-sm bg-[#E8862B]" />
              </div>

              <p className="mt-6 font-body text-body-lg leading-[1.7] text-[#4A5E80]">
                Mantenimiento, limpieza profesional, obras civiles y metalúrgica.
                Presupuesto claro, seguimiento del trabajo y garantía.
              </p>

              <div className="mt-9 flex flex-wrap gap-4">
                <Link href="/contacto?tipo=presupuesto" className="btn-primary px-8 py-4 text-[0.8rem]">
                  Pedir presupuesto
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/tienda"
                  className="inline-flex items-center justify-center gap-2 rounded border-2 border-[#E2E8F0] bg-white px-8 py-4 font-body text-[0.8rem] font-semibold uppercase tracking-[0.05em] text-[#4A5E80] transition-all hover:border-[#2D8FCC]/40 hover:bg-[#F4F7FB] hover:text-[#0B1120]"
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
                  <div key={s.label} className="rounded-xl border border-gray-200 bg-white px-3 py-3 text-center shadow-sm">
                    <div className="font-display text-[1.5rem] font-bold leading-none text-[#0B1120]">{s.number}</div>
                    <div className="mt-1 font-body text-[0.6rem] font-medium uppercase tracking-[0.08em] text-[#8094B4]">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Service cards 2×2 */}
              <div className="grid grid-cols-2 gap-3">
                {SERVICES.map(({ icon: Icon, label, sub, accent }) => (
                  <div
                    key={label}
                    className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-4 transition-all duration-300 hover:shadow-md"
                    style={{ '--accent': accent } as React.CSSProperties}
                  >
                    {/* Color accent top border on hover */}
                    <div
                      className="absolute left-0 top-0 h-[3px] w-full opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                      style={{ background: accent }}
                    />
                    <div
                      className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg"
                      style={{ background: accent + '14', border: `1px solid ${accent}30` }}
                    >
                      <Icon className="h-4 w-4" style={{ color: accent }} />
                    </div>
                    <p className="font-display text-[0.8rem] font-bold uppercase leading-tight text-[#0B1120]">{label}</p>
                    <p className="mt-0.5 font-body text-[0.65rem] text-[#8094B4]">{sub}</p>
                  </div>
                ))}
              </div>

              {/* Trust badge */}
              <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-[#F4F7FB] px-4 py-3">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-[#E8862B] text-[#E8862B]" />
                  ))}
                </div>
                <div className="h-4 w-px bg-gray-300" />
                <Clock className="h-3.5 w-3.5 shrink-0 text-[#2D8FCC]" />
                <span className="font-body text-[0.65rem] text-[#4A5E80]">Presupuesto sin costo · Respuesta en 24h</span>
                <Shield className="ml-auto h-3.5 w-3.5 shrink-0 text-[#2F855A]" />
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
