'use client';

import { useState, useEffect } from 'react';
import { Wrench, HardHat, Sparkles, Factory, Zap, Layers } from 'lucide-react';

const SLIDES = [
  {
    label: 'Soldadura & Estructuras',
    icon: Factory,
    gradient: 'from-[#0a1628] via-[#1a3a5c] to-[#0d2340]',
    accent: '#2D8FCC',
    tag: 'Metalurgica',
    desc: 'Fabricación de rejas, portones, estructuras metálicas y trabajos de soldadura en general.',
    photo: null as string | null,
  },
  {
    label: 'Obra civil & Remodelación',
    icon: HardHat,
    gradient: 'from-[#1a1200] via-[#2d2000] to-[#1a1200]',
    accent: '#E8862B',
    tag: 'Construcción',
    desc: 'Construcción, ampliación y remodelación de locales comerciales e industriales.',
    photo: null as string | null,
  },
  {
    label: 'Mantenimiento general',
    icon: Wrench,
    gradient: 'from-[#0a1a0f] via-[#0f2d1a] to-[#0a1a0f]',
    accent: '#48BB78',
    tag: 'Preventivo & Correctivo',
    desc: 'Mantenimiento integral de instalaciones, equipos y espacios industriales.',
    photo: null as string | null,
  },
  {
    label: 'Limpieza industrial',
    icon: Sparkles,
    gradient: 'from-[#1a0a28] via-[#2d1a40] to-[#1a0a28]',
    accent: '#9F7AEA',
    tag: 'Limpieza profesional',
    desc: 'Limpieza profunda de plantas, depósitos, oficinas y espacios comerciales.',
    photo: null as string | null,
  },
  {
    label: 'Eléctrica & Plomería',
    icon: Zap,
    gradient: 'from-[#1a1200] via-[#2d2000] to-[#0a1628]',
    accent: '#F6E05E',
    tag: 'Instalaciones',
    desc: 'Instalaciones eléctricas, sanitarias y de gas para todo tipo de obras.',
    photo: null as string | null,
  },
];

export function HeroDiagonalCarousel() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setActive((a) => (a + 1) % SLIDES.length), 3500);
    return () => clearInterval(t);
  }, []);

  // Show 3 cards: previous (back), active (front), next (hint)
  const prev = (active - 1 + SLIDES.length) % SLIDES.length;
  const next = (active + 1) % SLIDES.length;

  return (
    <div className="relative h-[420px] w-[320px] select-none" style={{ perspective: '1000px' }}>
      {SLIDES.map((slide, i) => {
        const Icon = slide.icon;
        const isFront = i === active;
        const isBack = i === prev;
        const isHint = i === next;
        const isVisible = isFront || isBack || isHint;

        if (!isVisible) return null;

        return (
          <div
            key={slide.label}
            onClick={() => isFront && setActive(next)}
            className={`absolute inset-0 rounded-2xl border overflow-hidden transition-all duration-700 cursor-pointer`}
            style={{
              background: `linear-gradient(135deg, ${slide.gradient.replace('from-', '').replace('via-', '').replace('to-', '')})`,
              borderColor: isFront ? slide.accent + '60' : '#ffffff08',
              transform: isFront
                ? 'rotate(-8deg) translateX(0px) translateY(0px) scale(1)'
                : isHint
                ? 'rotate(-8deg) translateX(28px) translateY(-28px) scale(0.92)'
                : 'rotate(-8deg) translateX(-28px) translateY(28px) scale(0.92)',
              zIndex: isFront ? 30 : isHint ? 20 : 10,
              opacity: isFront ? 1 : 0.5,
              boxShadow: isFront
                ? `0 32px 64px -12px ${slide.accent}30, 0 0 0 1px ${slide.accent}20`
                : 'none',
            }}
          >
            {/* Photo or gradient background */}
            {slide.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={slide.photo} alt={slide.label} className="absolute inset-0 h-full w-full object-cover" />
            ) : null}
            <div className={`absolute inset-0 bg-gradient-to-br ${slide.gradient} ${slide.photo ? 'opacity-70' : ''}`} />

            {/* Diagonal stripe pattern */}
            <svg className="absolute inset-0 h-full w-full opacity-[0.06]" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id={`diag-${i}`} x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                  <line x1="0" y1="0" x2="0" y2="20" stroke="white" strokeWidth="3" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill={`url(#diag-${i})`} />
            </svg>

            {/* Accent glow */}
            <div
              className="absolute -right-16 -top-16 h-48 w-48 rounded-full blur-3xl opacity-30"
              style={{ background: slide.accent }}
            />
            <div
              className="absolute -bottom-12 -left-12 h-40 w-40 rounded-full blur-3xl opacity-20"
              style={{ background: slide.accent }}
            />

            {/* Content */}
            <div className="relative z-10 flex h-full flex-col justify-between p-8">
              {/* Top: icon + tag */}
              <div className="flex items-start justify-between">
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-xl"
                  style={{ background: slide.accent + '25', border: `1px solid ${slide.accent}40` }}
                >
                  <Icon className="h-7 w-7" style={{ color: slide.accent }} />
                </div>
                <span
                  className="rounded-full px-3 py-1 font-body text-[0.6rem] font-semibold uppercase tracking-wider"
                  style={{ background: slide.accent + '20', color: slide.accent, border: `1px solid ${slide.accent}30` }}
                >
                  {slide.tag}
                </span>
              </div>

              {/* Bottom: label + dots */}
              <div>
                <p className="font-body text-caption uppercase tracking-[0.15em] text-white/40">Full Service & Clean</p>
                <h3 className="mt-1 font-display text-[1.6rem] font-bold uppercase leading-tight text-white">
                  {slide.label}
                </h3>
                <p className="mt-2 font-body text-[0.72rem] leading-relaxed text-white/50 line-clamp-2">
                  {slide.desc}
                </p>
                {/* Progress dots */}
                <div className="mt-5 flex gap-1.5">
                  {SLIDES.map((_, di) => (
                    <div
                      key={di}
                      onClick={(e) => { e.stopPropagation(); setActive(di); }}
                      className="h-1 rounded-full transition-all duration-500 cursor-pointer"
                      style={{
                        width: di === active ? '20px' : '6px',
                        background: di === active ? slide.accent : 'rgba(255,255,255,0.2)',
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
