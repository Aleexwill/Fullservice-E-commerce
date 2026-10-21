'use client';

import { useEffect, useRef, useState } from 'react';

interface ClientLogo {
  id: string;
  name: string;
  logoUrl: string;
  isActive: boolean;
  order: number;
}

const FALLBACK: ClientLogo[] = [
  { id: 'f1', name: 'Cliente A', logoUrl: '', isActive: true, order: 0 },
  { id: 'f2', name: 'Cliente B', logoUrl: '', isActive: true, order: 1 },
  { id: 'f3', name: 'Cliente C', logoUrl: '', isActive: true, order: 2 },
  { id: 'f4', name: 'Cliente D', logoUrl: '', isActive: true, order: 3 },
  { id: 'f5', name: 'Cliente E', logoUrl: '', isActive: true, order: 4 },
];

export function ClientLogosMarquee() {
  const [logos, setLogos] = useState<ClientLogo[]>([]);
  const trackRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number | null>(null);
  const posRef = useRef(0);

  useEffect(() => {
    fetch('/api/clientes-logo')
      .then((r) => r.json())
      .then((d) => {
        const active = (d.clientes as ClientLogo[] || [])
          .filter((c) => c.isActive)
          .sort((a, b) => a.order - b.order);
        setLogos(active.length > 0 ? active : FALLBACK);
      })
      .catch(() => setLogos(FALLBACK));
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || logos.length === 0) return;
    posRef.current = 0;
    const step = () => {
      posRef.current += 0.5;
      const halfWidth = track.scrollWidth / 2;
      if (posRef.current >= halfWidth) posRef.current = 0;
      track.style.transform = `translateX(-${posRef.current}px)`;
      animRef.current = requestAnimationFrame(step);
    };
    animRef.current = requestAnimationFrame(step);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [logos]);

  if (logos.length === 0) return null;

  const doubled = [...logos, ...logos];

  return (
    <section className="border-t border-gray-200 bg-white py-10">
      <div className="container-main mb-7">
        <span className="mb-1 block font-body text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-[#2D8FCC]">Clientes</span>
        <h2 className="font-display text-h2 uppercase text-[#0B1120]">Confían en nosotros</h2>
        <div className="mt-3 h-[3px] w-12 rounded-sm bg-gradient-to-r from-[#2D8FCC] to-[#E8862B]" />
      </div>

      <div className="relative overflow-hidden">
        {/* Fade edges */}
        <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-16 bg-gradient-to-r from-white to-transparent" />
        <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-16 bg-gradient-to-l from-white to-transparent" />

        <div ref={trackRef} className="flex items-center gap-6 whitespace-nowrap will-change-transform">
          {doubled.map((logo, i) => (
            <div
              key={`${logo.id}-${i}`}
              className="flex h-16 w-36 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-[#F4F7FB] px-4 py-3 opacity-50 transition-all duration-300 hover:opacity-100 hover:shadow-sm"
            >
              {logo.logoUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={logo.logoUrl}
                  alt={logo.name}
                  className="max-h-10 max-w-full object-contain"
                  loading="lazy"
                />
              ) : (
                <span className="font-display text-body font-bold tracking-tight text-[#4A5E80]">
                  {logo.name}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
