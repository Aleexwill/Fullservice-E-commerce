'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Wrench, HardHat, Factory, Zap, Droplets, Paintbrush, ShieldCheck, Thermometer, ArrowRight, MessageCircle, Phone, ChevronRight } from 'lucide-react';
import { siteConfig } from '@/config/site';
import { formatWhatsAppUrl } from '@/lib/utils';
import { useSettings } from '@/lib/settings-context';

function ProjectReel({ images }: { images: string[] }) {
  if (images.length === 0) return null;
  const doubled = [...images, ...images];
  const duration = images.length * 3;
  return (
    <div className="relative hidden h-[340px] w-[160px] shrink-0 overflow-hidden rounded-2xl md:block" aria-hidden="true">
      <div className="absolute inset-0 z-10 pointer-events-none" style={{background:'linear-gradient(to bottom,#0B1120 0%,transparent 18%,transparent 82%,#0B1120 100%)'}}/>
      <div className="flex flex-col gap-3" style={{animation:`reel-scroll ${duration}s linear infinite`}}>
        {doubled.map((src, i) => (
          <div key={i} className="h-[100px] w-[160px] shrink-0 overflow-hidden rounded-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" className="h-full w-full object-cover" loading="lazy"/>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes reel-scroll{0%{transform:translateY(0)}100%{transform:translateY(-50%)}}
      `}</style>
    </div>
  );
}

type ServiceCategory = 'todos' | 'mantenimiento' | 'civil' | 'metalurgica';
const categories = [{id:'todos',label:'Todos'},{id:'mantenimiento',label:'Mantenimiento'},{id:'civil',label:'Construcción civil'},{id:'metalurgica',label:'Metalúrgica'}] as const;
const ICON_MAP: Record<string, any> = { Zap, Droplets, Paintbrush, Wrench, HardHat, Factory, ShieldCheck, Thermometer };
const defaultServices = [
  {id:'1',icon:Zap,title:'Instalaciones eléctricas',description:'Instalación, mantenimiento y reparación de sistemas eléctricos residenciales e industriales con materiales certificados.',category:'mantenimiento' as ServiceCategory,features:['Tableros eléctricos','Iluminación LED','Puesta a tierra','Mantenimiento preventivo']},
  {id:'2',icon:Droplets,title:'Plomería e hidráulica',description:'Reparación de cañerías, instalación de sanitarios y sistemas de bombas de agua para hogares y empresas.',category:'mantenimiento' as ServiceCategory,features:['Reparación de pérdidas','Instalación sanitaria','Bombas de agua']},
  {id:'3',icon:Paintbrush,title:'Pintura y acabados',description:'Pintura interior y exterior, impermeabilización y revestimientos con productos de primera calidad.',category:'mantenimiento' as ServiceCategory,features:['Pintura interior/exterior','Impermeabilización','Texturizados']},
  {id:'4',icon:HardHat,title:'Obras nuevas',description:'Construcción de viviendas, locales comerciales y naves industriales desde cero hasta la entrega llave en mano.',category:'civil' as ServiceCategory,features:['Viviendas','Locales comerciales','Galpones']},
  {id:'5',icon:Factory,title:'Estructuras metálicas',description:'Diseño, fabricación y montaje de estructuras metálicas para proyectos industriales y comerciales.',category:'metalurgica' as ServiceCategory,features:['Naves industriales','Galpones','Entrepisos']},
  {id:'6',icon:Factory,title:'Herrería y soldadura',description:'Portones, rejas, escaleras, barandas y trabajos a medida con materiales de acero de alta resistencia.',category:'metalurgica' as ServiceCategory,features:['Portones automáticos','Rejas de seguridad','Escaleras']},
];

function ServiceCard({ service, index }: { service: any; index: number }) {
  const Icon = service.icon || Wrench;
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-center gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#E8862B] font-body text-[0.7rem] font-bold text-white">
          {index + 1}
        </span>
        <Icon className="h-5 w-5 shrink-0 text-[#E8862B]" />
      </div>
      <h2 className="font-display text-[0.8rem] font-bold uppercase leading-snug tracking-wide text-[#0B1120]">
        {service.title}
      </h2>
      <p className="font-body text-[0.72rem] leading-relaxed text-[#4A5E80]">
        {service.description}
      </p>
      {service.features?.length > 0 && (
        <ul className="mt-1 space-y-1">
          {service.features.slice(0, 3).map((f: string) => (
            <li key={f} className="flex items-center gap-1.5 font-body text-[0.65rem] text-[#8094B4]">
              <span className="h-1 w-1 shrink-0 rounded-full bg-[#E8862B]" />
              {f}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ServiciosPageInner() {
  const settings = useSettings();
  const whatsappNum = settings?.contact.whatsapp || siteConfig.whatsapp;
  const searchParams = useSearchParams();
  const initialCategory = (searchParams.get('categoria') as ServiceCategory) || 'todos';
  const [activeCategory, setActiveCategory] = useState<ServiceCategory>(initialCategory);
  const [services, setServices] = useState(defaultServices);
  const [reelImages, setReelImages] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/servicios-cms?active=true').then(r => r.json()).then(d => {
      if (d.services?.length) setServices(d.services.map((s: any) => ({ ...s, icon: ICON_MAP[s.icon] || Wrench })));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    fetch('/api/carousel-slides').then(r => r.json()).then((d: any[]) => {
      if (Array.isArray(d)) {
        const imgs = [...new Set(d.map((s: any) => s.photoUrl).filter(Boolean))];
        if (imgs.length > 0) setReelImages(imgs);
      }
    }).catch(() => {});
  }, []);

  const filtered = activeCategory === 'todos' ? services : services.filter((s: any) => s.category === activeCategory);
  const whatsappUrl = formatWhatsAppUrl(whatsappNum, 'Hola, quiero consultar sobre sus servicios.');

  return <>
    {/* Breadcrumb */}
    <div className="border-b border-gray-200 bg-white">
      <div className="container-main flex items-center gap-2 py-3 font-body text-caption text-[#8094B4]">
        <Link href="/" className="hover:text-[#0B1120]">Inicio</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="font-medium text-[#0B1120]">Servicios</span>
      </div>
    </div>

    {/* Hero */}
    <section className="relative overflow-hidden border-b border-gray-200 bg-[#0B1120] py-20 md:py-24">
      <div className="pointer-events-none absolute inset-0" style={{background:'radial-gradient(ellipse at 20% 50%,#2D8FCC18 0%,transparent 55%),radial-gradient(ellipse at 80% 20%,#E8862B12 0%,transparent 50%)'}}/>
      <div className="pointer-events-none absolute left-0 top-0 h-[2px] w-full" style={{background:'linear-gradient(90deg,#2D8FCC,#E8862B,#2D8FCC)'}}/>
      <div className="container-main flex flex-col gap-12 md:flex-row md:items-center md:justify-between">
        <div className="max-w-2xl">
          <span className="overline text-[#7CC4EF]">Lo que hacemos</span>
          <h1 className="mt-4 font-display text-[clamp(2rem,4.5vw,3.25rem)] font-bold leading-[1.05] tracking-tight text-white">Soluciones para<br/>cada proyecto</h1>
          <p className="mt-5 font-body text-body-lg leading-relaxed text-[#8094B4]">Mantenimiento, obras civiles y metalúrgica para empresas y hogares.<br className="hidden md:block"/> Presupuesto detallado sin compromiso.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/contacto?tipo=presupuesto" className="btn-primary">Pedir presupuesto <ArrowRight className="h-4 w-4"/></Link>
            <a href={formatWhatsAppUrl(whatsappNum, 'Hola, quiero consultar sobre sus servicios.')} target="_blank" rel="noopener noreferrer" className="btn-whatsapp"><MessageCircle className="h-4 w-4"/> WhatsApp</a>
          </div>
        </div>
        <ProjectReel images={reelImages}/>
      </div>
    </section>

    {/* Category tabs */}
    <section className="sticky top-[68px] z-40 border-b border-gray-200 bg-white/95 backdrop-blur-lg lg:top-[95px]">
      <div className="container-main flex gap-1 overflow-x-auto py-3">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            aria-pressed={activeCategory === cat.id}
            className={`min-h-[44px] whitespace-nowrap rounded-lg px-5 py-3 font-body text-[.75rem] font-semibold uppercase tracking-[.04em] transition-all ${activeCategory === cat.id ? 'bg-[#0B1120] text-white shadow-sm' : 'text-[#8094B4] hover:bg-[#F4F7FB] hover:text-[#0B1120]'}`}
          >
            {cat.label}
          </button>
        ))}
      </div>
    </section>

    {/* Flip cards grid */}
    <section className="section bg-[#F4F7FB]">
      <div className="container-main">
        <div className="mb-7 flex items-center justify-between">
          <span className="overline">Servicios profesionales</span>
          <span className="font-body text-body-sm text-[#8094B4]">{filtered.length} servicio{filtered.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((service: any, i: number) => (
            <ServiceCard key={service.id} service={service} index={i} />
          ))}
        </div>
      </div>
    </section>

    {/* CTA bottom */}
    <section className="border-t border-gray-200 bg-white py-16">
      <div className="container-main text-center">
        <span className="overline">¿Necesitás algo más?</span>
        <h2 className="mt-2 font-display text-h2 text-[#0B1120]">Hablemos de tu proyecto</h2>
        <p className="mx-auto mt-3 max-w-md font-body text-body text-[#4A5E80]">Contanos qué necesitás y te ayudamos a encontrar la solución ideal.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="btn-whatsapp"><MessageCircle className="h-4 w-4"/> WhatsApp</a>
          <Link href="/contacto" className="btn-secondary"><Phone className="h-4 w-4"/> Contactar</Link>
        </div>
      </div>
    </section>
  </>;
}

export default function ServiciosPage() {
  return <Suspense fallback={null}><ServiciosPageInner /></Suspense>;
}
