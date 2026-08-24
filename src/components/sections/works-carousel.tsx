'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Wrench, HardHat, Sparkles, Factory } from 'lucide-react';

const WORKS = [
  {
    id: 1,
    gradient: 'from-blue/30 via-steel-900 to-carbon',
    accent: '#2D8FCC',
    icon: Wrench,
    title: 'Instalación eléctrica industrial',
    category: 'Mantenimiento',
    detail: 'Tendido de cableado, tableros y automatización en planta industrial.',
  },
  {
    id: 2,
    gradient: 'from-yellow/20 via-steel-900 to-carbon',
    accent: '#F6A623',
    icon: HardHat,
    title: 'Construcción civil — Estructura',
    category: 'Construcción',
    detail: 'Columnas, vigas y losas de hormigón armado para edificio comercial.',
  },
  {
    id: 3,
    gradient: 'from-[#48BB78]/20 via-steel-900 to-carbon',
    accent: '#48BB78',
    icon: Sparkles,
    title: 'Limpieza profunda de instalaciones',
    category: 'Limpieza',
    detail: 'Tratamiento de pisos, superficies y áreas industriales con equipos profesionales.',
  },
  {
    id: 4,
    gradient: 'from-orange/20 via-steel-900 to-carbon',
    accent: '#E8631A',
    icon: Factory,
    title: 'Estructura metálica — Galpón',
    category: 'Metalúrgica',
    detail: 'Diseño y montaje de estructura metálica para galpón de 800 m².',
  },
  {
    id: 5,
    gradient: 'from-blue/20 via-steel-900 to-carbon',
    accent: '#2D8FCC',
    icon: Wrench,
    title: 'Mantenimiento edilicio preventivo',
    category: 'Mantenimiento',
    detail: 'Plan de mantenimiento mensual: plomería, electricidad y pintura.',
  },
  {
    id: 6,
    gradient: 'from-yellow/15 via-steel-900 to-carbon',
    accent: '#F6A623',
    icon: HardHat,
    title: 'Obra civil — Ampliación',
    category: 'Construcción',
    detail: 'Ampliación de 200 m² en planta baja con terminaciones de primera calidad.',
  },
];

export function WorksCarousel() {
  const [current, setCurrent] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const total = WORKS.length;

  const next = () => setCurrent((c) => (c + 1) % total);
  const prev = () => setCurrent((c) => (c - 1 + total) % total);

  useEffect(() => {
    if (isHovered) return;
    timerRef.current = setInterval(next, 4000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isHovered]);

  return (
    <section className="section border-t border-steel-900/40">
      <div className="container-main">
        <div className="mb-10">
          <span className="overline mb-2 block">Galería de trabajos</span>
          <h2 className="font-display text-h1 uppercase text-arctic">Nuestras obras</h2>
          <div className="mt-4 h-[3px] w-12 rounded-sm bg-gradient-to-r from-blue to-orange" />
          <p className="mt-4 font-body text-body text-steel-300">
            Cada proyecto refleja nuestro compromiso con la calidad y la precisión.
          </p>
        </div>

        <div
          className="relative overflow-hidden rounded-xl"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Slides */}
          <div
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${current * 100}%)` }}
          >
            {WORKS.map((w) => {
              const Icon = w.icon;
              return (
                <div key={w.id} className={`relative flex min-w-full flex-col items-center justify-center bg-gradient-to-br ${w.gradient} h-[420px] md:h-[500px]`}>
                  {/* decorative background icon */}
                  <Icon className="absolute right-8 top-8 h-32 w-32 opacity-5 md:h-48 md:w-48" style={{ color: w.accent }} />
                  <div className="relative z-10 flex flex-col items-center gap-4 px-6 text-center">
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-white/10 bg-carbon/60 backdrop-blur-sm">
                      <Icon className="h-10 w-10" style={{ color: w.accent }} />
                    </div>
                    <div>
                      <span className="mb-2 inline-block rounded-full border px-3 py-0.5 font-body text-caption font-semibold uppercase tracking-wider" style={{ borderColor: `${w.accent}50`, color: w.accent, background: `${w.accent}15` }}>{w.category}</span>
                      <h3 className="mt-2 font-display text-h2 text-arctic">{w.title}</h3>
                      <p className="mx-auto mt-3 max-w-md font-body text-body text-steel-400">{w.detail}</p>
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-1 opacity-60" style={{ background: `linear-gradient(to right, transparent, ${w.accent}, transparent)` }} />
                </div>
              );
            })}
          </div>

          {/* Nav buttons */}
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-carbon/70 p-2 text-arctic backdrop-blur-sm transition hover:bg-carbon"
            aria-label="Anterior"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-carbon/70 p-2 text-arctic backdrop-blur-sm transition hover:bg-carbon"
            aria-label="Siguiente"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* Dots */}
          <div className="absolute bottom-4 right-6 flex gap-1.5">
            {WORKS.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`h-1.5 rounded-full transition-all ${i === current ? 'w-6 bg-blue-bright' : 'w-1.5 bg-white/40'}`}
                aria-label={`Ir a foto ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
