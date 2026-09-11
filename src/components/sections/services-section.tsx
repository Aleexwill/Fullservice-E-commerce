import Link from 'next/link';
import { Wrench, HardHat, Factory, Droplets, Clock, Users, FileText, ArrowRight, Phone, MessageCircle } from 'lucide-react';
import { siteConfig } from '@/config/site';
import { formatWhatsAppUrl } from '@/lib/utils';

const trustItems = [
  { icon: Clock, title: 'Respuesta en 24 h', description: 'Respondemos tu consulta en menos de 24 horas' },
  { icon: Users, title: 'Técnicos verificados', description: 'Personal capacitado y con experiencia comprobada' },
  { icon: Wrench, title: 'Materiales de primera', description: 'Trabajamos con las mejores marcas del mercado' },
  { icon: FileText, title: 'Garantía por escrito', description: 'Todos nuestros trabajos tienen garantía documentada' },
];

export function TrustBar() {
  return <section className="section-sm border-y border-gray-200 bg-[#F4F7FB]"><div className="container-main"><div className="grid grid-cols-2 gap-6 md:grid-cols-4 md:gap-8">{trustItems.map((item) => { const Icon = item.icon; return <div key={item.title} className="flex flex-col items-center text-center"><div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-[#EBF5FB] text-[#2D8FCC]"><Icon className="h-6 w-6" /></div><h3 className="font-body text-body-sm font-semibold text-[#0B1120]">{item.title}</h3><p className="mt-1 hidden font-body text-caption text-[#4A5E80] sm:block">{item.description}</p></div>; })}</div></div></section>;
}

const services = [
  { icon: Wrench, title: 'Mantenimiento general', description: 'Reparaciones, instalaciones y mantenimiento preventivo para tu empresa o hogar. Electricidad, plomería, pintura y más.', href: '/servicios?categoria=mantenimiento', iconBg: 'bg-blue-muted', iconColor: 'text-blue-bright', count: '12 servicios' },
  { icon: HardHat, title: 'Construcción civil', description: 'Obras nuevas, ampliaciones, refacciones y terminaciones con calidad profesional. Presupuesto detallado sin compromiso.', href: '/servicios?categoria=civil', iconBg: 'bg-yellow-muted', iconColor: 'text-yellow-bright', count: '8 servicios' },
  { icon: Factory, title: 'Metalúrgica', description: 'Estructuras metálicas, herrería, soldadura y trabajos a medida. Portones, rejas, escaleras y más.', href: '/servicios?categoria=metalurgica', iconBg: 'bg-success-light', iconColor: 'text-[#48BB78]', count: '6 servicios' },
];

export function ServicesSection() {
  const items = [
    { icon: Wrench, title: 'Mantenimiento', text: 'Instalaciones, reparaciones y cuidado de tus espacios.', query: 'mantenimiento' },
    { icon: Droplets, title: 'Limpieza profesional', text: 'Consultá por limpieza para oficinas, industrias y espacios comerciales.', query: 'limpieza' },
    { icon: HardHat, title: 'Construcción civil', text: 'Obras, ampliaciones y remodelaciones para tu próximo proyecto.', query: 'civil' },
    { icon: Factory, title: 'Metalúrgica', text: 'Estructuras, herrería y soluciones fabricadas a medida.', query: 'metalurgica' },
  ];
  return <section className="fs-services"><div className="container-main"><div className="fs-section-heading"><div><p className="fs-eyebrow">QUÉ PODEMOS HACER POR VOS</p><h2>Soluciones que<br/>hacen la diferencia.</h2></div><p className="fs-section-description">Del mantenimiento cotidiano a una nueva obra. Encontrá el servicio que necesita tu espacio.</p></div><div className="fs-services-grid">{items.map(({icon:Icon,title,text,query},i)=><Link key={title} href={query==='limpieza'?'/contacto?tipo=presupuesto&servicio=Limpieza%20profesional':`/servicios?categoria=${query}`} className="fs-service"><div className="fs-service-top"><Icon size={30}/><span>0{i+1}</span></div><h3>{title}</h3><p>{text}</p><span className="fs-service-link">{query==='limpieza'?'Consultar':'Explorar servicio'} <ArrowRight size={18}/></span></Link>)}</div></div></section>;
}

export function CtaSection({ whatsapp }: { whatsapp?: string } = {}) {
  const whatsappUrl = formatWhatsAppUrl(whatsapp || siteConfig.whatsapp, 'Hola, me gustaría pedir un presupuesto.');
  return <section className="relative overflow-hidden bg-[#0B1120] py-16 md:py-20"><div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: 'radial-gradient(circle at 25% 50%, #2D8FCC 0%, transparent 55%), radial-gradient(circle at 78% 50%, #E8862B 0%, transparent 55%)' }} /><div className="absolute left-0 top-0 h-[3px] w-full bg-gradient-to-r from-[#2D8FCC] via-[#E8862B] to-[#2D8FCC]" /><div className="container-main relative text-center"><span className="mb-3 block font-body text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-[#3CAAE0]">Contacto</span><h2 className="text-balance font-display text-h1 uppercase text-white">¿Necesitás una cotización?</h2><div className="mx-auto mt-4 h-[3px] w-12 rounded-sm bg-gradient-to-r from-[#2D8FCC] to-[#E8862B]" /><p className="mx-auto mt-6 max-w-xl font-body text-body-lg text-[#8094B4]">Contanos tu proyecto y te respondemos en menos de 24 horas con un presupuesto detallado y sin compromiso.</p><div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-4"><Link href="/contacto" className="btn-primary px-8 py-4 text-[0.8rem]"><Phone className="h-4 w-4" />Contactar ahora</Link><a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="btn-whatsapp px-8 py-4 text-[0.8rem]"><MessageCircle className="h-4 w-4" />WhatsApp</a></div></div></section>;
}
