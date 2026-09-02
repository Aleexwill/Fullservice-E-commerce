import Link from 'next/link';
import { Star, Target, Eye, Heart } from 'lucide-react';
import { HeroSection } from '@/components/sections/hero-section';
import { TrustBar, ServicesSection, CtaSection } from '@/components/sections/services-section';
import { PromoBannerCarousel } from '@/components/sections/promo-banner-carousel';
import { Isotipo } from '@/components/ui/isotipo';
import { AddToCartButton } from '@/components/sections/add-to-cart-button';
import { getCachedSettings } from '@/lib/settings-store';
import { getCachedContent, type SiteContent } from '@/lib/content-store';
import { getAllProducts } from '@/lib/products-store';
import { formatPrice, getEffectivePrice } from '@/lib/utils';

/* ============================================================
   QUIENES SOMOS (mision, vision, valores)
   ============================================================ */

function AboutSection({ about }: { about: SiteContent['about'] }) {
  return (
    <section className="section border-t border-steel-900/40">
      <div className="container-main">
        <div className="mb-12 text-center">
          <span className="overline mb-2 block">Quienes somos</span>
          <h2 className="font-display text-h1 uppercase text-arctic">{about.title}</h2>
          <div className="mx-auto mt-4 h-[3px] w-12 rounded-sm bg-gradient-to-r from-blue to-orange" />
          <p className="mx-auto mt-4 max-w-2xl font-body text-body text-steel-300">
            {about.description}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="card p-6">
            <Target className="h-6 w-6 text-blue-bright" />
            <h3 className="mt-3 font-display text-h3 text-arctic">Mision</h3>
            <p className="mt-2 font-body text-body-sm text-steel-300 leading-relaxed">{about.mission}</p>
          </div>
          <div className="card p-6">
            <Eye className="h-6 w-6 text-blue-bright" />
            <h3 className="mt-3 font-display text-h3 text-arctic">Vision</h3>
            <p className="mt-2 font-body text-body-sm text-steel-300 leading-relaxed">{about.vision}</p>
          </div>
        </div>

        {about.values.length > 0 && (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {about.values.map((value, i) => (
              <div key={i} className="card p-5">
                <Heart className="h-5 w-5 text-orange" />
                <h4 className="mt-2 font-display text-h4 text-arctic">{value.title}</h4>
                <p className="mt-1 font-body text-body-sm text-steel-300">{value.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/* ============================================================
   PRODUCTOS DESTACADOS
   ============================================================ */

async function FeaturedProducts() {
  const all = await getAllProducts().catch(() => []);
  const products = all.filter((p) => p.isFeatured && p.isActive).slice(0, 4);

  if (products.length === 0) return null;

  return (
    <section className="section border-t border-steel-900/40">
      <div className="container-main">
        <div className="mb-12">
          <span className="overline mb-2 block">E-commerce</span>
          <h2 className="font-display text-h1 uppercase text-arctic">
            Productos destacados
          </h2>
          <div className="mt-4 h-[3px] w-12 rounded-sm bg-gradient-to-r from-blue to-orange" />
          <p className="mt-4 font-body text-body text-steel-300">
            Herramientas y materiales de las mejores marcas, con envio a domicilio.
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
                  {/* Image */}
                  <div className="relative flex h-44 items-center justify-center bg-gradient-to-br from-steel-900 to-steel-700">
                    {product.images?.[0] ? (
                      <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover" />
                    ) : (
                      <Isotipo size={64} />
                    )}
                    {discount > 0 && (
                      <span className="badge-red absolute left-2 top-2">{promo.isOnSale ? 'Oferta ' : ''}-{discount}%</span>
                    )}
                  </div>
                  {/* Info */}
                  <div className="p-4 pb-0">
                    <span className="font-body text-overline uppercase tracking-[0.08em] text-steel-500">
                      {product.brand}
                    </span>
                    <h3 className="mt-1 font-body text-body-sm font-semibold text-cloud leading-tight line-clamp-2">
                      {product.name}
                    </h3>
                    {product.reviewCount > 0 && (
                      <div className="mt-2 flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3 w-3 ${i < Math.floor(product.rating) ? 'fill-yellow text-yellow' : 'text-steel-700'}`}
                          />
                        ))}
                        <span className="ml-1 font-body text-caption text-steel-500">({product.reviewCount})</span>
                      </div>
                    )}
                    {/* Price */}
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="font-display text-[1.3rem] font-bold text-arctic">
                        {formatPrice(displayPrice)}
                      </span>
                      {strikePrice && (
                        <span className="font-body text-body-sm text-steel-500 line-through">
                          {formatPrice(strikePrice)}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
                <div className="p-4 pt-3">
                  <AddToCartButton
                    productId={product.id}
                    sku={product.sku}
                    name={product.name}
                    slug={product.slug}
                    price={displayPrice}
                    image={product.images?.[0] || ''}
                    stock={product.stock}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 text-center">
          <Link href="/tienda" className="btn-secondary">
            Ver toda la tienda
            <span className="ml-1">&rarr;</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   PORTFOLIO PREVIEW
   ============================================================ */

function PortfolioPreview() {
  const projects = [
    {
      id: 1,
      title: 'Remodelacion oficinas corporativas',
      category: 'Construccion civil',
      location: 'Asuncion',
      badge: 'blue' as const,
    },
    {
      id: 2,
      title: 'Estructura metalica nave industrial',
      category: 'Metalurgica',
      location: 'Luque',
      badge: 'green' as const,
    },
    {
      id: 3,
      title: 'Mantenimiento integral edificio',
      category: 'Mantenimiento',
      location: 'San Lorenzo',
      badge: 'yellow' as const,
    },
  ];

  const badgeClass = {
    blue: 'badge-blue',
    green: 'badge-green',
    yellow: 'badge-yellow',
  };

  return (
    <section className="section border-t border-steel-900/40">
      <div className="container-main">
        <div className="mb-12">
          <span className="overline mb-2 block">Proyectos</span>
          <h2 className="font-display text-h1 uppercase text-arctic">
            Proyectos que hablan por nosotros
          </h2>
          <div className="mt-4 h-[3px] w-12 rounded-sm bg-gradient-to-r from-blue to-orange" />
          <p className="mt-4 font-body text-body text-steel-300">
            Mira algunos de los trabajos que realizamos.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <div key={project.id} className="card-interactive group overflow-hidden">
              {/* Image placeholder */}
              <div className="relative flex h-48 items-center justify-center bg-gradient-to-br from-carbon to-steel-900">
                <Isotipo size={80} color="#2D8FCC15" />
                <div className="absolute inset-0 bg-blue/0 transition-colors group-hover:bg-blue/10" />
              </div>
              <div className="p-5">
                <span className={badgeClass[project.badge]}>
                  {project.category}
                </span>
                <h3 className="mt-3 font-display text-h3 text-arctic">
                  {project.title}
                </h3>
                <p className="mt-1 font-body text-body-sm text-steel-500">
                  {project.location}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link href="/portfolio" className="btn-secondary">
            Ver portfolio completo
            <span className="ml-1">&rarr;</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   TESTIMONIALS
   ============================================================ */

function TestimonialsSection() {
  const testimonials = [
    {
      id: 1,
      text: 'Excelente trabajo. Respondieron rapido, cumplieron los plazos y el resultado fue impecable. Totalmente recomendables.',
      author: 'Juan Perez',
      company: 'Empresa ABC',
      rating: 5,
    },
    {
      id: 2,
      text: 'Profesionales de primera. El equipo fue puntual, limpio y dejaron todo perfecto. Ya los contrate 3 veces.',
      author: 'Maria Gonzalez',
      company: 'Consultora XYZ',
      rating: 5,
    },
    {
      id: 3,
      text: 'Los mejores precios y la mejor calidad. La estructura metalica que hicieron supero nuestras expectativas.',
      author: 'Carlos Ruiz',
      company: 'Industrial DEF',
      rating: 5,
    },
  ];

  return (
    <section className="section border-t border-steel-900/40">
      <div className="container-main">
        <div className="mb-12 text-center">
          <span className="overline mb-2 block">Testimonios</span>
          <h2 className="font-display text-h1 uppercase text-arctic">
            Lo que dicen nuestros clientes
          </h2>
          <div className="mx-auto mt-4 h-[3px] w-12 rounded-sm bg-gradient-to-r from-blue to-orange" />
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {testimonials.map((testimonial) => (
            <div key={testimonial.id} className="card p-6 text-center">
              {/* Stars */}
              <div className="mb-4 flex justify-center gap-1">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star
                    key={i}
                    className="h-4 w-4 fill-yellow text-yellow"
                  />
                ))}
              </div>
              <blockquote className="font-body text-body italic text-steel-300 leading-relaxed">
                &ldquo;{testimonial.text}&rdquo;
              </blockquote>
              <div className="mt-4 border-t border-steel-900/40 pt-4">
                <cite className="font-body text-body-sm font-semibold not-italic text-arctic">
                  {testimonial.author}
                </cite>
                <p className="mt-0.5 font-body text-caption text-steel-500">
                  {testimonial.company}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   HOME PAGE
   ============================================================ */

export default async function HomePage() {
  const settings = await getCachedSettings();
  const content = await getCachedContent();
  return (
    <>
      <HeroSection />
      <TrustBar />
      <ServicesSection />
      <AboutSection about={content.about} />
      <PromoBannerCarousel />
      <FeaturedProducts />
      <PortfolioPreview />
      <TestimonialsSection />
      <CtaSection whatsapp={settings.contact.whatsapp} />
    </>
  );
}
