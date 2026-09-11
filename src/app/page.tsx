import Link from 'next/link';
import NextImage from 'next/image';
import { Star, ArrowRight } from 'lucide-react';
import { HeroSection } from '@/components/sections/hero-section';
import { ServicesSection, CtaSection } from '@/components/sections/services-section';
import { getAllProjects, type Project } from '@/lib/portfolio-store';
import '@/styles/public-refresh.css';
import { Isotipo } from '@/components/ui/isotipo';
import { AddToCartButton } from '@/components/sections/add-to-cart-button';
import { getCachedSettings } from '@/lib/settings-store';
import { getCachedContent, type SiteContent } from '@/lib/content-store';
import { getAllProducts } from '@/lib/products-store';
import { formatPrice, getEffectivePrice } from '@/lib/utils';

/* ============================================================
   QUIÉNES SOMOS (misión, visión, valores)
   ============================================================ */

function AboutSection({ about }: { about: SiteContent['about'] }) {
  return <section className="fs-about"><div className="container-main fs-about-grid"><div><p className="fs-eyebrow">CONOCENOS</p><h2>Un equipo que se involucra en tu proyecto.</h2></div><div><p>{about.description}</p><Link href="/contacto" className="fs-text-link">Conversemos <ArrowRight size={18}/></Link></div></div></section>;
}

function PartnersSection() {
  const names = ['Tigre','Grupo MAO','Paraguay Textil','Agpar','Inyeplast','Innova Technology Paraguay','Ball','Granusa','Rodan','Gala','Sena Ingeniería','Agriplus'];
  const crops = [[24,32,190,75],[279,32,204,88],[575,42,168,77],[42,168,153,100],[303,187,156,63],[586,146,159,157],[20,317,156,153],[267,375,210,72],[541,344,211,112],[38,518,160,72],[262,524,254,81],[560,522,181,72]];
  return <section className="fs-partners"><div className="container-main"><div className="fs-partners-heading"><p className="fs-eyebrow">RELACIONES QUE CONSTRUIMOS</p><h2>Empresas con las que trabajamos</h2></div><div className="fs-partner-grid">{names.map((name,i)=><div key={name} className="fs-partner"><div role="img" aria-label={name} className="fs-partner-crop" style={{aspectRatio:`${crops[i][2]}/${crops[i][3]}`,maxWidth:140,maxHeight:90}}><img src="/partners/empresas.jpeg" alt="" style={{width:`${788/crops[i][2]*100}%`,height:`${663/crops[i][3]*100}%`,left:`-${crops[i][0]/crops[i][2]*100}%`,top:`-${crops[i][1]/crops[i][3]*100}%`}}/></div></div>)}</div></div></section>;
}

function ProcessSection() {
  return <section className="fs-process"><div className="container-main"><p className="fs-eyebrow">DE LA IDEA A LA EJECUCIÓN</p><h2>Hagámoslo simple.</h2><div className="fs-process-grid">{[['Contanos qué necesitás','Compartí el tipo de trabajo, la ubicación y los detalles de tu proyecto.'],['Definimos el alcance','Coordinamos los detalles para preparar una propuesta acorde a tu necesidad.'],['Coordinamos el trabajo','Acordamos las tareas y los próximos pasos con vos.']].map(([title,copy],i)=><div key={title}><span className="fs-step">0{i+1}</span><h3>{title}</h3><p>{copy}</p></div>)}</div></div></section>;
}

/* ============================================================
   PRODUCTOS DESTACADOS
   ============================================================ */

