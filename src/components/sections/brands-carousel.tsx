'use client';

import { useEffect, useRef } from 'react';

const BRANDS = [
  { name: 'Bosch', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Bosch_logo_svg.svg/320px-Bosch_logo_svg.svg.png' },
  { name: 'Stanley', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/Stanley_logo.svg/320px-Stanley_logo.svg.png' },
  { name: 'DeWalt', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/DeWalt_Logo.svg/320px-DeWalt_Logo.svg.png' },
  { name: 'Makita', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/Makita_logo.svg/320px-Makita_logo.svg.png' },
  { name: '3M', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/3M_wordmark.svg/320px-3M_wordmark.svg.png' },
  { name: 'Philips', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Philips_logo_new.svg/320px-Philips_logo_new.svg.png' },
  { name: 'Schneider', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Schneider_Electric_2007.svg/320px-Schneider_Electric_2007.svg.png' },
  { name: 'Siemens', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Siemens-logo.svg/320px-Siemens-logo.svg.png' },
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

        <div ref={trackRef} className="flex items-center gap-12 whitespace-nowrap will-change-transform">
          {ALL.map((brand, i) => (
            <div
              key={i}
              className="flex h-16 w-32 shrink-0 items-center justify-center rounded-lg border border-steel-900/30 bg-steel-900/20 px-4 py-3 grayscale opacity-60 transition hover:opacity-100 hover:grayscale-0"
            >
              <img
                src={brand.logo}
                alt={brand.name}
                className="max-h-full max-w-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).parentElement!.innerHTML = `<span class="font-display text-body-sm font-bold text-steel-300">${brand.name}</span>`;
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
