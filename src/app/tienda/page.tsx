import { Suspense } from 'react';
import type { Metadata } from 'next';
import { siteConfig } from '@/config/site';
import { prisma } from '@/lib/prisma';
import { TiendaClient } from './tienda-client';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Tienda — Full Service & Clean',
  description: 'Comprá herramientas, electricidad, plomería y más. Envío a todo el país.',
  alternates: { canonical: '/tienda' },
  openGraph: { url: `${siteConfig.url}/tienda` },
};

async function getInitialProducts() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
    take: 100,
    select: {
      id: true, sku: true, slug: true, name: true, brand: true, category: true,
      price: true, compareAtPrice: true, stock: true, images: true,
      isFeatured: true, rating: true, reviewCount: true, salesCount: true,
      shortDescription: true, promoDiscountPercent: true,
      promoStartsAt: true, promoEndsAt: true,
    },
  });
  return products.map((p) => ({
    ...p,
    price: Number(p.price),
    compareAtPrice: p.compareAtPrice === null ? null : Number(p.compareAtPrice),
    promoStartsAt: p.promoStartsAt ? p.promoStartsAt.toISOString() : null,
    promoEndsAt: p.promoEndsAt ? p.promoEndsAt.toISOString() : null,
  }));
}

export default async function TiendaPage() {
  const initialProducts = await getInitialProducts();
  return (
    <Suspense>
      <TiendaClient initialProducts={initialProducts} />
    </Suspense>
  );
}
