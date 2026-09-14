'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Wrench, HardHat, Factory, Zap, Droplets, Paintbrush, ShieldCheck, Thermometer, ArrowRight, MessageCircle, Phone, ChevronRight } from 'lucide-react';
import { siteConfig } from '@/config/site';
import { formatWhatsAppUrl } from '@/lib/utils';

function ProjectReel({ images }: { images: string[] }) {
  if (images.length === 0) return null;
  // No duplicates — just scroll the unique list; duplicate the array only for the seamless loop
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
{id:'1',icon:Zap,title:'Instalaciones eléctricas',description:'Instalación, mantenimiento y reparación de sistemas eléctricos.',category:'mantenimiento' as ServiceCategory,features:['Tableros eléctricos','Iluminación LED','Puesta a tierra','Mantenimiento preventivo']},
{id:'2',icon:Droplets,title:'Plomería e hidráulica',description:'Reparación de cañerías, instalación de sanitarios y bombas de agua.',category:'mantenimiento' as ServiceCategory,features:['Reparación de pérdidas','Instalación sanitaria','Bombas de agua']},
{id:'3',icon:Paintbrush,title:'Pintura y acabados',description:'Pintura interior y exterior, impermeabilización y revestimientos.',category:'mantenimiento' as ServiceCategory,features:['Pintura interior/exterior','Impermeabilización','Texturizados']},
{id:'4',icon:HardHat,title:'Obras nuevas',description:'Construcción de viviendas, locales comerciales y naves industriales.',category:'civil' as ServiceCategory,features:['Viviendas','Locales comerciales','Galpones']},
{id:'5',icon:Factory,title:'Estructuras metálicas',description:'Diseño, fabricación y montaje de estructuras metálicas.',category:'metalurgica' as ServiceCategory,features:['Naves industriales','Galpones','Entrepisos']},
{id:'6',icon:Factory,title:'Herrería y soldadura',description:'Portones, rejas, escaleras, barandas y trabajos a medida.',category:'metalurgica' as ServiceCategory,features:['Portones automáticos','Rejas de seguridad','Escaleras']},
];

