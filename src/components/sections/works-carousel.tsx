'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const WORKS = [
  {
    id: 1,
    src: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80',
    title: 'Instalación eléctrica industrial',
    category: 'Mantenimiento',
  },
  {
    id: 2,
    src: 'https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=800&q=80',
    title: 'Construcción civil — Estructura',
    category: 'Construcción',
  },
  {
    id: 3,
    src: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
    title: 'Limpieza profunda de instalaciones',
    category: 'Limpieza',
  },
  {
    id: 4,
    src: 'https://images.unsplash.com/photo-1565008447742-97f6f38c985c?w=800&q=80',
    title: 'Estructura metálica — Galpón',
    category: 'Metalúrgica',
  },
  {
    id: 5,
    src: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80',
    title: 'Mantenimiento edilicio preventivo',
    category: 'Mantenimiento',
  },
  {
    id: 6,
    src: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800&q=80',
    title: 'Obra civil — Ampliación',
    category: 'Construcción',
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
            {WORKS.map((w) => (
              <div key={w.id} className="relative min-w-full">
                <img
                  src={w.src}
                  alt={w.title}
                  className="h-[420px] w-full object-cover md:h-[520px]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-carbon/80 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 p-6 md:p-8">
                  <span className="badge-blue mb-2 inline-block">{w.category}</span>
                  <h3 className="font-display text-h2 text-arctic">{w.title}</h3>
                </div>
              </div>
            ))}
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
