'use client';

import { useEffect, useRef } from 'react';

const BRANDS = [
  { name: 'Bosch', color: '#EA0016' },
  { name: 'Stanley', color: '#FFCD00' },
  { name: 'DeWalt', color: '#FFCD11' },
  { name: 'Makita', color: '#00A0E9' },
  { name: '3M', color: '#FF0000' },
  { name: 'Philips', color: '#0B5ED7' },
  { name: 'Schneider', color: '#3DCD58' },
  { name: 'Siemens', color: '#009999' },
  { name: 'Milwaukee', color: '#E4002B' },
  { name: 'Truper', color: '#F47920' },
];

// Duplicate for seamless loop
const ALL = [...BRANDS, ...BRANDS];

export function BrandsCarousel() {
  const trackRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number | null>(null);
  const posRef = useRef(0);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const step = () => {
      posRef.current += 0.4;
      const halfWidth = track.scrollWidth / 2;
      if (posRef.current >= halfWidth) posRef.current = 0;
      track.style.transform = `translateX(-${posRef.current}px)`;
      animRef.current = requestAnimationFrame(step);
    };
    animRef.current = requestAnimationFrame(step);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, []);

  return (
    <section className="border-t border-steel-900/40 py-10">
      <div className="container-main mb-8">
        <span className="overline mb-2 block">Marcas</span>
        <h2 className="font-display text-h2 uppercase text-arctic">Trabajamos con las mejores marcas</h2>
        <div className="mt-3 h-[3px] w-12 rounded-sm bg-gradient-to-r from-blue to-orange" />
      </div>

      <div className="relative overflow-hidden">
        {/* Fade edges */}
        <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-16 bg-gradient-to-r from-carbon to-transparent" />
        <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-16 bg-gradient-to-l from-carbon to-transparent" />

        <div ref={trackRef} className="flex items-center gap-8 whitespace-nowrap will-change-transform">
          {ALL.map((brand, i) => (
            <div
              key={i}
              className="flex h-16 w-36 shrink-0 items-center justify-center rounded-lg border border-steel-900/40 bg-steel-900/30 px-5 py-3 opacity-50 transition-all duration-300 hover:opacity-100"
              style={{ borderColor: `${brand.color}30` }}
            >
              <span
                className="font-display text-body font-bold tracking-tight"
                style={{ color: brand.color }}
              >
                {brand.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
