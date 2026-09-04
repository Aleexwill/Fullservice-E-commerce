import Link from 'next/link';
import NextImage from 'next/image';
import { Star, Target, Eye, Heart, ArrowRight, MapPin } from 'lucide-react';
import { HeroSection } from '@/components/sections/hero-section';
import { TrustBar, ServicesSection, CtaSection } from '@/components/sections/services-section';
import { PromoBannerCarousel } from '@/components/sections/promo-banner-carousel';
import { Isotipo } from '@/components/ui/isotipo';
import { AddToCartButton } from '@/components/sections/add-to-cart-button';
import { getCachedSettings } from '@/lib/settings-store';
import { getCachedContent, type SiteContent } from '@/lib/content-store';
import { getAllProducts } from '@/lib/products-store';
import { formatPrice, getEffectivePrice } from '@/lib/utils';

function SectionHeading({ eyebrow, title, description, centered = false }: { eyebrow: string; title: string; description?: string; centered?: boolean }) {
  return (
    <div className={centered ? 'mx-auto mb-12 max-w-2xl text-center' : 'mb-12 max-w-3xl'}>
      <span className="overline">{eyebrow}</span>
      <h2 className="mt-2 font-display text-[clamp(2rem,4vw,3.25rem)] font-bold uppercase leading-none tracking-tight text-[#0B1120]">{title}</h2>
      <div className={`${centered ? 'mx-auto' : ''} mt-5 flex gap-1.5`}><span className="h-1 w-12 rounded-full bg-blue" /><span className="h-1 w-6 rounded-full bg-orange" /></div>
      {description && <p className="mt-5 font-body text-body leading-7 text-slate-500">{description}</p>}
    </div>
  );
}

function AboutSection({ about }: { about: SiteContent['about'] }) {
  return <section className="section surface-muted"><div className="container-main"><SectionHeading eyebrow="Quiénes somos" title={about.title} description={about.description} centered />
    <div className="grid gap-5 md:grid-cols-2">
      {[['Misión', about.mission, Target], ['Visión', about.vision, Eye]].map(([title, text, Icon]) => <div key={String(title)} className="card group p-7 hover:-translate-y-1"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue/10 text-blue transition-colors group-hover:bg-blue group-hover:text-white"><Icon className="h-5 w-5" /></div><h3 className="mt-5 font-display text-2xl font-bold uppercase text-[#0B1120]">{title as string}</h3><p className="mt-2 font-body text-body leading-7 text-slate-500">{text as string}</p></div>)}
    </div>
    {about.values.length > 0 && <div className="mt-5 grid gap-4 sm:grid-cols-3">{about.values.map((value, i) => <div key={i} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><Heart className="h-5 w-5 text-orange" /><h4 className="mt-4 font-display text-lg font-bold uppercase text-[#0B1120]">{value.title}</h4><p className="mt-1 font-body text-sm leading-6 text-slate-500">{value.description}</p></div>)}</div>}
  </div></section>;
}

async function FeaturedProducts() {
  const all = await getAllProducts().catch(() => []);
  const products = all.filter((p) => p.isFeatured && p.isActive).slice(0, 4);
  if (products.length === 0) return null;
  return <section className="section"><div className="container-main"><SectionHeading eyebrow="Tienda online" title="Productos destacados" description="Herramientas y materiales de las mejores marcas, con envío a domicilio." />
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">{products.map((product) => {
      const promo = getEffectivePrice(product);
      const discount = promo.isOnSale ? promo.discountPercent : product.compareAtPrice && product.compareAtPrice > product.price ? Math.round((1 - product.price / product.compareAtPrice) * 100) : 0;
      const displayPrice = promo.isOnSale ? promo.price : product.price;
      const strikePrice = promo.isOnSale ? product.price : product.compareAtPrice && product.compareAtPrice > product.price ? product.compareAtPrice : null;
      return <article key={product.id} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_30px_rgba(15,23,42,.05)] transition-all duration-300 hover:-translate-y-1 hover:border-blue/25 hover:shadow-[0_20px_45px_rgba(15,23,42,.10)]">
        <Link href={`/tienda/${product.slug}`}>
          <div className="relative aspect-square overflow-hidden bg-slate-50">
            {product.images?.[0] ? <NextImage src={product.images[0]} alt={product.name} fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="(max-width: 768px) 50vw, 25vw" /> : <div className="flex h-full items-center justify-center"><Isotipo size={64} /></div>}
            {discount > 0 && <span className="badge-orange absolute left-3 top-3">{promo.isOnSale ? 'Oferta ' : ''}-{discount}%</span>}
          </div>
          <div className="p-4 pb-2">
            <span className="font-body text-[.65rem] font-bold uppercase tracking-wider text-slate-400">{product.brand}</span>
            <h3 className="mt-1 line-clamp-2 font-body text-sm font-semibold leading-5 text-[#0B1120]">{product.name}</h3>
            {product.reviewCount > 0 && <div className="mt-2 flex items-center gap-1">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`h-3 w-3 ${i < Math.floor(product.rating) ? 'fill-orange text-orange' : 'text-slate-300'}`} />)}<span className="ml-1 text-[.65rem] text-slate-400">({product.reviewCount})</span></div>}
            <div className="mt-3 flex flex-wrap items-baseline gap-2"><span className="font-display text-xl font-bold text-[#0B1120]">{formatPrice(displayPrice)}</span>{strikePrice && <span className="font-body text-xs text-slate-400 line-through">{formatPrice(strikePrice)}</span>}</div>
          </div>
        </Link>
        <div className="p-4 pt-2"><AddToCartButton productId={product.id} sku={product.sku} name={product.name} slug={product.slug} price={displayPrice} image={product.images?.[0] || ''} stock={product.stock} /></div>
      </article>;
    })}</div>
    <div className="mt-9 text-center"><Link href="/tienda" className="btn-secondary">Ver toda la tienda <ArrowRight className="h-4 w-4" /></Link></div>
  </div></section>;
}

