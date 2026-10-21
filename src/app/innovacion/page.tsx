'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronRight, ArrowRight, MessageCircle, Zap, HardHat, Factory, Wrench, MapPin, Calendar, ZoomIn } from 'lucide-react';
import { Isotipo } from '@/components/ui/isotipo';
import { siteConfig } from '@/config/site';
import { formatWhatsAppUrl } from '@/lib/utils';
import { useSettings } from '@/lib/settings-context';

interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  duration: string;
  year: string;
  client: string;
  image: string;
  badge: string;
  isActive: boolean;
  isFeatured: boolean;
}

const defaultProjects: Project[] = [
  { id: '1', title: 'Fabricación y Montaje de Estructuras Metálicas', description: 'Diseño, fabricación y montaje de estructura metálica para nave industrial con tecnología de corte por plasma y soldadura TIG.', category: 'metalurgica', location: 'Lambaré', duration: '4 meses', year: '2025', client: 'Industria alimenticia', image: '', badge: 'green', isActive: true, isFeatured: true },
  { id: '2', title: 'Refuerzo Estructural y Restauración Integral', description: 'Intervención con técnicas de refuerzo estructural con fibra de carbono y sistemas de impermeabilización de última generación.', category: 'civil', location: 'Lambaré', duration: '3 meses', year: '2025', client: 'Empresa comercial', image: '', badge: 'blue', isActive: true, isFeatured: true },
  { id: '3', title: 'Sistema Eléctrico Industrial Automatizado', description: 'Instalación de tableros inteligentes con monitoreo remoto y automatización de circuitos para planta industrial.', category: 'mantenimiento', location: 'Asunción', duration: '2 meses', year: '2025', client: 'Empresa multinacional', image: '', badge: 'yellow', isActive: true, isFeatured: true },
];

const CATEGORY_ICON: Record<string, any> = {
  metalurgica: Factory,
  civil: HardHat,
  mantenimiento: Zap,
  instalaciones: Zap,
  limpieza: Wrench,
};

const CATEGORY_COLOR: Record<string, { bg: string; text: string; label: string }> = {
  metalurgica:   { bg: '#F0F0F0',  text: '#4A5E80', label: 'Metalúrgica' },
  civil:         { bg: '#FEF3E9',  text: '#E8862B', label: 'Construcción civil' },
  mantenimiento: { bg: '#EBF5FB',  text: '#2D8FCC', label: 'Mantenimiento' },
  instalaciones: { bg: '#EBF5FB',  text: '#2D8FCC', label: 'Instalaciones' },
  limpieza:      { bg: '#EDF7F0',  text: '#2E9E5B', label: 'Limpieza' },
};

function ProjectCard({ project }: { project: Project }) {
  const cat = CATEGORY_COLOR[project.category] || CATEGORY_COLOR.mantenimiento;
  const Icon = CATEGORY_ICON[project.category] || Wrench;

  return (
    <article className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      {/* Image / placeholder */}
      <div className="relative flex h-52 items-center justify-center overflow-hidden bg-gradient-to-br from-[#EBF5FB] to-white">
        {project.image ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={project.image} alt={project.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B1120]/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <div className="flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 font-body text-sm font-semibold text-[#0B1120] shadow-lg">
                <ZoomIn className="h-4 w-4 text-[#2D8FCC]" />Ver detalle
              </div>
            </div>
          </>
        ) : (
          <Isotipo size={80} color="#2D8FCC15" />
        )}
        {/* Category badge */}
        <div className="absolute left-4 top-4">
          <span
            className="flex items-center gap-1.5 rounded-full px-3 py-1 font-body text-[0.65rem] font-semibold uppercase tracking-wider"
            style={{ backgroundColor: cat.bg, color: cat.text }}
          >
            <Icon className="h-3 w-3" />
            {cat.label}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <h2 className="font-display text-[0.95rem] font-bold leading-tight text-[#0B1120]">{project.title}</h2>
        <p className="mt-2 line-clamp-2 font-body text-[0.78rem] leading-relaxed text-[#4A5E80]">{project.description}</p>
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 border-t border-gray-100 pt-3">
          {project.location && (
            <span className="flex items-center gap-1.5 font-body text-caption text-[#8094B4]">
              <MapPin className="h-3 w-3 text-[#2D8FCC]" />{project.location}
            </span>
          )}
          {project.year && (
            <span className="flex items-center gap-1.5 font-body text-caption text-[#8094B4]">
              <Calendar className="h-3 w-3 text-[#2D8FCC]" />{project.duration} · {project.year}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

export default function InnovacionPage() {
  const settings = useSettings();
  const whatsappNum = settings?.contact.whatsapp || siteConfig.whatsapp;
  const [projects, setProjects] = useState<Project[]>(defaultProjects);

  useEffect(() => {
    fetch('/api/trabajos?active=true')
      .then((r) => r.json())
      .then((d) => { if (d.projects?.length > 0) setProjects(d.projects); })
      .catch(() => {});
  }, []);

  const whatsappUrl = formatWhatsAppUrl(whatsappNum, 'Hola, quiero consultar sobre proyectos de innovación.');
  const featured = projects.filter((p) => p.isActive).slice(0, 6);

  return (
    <>
      {/* Breadcrumb */}
      <div className="border-b border-gray-200 bg-white">
        <div className="container-main flex items-center gap-2 py-3 font-body text-caption text-[#8094B4]">
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
            Proyectos ejecutados con tecnología, métodos modernos y soluciones que hacen la diferencia. De la ingeniería a la entrega final.
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

      {/* Projects grid */}
      <section className="section bg-[#F4F7FB]">
        <div className="container-main">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <span className="overline">Lo que hacemos</span>
              <h2 className="mt-1 font-display text-h2 text-[#0B1120]">Proyectos destacados</h2>
            </div>
            <Link href="/trabajos" className="hidden shrink-0 items-center gap-1.5 font-body text-body-sm font-semibold text-[#2D8FCC] hover:underline sm:flex">
              Ver todos <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {featured.length === 0 ? (
            <div className="py-20 text-center">
              <Isotipo size={72} color="#2D8FCC18" />
              <p className="mt-4 font-body text-body text-[#8094B4]">Próximamente publicaremos nuestros proyectos de innovación.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}

          <div className="mt-8 flex justify-center sm:hidden">
            <Link href="/trabajos" className="btn-secondary">Ver todos los trabajos <ArrowRight className="h-4 w-4" /></Link>
          </div>
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
    </>
  );
}
