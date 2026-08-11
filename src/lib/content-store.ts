import { prisma } from './prisma';

export interface SiteContent {
  hero: {
    badge: string;
    title: string;
    highlight: string;
    subtitle: string;
    ctaPrimary: string;
    ctaSecondary: string;
    stats: { value: string; label: string }[];
  };
  about: {
    title: string;
    description: string;
    image: string;
    values: { title: string; description: string }[];
  };
  testimonials: {
    id: string;
    name: string;
    role: string;
    company: string;
    text: string;
    rating: number;
    avatar: string;
    isActive: boolean;
  }[];
  banners: {
    id: string;
    title: string;
    subtitle: string;
    image: string;
    link: string;
    position: string;
    isActive: boolean;
  }[];
  branding: {
    logo: string;
    logoWhite: string;
    favicon: string;
    ogImage: string;
    primaryColor: string;
    accentColor: string;
  };
  footer: {
    description: string;
    copyright: string;
  };
}

const SINGLETON_ID = 'singleton';

const DEFAULT_CONTENT: SiteContent = {
  hero: {
    badge: 'Soluciones integrales',
    title: 'Ingenieria',
    highlight: 'Construccion & Servicios',
    subtitle: 'Brindamos soluciones profesionales en construccion civil, metalurgica, mantenimiento industrial y ferreteria especializada.',
    ctaPrimary: 'Solicitar presupuesto',
    ctaSecondary: 'Ver servicios',
    stats: [
      { value: '+150', label: 'Proyectos' },
      { value: '+12', label: 'Anos' },
      { value: '98%', label: 'Satisfaccion' },
    ],
  },
  about: {
    title: 'Sobre Full Service & Clean',
    description: 'Somos una empresa paraguaya dedicada a brindar soluciones integrales en mantenimiento, limpieza y servicios profesionales.',
    image: '',
    values: [
      { title: 'Calidad', description: 'Materiales de primera y mano de obra certificada' },
      { title: 'Compromiso', description: 'Cumplimos plazos y presupuestos acordados' },
      { title: 'Experiencia', description: 'Mas de 12 anos en el mercado paraguayo' },
    ],
  },
  testimonials: [],
  banners: [],
  branding: {
    logo: '',
    logoWhite: '',
    favicon: '',
    ogImage: '',
    primaryColor: '#2D8FCC',
    accentColor: '#D69E2E',
  },
  footer: {
    description: 'Soluciones integrales en mantenimiento, limpieza y servicios profesionales.',
    copyright: '© 2026 Full Service & Clean. Todos los derechos reservados.',
  },
};

function deepMerge<T>(target: T, source: unknown): T {
  const output: Record<string, unknown> = { ...(target as Record<string, unknown>) };
  const src = source as Record<string, unknown>;
  for (const key of Object.keys(src)) {
    const sourceVal = src[key];
    if (sourceVal && typeof sourceVal === 'object' && !Array.isArray(sourceVal)) {
      output[key] = deepMerge((target as Record<string, unknown>)[key] || {}, sourceVal);
    } else if (sourceVal !== undefined) {
      output[key] = sourceVal;
    }
  }
  return output as T;
}

export async function getContent(): Promise<SiteContent> {
  const row = await prisma.siteContent.findUnique({ where: { id: SINGLETON_ID } });
  if (!row) return DEFAULT_CONTENT;
  return deepMerge(DEFAULT_CONTENT, row.data);
}

export async function updateContent(data: Partial<SiteContent>): Promise<SiteContent> {
  const current = await getContent();
  const updated = deepMerge(current, data);
  if (data.testimonials !== undefined) updated.testimonials = data.testimonials;
  if (data.banners !== undefined) updated.banners = data.banners;
  if (data.hero?.stats !== undefined) updated.hero.stats = data.hero.stats;
  if (data.about?.values !== undefined) updated.about.values = data.about.values;

  await prisma.siteContent.upsert({
    where: { id: SINGLETON_ID },
    create: { id: SINGLETON_ID, data: updated },
    update: { data: updated },
  });
  return updated;
}
