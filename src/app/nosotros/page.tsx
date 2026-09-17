import Link from 'next/link';
import { ChevronRight, ArrowRight, MessageCircle, Phone, ShieldCheck, Eye, Target, Users, Star, Lightbulb } from 'lucide-react';
import { siteConfig } from '@/config/site';
import { formatWhatsAppUrl } from '@/lib/utils';

const valores = [
  { icon: ShieldCheck, title: 'Compromiso', desc: 'Dedicación plena para lograr soluciones eficientes y resultados de calidad.' },
  { icon: Users, title: 'Confianza', desc: 'Relaciones sólidas basadas en la transparencia, el cumplimiento y la satisfacción.' },
  { icon: Star, title: 'Excelencia', desc: 'Mejora continua para optimizar los entornos y servicios ofrecidos.' },
  { icon: Users, title: 'Trabajo en equipo', desc: 'Colaboración y respeto que fortalecen al equipo y al servicio.' },
  { icon: Lightbulb, title: 'Innovación', desc: 'Evolución constante mediante tecnologías y métodos que potencian nuestro impacto.' },
];

export default function NosotrosPage() {
  const whatsappUrl = formatWhatsAppUrl(siteConfig.whatsapp, 'Hola, quiero saber más sobre Full Service & Clean.');
  return (
    <>
      {/* Breadcrumb */}
      <div className="border-b border-gray-200 bg-white">
        <div className="container-main flex items-center gap-2 py-3 font-body text-[.75rem] text-[#8094B4]">
          <Link href="/" className="hover:text-[#0B1120]">Inicio</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-[#0B1120]">Nosotros</span>
        </div>
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-gray-200 bg-[#0B1120] py-20 md:py-28">
        <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(ellipse at 20% 50%,#2D8FCC18 0%,transparent 55%),radial-gradient(ellipse at 80% 20%,#E8862B12 0%,transparent 50%)' }} />
        <div className="pointer-events-none absolute left-0 top-0 h-[2px] w-full" style={{ background: 'linear-gradient(90deg,#2D8FCC,#E8862B,#2D8FCC)' }} />
        <div className="container-main text-center">
          <span className="font-body text-[.7rem] font-semibold uppercase tracking-[.14em] text-[#7CC4EF]">Quiénes somos</span>
          <h1 className="mt-4 font-display text-[clamp(2.2rem,5vw,3.5rem)] font-bold leading-[1.05] tracking-tight text-white">
            Full Service &amp; Clean
          </h1>
          <p className="mx-auto mt-5 max-w-2xl font-body text-[1.05rem] leading-relaxed text-[#8094B4]">
            Empresa paraguaya especializada en mantenimiento, construcción y metalúrgica. Trabajamos con compromiso, confianza y excelencia para transformar cada proyecto en un resultado duradero.
          </p>
        </div>
      </section>

      {/* Misión + Visión */}
      <section className="bg-white py-20 md:py-24">
        <div className="container-main grid gap-8 md:grid-cols-2">
          {/* Misión */}
          <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-[#F4F7FB] p-8 md:p-10">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-[#EBF5FB] text-[#2D8FCC]">
              <Target className="h-6 w-6" />
            </div>
            <span className="font-body text-[.7rem] font-bold uppercase tracking-[.14em] text-[#2D8FCC]">Misión</span>
            <h2 className="mt-2 font-display text-[1.6rem] font-bold leading-tight text-[#0B1120]">Lo que nos mueve cada día</h2>
            <p className="mt-4 font-body text-[.95rem] leading-relaxed text-[#4A5E80]">
              Impulsamos el desarrollo de proyectos ofreciendo soluciones integrales que garantizan el óptimo funcionamiento de los bienes de nuestros clientes. Con un enfoque en la calidad y la eficiencia, fomentamos relaciones de confianza duraderas.
            </p>
            {/* Accent bar */}
            <div className="absolute bottom-0 left-0 h-1 w-full" style={{ background: 'linear-gradient(90deg,#2D8FCC,#E8862B)' }} />
          </div>

          {/* Visión */}
          <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-[#0B1120] p-8 md:p-10 text-white">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-[#7CC4EF]">
              <Eye className="h-6 w-6" />
            </div>
            <span className="font-body text-[.7rem] font-bold uppercase tracking-[.14em] text-[#7CC4EF]">Visión</span>
            <h2 className="mt-2 font-display text-[1.6rem] font-bold leading-tight text-white">Hacia dónde vamos</h2>
            <p className="mt-4 font-body text-[.95rem] leading-relaxed text-[#8094B4]">
              Ser la empresa líder en soluciones integrales de mantenimiento y construcción, reconocida por nuestra calidad, eficiencia y compromiso. Buscamos transformar y optimizar entornos mediante servicios que garanticen su funcionalidad y desarrollo, fortaleciendo relaciones de confianza y generando un impacto positivo en cada proyecto.
            </p>
            <div className="absolute bottom-0 left-0 h-1 w-full" style={{ background: 'linear-gradient(90deg,#2D8FCC,#E8862B)' }} />
          </div>
        </div>
      </section>

      {/* Valores */}
      <section className="bg-[#F4F7FB] py-20 md:py-24">
        <div className="container-main">
          <div className="mb-12 text-center">
            <span className="font-body text-[.7rem] font-bold uppercase tracking-[.14em] text-[#2D8FCC]">Lo que nos define</span>
            <h2 className="mt-2 font-display text-[clamp(1.7rem,3vw,2.4rem)] font-bold text-[#0B1120]">Valores centrales</h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {valores.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="group rounded-2xl border border-white bg-white p-7 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-[#EBF5FB] text-[#2D8FCC] transition-colors group-hover:bg-[#2D8FCC] group-hover:text-white">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-display text-[1.1rem] font-bold text-[#0B1120]">{title}</h3>
                <p className="mt-2 font-body text-[.88rem] leading-relaxed text-[#4A5E80]">{desc}</p>
              </div>
            ))}
            {/* Pontualmente card — último valor del documento */}
            <div className="rounded-2xl border border-[#2D8FCC]/20 bg-[#EBF5FB] p-7">
              <p className="font-body text-[.85rem] font-semibold italic text-[#2D8FCC]">
                &ldquo;Nuestros valores: compromiso, confianza, excelencia, trabajo en equipo e innovación.&rdquo;
              </p>
              <p className="mt-3 font-body text-[.8rem] text-[#4A5E80]">— Full Service &amp; Clean</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-gray-200 bg-white py-16">
        <div className="container-main text-center">
          <span className="font-body text-[.7rem] font-semibold uppercase tracking-[.14em] text-[#2D8FCC]">¿Trabajamos juntos?</span>
          <h2 className="mt-2 font-display text-[clamp(1.5rem,3vw,2rem)] font-bold text-[#0B1120]">Contactanos hoy</h2>
          <p className="mx-auto mt-3 max-w-md font-body text-[.95rem] text-[#4A5E80]">Contanos tu proyecto y te armamos un presupuesto sin compromiso.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="btn-whatsapp"><MessageCircle className="h-4 w-4" /> WhatsApp</a>
            <Link href="/contacto" className="btn-secondary"><Phone className="h-4 w-4" /> Contactar</Link>
            <Link href="/servicios" className="btn-primary">Ver servicios <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </section>
    </>
  );
}