async function FeaturedProducts() {
  const all = await getAllProducts().catch(() => []);
  const products = all.filter((p) => p.isFeatured && p.isActive).slice(0, 4);

  if (products.length === 0) return null;

  return (
    <section className="section border-t border-gray-200">
      <div className="container-main">
        <div className="mb-12">
          <span className="overline mb-2 block">E-commerce</span>
          <h2 className="font-display text-h1 uppercase text-[#0B1120]">
            Productos destacados
          </h2>
          <div className="mt-4 h-[3px] w-12 rounded-sm bg-gradient-to-r from-blue to-orange" />
          <p className="mt-4 font-body text-body text-[#4A5E80]">
            Herramientas y materiales de las mejores marcas, con envío a domicilio.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {products.map((product) => {
            const promo = getEffectivePrice(product);
            const discount = promo.isOnSale
              ? promo.discountPercent
              : product.compareAtPrice && product.compareAtPrice > product.price
                ? Math.round((1 - product.price / product.compareAtPrice) * 100)
                : 0;
            const displayPrice = promo.isOnSale ? promo.price : product.price;
            const strikePrice = promo.isOnSale
              ? product.price
              : product.compareAtPrice && product.compareAtPrice > product.price
                ? product.compareAtPrice
                : null;

            return (
              <div key={product.id} className="card-interactive group overflow-hidden">
                <Link href={`/tienda/${product.slug}`}>
                  <div className="relative flex h-44 items-center justify-center bg-gradient-to-br from-[#EBF5FB] to-[#F4F7FB]">
                    {product.images?.[0] ? (
                      <NextImage src={product.images[0]} alt={product.name} fill className="object-cover" sizes="(max-width: 768px) 50vw, 25vw" />
                    ) : (
                      <Isotipo size={64} />
                    )}
                    {discount > 0 && (
                      <span className="badge-red absolute left-2 top-2">{promo.isOnSale ? 'Oferta ' : ''}-{discount}%</span>
                    )}
                  </div>
                  <div className="p-4 pb-0">
                    <span className="font-body text-overline uppercase tracking-[0.08em] text-[#8094B4]">{product.brand}</span>
                    <h3 className="mt-1 font-body text-body-sm font-semibold text-[#0B1120] leading-tight line-clamp-2">{product.name}</h3>
                    {product.reviewCount > 0 && (
                      <div className="mt-2 flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`h-3 w-3 ${i < Math.floor(product.rating) ? 'fill-yellow text-yellow' : 'text-[#C0CEDF]'}`} />
                        ))}
                        <span className="ml-1 font-body text-caption text-[#8094B4]">({product.reviewCount})</span>
                      </div>
                    )}
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="font-display text-[1.3rem] font-bold text-[#0B1120]">{formatPrice(displayPrice)}</span>
                      {strikePrice && <span className="font-body text-body-sm text-[#8094B4] line-through">{formatPrice(strikePrice)}</span>}
                    </div>
                  </div>
                </Link>
                <div className="p-4 pt-3">
                  <AddToCartButton productId={product.id} sku={product.sku} name={product.name} slug={product.slug} price={displayPrice} image={product.images?.[0] || ''} stock={product.stock} />
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 text-center">
          <Link href="/tienda" className="btn-secondary">Ver toda la tienda <span className="ml-1">&rarr;</span></Link>
        </div>
      </div>
    </section>
  );
}

function PortfolioPreview({ projects }: { projects: Project[] }) {
  if (!projects.length) return null;
  return <section className="fs-projects"><div className="container-main"><div className="fs-section-heading"><div><p className="fs-eyebrow">DEL PLAN A LA REALIDAD</p><h2>El trabajo habla.</h2></div><Link href="/portfolio" className="fs-text-link">Ver proyectos <ArrowRight size={18}/></Link></div><div className="fs-project-grid">{projects.slice(0,3).map((project,i)=><Link href="/portfolio" key={project.id} className={`fs-project fs-project-${i}`}><div className="fs-project-image"><NextImage src={project.image} alt={project.title} fill sizes="(max-width: 768px) 100vw, 60vw" className="object-cover"/></div><div className="fs-project-copy"><span>{project.location || project.category}</span><h3>{project.title}</h3></div></Link>)}</div></div></section>;
}

export default async function HomePage() {
  const settings = await getCachedSettings();
  const content = await getCachedContent();
  const projects = (await getAllProjects().catch(() => [])).filter(p => p.isActive && p.image);
  return (
    <div className="fs-home">
      <HeroSection image={projects[0]?.image} title={projects[0]?.title} />
      <PartnersSection />
      <ServicesSection />
      <PortfolioPreview projects={projects} />
      <ProcessSection />
      <FeaturedProducts />
      <AboutSection about={content.about} />
      <CtaSection whatsapp={settings.contact.whatsapp} />
    </div>
  );
}
