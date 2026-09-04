'use client';

import { useState, useEffect, useRef } from 'react';

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

const INTERVAL = 4000;

export function HeroDiagonalCarousel() {
  const [slides, setSlides] = useState<Slide[]>(FALLBACK_SLIDES);
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);
  const [animKey, setAnimKey] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetch('/api/carousel-slides')
      .then((r) => r.json())
      .then((data: Slide[]) => {
        if (Array.isArray(data) && data.length > 0) setSlides(data);
      })
      .catch(() => {});
  }, []);

  const startCycle = (startIndex: number) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (progressRef.current) clearInterval(progressRef.current);

    setProgress(0);
    setAnimKey((k) => k + 1);

    let p = 0;
    progressRef.current = setInterval(() => {
      p += 100 / (INTERVAL / 50);
      setProgress(Math.min(p, 100));
    }, 50);

    intervalRef.current = setInterval(() => {
      setActive((a) => {
        const next = (a + 1) % slides.length;
        setProgress(0);
        setAnimKey((k) => k + 1);
        let pp = 0;
        if (progressRef.current) clearInterval(progressRef.current);
        progressRef.current = setInterval(() => {
          pp += 100 / (INTERVAL / 50);
          setProgress(Math.min(pp, 100));
        }, 50);
        return next;
      });
    }, INTERVAL);

    return startIndex;
  };

  useEffect(() => {
    if (slides.length < 2) return;
    startCycle(0);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (progressRef.current) clearInterval(progressRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slides.length]);

  const handleSelect = (i: number) => {
    setActive(i);
    startCycle(i);
  };

  if (slides.length === 0) return null;

  const current = slides[active];

  return (
    <div className="w-full">
      <div className="relative flex gap-0 overflow-hidden rounded-2xl border border-white/[0.06]" style={{ minHeight: '200px' }}>

        {/* Left: numbered service list */}
        <div className="relative z-10 flex flex-col border-r border-white/[0.08] bg-black/30 backdrop-blur-sm" style={{ width: 'clamp(160px, 22vw, 260px)', flexShrink: 0 }}>
          {slides.map((slide, i) => {
            const isActive = i === active;
            return (
              <button
                key={slide.id}
                onClick={() => handleSelect(i)}
                className="group relative flex items-center gap-3 px-4 py-3.5 text-left transition-all duration-300 focus:outline-none"
                style={{
                  background: isActive ? slide.accent + '12' : 'transparent',
                  borderLeft: isActive ? `2px solid ${slide.accent}` : '2px solid transparent',
                }}
              >
                {/* Number */}
                <span
                  className="font-display text-[0.65rem] font-bold tabular-nums transition-all duration-300"
                  style={{ color: isActive ? slide.accent : 'rgba(255,255,255,0.2)', minWidth: '1.5rem' }}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>

                {/* Label */}
                <div className="min-w-0">
                  <p
                    className="truncate font-body text-[0.68rem] font-semibold leading-tight transition-colors duration-300"
                    style={{ color: isActive ? '#fff' : 'rgba(255,255,255,0.45)' }}
                  >
                    {slide.label}
                  </p>
                  <p
                    className="mt-0.5 truncate font-body text-[0.55rem] uppercase tracking-wider transition-colors duration-300"
                    style={{ color: isActive ? slide.accent : 'rgba(255,255,255,0.2)' }}
                  >
                    {slide.tag}
                  </p>
                </div>

                {/* Active indicator dot */}
                {isActive && (
                  <span
                    className="ml-auto h-1.5 w-1.5 flex-shrink-0 rounded-full"
                    style={{ background: slide.accent, boxShadow: `0 0 6px ${slide.accent}` }}
                  />
                )}
              </button>
            );
          })}

          {/* Bottom progress bar */}
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/5">
            <div
              className="h-full transition-none"
              style={{ width: `${progress}%`, background: current.accent, transition: 'width 50ms linear' }}
            />
          </div>
        </div>

        {/* Right: featured panel */}
        <div className="relative flex-1 overflow-hidden" style={{ minHeight: '200px' }}>
          {/* Background photo / gradient */}
          {current.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={`img-${animKey}`}
              src={current.photoUrl}
              alt={current.label}
              className="absolute inset-0 h-full w-full object-cover"
              style={{ animation: 'fsKenBurns 5s ease-out forwards' }}
            />
          ) : null}

          <div
            className={`absolute inset-0 bg-gradient-to-br ${current.gradient}`}
            style={{ opacity: current.photoUrl ? (current.overlayOpacity ?? 55) / 100 : 0.92 }}
          />

          {/* Subtle texture grid */}
          <svg className="absolute inset-0 h-full w-full opacity-[0.035]" aria-hidden="true">
            <defs>
              <pattern id="fs-grid" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
                <path d="M 32 0 L 0 0 0 32" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#fs-grid)" />
          </svg>

          {/* Accent glow blob */}
          <div
            className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full blur-3xl"
            style={{ background: current.accent, opacity: 0.15 }}
          />
          <div
            className="pointer-events-none absolute -bottom-8 left-1/3 h-32 w-32 rounded-full blur-2xl"
            style={{ background: current.accent, opacity: 0.08 }}
          />

          {/* Content */}
          <div key={animKey} className="relative z-10 flex h-full flex-col justify-between p-6" style={{ animation: 'fsSlideIn 0.45s cubic-bezier(0.22,1,0.36,1) forwards' }}>
            {/* Top: tag */}
            <div className="flex items-center gap-2">
              <span
                className="rounded-full px-2.5 py-0.5 font-body text-[0.55rem] font-bold uppercase tracking-widest"
                style={{ background: current.accent + '20', color: current.accent, border: `1px solid ${current.accent}35` }}
              >
                {current.tag}
              </span>
              <span className="h-px flex-1 max-w-[40px]" style={{ background: `linear-gradient(to right, ${current.accent}50, transparent)` }} />
            </div>

            {/* Bottom: service info */}
            <div>
              <p className="font-body text-[0.5rem] uppercase tracking-[0.2em] text-white/35">Full Service & Clean</p>
              <h3 className="mt-1 font-display text-[1.35rem] font-black uppercase leading-none tracking-tight text-white" style={{ textShadow: `0 0 40px ${current.accent}30` }}>
                {current.label}
              </h3>
              {current.description && (
                <p className="mt-2 font-body text-[0.68rem] leading-relaxed text-white/55 line-clamp-2 max-w-[340px]">
                  {current.description}
                </p>
              )}

              {/* Accent underline bar */}
              <div className="mt-3 flex items-center gap-2">
                <div className="h-[3px] w-8 rounded-full" style={{ background: current.accent }} />
                <div className="h-[1px] w-4 rounded-full" style={{ background: current.accent, opacity: 0.4 }} />
              </div>
            </div>
          </div>

          {/* Slide counter (top-right corner) */}
          <div className="absolute right-4 top-4 z-10 flex items-baseline gap-0.5 font-display">
            <span className="text-[1rem] font-black tabular-nums" style={{ color: current.accent }}>
              {String(active + 1).padStart(2, '0')}
            </span>
            <span className="text-[0.6rem] font-bold text-white/25">/{String(slides.length).padStart(2, '0')}</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fsSlideIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fsKenBurns {
          from { transform: scale(1.06); }
          to   { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
