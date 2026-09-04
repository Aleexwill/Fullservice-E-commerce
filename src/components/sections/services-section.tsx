import Link from 'next/link';
import { Wrench, HardHat, Factory, Clock, Users, FileText, ArrowRight, Phone, MessageCircle } from 'lucide-react';
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
  { icon: Wrench, title: 'Mantenimiento general', description: 'Reparaciones, instalaciones y mantenimiento preventivo para tu empresa o hogar. Electricidad, plomería, pintura y más.', href: '/servicios/mantenimiento', iconBg: 'bg-blue-muted', iconColor: 'text-blue-bright', count: '12 servicios' },
  { icon: HardHat, title: 'Construcción civil', description: 'Obras nuevas, ampliaciones, refacciones y terminaciones con calidad profesional. Presupuesto detallado sin compromiso.', href: '/servicios/construccion-civil', iconBg: 'bg-yellow-muted', iconColor: 'text-yellow-bright', count: '8 servicios' },
  { icon: Factory, title: 'Metalúrgica', description: 'Estructuras metálicas, herrería, soldadura y trabajos a medida. Portones, rejas, escaleras y más.', href: '/servicios/metalurgica', iconBg: 'bg-success-light', iconColor: 'text-[#48BB78]', count: '6 servicios' },
];

export function ServicesSection() {
  return <section className="section bg-white"><div className="container-main"><div className="mb-12"><span className="mb-2 block font-body text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-[#2D8FCC]">Nuestros servicios</span><h2 className="font-display text-h1 uppercase text-[#0B1120]">Servicios profesionales</h2><div className="mt-4 h-[3px] w-12 rounded-sm bg-gradient-to-r from-blue to-orange" /><p className="mt-4 max-w-lg font-body text-body text-[#4A5E80]">Cubrimos todas las necesidades de mantenimiento, construcción y metalúrgica para empresas y hogares.</p></div><div className="grid grid-cols-1 gap-6 md:grid-cols-3">{services.map((service) => { const Icon = service.icon; return <Link key={service.title} href={service.href} className="card-interactive group p-6"><div className="mb-4 flex items-center gap-3"><div className={`flex h-10 w-10 items-center justify-center rounded-lg ${service.iconBg} ${service.iconColor}`}><Icon className="h-5 w-5" /></div><div><h3 className="font-display text-h4 text-[#0B1120] transition-colors group-hover:text-[#2D8FCC]">{service.title}</h3><span className="font-body text-caption text-[#8094B4]">{service.count}</span></div></div><p className="font-body text-body-sm leading-relaxed text-[#4A5E80]">{service.description}</p><div className="mt-4 inline-flex items-center gap-1 font-body text-label font-semibold uppercase tracking-[0.06em] text-[#2D8FCC]">Ver más <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" /></div></Link>; })}</div></div></section>;
}

export function CtaSection({ whatsapp }: { whatsapp?: string } = {}) {
  const whatsappUrl = formatWhatsAppUrl(whatsapp || siteConfig.whatsapp, 'Hola, me gustaría pedir un presupuesto.');
  return <section className="relative overflow-hidden bg-[#0B1120] py-16 md:py-20"><div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: 'radial-gradient(circle at 25% 50%, #2D8FCC 0%, transparent 55%), radial-gradient(circle at 78% 50%, #E8862B 0%, transparent 55%)' }} /><div className="absolute left-0 top-0 h-[3px] w-full bg-gradient-to-r from-[#2D8FCC] via-[#E8862B] to-[#2D8FCC]" /><div className="container-main relative text-center"><span className="mb-3 block font-body text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-[#3CAAE0]">Contacto</span><h2 className="text-balance font-display text-h1 uppercase text-white">¿Necesitás una cotización?</h2><div className="mx-auto mt-4 h-[3px] w-12 rounded-sm bg-gradient-to-r from-[#2D8FCC] to-[#E8862B]" /><p className="mx-auto mt-6 max-w-xl font-body text-body-lg text-[#8094B4]">Contanos tu proyecto y te respondemos en menos de 24 horas con un presupuesto detallado y sin compromiso.</p><div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-4"><Link href="/contacto" className="btn-primary px-8 py-4 text-[0.8rem]"><Phone className="h-4 w-4" />Contactar ahora</Link><a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="btn-whatsapp px-8 py-4 text-[0.8rem]"><MessageCircle className="h-4 w-4" />WhatsApp</a></div></div></section>;
}
