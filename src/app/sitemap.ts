import { MetadataRoute } from 'next';
import { siteConfig } from '@/config/site';
import { getAllProducts } from '@/lib/products-store';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url;
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/tienda`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/servicios`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/nosotros`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/trabajos`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/clientes`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/contacto`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/privacidad`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${base}/terminos`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
  ];

  let productRoutes: MetadataRoute.Sitemap = [];
  try {
    const products = await getAllProducts();
    productRoutes = products
      .filter((p) => p.isActive)
      .map((p) => ({
        url: `${base}/tienda/${p.slug}`,
        lastModified: now,
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }));
  } catch {}

  return [...staticRoutes, ...productRoutes];
}
