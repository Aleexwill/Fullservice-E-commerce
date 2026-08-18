import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight, Star, ShieldCheck, Truck, CreditCard } from 'lucide-react';
import { getProductBySlug, getAllProducts } from '@/lib/products-store';
import { siteConfig } from '@/config/site';
import { formatPrice, getEffectivePrice } from '@/lib/utils';
import { Isotipo } from '@/components/ui/isotipo';
import { AddToCartButton } from '@/components/sections/add-to-cart-button';
import { ProductGallery } from '@/components/sections/product-gallery';

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProductBySlug(params.slug).catch(() => null);
  if (!product) return {};

  return {
    title: product.name,
    description: product.shortDescription || product.description.slice(0, 155),
    openGraph: {
      title: product.name,
      description: product.shortDescription || product.description.slice(0, 155),
      images: product.images?.[0] ? [product.images[0]] : undefined,
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const product = await getProductBySlug(params.slug).catch(() => null);
  if (!product || !product.isActive) notFound();

  const promo = getEffectivePrice(product);
  const displayPrice = promo.isOnSale ? promo.price : product.price;
  const strikePrice = promo.isOnSale
    ? product.price
    : product.compareAtPrice && product.compareAtPrice > product.price
      ? product.compareAtPrice
      : null;

  const all = await getAllProducts().catch(() => []);
  const related = all
    .filter((p) => p.id !== product.id && p.category === product.category && p.isActive)
    .slice(0, 4);

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.shortDescription || product.description,
    sku: product.sku,
    brand: { '@type': 'Brand', name: product.brand },
    image: product.images ?? [],
    offers: {
      '@type': 'Offer',
      url: `${siteConfig.url}/tienda/${product.slug}`,
      priceCurrency: 'PYG',
      price: displayPrice,
      availability:
        product.stock > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      seller: { '@type': 'Organization', name: 'Full Service & Clean' },
    },
    ...(product.rating > 0 && product.reviewCount > 0
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: product.rating,
            reviewCount: product.reviewCount,
          },
        }
      : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      {/* Breadcrumb */}
      <div className="border-b border-steel-900/40">
        <div className="container-main flex flex-wrap items-center gap-2 py-3 font-body text-caption text-steel-500">
          <Link href="/" className="hover:text-arctic">Inicio</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/tienda" className="hover:text-arctic">Tienda</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-arctic">{product.name}</span>
        </div>
      </div>

      <section className="section">
        <div className="container-main">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
            {/* Gallery */}
            <ProductGallery images={product.images} name={product.name} />

            {/* Info */}
            <div>
              <span className="font-body text-overline uppercase tracking-[0.08em] text-steel-500">
                {product.brand}
              </span>
              <h1 className="mt-1 font-display text-h1 text-arctic">{product.name}</h1>

              {product.reviewCount > 0 && (
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${i < Math.floor(product.rating) ? 'fill-yellow text-yellow' : 'text-steel-700'}`}
                      />
                    ))}
                  </div>
                  <span className="font-body text-caption text-steel-500">({product.reviewCount} reseñas)</span>
                </div>
              )}

              <div className="mt-5 flex items-center gap-3">
                <span className="font-display text-h1 text-arctic">{formatPrice(displayPrice)}</span>
                {strikePrice && (
                  <span className="font-body text-body text-steel-500 line-through">{formatPrice(strikePrice)}</span>
                )}
                {promo.isOnSale && <span className="badge-red">Oferta -{promo.discountPercent}%</span>}
              </div>

              {product.shortDescription && (
                <p className="mt-4 font-body text-body text-steel-300">{product.shortDescription}</p>
              )}

              <div className="mt-4 flex items-center gap-2 font-body text-caption text-steel-500">
                <span className="font-mono">{product.sku}</span>
                <span>·</span>
                <span>{product.stock > 0 ? `${product.stock} disponibles` : 'Sin stock'}</span>
              </div>

              <div className="mt-6">
                <AddToCartButton
                  productId={product.id}
                  sku={product.sku}
                  name={product.name}
                  slug={product.slug}
                  price={displayPrice}
                  image={product.images?.[0] || ''}
                  stock={product.stock}
                  className="btn-primary w-full justify-center sm:w-auto sm:px-10"
                />
              </div>

              {/* Trust strip */}
              <div className="mt-8 grid grid-cols-1 gap-3 border-t border-steel-900/40 pt-6 sm:grid-cols-3">
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-blue" />
                  <span className="font-body text-caption text-steel-300">Envío a todo el país</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-blue" />
                  <span className="font-body text-caption text-steel-300">Garantía oficial</span>
                </div>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-blue" />
                  <span className="font-body text-caption text-steel-300">Pago seguro</span>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          {product.description && (
            <div className="mt-16 max-w-3xl">
              <h2 className="font-display text-h3 uppercase text-arctic">Descripción</h2>
              <p className="mt-3 whitespace-pre-line font-body text-body text-steel-300 leading-relaxed">
                {product.description}
              </p>
            </div>
          )}

          {/* Specifications */}
          {product.specifications && Object.keys(product.specifications).length > 0 && (
            <div className="mt-10 max-w-3xl">
              <h2 className="font-display text-h3 uppercase text-arctic">Especificaciones</h2>
              <div className="mt-3 divide-y divide-steel-900/40 rounded-lg border border-steel-900/40">
                {Object.entries(product.specifications).map(([key, value]) => (
                  <div key={key} className="flex justify-between gap-4 px-4 py-2.5 font-body text-body-sm">
                    <span className="text-steel-500">{key}</span>
                    <span className="text-cloud">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Related products */}
          {related.length > 0 && (
            <div className="mt-16">
              <h2 className="font-display text-h2 uppercase text-arctic">También te puede interesar</h2>
              <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
                {related.map((p) => {
                  const rPromo = getEffectivePrice(p);
                  const rPrice = rPromo.isOnSale ? rPromo.price : p.price;
                  return (
                    <Link key={p.id} href={`/tienda/${p.slug}`} className="card-interactive group overflow-hidden">
                      <div className="relative flex h-36 items-center justify-center bg-gradient-to-br from-steel-900 to-steel-700">
                        {p.images?.[0] ? (
                          <img src={p.images[0]} alt={p.name} className="h-full w-full object-cover" />
                        ) : (
                          <Isotipo size={48} />
                        )}
                      </div>
                      <div className="p-3">
                        <h3 className="font-body text-body-sm font-semibold text-cloud line-clamp-2">{p.name}</h3>
                        <p className="mt-1 font-display text-body font-bold text-arctic">{formatPrice(rPrice)}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
