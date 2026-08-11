import { prisma } from './prisma';

export interface SiteSettings {
  general: {
    siteName: string;
    siteDescription: string;
    siteUrl: string;
    logo: string;
  };
  contact: {
    phone: string;
    email: string;
    address: string;
    city: string;
    whatsapp: string;
    mapUrl: string;
  };
  social: {
    facebook: string;
    instagram: string;
    linkedin: string;
    youtube: string;
    tiktok: string;
  };
  business: {
    openingHours: {
      weekdays: string;
      saturday: string;
      sunday: string;
    };
    currency: string;
    taxRate: number;
    shippingBase: number;
    freeShippingThreshold: number;
  };
  notifications: {
    emailOnNewOrder: boolean;
    emailOnNewLead: boolean;
    whatsappOnNewOrder: boolean;
    adminEmail: string;
  };
  seo: {
    metaTitle: string;
    metaDescription: string;
    ogImage: string;
    googleAnalyticsId: string;
    metaPixelId: string;
  };
}

const SINGLETON_ID = 'singleton';

const DEFAULT_SETTINGS: SiteSettings = {
  general: {
    siteName: 'Full Service & Clean',
    siteDescription: 'Mantenimiento, Limpieza y Servicios Profesionales',
    siteUrl: 'http://localhost:3000',
    logo: '',
  },
  contact: {
    phone: '+595 971 528 800',
    email: 'info@fullserviceandclean.com.py',
    address: 'Av. Principal 1234',
    city: 'Asuncion, Paraguay',
    whatsapp: '+595971528800',
    mapUrl: '',
  },
  social: {
    facebook: 'https://facebook.com/fullserviceandclean',
    instagram: 'https://instagram.com/fullserviceandclean',
    linkedin: '',
    youtube: '',
    tiktok: '',
  },
  business: {
    openingHours: {
      weekdays: 'Lunes a Viernes: 07:00 - 18:00',
      saturday: 'Sabados: 07:00 - 12:00',
      sunday: 'Domingos: Cerrado',
    },
    currency: 'PYG',
    taxRate: 10,
    shippingBase: 25000,
    freeShippingThreshold: 500000,
  },
  notifications: {
    emailOnNewOrder: true,
    emailOnNewLead: true,
    whatsappOnNewOrder: false,
    adminEmail: 'admin@fullserviceandclean.com.py',
  },
  seo: {
    metaTitle: 'Full Service & Clean — Mantenimiento, Limpieza y Servicios',
    metaDescription: 'Soluciones integrales en mantenimiento, limpieza y servicios profesionales en Paraguay.',
    ogImage: '',
    googleAnalyticsId: '',
    metaPixelId: '',
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

export async function getSettings(): Promise<SiteSettings> {
  const row = await prisma.siteSettings.findUnique({ where: { id: SINGLETON_ID } });
  if (!row) return DEFAULT_SETTINGS;
  return deepMerge(DEFAULT_SETTINGS, row.data);
}

export async function updateSettings(data: Partial<SiteSettings>): Promise<SiteSettings> {
  const current = await getSettings();
  const updated = deepMerge(current, data);
  await prisma.siteSettings.upsert({
    where: { id: SINGLETON_ID },
    create: { id: SINGLETON_ID, data: updated },
    update: { data: updated },
  });
  return updated;
}
