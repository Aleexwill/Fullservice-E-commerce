import { MetadataRoute } from 'next';
import { siteConfig } from '@/config/site';
import { getAllServices } from '@/lib/services-store';
import { getAllProjects } from '@/lib/portfolio-store';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url;
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/servicios`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/nosotros`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/portfolio`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/clientes`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/contacto`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/privacidad`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${base}/terminos`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
  ];

  let projectRoutes: MetadataRoute.Sitemap = [];
  try {
    const projects = await getAllProjects();
    projectRoutes = projects
      .filter((p) => p.isActive)
      .map((p) => ({
        url: `${base}/portfolio/${p.id}`,
        lastModified: now,
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      }));
  } catch {}

  return [...staticRoutes, ...projectRoutes];
}
