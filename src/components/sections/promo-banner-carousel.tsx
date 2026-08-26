'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PromoBanner {
  id: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaUrl: string;
  imageUrl: string;
  bgColor: string;
  accentColor: string;
  badge: string;
}

const FALLBACK: PromoBanner[] = [
  { id: '1', title: 'Hasta 30% OFF en herramientas', subtitle: 'Ofertas válidas hasta fin de mes. Stock limitado.', ctaLabel: 'Ver ofertas', ctaUrl: '/tienda', imageUrl: '', bgColor: '#0a1628', accentColor: '#E8862B', badge: 'OFERTA' },
  { id: '2', title: 'Servicio completo garantizado', subtitle: 'Presupuesto sin cargo. Respuesta en 24 horas.', ctaLabel: 'Pedir presupuesto', ctaUrl: '/contacto?tipo=presupuesto', imageUrl: '', bgColor: '#0a1a0f', accentColor: '#48BB78', badge: 'NUEVO' },
];

export function PromoBannerCarousel() {
  const [banners, setBanners] = useState<PromoBanner[]>(FALLBACK);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    fetch('/api/promo-banners')
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data) && data.length > 0) setBanners(data); })
      .catch(() => {});
  }, []);

  const next = useCallback(() => setActive((a) => (a + 1) % banners.length), [banners.length]);
  const prev = useCallback(() => setActive((a) => (a - 1 + banners.length) % banners.length), [banners.length]);

  useEffect(() => {
    if (paused || banners.length < 2) return;
    const t = setInterval(next, 5000);
    return () => clearInterval(t);
  }, [paused, next, banners.length]);

  if (banners.length === 0) return null;
  const b = banners[active];

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ minHeight: '280px' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Slides */}
      {banners.map((banner, i) => (
        <div
          key={banner.id}
          className="absolute inset-0 transition-opacity duration-700"
          style={{ opacity: i === active ? 1 : 0, zIndex: i === active ? 1 : 0 }}
          aria-hidden={i !== active}
        >
          {/* Background image */}
          {banner.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={banner.imageUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}

          {/* Bg color + gradient overlay */}
          <div
            className="absolute inset-0"
            style={{
              background: banner.imageUrl
                ? `linear-gradient(105deg, ${banner.bgColor}f0 45%, ${banner.bgColor}70 75%, transparent 100%)`
                : `linear-gradient(135deg, ${banner.bgColor} 0%, ${banner.bgColor}cc 100%)`,
            }}
          />

          {/* Decorative shapes */}
          <div className="absolute inset-0 overflow-hidden">
            <div
              className="absolute -right-20 -top-20 h-72 w-72 rounded-full opacity-10 blur-3xl"
              style={{ background: banner.accentColor }}
            />
            <div
              className="absolute -bottom-16 right-[20%] h-56 w-56 rounded-full opacity-15 blur-3xl"
              style={{ background: banner.accentColor }}
            />
            {/* Diagonal stripe */}
            <svg className="absolute inset-0 h-full w-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id={`stripe-${banner.id}`} x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
                  <line x1="0" y1="0" x2="0" y2="30" stroke="white" strokeWidth="4" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill={`url(#stripe-${banner.id})`} />
            </svg>
          </div>

          {/* Content */}
          <div className="container-main relative z-10 flex h-full min-h-[280px] items-center py-10">
            <div className="max-w-[580px]">
              {/* Badge */}
              {banner.badge && (
                <span
                  className="mb-4 inline-block rounded-full px-3 py-1 font-body text-[0.65rem] font-bold uppercase tracking-widest"
                  style={{ background: banner.accentColor + '25', color: banner.accentColor, border: `1px solid ${banner.accentColor}50` }}
                >
                  {banner.badge}
                </span>
              )}

              {/* Title */}
              <h2 className="font-display text-[clamp(1.6rem,4vw,2.8rem)] font-bold uppercase leading-tight text-white">
                {banner.title}
              </h2>

              {/* Subtitle */}
              {banner.subtitle && (
                <p className="mt-3 font-body text-[0.95rem] leading-relaxed text-white/70">
                  {banner.subtitle}
                </p>
              )}

              {/* CTA */}
              {banner.ctaLabel && banner.ctaUrl && (
                <Link
                  href={banner.ctaUrl}
                  className="mt-6 inline-flex items-center gap-2 rounded-lg px-6 py-3 font-body text-[0.8rem] font-bold uppercase tracking-wide text-carbon transition-all hover:brightness-110 hover:shadow-lg active:scale-95"
                  style={{ background: banner.accentColor }}
                >
                  {banner.ctaLabel}
                  <ChevronRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Nav arrows */}
      {banners.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/30 p-2 text-white backdrop-blur-sm transition hover:bg-black/50"
            aria-label="Anterior"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={next}
            className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/30 p-2 text-white backdrop-blur-sm transition hover:bg-black/50"
            aria-label="Siguiente"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      {/* Dots */}
      {banners.length > 1 && (
        <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === active ? '20px' : '6px',
                height: '6px',
                background: i === active ? b.accentColor : 'rgba(255,255,255,0.3)',
              }}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
