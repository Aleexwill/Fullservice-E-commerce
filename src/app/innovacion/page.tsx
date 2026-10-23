'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronRight, ArrowRight, MessageCircle, Play, ZoomIn, X, Leaf } from 'lucide-react';
import { Isotipo } from '@/components/ui/isotipo';
import { siteConfig } from '@/config/site';
import { formatWhatsAppUrl } from '@/lib/utils';
import { useSettings } from '@/lib/settings-context';

interface InnovacionItem {
  id: string;
  title: string;
  description: string;
  mediaUrl: string;
  mediaType: string;
  thumbnail: string;
  images: string[];
  isActive: boolean;
  order: number;
}

function isYoutube(url: string) {
  return /youtube\.com|youtu\.be/.test(url);
}
function isVimeo(url: string) {
  return /vimeo\.com/.test(url);
}
function getYoutubeEmbed(url: string) {
  const m = url.match(/(?:v=|youtu\.be\/)([^&?/]+)/);
  return m ? `https://www.youtube.com/embed/${m[1]}?autoplay=1` : url;
}
function getVimeoEmbed(url: string) {
  const m = url.match(/vimeo\.com\/(\d+)/);
  return m ? `https://player.vimeo.com/video/${m[1]}?autoplay=1` : url;
}

function MediaModal({ item, onClose }: { item: InnovacionItem; onClose: () => void }) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const extraImages = item.images || [];

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (lightboxIdx !== null) {
        if (e.key === 'Escape') setLightboxIdx(null);
        else if (e.key === 'ArrowRight') setLightboxIdx((i) => (i! + 1) % extraImages.length);
        else if (e.key === 'ArrowLeft') setLightboxIdx((i) => (i! - 1 + extraImages.length) % extraImages.length);
      } else if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose, lightboxIdx, extraImages.length]);

  const isVideo = item.mediaType === 'video';

  let embedUrl = item.mediaUrl;
  if (isVideo) {
    if (isYoutube(item.mediaUrl)) embedUrl = getYoutubeEmbed(item.mediaUrl);
    else if (isVimeo(item.mediaUrl)) embedUrl = getVimeoEmbed(item.mediaUrl);
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/92 p-4"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition"
        aria-label="Cerrar"
      >
        <X className="h-4 w-4" />
      </button>

      <div
        className="relative flex w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-[#0d1525]"
        style={{ maxHeight: 'calc(100dvh - 2rem)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Media */}
        <div className="relative flex-shrink-0 bg-black">
          {isVideo ? (
            (isYoutube(item.mediaUrl) || isVimeo(item.mediaUrl)) ? (
              <div className="aspect-video w-full">
                <iframe
                  src={embedUrl}
                  className="h-full w-full"
                  allow="autoplay; fullscreen"
                  allowFullScreen
                />
              </div>
            ) : (
              <video
                src={item.mediaUrl}
                controls
                autoPlay
                className="max-h-[60vh] w-full object-contain"
              />
            )
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.mediaUrl}
              alt={item.title}
              className="max-h-[65vh] w-full object-contain"
            />
          )}
        </div>

        {/* Info + gallery */}
        {(item.title || item.description || extraImages.length > 0) && (
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            {item.title && (
              <p className="font-display text-base font-bold leading-snug text-white">{item.title}</p>
            )}
            {item.description && (
              <p className="mt-2 font-body text-[0.8rem] leading-relaxed text-white/60">
                {item.description}
              </p>
            )}

            {/* Image collage */}
            {extraImages.length > 0 && (
              <div className={`mt-4 grid gap-1.5 ${extraImages.length === 1 ? 'grid-cols-1' : extraImages.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                {extraImages.map((url, i) => (
                  <button
                    key={i}
                    onClick={() => setLightboxIdx(i)}
                    className="group relative overflow-hidden rounded-lg bg-black/30 focus:outline-none focus:ring-2 focus:ring-[#7CC4EF]"
                    style={{ aspectRatio: extraImages.length === 1 ? '16/9' : '1' }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt=""
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors duration-200 group-hover:bg-black/40">
                      <ZoomIn className="h-5 w-5 text-white opacity-0 drop-shadow-lg transition-opacity group-hover:opacity-100" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Lightbox overlay */}
        {lightboxIdx !== null && (
          <div
            className="absolute inset-0 z-10 flex items-center justify-center bg-black/95"
            onClick={() => setLightboxIdx(null)}
          >
            {/* Close button — prominent */}
            <button
              onClick={() => setLightboxIdx(null)}
              className="absolute right-3 top-3 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#0B1120] shadow-lg hover:bg-white/90 transition"
              aria-label="Cerrar imagen"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Prev arrow */}
            {extraImages.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); setLightboxIdx((i) => (i! - 1 + extraImages.length) % extraImages.length); }}
                className="absolute left-3 top-1/2 z-20 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#0B1120] shadow-lg hover:bg-white/90 transition"
                aria-label="Anterior"
              >
                <ChevronRight className="h-5 w-5 rotate-180" />
              </button>
            )}

            {/* Next arrow */}
            {extraImages.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); setLightboxIdx((i) => (i! + 1) % extraImages.length); }}
                className="absolute right-3 top-1/2 z-20 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#0B1120] shadow-lg hover:bg-white/90 transition"
                aria-label="Siguiente"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            )}

            {/* Counter */}
            {extraImages.length > 1 && (
              <span className="absolute bottom-3 left-1/2 z-20 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 font-body text-xs text-white">
                {lightboxIdx + 1} / {extraImages.length}
              </span>
            )}

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={extraImages[lightboxIdx]}
              alt=""
              className="max-h-full max-w-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function MediaCard({ item, onClick }: { item: InnovacionItem; onClick: () => void }) {
  const isVideo = item.mediaType === 'video';
  const thumb = item.thumbnail || (isVideo ? '' : item.mediaUrl);

  return (
    <button
      onClick={onClick}
      className="group relative overflow-hidden rounded-xl bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#2D8FCC] w-full text-left"
    >
      <div className="relative flex h-60 items-center justify-center overflow-hidden bg-[#EBF5FB]">
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumb} alt={item.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
        ) : (
          <Isotipo size={64} color="#2D8FCC20" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <div className="flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 font-body text-sm font-semibold text-[#0B1120] shadow">
            {isVideo ? <Play className="h-4 w-4 text-[#2D8FCC]" /> : <ZoomIn className="h-4 w-4 text-[#2D8FCC]" />}
            {isVideo ? 'Ver video' : 'Ver imagen'}
          </div>
        </div>
        <div className="absolute left-3 top-3">
          <span className="flex items-center gap-1 rounded-full bg-black/50 px-2.5 py-1 font-body text-[0.6rem] font-semibold uppercase tracking-wide text-white backdrop-blur-sm">
            {isVideo ? <Play className="h-2.5 w-2.5" /> : <ZoomIn className="h-2.5 w-2.5" />}
            {isVideo ? 'Video' : 'Imagen'}
          </span>
        </div>
        <div className="absolute right-3 top-3">
          <span className="flex items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-500/20 px-2.5 py-1 font-body text-[0.6rem] font-semibold uppercase tracking-wide text-emerald-200 backdrop-blur-sm">
            <Leaf className="h-2.5 w-2.5" /> Eco
          </span>
        </div>
      </div>
      {item.title && (
        <div className="px-4 py-3">
          <p className="font-display text-[0.88rem] font-semibold leading-snug text-[#0B1120] line-clamp-1">{item.title}</p>
        </div>
      )}
    </button>
  );
}

export default function InnovacionPage() {
  const settings = useSettings();
  const whatsappNum = settings?.contact.whatsapp || siteConfig.whatsapp;
  const [items, setItems] = useState<InnovacionItem[]>([]);
  const [selected, setSelected] = useState<InnovacionItem | null>(null);

  useEffect(() => {
    fetch('/api/innovacion?active=true')
      .then((r) => r.json())
      .then((d) => { if (d.items?.length > 0) setItems(d.items); })
      .catch(() => {});
  }, []);

  const whatsappUrl = formatWhatsAppUrl(whatsappNum, 'Hola, quiero consultar sobre proyectos de innovación.');

  return (
    <>
      {/* Breadcrumb */}
      <div className="border-b border-gray-200 bg-white">
        <div className="container-main flex items-center gap-2 py-3 font-body text-caption text-[#4A5E80]">
          <Link href="/" className="hover:text-[#2D8FCC]">Inicio</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-[#0B1120]">Innovación</span>
        </div>
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-gray-200 bg-[#0B1120] py-20 md:py-24">
        <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(ellipse at 15% 50%,#2D8FCC18 0%,transparent 55%),radial-gradient(ellipse at 85% 20%,#E8862B12 0%,transparent 50%)' }} />
        <div className="pointer-events-none absolute left-0 top-0 h-[2px] w-full" style={{ background: 'linear-gradient(90deg,#2D8FCC,#E8862B,#2D8FCC)' }} />
        <div className="container-main relative">
          <span className="overline text-[#7CC4EF]">Soluciones que transforman</span>
          <h1 className="mt-4 font-display text-[clamp(2.4rem,6vw,4.8rem)] font-bold uppercase leading-[.92] tracking-tight text-white">
            Innovación
          </h1>
          <p className="mt-6 max-w-2xl font-body text-body-lg leading-relaxed text-[#C0CEDF]">
            Conocé los proyectos, tecnologías y procesos innovadores que aplicamos en nuestros trabajos. De la ingeniería a la entrega final.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/contacto?tipo=presupuesto" className="btn-primary">
              Pedir presupuesto <ArrowRight className="h-4 w-4" />
            </Link>
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="btn-whatsapp">
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* Gallery */}
      <section className="section bg-[#F4F7FB]">
        <div className="container-main">
          <div className="mb-8">
            <h2 className="font-display text-h2 text-[#0B1120]">Innovaciones en acción</h2>
          </div>

          {items.length === 0 ? (
            <div className="py-20 text-center">
              <Isotipo size={72} color="#2D8FCC18" />
              <p className="mt-4 font-body text-body text-[#8094B4]">Próximamente publicaremos contenido de innovación.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <MediaCard key={item.id} item={item} onClick={() => setSelected(item)} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-gray-200 bg-white py-16">
        <div className="container-main text-center">
          <span className="overline">¿Tenés un proyecto?</span>
          <h2 className="mt-2 font-display text-h2 text-[#0B1120]">Hagámoslo realidad</h2>
          <p className="mx-auto mt-3 max-w-md font-body text-body text-[#4A5E80]">
            Contanos qué necesitás y te preparamos un presupuesto con la solución más innovadora para tu proyecto.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/contacto?tipo=presupuesto" className="btn-primary">Pedir presupuesto <ArrowRight className="h-4 w-4" /></Link>
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="btn-whatsapp"><MessageCircle className="h-4 w-4" /> WhatsApp</a>
          </div>
        </div>
      </section>

      {/* Lightbox modal */}
      {selected && <MediaModal item={selected} onClose={() => setSelected(null)} />}
    </>
  );
}
