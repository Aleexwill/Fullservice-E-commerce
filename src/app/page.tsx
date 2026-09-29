import Link from 'next/link';
import NextImage from 'next/image';
import { ArrowRight, Target, Eye } from 'lucide-react';
import { HeroSection } from '@/components/sections/hero-section';
import { ServicesSection, CtaSection } from '@/components/sections/services-section';
import { getAllProjects, type Project } from '@/lib/portfolio-store';
import '@/styles/public-refresh.css';
import { Isotipo } from '@/components/ui/isotipo';
import { getCachedSettings } from '@/lib/settings-store';
import { getCachedContent, type SiteContent } from '@/lib/content-store';

/* ============================================================
   QUIÉNES SOMOS (misión, visión, valores)
   ============================================================ */

function AboutSection({ about }: { about: SiteContent['about'] }) {
  return (
    <section className="fs-about" aria-labelledby="about-heading">
      <div className="container-main">
        <div className="fs-about-grid">
          <div>
            <p className="fs-eyebrow">CONOCENOS</p>
            <h2 id="about-heading">Un equipo que se involucra en tu proyecto.</h2>
          </div>
          <div>
            <p>{about.description}</p>
            <Link href="/contacto" className="fs-text-link">Conversemos <ArrowRight size={18} /></Link>
          </div>
        </div>
        <div className="mt-10 grid gap-6 md:mt-14 md:grid-cols-2">
          <article className="rounded-xl border border-[#dce5eb] bg-[#f2f6f8] p-6 sm:p-8">
            <Target className="mb-5 h-8 w-8 text-[#257da8]" aria-hidden="true" />
            <h3 className="mb-3 text-2xl">Nuestra misión</h3>
            <p>{about.mission}</p>
          </article>
          <article className="rounded-xl border border-[#e8dfd4] bg-[#fcf7f0] p-6 sm:p-8">
            <Eye className="mb-5 h-8 w-8 text-[#a95c19]" aria-hidden="true" />
            <h3 className="mb-3 text-2xl">Nuestra visión</h3>
            <p>{about.vision}</p>
          </article>
        </div>
      </div>
    </section>
  );
}


function ProcessSection() {
  return <section className="fs-process"><div className="container-main"><p className="fs-eyebrow">DE LA IDEA A LA EJECUCIÓN</p><h2>Hagámoslo simple.</h2><div className="fs-process-grid">{[['Contanos qué necesitás','Compartí el tipo de trabajo, la ubicación y los detalles de tu proyecto.'],['Definimos el alcance','Coordinamos los detalles para preparar una propuesta acorde a tu necesidad.'],['Coordinamos el trabajo','Acordamos las tareas y los próximos pasos con vos.']].map(([title,copy],i)=><div key={title}><span className="fs-step">0{i+1}</span><h3>{title}</h3><p>{copy}</p></div>)}</div></div></section>;
}


function PortfolioPreview({ projects }: { projects: Project[] }) {
  if (!projects.length) return null;
  return <section className="fs-projects"><div className="container-main"><div className="fs-section-heading"><div><p className="fs-eyebrow">DEL PLAN A LA REALIDAD</p><h2>El trabajo habla.</h2></div><Link href="/trabajos" className="fs-text-link">Ver proyectos <ArrowRight size={18}/></Link></div><div className="fs-project-grid">{projects.slice(0,3).map((project,i)=><Link href="/trabajos" key={project.id} className={`fs-project fs-project-${i}`}><div className="fs-project-image"><NextImage src={project.image} alt={project.title} fill sizes="(max-width: 768px) 100vw, 60vw" className="object-cover"/></div><div className="fs-project-copy"><span>{project.location || project.category}</span><h3>{project.title}</h3></div></Link>)}</div></div></section>;
}

export default async function HomePage() {
  const settings = await getCachedSettings();
  const content = await getCachedContent();
  const projects = (await getAllProjects().catch(() => [])).filter(p => p.isActive && p.image);
  return (
    <div className="fs-home">
      <HeroSection showStore={settings.sections?.showStore !== false} />
      <ServicesSection />
      <PortfolioPreview projects={projects} />
      <ProcessSection />
      <AboutSection about={content.about} />
      <CtaSection whatsapp={settings.contact.whatsapp} />
    </div>
  );
}
