import { unstable_cache } from 'next/cache';
import { prisma } from './prisma';
import type { Prisma } from '@prisma/client';

export const CONTENT_CACHE_TAG = 'site-content';

export interface SiteContent {
  hero: { badge: string; title: string; highlight: string; subtitle: string; ctaPrimary: string; ctaSecondary: string; stats: { value: string; label: string }[]; };
  about: { title: string; description: string; mission: string; vision: string; image: string; values: { title: string; description: string }[]; };
  testimonials: { id: string; name: string; role: string; company: string; text: string; rating: number; avatar: string; isActive: boolean; }[];
  banners: { id: string; title: string; subtitle: string; image: string; link: string; position: string; isActive: boolean; }[];
  branding: { logo: string; logoWhite: string; favicon: string; ogImage: string; primaryColor: string; accentColor: string; };
  footer: { description: string; copyright: string; };
}

const SINGLETON_ID = 'singleton';

const DEFAULT_CONTENT: SiteContent = {
  hero: {
    badge: 'Soluciones integrales',
    title: 'Ingeniería',
    highlight: 'Construcción & Servicios',
    subtitle: 'Brindamos soluciones profesionales en construcción civil, metalúrgica, mantenimiento industrial y ferretería especializada.',
    ctaPrimary: 'Solicitar presupuesto',
    ctaSecondary: 'Ver servicios',
    stats: [
      { value: '+150', label: 'Proyectos' },
      { value: '+12', label: 'Años' },
      { value: '98%', label: 'Satisfacción' },
    ],
  },
  about: {
    title: 'Sobre Full Service & Clean',
    description: 'Empresa paraguaya especializada en mantenimiento, construcción y metalúrgica. Trabajamos con compromiso, confianza y excelencia para transformar cada proyecto en un resultado duradero.',
    mission: 'Impulsamos el desarrollo de proyectos ofreciendo soluciones integrales que garantizan el óptimo funcionamiento de los bienes de nuestros clientes. Con un enfoque en la calidad y la eficiencia, fomentamos relaciones de confianza duraderas.',
    vision: 'Ser la empresa líder en soluciones integrales de mantenimiento y construcción, reconocida por nuestra calidad, eficiencia y compromiso. Buscamos transformar y optimizar entornos mediante servicios que garanticen su funcionalidad y desarrollo, fortaleciendo relaciones de confianza y generando un impacto positivo en cada proyecto.',
    image: '',
    values: [
      { title: 'Compromiso', description: 'Dedicación plena para lograr soluciones eficientes y resultados de calidad.' },
      { title: 'Confianza', description: 'Relaciones sólidas basadas en la transparencia, el cumplimiento y la satisfacción.' },
      { title: 'Excelencia', description: 'Mejora continua para optimizar los entornos y servicios ofrecidos.' },
      { title: 'Trabajo en equipo', description: 'Colaboración y respeto que fortalecen al equipo y al servicio.' },
      { title: 'Innovación', description: 'Evolución constante mediante tecnologías y métodos que potencian nuestro impacto.' },
    ],
  },
  testimonials: [], banners: [],
  branding: { logo: '', logoWhite: '', favicon: '', ogImage: '', primaryColor: '#2D8FCC', accentColor: '#D69E2E' },
  footer: { description: 'Soluciones integrales en mantenimiento, limpieza y servicios profesionales.', copyright: '© 2026 Full Service & Clean. Todos los derechos reservados.' },
};

function deepMerge<T>(target: T, source: unknown): T {
  const output: Record<string, unknown> = { ...(target as Record<string, unknown>) };
  const src = source as Record<string, unknown>;
  for (const key of Object.keys(src)) {
    const sourceVal = src[key];
    if (sourceVal && typeof sourceVal === 'object' && !Array.isArray(sourceVal)) output[key] = deepMerge((target as Record<string, unknown>)[key] || {}, sourceVal);
    else if (sourceVal !== undefined) output[key] = sourceVal;
  }
  return output as T;
}

export async function getContent(): Promise<SiteContent> {
  const row = await prisma.siteContent.findUnique({ where: { id: SINGLETON_ID } });
  if (!row) return DEFAULT_CONTENT;
  return deepMerge(DEFAULT_CONTENT, row.data);
}

export const getCachedContent = unstable_cache(
  async () => { try { return await getContent(); } catch { return DEFAULT_CONTENT; } },
  ['site-content'], { tags: [CONTENT_CACHE_TAG], revalidate: 60 }
);

export async function updateContent(data: Partial<SiteContent>): Promise<SiteContent> {
  const current = await getContent();
  const updated = deepMerge(current, data);
  if (data.testimonials !== undefined) updated.testimonials = data.testimonials;
  if (data.banners !== undefined) updated.banners = data.banners;
  if (data.hero?.stats !== undefined) updated.hero.stats = data.hero.stats;
  if (data.about?.values !== undefined) updated.about.values = data.about.values;
  await prisma.siteContent.upsert({ where: { id: SINGLETON_ID }, create: { id: SINGLETON_ID, data: updated as unknown as Prisma.InputJsonValue }, update: { data: updated as unknown as Prisma.InputJsonValue } });
  return updated;
}
