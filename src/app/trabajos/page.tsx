'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ChevronRight, MapPin, Calendar, ArrowRight, MessageCircle, X, ChevronLeft, ChevronRight as ChevRight, ZoomIn } from 'lucide-react';
import { Isotipo } from '@/components/ui/isotipo';
import { siteConfig } from '@/config/site';
import { formatWhatsAppUrl } from '@/lib/utils';

type ProjectCategory = 'todos' | 'civil' | 'metalurgica' | 'mantenimiento' | 'limpieza' | 'instalaciones';
const categories: { id: ProjectCategory; label: string }[] = [
  { id: 'todos', label: 'Todos' },
  { id: 'civil', label: 'Construcción civil' },
  { id: 'metalurgica', label: 'Metalúrgica' },
  { id: 'mantenimiento', label: 'Mantenimiento' },
  { id: 'limpieza', label: 'Limpieza' },
  { id: 'instalaciones', label: 'Instalaciones' },
];

interface TechnicalDetails { [key: string]: string }
interface Project {
  id: string; title: string; description: string; category: string;
  location: string; duration: string; year: string; client: string;
  image: string; gallery: string[]; technicalDetails: TechnicalDetails;
  badge: 'blue' | 'green' | 'yellow' | 'neutral'; size: string;
  isActive: boolean; isFeatured: boolean; order: number;
}

const defaultProjects: Project[] = [
  { id:'1', title:'Remodelación oficinas corporativas', description:'Remodelación integral de 800m² de oficinas. Incluyó demolición parcial, nueva distribución, instalación eléctrica, pintura y acabados de primera calidad.', category:'civil', location:'Asunción', duration:'3 meses', year:'2025', client:'Empresa multinacional', badge:'blue', size:'large', image:'', gallery:[], technicalDetails:{ Superficie:'800 m²', Materiales:'Durlock, porcelanato, pintura latex', Equipo:'12 personas', Norma:'INTN 3529' }, isActive:true, isFeatured:true, order:0 },
  { id:'2', title:'Nave industrial 1200m²', description:'Diseño, fabricación y montaje de estructura metálica para nave industrial. Incluyó cubierta, cerramientos laterales y portones automáticos.', category:'metalurgica', location:'Luque', duration:'4 meses', year:'2025', client:'Industria alimenticia', badge:'green', size:'large', image:'', gallery:[], technicalDetails:{ Superficie:'1200 m²', Estructura:'Acero A36', Cubierta:'Chapa cincalum calibre 24', Altura:'8 m a cumbrera' }, isActive:true, isFeatured:true, order:1 },
  { id:'3', title:'Mantenimiento preventivo edificio comercial', description:'Contrato anual de mantenimiento preventivo para edificio de 12 pisos.', category:'mantenimiento', location:'San Lorenzo', duration:'12 meses', year:'2024-2025', client:'Administración de edificio', badge:'yellow', size:'normal', image:'', gallery:[], technicalDetails:{ Pisos:'12', Frecuencia:'Mensual', Cobertura:'Eléctrica, sanitaria, civil' }, isActive:true, isFeatured:false, order:2 },
  { id:'4', title:'Portones automáticos residenciales', description:'Fabricación e instalación de portones corredizos automáticos para conjunto residencial de 24 unidades.', category:'metalurgica', location:'Lambaré', duration:'2 meses', year:'2025', client:'Constructora residencial', badge:'green', size:'normal', image:'', gallery:[], technicalDetails:{ Unidades:'24 portones', Material:'Hierro cuadrado 25mm', Automatización:'Motor 600 kg', Acabado:'Pintura epoxi' }, isActive:true, isFeatured:false, order:3 },
];

const badgeColors: Record<string, string> = {
  blue: 'bg-blue-100 text-blue-700 border border-blue-200',
  green: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  yellow: 'bg-amber-100 text-amber-700 border border-amber-200',
  neutral: 'bg-gray-100 text-gray-600 border border-gray-200',
};
const categoryLabel: Record<string, string> = {
  todos:'Todos', civil:'Construcción civil', metalurgica:'Metalúrgica',
  mantenimiento:'Mantenimiento', limpieza:'Limpieza', instalaciones:'Instalaciones',
};

