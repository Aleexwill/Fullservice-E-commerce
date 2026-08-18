import type { MetadataRoute } from 'next';
import { siteConfig } from '@/config/site';
import { getAllProducts } from '@/lib/products-store';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url;

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base,               lastModified: new Date(), changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${base}/tienda`,   lastModified: new Date(), changeFrequency: 'daily',   priority: 0.9 },
    { url: `${base}/servicios`,lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/portfolio`,lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/contacto`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/terminos`, lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${base}/privacidad`,lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ];

  let productRoutes: MetadataRoute.Sitemap = [];
  try {
    const products = await getAllProducts();
    productRoutes = products
      .filter((p) => p.isActive && p.slug)
      .map((p) => ({
        url: `${base}/tienda/${p.slug}`,
        lastModified: new Date(p.updatedAt),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }));
  } catch {
    // si la DB no está disponible en build time, omitimos los productos
  }

  return [...staticRoutes, ...productRoutes];
}