function PortfolioPreview() {
  const projects = [
    { id: 1, title: 'Remodelación oficinas corporativas', category: 'Construcción civil', location: 'Asunción', badge: 'blue' as const },
    { id: 2, title: 'Estructura metálica nave industrial', category: 'Metalúrgica', location: 'Luque', badge: 'green' as const },
    { id: 3, title: 'Mantenimiento integral edificio', category: 'Mantenimiento', location: 'San Lorenzo', badge: 'yellow' as const },
  ];
  const badgeClass = { blue: 'badge-blue', green: 'badge-green', yellow: 'badge-yellow' };
  return <section className="section surface-muted"><div className="container-main"><SectionHeading eyebrow="Proyectos" title="Proyectos que hablan por nosotros" description="Mirá algunos de los trabajos que realizamos." />
    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{projects.map(project => <div key={project.id} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"><div className="relative flex h-52 items-center justify-center overflow-hidden bg-slate-100"><div className="absolute inset-0 bg-gradient-to-br from-blue/10 to-orange/10 transition-transform duration-700 group-hover:scale-110" /><Isotipo size={82} color="#2D8FCC20" /></div><div className="p-6"><span className={badgeClass[project.badge]}>{project.category}</span><h3 className="mt-4 font-display text-2xl font-bold uppercase leading-tight text-[#0B1120]">{project.title}</h3><p className="mt-2 flex items-center gap-1.5 font-body text-sm text-slate-500"><MapPin className="h-4 w-4 text-blue" />{project.location}</p></div></div>)}</div>
    <div className="mt-9 text-center"><Link href="/portfolio" className="btn-secondary">Ver portfolio completo <ArrowRight className="h-4 w-4" /></Link></div>
  </div></section>;
}

function TestimonialsSection() {
  const testimonials = [
    { id: 1, text: 'Excelente trabajo. Respondieron rápido, cumplieron los plazos y el resultado fue impecable. Totalmente recomendables.', author: 'Juan Perez', company: 'Empresa ABC', rating: 5 },
    { id: 2, text: 'Profesionales de primera. El equipo fue puntual, limpio y dejaron todo perfecto. Ya los contraté 3 veces.', author: 'Maria Gonzalez', company: 'Consultora XYZ', rating: 5 },
    { id: 3, text: 'Los mejores precios y la mejor calidad. La estructura metálica que hicieron superó nuestras expectativas.', author: 'Carlos Ruiz', company: 'Industrial DEF', rating: 5 },
  ];
  return <section className="section"><div className="container-main"><SectionHeading eyebrow="Testimonios" title="Lo que dicen nuestros clientes" centered />
    <div className="grid gap-5 md:grid-cols-3">{testimonials.map(t => <figure key={t.id} className="card p-7"><div className="flex gap-1">{Array.from({ length: t.rating }).map((_, i) => <Star key={i} className="h-4 w-4 fill-orange text-orange" />)}</div><blockquote className="mt-5 font-body text-sm leading-7 text-slate-600">“{t.text}”</blockquote><figcaption className="mt-6 border-t border-slate-100 pt-5"><div className="font-body text-sm font-bold text-[#0B1120]">{t.author}</div><div className="mt-1 font-body text-xs text-slate-400">{t.company}</div></figcaption></figure>)}</div>
  </div></section>;
}

export default async function HomePage() {
  const settings = await getCachedSettings();
  const content = await getCachedContent();
  return <><HeroSection /><TrustBar /><ServicesSection /><AboutSection about={content.about} /><PromoBannerCarousel /><FeaturedProducts /><PortfolioPreview /><TestimonialsSection /><CtaSection whatsapp={settings.contact.whatsapp} /></>;
}