export default function ServiciosPage(){
 const searchParams = useSearchParams();
 const initialCategory = (searchParams.get('categoria') as ServiceCategory) || 'todos';
 const [activeCategory,setActiveCategory]=useState<ServiceCategory>(initialCategory); const [services,setServices]=useState(defaultServices);
 const [reelImages,setReelImages]=useState<string[]>([]);
 useEffect(()=>{fetch('/api/servicios-cms?active=true').then(r=>r.json()).then(d=>{if(d.services?.length)setServices(d.services.map((s:any)=>({...s,icon:ICON_MAP[s.icon]||Wrench})));}).catch(()=>{});},[]);
 useEffect(()=>{fetch('/api/carousel-slides').then(r=>r.json()).then((d:any[])=>{if(Array.isArray(d)){const imgs=[...new Set(d.map((s:any)=>s.photoUrl).filter(Boolean))];if(imgs.length>0)setReelImages(imgs);}}).catch(()=>{});},[]);
 const filtered=activeCategory==='todos'?services:services.filter((s:any)=>s.category===activeCategory); const whatsappUrl=formatWhatsAppUrl(siteConfig.whatsapp,'Hola, quiero consultar sobre sus servicios.');
 return <>
  <div className="border-b border-gray-200 bg-white"><div className="container-main flex items-center gap-2 py-3 font-body text-caption text-[#8094B4]"><Link href="/" className="hover:text-[#0B1120]">Inicio</Link><ChevronRight className="h-3 w-3"/><span className="font-medium text-[#0B1120]">Servicios</span></div></div>
  <section className="relative overflow-hidden border-b border-gray-200 bg-[#0B1120] py-20 md:py-24">
    {/* Gradiente de fondo */}
    <div className="pointer-events-none absolute inset-0" style={{background:'radial-gradient(ellipse at 20% 50%,#2D8FCC18 0%,transparent 55%),radial-gradient(ellipse at 80% 20%,#E8862B12 0%,transparent 50%)'}}/>
    <div className="pointer-events-none absolute left-0 top-0 h-[2px] w-full" style={{background:'linear-gradient(90deg,#2D8FCC,#E8862B,#2D8FCC)'}}/>
    <div className="container-main flex flex-col gap-12 md:flex-row md:items-center md:justify-between">
      {/* Copy */}
      <div className="max-w-2xl">
        <span className="overline text-[#7CC4EF]">Lo que hacemos</span>
        <h1 className="mt-4 font-display text-[clamp(2rem,4.5vw,3.25rem)] font-bold leading-[1.05] tracking-tight text-white">Soluciones para<br/>cada proyecto</h1>
        <p className="mt-5 font-body text-body-lg leading-relaxed text-[#8094B4]">Mantenimiento, obras civiles y metalúrgica para empresas y hogares.<br className="hidden md:block"/> Presupuesto detallado sin compromiso.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/contacto?tipo=presupuesto" className="btn-primary">Pedir presupuesto <ArrowRight className="h-4 w-4"/></Link>
          <a href={formatWhatsAppUrl(siteConfig.whatsapp,'Hola, quiero consultar sobre sus servicios.')} target="_blank" rel="noopener noreferrer" className="btn-whatsapp"><MessageCircle className="h-4 w-4"/> WhatsApp</a>
        </div>
      </div>
      {/* Animated project reel */}
      <ProjectReel images={reelImages}/>
    </div>
  </section>
  <section className="sticky top-[95px] z-40 border-b border-gray-200 bg-white/95 backdrop-blur-lg"><div className="container-main flex gap-1 overflow-x-auto py-3">{categories.map(cat=><button key={cat.id} onClick={()=>setActiveCategory(cat.id)} aria-pressed={activeCategory===cat.id} className={`min-h-[44px] whitespace-nowrap rounded-lg px-5 py-3 font-body text-[.75rem] font-semibold uppercase tracking-[.04em] transition-all ${activeCategory===cat.id?'bg-[#0B1120] text-white shadow-sm':'text-[#8094B4] hover:bg-[#F4F7FB] hover:text-[#0B1120]'}`}>{cat.label}</button>)}</div></section>
  <section className="section bg-[#F4F7FB]"><div className="container-main"><div className="mb-7 flex items-center justify-between"><span className="overline">Servicios profesionales</span><span className="font-body text-body-sm text-[#8094B4]">{filtered.length} servicio{filtered.length!==1?'s':''}</span></div><div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">{filtered.map((service:any)=>{const Icon=service.icon;const wa=formatWhatsAppUrl(siteConfig.whatsapp,`Hola, quiero solicitar información sobre ${service.title}.`);const hasImg=!!service.image;const titleCls=hasImg?'mt-6 font-display text-h3 leading-tight text-white group-hover:text-[#7CC4EF]':'mt-6 font-display text-h3 leading-tight text-[#0B1120] group-hover:text-[#2D8FCC]';const descCls=hasImg?'mt-2 font-body text-body-sm leading-relaxed text-white/80':'mt-2 font-body text-body-sm leading-relaxed text-[#4A5E80]';const featCls=hasImg?'flex items-center gap-2 font-body text-caption text-white/75':'flex items-center gap-2 font-body text-caption text-[#4A5E80]';const dotCls=hasImg?'h-1.5 w-1.5 shrink-0 rounded-full bg-[#7CC4EF]':'h-1.5 w-1.5 shrink-0 rounded-full bg-[#2D8FCC]';const iconBoxCls=hasImg?'flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 text-white backdrop-blur-sm':'flex h-12 w-12 items-center justify-center rounded-xl bg-[#EBF5FB] text-[#2D8FCC]';return <article key={service.id} className={`card-interactive group relative flex flex-col overflow-hidden ${hasImg?'':'p-6'}`}>{hasImg&&<><img src={service.image} alt={service.title} className="absolute inset-0 h-full w-full object-cover opacity-60 transition-opacity duration-300 group-hover:opacity-70"/><div className="absolute inset-0 bg-gradient-to-b from-[#0B1120]/50 via-[#0B1120]/40 to-[#0B1120]/65 pointer-events-none"/></>}<div className={`relative z-10 flex flex-1 flex-col ${hasImg?'p-6':''}`}><div className="flex items-start justify-between gap-4"><div className={iconBoxCls}><Icon className="h-5 w-5"/></div><span className={hasImg?'inline-flex items-center rounded-full bg-white/20 px-2.5 py-0.5 font-body text-[0.65rem] font-semibold text-white backdrop-blur-sm':'badge-blue'}>{service.category==='civil'?'Civil':service.category==='metalurgica'?'Metalúrgica':'Mantenimiento'}</span></div><h2 className={titleCls}>{service.title}</h2><p className={descCls}>{service.description}</p><ul className="mt-5 space-y-2">{service.features?.map((f:string)=><li key={f} className={featCls}><span className={dotCls}/>{f}</li>)}</ul><div className="mt-auto flex gap-2 pt-6"><Link href={`/contacto?tipo=presupuesto&servicio=${encodeURIComponent(service.title)}&categoria=${encodeURIComponent(service.category)}`} className="btn-primary flex-1">Cotizar <ArrowRight className="h-4 w-4"/></Link><a href={wa} target="_blank" rel="noopener noreferrer" aria-label={`Consultar ${service.title} por WhatsApp`} className="btn-whatsapp px-3"><MessageCircle className="h-4 w-4"/></a></div></div></article>})}</div></div></section>
  <section className="border-t border-gray-200 bg-white py-16"><div className="container-main text-center"><span className="overline">¿Necesitás algo más?</span><h2 className="mt-2 font-display text-h2 text-[#0B1120]">Hablemos de tu proyecto</h2><p className="mx-auto mt-3 max-w-md font-body text-body text-[#4A5E80]">Contanos qué necesitás y te ayudamos a encontrar la solución ideal.</p><div className="mt-6 flex flex-wrap justify-center gap-3"><a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="btn-whatsapp"><MessageCircle className="h-4 w-4"/> WhatsApp</a><Link href="/contacto" className="btn-secondary"><Phone className="h-4 w-4"/> Contactar</Link></div></div></section>
 </>;
}
