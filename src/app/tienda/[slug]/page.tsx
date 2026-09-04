import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight, Star, ShieldCheck, Truck, CreditCard, ArrowLeft } from 'lucide-react';
import { getProductBySlug, getAllProducts } from '@/lib/products-store';
import { siteConfig } from '@/config/site';
import { formatPrice, getEffectivePrice } from '@/lib/utils';
import { Isotipo } from '@/components/ui/isotipo';
import { AddToCartButton } from '@/components/sections/add-to-cart-button';
import { ProductGallery } from '@/components/sections/product-gallery';

interface Props { params: { slug: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProductBySlug(params.slug).catch(() => null);
  if (!product) return {};
  return { title: product.name, description: product.shortDescription || product.description.slice(0, 155), openGraph: { title: product.name, description: product.shortDescription || product.description.slice(0, 155), images: product.images?.[0] ? [product.images[0]] : undefined } };
}

export default async function ProductPage({ params }: Props) {
  const product = await getProductBySlug(params.slug).catch(() => null);
  if (!product || !product.isActive) notFound();
  const promo = getEffectivePrice(product);
  const displayPrice = promo.isOnSale ? promo.price : product.price;
  const strikePrice = promo.isOnSale ? product.price : product.compareAtPrice && product.compareAtPrice > product.price ? product.compareAtPrice : null;
  const discount = promo.isOnSale ? promo.discountPercent : strikePrice ? Math.round((1 - product.price / strikePrice) * 100) : 0;
  const all = await getAllProducts().catch(() => []);
  const related = all.filter((p) => p.id !== product.id && p.category === product.category && p.isActive).slice(0, 4);
  const productSchema = { '@context': 'https://schema.org', '@type': 'Product', name: product.name, description: product.shortDescription || product.description, sku: product.sku, brand: { '@type': 'Brand', name: product.brand }, image: product.images ?? [], offers: { '@type': 'Offer', url: `${siteConfig.url}/tienda/${product.slug}`, priceCurrency: 'PYG', price: displayPrice, availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock', seller: { '@type': 'Organization', name: 'Full Service & Clean' } }, ...(product.rating > 0 && product.reviewCount > 0 ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: product.rating, reviewCount: product.reviewCount } } : {}) };

  return (
    <main className="bg-[#F4F7FB]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} />
      <div className="border-b border-gray-200 bg-white"><div className="container-main flex flex-wrap items-center gap-2 py-3 font-body text-caption text-[#8094B4]"><Link href="/" className="hover:text-[#2D8FCC]">Inicio</Link><ChevronRight className="h-3 w-3" /><Link href="/tienda" className="hover:text-[#2D8FCC]">Tienda</Link><ChevronRight className="h-3 w-3" /><span className="truncate text-[#0B1120]">{product.name}</span></div></div>
      <section className="section"><div className="container-main">
        <Link href="/tienda" className="mb-6 inline-flex items-center gap-2 font-body text-body-sm font-medium text-[#4A5E80] hover:text-[#2D8FCC]"><ArrowLeft className="h-4 w-4" /> Volver a la tienda</Link>
        <div className="grid gap-10 lg:grid-cols-[1.05fr_.95fr] lg:items-start">
          <div className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm md:p-5"><ProductGallery images={product.images} name={product.name} /></div>
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
            <span className="font-body text-[0.65rem] font-semibold uppercase tracking-[.12em] text-[#8094B4]">{product.brand}</span>
            <h1 className="mt-2 font-display text-[clamp(2rem,4vw,3.2rem)] font-bold leading-[.98] text-[#0B1120]">{product.name}</h1>
            {product.reviewCount > 0 && <div className="mt-4 flex items-center gap-2"><div className="flex gap-0.5">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`h-4 w-4 ${i < Math.floor(product.rating) ? 'fill-[#F6E05E] text-[#D69E2E]' : 'text-[#C0CEDF]'}`} />)}</div><span className="font-body text-caption text-[#8094B4]">{product.rating.toFixed(1)} · {product.reviewCount} reseñas</span></div>}
            <div className="mt-6 flex flex-wrap items-end gap-3 border-y border-gray-100 py-5"><span className="font-display text-[clamp(2rem,4vw,2.8rem)] font-bold text-[#0B1120]">{formatPrice(displayPrice)}</span>{strikePrice && <span className="pb-1 font-body text-body text-[#9AAAC0] line-through">{formatPrice(strikePrice)}</span>}{discount > 0 && <span className="badge-red mb-1">-{discount}%</span>}</div>
            {product.shortDescription && <p className="mt-5 font-body text-body-lg leading-relaxed text-[#4A5E80]">{product.shortDescription}</p>}
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 font-body text-caption text-[#8094B4]"><span>SKU: <strong className="text-[#4A5E80]">{product.sku}</strong></span><span>{product.stock > 0 ? <strong className="text-[#2F855A]">{product.stock} disponibles</strong> : <strong className="text-[#C53030]">Sin stock</strong>}</span></div>
            <div className="mt-7"><AddToCartButton productId={product.id} sku={product.sku} name={product.name} slug={product.slug} price={displayPrice} image={product.images?.[0] || ''} stock={product.stock} className="btn-primary w-full justify-center py-4 sm:text-base" /></div>
            <div className="mt-6 grid gap-3 border-t border-gray-100 pt-5 sm:grid-cols-3">{[{ icon: Truck, title: 'Envío', text: 'A todo el país' }, { icon: ShieldCheck, title: 'Garantía', text: 'Oficial' }, { icon: CreditCard, title: 'Pago', text: 'Seguro' }].map(({ icon: Icon, title, text }) => <div key={title} className="flex items-center gap-2.5 rounded-lg bg-[#F4F7FB] p-3"><Icon className="h-4 w-4 shrink-0 text-[#2D8FCC]" /><div><div className="font-body text-caption font-semibold text-[#0B1120]">{title}</div><div className="font-body text-[.7rem] text-[#8094B4]">{text}</div></div></div>)}</div>
          </div>
        </div>
        <div className="mt-10 grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
          {product.description && <section className="rounded-2xl border border-gray-200 bg-white p-6 md:p-8"><span className="overline">Información</span><h2 className="mt-2 font-display text-h2 uppercase text-[#0B1120]">Descripción</h2><p className="mt-4 whitespace-pre-line font-body text-body leading-7 text-[#4A5E80]">{product.description}</p></section>}
          {product.specifications && Object.keys(product.specifications).length > 0 && <section className="rounded-2xl border border-gray-200 bg-white p-6 md:p-8"><span className="overline">Ficha técnica</span><h2 className="mt-2 font-display text-h2 uppercase text-[#0B1120]">Especificaciones</h2><div className="mt-4 divide-y divide-gray-100 rounded-xl border border-gray-200">{Object.entries(product.specifications).map(([key, value]) => <div key={key} className="flex justify-between gap-4 px-4 py-3 font-body text-body-sm"><span className="text-[#8094B4]">{key}</span><span className="text-right font-medium text-[#0B1120]">{value}</span></div>)}</div></section>}
        </div>
        {related.length > 0 && <section className="mt-14"><div className="flex items-end justify-between gap-4"><div><span className="overline">Más productos</span><h2 className="mt-2 font-display text-h2 uppercase text-[#0B1120]">También te puede interesar</h2></div><Link href="/tienda" className="hidden items-center gap-1 font-body text-body-sm font-semibold text-[#2D8FCC] sm:flex">Ver tienda <ChevronRight className="h-4 w-4" /></Link></div><div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">{related.map((p) => { const rp = getEffectivePrice(p); const price = rp.isOnSale ? rp.price : p.price; return <Link key={p.id} href={`/tienda/${p.slug}`} className="card-interactive group overflow-hidden bg-white"><div className="relative flex h-40 items-center justify-center bg-[#F4F7FB]">{p.images?.[0] ? <img src={p.images[0]} alt={p.name} className="h-full w-full object-cover" /> : <Isotipo size={48} color="#2D8FCC30" />}</div><div className="p-4"><span className="font-body text-[.65rem] uppercase tracking-[.08em] text-[#8094B4]">{p.brand}</span><h3 className="mt-1 line-clamp-2 font-body text-body-sm font-semibold text-[#0B1120]">{p.name}</h3><p className="mt-2 font-display text-body font-bold text-[#0B1120]">{formatPrice(price)}</p></div></Link> })}</div></section>}
      </div></section>
    </main>
  );
}
