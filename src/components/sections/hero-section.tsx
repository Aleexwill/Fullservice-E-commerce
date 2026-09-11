import Link from 'next/link';
import Image from 'next/image';
import { HeroDiagonalCarousel } from '@/components/sections/hero-carousel';
import { ArrowRight, Wrench, Droplets, HardHat, Factory } from 'lucide-react';

export function HeroSection({ image, title }: { image?: string; title?: string }) {
  return <section className="fs-hero"><div className="container-main fs-hero-grid">
    <div className="fs-hero-copy"><p className="fs-eyebrow">FULL SERVICE & CLEAN · PARAGUAY</p>
      <h1>Tu proyecto.<br />Nuestro <span>compromiso.</span></h1>
      <p className="fs-intro">Mantenimiento, limpieza y construcción para espacios que necesitan funcionar mejor.</p>
      <div className="fs-actions"><Link href="/contacto?tipo=presupuesto" className="btn-primary">Pedir presupuesto <ArrowRight size={18}/></Link><Link href="/tienda" className="fs-text-link">Explorar tienda <ArrowRight size={18}/></Link></div>
      <p className="fs-hero-note">Para empresas, industrias y hogares.</p>
    </div>
    <div className={`fs-hero-visual ${image ? 'has-photo' : ''}`}>
      {image ? <Image src={image} alt={title || 'Trabajo de Full Service & Clean'} fill priority sizes="(max-width: 900px) 100vw, 50vw" className="object-cover"/> : <><span className="fs-visual-label">EXPERIENCIA QUE CONECTA</span><div className="fs-service-list">{[[Wrench,'Mantenimiento'],[Droplets,'Limpieza profesional'],[HardHat,'Obras civiles'],[Factory,'Metalúrgica']].map(([Icon,label],i)=>{const Symbol=Icon as typeof Wrench; return <div key={String(label)}><span>0{i+1}</span><Symbol size={24}/><strong>{String(label)}</strong></div>;})}</div></>}
      <div className="fs-visual-caption"><span>Un equipo. Soluciones integrales.</span><ArrowRight size={24}/></div>
    </div>
  </div><div className="container-main fs-hero-carousel"><HeroDiagonalCarousel /></div></section>;
}