function Lightbox({ project, onClose }: { project: Project; onClose: () => void }) {
  const images = [project.image, ...project.gallery].filter(Boolean);
  const [idx, setIdx] = useState(0);
  const prev = useCallback(() => setIdx((i) => (i - 1 + images.length) % images.length), [images.length]);
  const next = useCallback(() => setIdx((i) => (i + 1) % images.length), [images.length]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', handler); document.body.style.overflow = ''; };
  }, [onClose, prev, next]);

  const details = Object.entries(project.technicalDetails || {}).filter(([, v]) => v);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-[#0B1120]/98 backdrop-blur-md" onClick={onClose}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 md:p-6" onClick={(e) => e.stopPropagation()}>
        <div>
          <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${badgeColors[project.badge] || badgeColors.neutral}`}>
            {categoryLabel[project.category] || project.category}
          </span>
          <h2 className="mt-2 font-display text-xl font-bold text-white md:text-2xl">{project.title}</h2>
          {project.description && (
            <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-white/60">{project.description}</p>
          )}
        </div>
        <button onClick={onClose} className="rounded-xl bg-white/10 p-2.5 text-white/70 hover:bg-white/20 hover:text-white">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Image viewer */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden px-4" onClick={(e) => e.stopPropagation()}>
        {images.length > 0 ? (
          <>
            <img
              src={images[idx]}
              alt={`${project.title} — imagen ${idx + 1}`}
              className="max-h-full max-w-full rounded-xl object-contain shadow-2xl"
            />
            {images.length > 1 && (
              <>
                <button onClick={prev} className="absolute left-4 rounded-full bg-white/10 p-3 text-white hover:bg-white/25 backdrop-blur-sm">
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button onClick={next} className="absolute right-4 rounded-full bg-white/10 p-3 text-white hover:bg-white/25 backdrop-blur-sm">
                  <ChevRight className="h-5 w-5" />
                </button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {images.map((_, i) => (
                    <button key={i} onClick={() => setIdx(i)}
                      className={`h-1.5 rounded-full transition-all ${i === idx ? 'w-5 bg-[#2D8FCC]' : 'w-1.5 bg-white/30'}`} />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="flex h-64 w-full items-center justify-center rounded-xl border border-white/10 bg-white/5">
            <Isotipo size={80} color="#2D8FCC30" />
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto px-6 py-3" onClick={(e) => e.stopPropagation()}>
          {images.map((src, i) => (
            <button key={i} onClick={() => setIdx(i)}
              className={`h-14 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${i === idx ? 'border-[#2D8FCC]' : 'border-white/10 opacity-60 hover:opacity-100'}`}>
              <img src={src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Details panel */}
      <div className="border-t border-white/10 bg-white/[0.03] px-4 py-4 md:px-6" onClick={(e) => e.stopPropagation()}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <div className="flex flex-wrap gap-4 text-xs text-white/50">
              {project.location && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-[#6FC3F5]" />{project.location}</span>}
              {project.duration && <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5 text-[#6FC3F5]" />{project.duration} · {project.year}</span>}
              {project.client && <span className="text-white/40">Cliente: <span className="text-white/60">{project.client}</span></span>}
            </div>
          </div>
          {details.length > 0 && (
            <div>
              <p className="mb-2 text-[0.65rem] font-bold uppercase tracking-widest text-[#6FC3F5]">Detalles técnicos</p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
                {details.map(([k, v]) => (
                  <div key={k}>
                    <span className="text-[0.65rem] font-semibold uppercase tracking-wide text-white/35">{k}</span>
                    <p className="text-xs font-medium text-white/80">{v}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TrabajosDestacadosPage() {
  const [activeCategory, setActiveCategory] = useState<ProjectCategory>('todos');
  const [projects, setProjects] = useState<Project[]>(defaultProjects);
  const [lightbox, setLightbox] = useState<Project | null>(null);

  useEffect(() => {
    fetch('/api/trabajos?active=true')
      .then((r) => r.json())
      .then((d) => { if (d.projects?.length > 0) setProjects(d.projects); })
      .catch(() => {});
  }, []);

  const filtered = activeCategory === 'todos'
    ? projects
    : projects.filter((p) => p.category === activeCategory);

  const whatsappUrl = formatWhatsAppUrl(siteConfig.whatsapp, 'Hola, vi sus trabajos y me gustaría consultar sobre un proyecto similar.');

  return (
    <>
      {lightbox && <Lightbox project={lightbox} onClose={() => setLightbox(null)} />}

      {/* Breadcrumb */}
      <div className="border-b border-gray-200 bg-white">
        <div className="container-main flex items-center gap-2 py-3 font-body text-caption text-[#8094B4]">
          <Link href="/" className="hover:text-[#2D8FCC]">Inicio</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-[#0B1120]">Trabajos Destacados</span>
        </div>
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-gray-200 bg-[#0B1120] py-20 md:py-24">
        <div className="pointer-events-none absolute -right-32 top-0 h-96 w-96 rounded-full bg-[#2D8FCC] opacity-[0.06] blur-3xl" />
        <div className="container-main relative">
          <span className="overline text-[#7CC4EF]">Nuestro trabajo</span>
          <h1 className="mt-3 max-w-3xl font-display text-[clamp(2.4rem,6vw,4.8rem)] font-bold uppercase leading-[.92] tracking-tight text-white">
            Trabajos<br />Destacados
          </h1>
          <p className="mt-6 max-w-2xl font-body text-body-lg leading-relaxed text-[#C0CEDF]">
            Obras y servicios ejecutados con foco en calidad, seguridad y cumplimiento de plazos. Hacé clic en cualquier trabajo para ver la galería completa y los detalles técnicos.
          </p>
          <div className="mt-8 flex gap-3">
            <Link href="/clientes" className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-2.5 font-body text-sm font-semibold text-white hover:bg-white/15 transition-colors">
              Ver nuestros clientes <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Filtros */}
      <section className="sticky top-[95px] z-40 border-b border-gray-200 bg-white/95 backdrop-blur-lg">
        <div className="container-main flex gap-1 overflow-x-auto py-3">
          {categories.map((cat) => (
            <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
              className={`min-h-[44px] whitespace-nowrap rounded-lg px-5 py-3 font-body text-[.75rem] font-semibold uppercase tracking-[.04em] transition-all ${activeCategory === cat.id ? 'bg-[#0B1120] text-white shadow-sm' : 'text-[#8094B4] hover:bg-[#F4F7FB] hover:text-[#0B1120]'}`}>
              {cat.label}
            </button>
          ))}
        </div>
      </section>

      {/* Grid */}
      <section className="section bg-[#F4F7FB]">
        <div className="container-main">
          <div className="mb-7 flex items-center justify-between">
            <span className="overline">Experiencia comprobada</span>
            <span className="font-body text-body-sm text-[#8094B4]">{filtered.length} trabajo{filtered.length !== 1 ? 's' : ''}</span>
          </div>

          {filtered.length === 0 ? (
            <div className="py-20 text-center font-body text-[#8094B4]">No hay trabajos en esta categoría aún.</div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((project) => (
                <article
                  key={project.id}
                  onClick={() => setLightbox(project)}
                  className="card-interactive group cursor-pointer overflow-hidden"
                >
                  {/* Imagen */}
                  <div className="relative flex h-56 items-center justify-center overflow-hidden bg-gradient-to-br from-[#EBF5FB] to-white">
                    {project.image
                      ? <img src={project.image} alt={project.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      : <Isotipo size={92} color="#2D8FCC18" />
                    }
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0B1120]/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      <div className="flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 font-body text-sm font-semibold text-[#0B1120] shadow-lg">
                        <ZoomIn className="h-4 w-4 text-[#2D8FCC]" />
                        Ver galería
                      </div>
                    </div>
                    <div className="absolute right-4 top-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${badgeColors[project.badge] || badgeColors.neutral}`}>
                        {categoryLabel[project.category] || project.category}
                      </span>
                    </div>
                    {project.gallery.length > 0 && (
                      <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-black/50 px-2 py-1 text-[0.65rem] font-semibold text-white backdrop-blur-sm">
                        <span>+{project.gallery.length}</span>
                        <span className="text-white/60">fotos</span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-5">
                    <h2 className="font-display text-h3 leading-tight text-[#0B1120]">{project.title}</h2>
                    <p className="mt-2 line-clamp-2 font-body text-body-sm leading-relaxed text-[#4A5E80]">{project.description}</p>

                    {/* Detalles técnicos preview */}
                    {Object.keys(project.technicalDetails || {}).length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 border-t border-gray-100 pt-3">
                        {Object.entries(project.technicalDetails).slice(0, 2).map(([k, v]) => (
                          <div key={k} className="flex flex-col">
                            <span className="text-[0.6rem] font-bold uppercase tracking-wide text-[#8094B4]">{k}</span>
                            <span className="text-[0.72rem] font-semibold text-[#0B1120]">{v}</span>
                          </div>
                        ))}
                        {Object.keys(project.technicalDetails).length > 2 && (
                          <span className="self-end text-[0.65rem] text-[#8094B4]">+{Object.keys(project.technicalDetails).length - 2} más</span>
                        )}
                      </div>
                    )}

                    <div className="mt-4 grid grid-cols-2 gap-3 border-t border-gray-200 pt-4">
                      <div className="flex gap-2">
                        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#2D8FCC]" />
                        <span className="font-body text-caption text-[#4A5E80]">{project.location}</span>
                      </div>
                      <div className="flex gap-2">
                        <Calendar className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#2D8FCC]" />
                        <span className="font-body text-caption text-[#4A5E80]">{project.duration} · {project.year}</span>
                      </div>
                    </div>
                    {project.client && (
                      <p className="mt-3 font-body text-caption text-[#8094B4]">
                        Cliente: <span className="text-[#4A5E80]">{project.client}</span>
                      </p>
                    )}
                  </div>
                </article>
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
          <p className="mx-auto mt-3 max-w-md font-body text-body text-[#4A5E80]">Contanos qué necesitás y te preparamos un presupuesto personalizado.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/contacto?tipo=presupuesto" className="btn-primary">Pedir presupuesto <ArrowRight className="h-4 w-4" /></Link>
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="btn-whatsapp"><MessageCircle className="h-4 w-4" /> WhatsApp</a>
          </div>
        </div>
      </section>
    </>
  );
}
