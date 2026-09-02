'use client';

import { useState, useEffect } from 'react';

interface Slide {
  id: string;
  label: string;
  tag: string;
  description: string;
  photoUrl: string;
  accent: string;
  gradient: string;
  overlayOpacity: number;
  order: number;
}

const FALLBACK_SLIDES: Slide[] = [
  { id: '1', label: 'Soldadura & Estructuras', tag: 'Metalurgica', description: 'Fabricación de rejas, portones, estructuras metálicas y trabajos de soldadura en general.', photoUrl: '', accent: '#2D8FCC', gradient: 'from-[#0a1628] via-[#1a3a5c] to-[#0d2340]', overlayOpacity: 55, order: 0 },
  { id: '2', label: 'Obra civil & Remodelación', tag: 'Construcción', description: 'Construcción, ampliación y remodelación de locales comerciales e industriales.', photoUrl: '', accent: '#E8862B', gradient: 'from-[#1a1200] via-[#2d2000] to-[#1a1200]', overlayOpacity: 55, order: 1 },
  { id: '3', label: 'Mantenimiento general', tag: 'Preventivo & Correctivo', description: 'Mantenimiento integral de instalaciones, equipos y espacios industriales.', photoUrl: '', accent: '#48BB78', gradient: 'from-[#0a1a0f] via-[#0f2d1a] to-[#0a1a0f]', overlayOpacity: 55, order: 2 },
  { id: '4', label: 'Limpieza industrial', tag: 'Limpieza profesional', description: 'Limpieza profunda de plantas, depósitos, oficinas y espacios comerciales.', photoUrl: '', accent: '#9F7AEA', gradient: 'from-[#1a0a28] via-[#2d1a40] to-[#1a0a28]', overlayOpacity: 55, order: 3 },
  { id: '5', label: 'Eléctrica & Plomería', tag: 'Instalaciones', description: 'Instalaciones eléctricas, sanitarias y de gas para todo tipo de obras.', photoUrl: '', accent: '#F6E05E', gradient: 'from-[#1a1200] via-[#2d2000] to-[#0a1628]', overlayOpacity: 55, order: 4 },
];

export function HeroDiagonalCarousel() {
  const [slides, setSlides] = useState<Slide[]>(FALLBACK_SLIDES);
  const [active, setActive] = useState(0);

  useEffect(() => {
    fetch('/api/carousel-slides')
      .then((r) => r.json())
      .then((data: Slide[]) => {
        if (Array.isArray(data) && data.length > 0) setSlides(data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (slides.length < 2) return;
    const t = setInterval(() => setActive((a) => (a + 1) % slides.length), 3500);
    return () => clearInterval(t);
  }, [slides.length]);

  if (slides.length === 0) return null;

  return (
    <div className="w-full">
      {/* Cards row */}
      <div className="flex gap-3 items-end overflow-x-auto pb-1 scrollbar-none" style={{ scrollbarWidth: 'none' }}>
        {slides.map((slide, i) => {
          const isActive = i === active;
          return (
            <div
              key={slide.id}
              onClick={() => setActive(i)}
              className="relative rounded-2xl border overflow-hidden cursor-pointer flex-shrink-0 transition-all duration-500"
              style={{
                width: isActive ? 'clamp(260px, 30vw, 380px)' : 'clamp(120px, 13vw, 180px)',
                height: isActive ? '220px' : '160px',
                borderColor: isActive ? slide.accent + '60' : '#ffffff10',
                boxShadow: isActive ? `0 24px 48px -8px ${slide.accent}30, 0 0 0 1px ${slide.accent}20` : 'none',
                opacity: isActive ? 1 : 0.55,
              }}
            >
              {/* Photo */}
              {slide.photoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={slide.photoUrl} alt={slide.label} className="absolute inset-0 h-full w-full object-cover" />
              )}

              {/* Gradient overlay */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${slide.gradient}`}
                style={{ opacity: slide.photoUrl ? (slide.overlayOpacity ?? 55) / 100 : 1 }}
              />

              {/* Diagonal stripe */}
              <svg className="absolute inset-0 h-full w-full opacity-[0.05]">
                <defs>
                  <pattern id={`diag-h-${i}`} x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                    <line x1="0" y1="0" x2="0" y2="20" stroke="white" strokeWidth="3" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill={`url(#diag-h-${i})`} />
              </svg>

              {/* Accent glow */}
              <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full blur-3xl opacity-25" style={{ background: slide.accent }} />

              {/* Content */}
              <div className="relative z-10 flex h-full flex-col justify-between p-4">
                {/* Tag badge */}
                <div>
                  <span
                    className="rounded-full px-2.5 py-0.5 font-body text-[0.55rem] font-semibold uppercase tracking-wider"
                    style={{ background: slide.accent + '20', color: slide.accent, border: `1px solid ${slide.accent}30` }}
                  >
                    {slide.tag}
                  </span>
                </div>

                {/* Label + description (only active) */}
                <div>
                  <p className="font-body text-[0.5rem] uppercase tracking-[0.15em] text-white/40">Full Service & Clean</p>
                  <h3 className={`mt-0.5 font-display font-bold uppercase leading-tight text-white transition-all duration-500 ${isActive ? 'text-[1.1rem]' : 'text-[0.75rem]'}`}>
                    {slide.label}
                  </h3>
                  {isActive && slide.description && (
                    <p className="mt-1.5 font-body text-[0.65rem] leading-relaxed text-white/50 line-clamp-2">
                      {slide.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress dots */}
      <div className="mt-4 flex gap-1.5 justify-center">
        {slides.map((slide, di) => (
          <div
            key={di}
            onClick={() => setActive(di)}
            className="h-1 rounded-full transition-all duration-500 cursor-pointer"
            style={{
              width: di === active ? '20px' : '6px',
              background: di === active ? slides[active].accent : 'rgba(255,255,255,0.2)',
            }}
          />
        ))}
      </div>
    </div>
  );
}
