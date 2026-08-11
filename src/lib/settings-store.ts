import { unstable_cache } from 'next/cache';
import { prisma } from './prisma';
import type { Prisma } from '@prisma/client';

export const SETTINGS_CACHE_TAG = 'site-settings';

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
  payment: {
    /** Pasarela de pago online (Stripe/MercadoPago) — desactivada hasta integrarla */
    gatewayEnabled: boolean;
    /** Métodos manuales disponibles hoy en el checkout */
    bankTransferEnabled: boolean;
    cashOnDeliveryEnabled: boolean;
    bankName: string;
    accountHolder: string;
    accountNumber: string;
    accountType: string;
    qrImageUrl: string;
    instructions: string;
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
  payment: {
    gatewayEnabled: false,
    bankTransferEnabled: true,
    cashOnDeliveryEnabled: true,
    bankName: '',
    accountHolder: '',
    accountNumber: '',
    accountType: '',
    qrImageUrl: '',
    instructions: 'Envía el comprobante de transferencia por WhatsApp para confirmar tu pedido.',
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

/**
 * Igual que getSettings() pero cacheado (60s) y resiliente ante fallas de DB
 * (build-time o un hiccup de Neon) — usada en layout/páginas públicas donde
 * un fallback a los defaults es preferible a romper el build/render entero
 * de todo el sitio por un dato no crítico (SEO, navbar, footer).
 */
export const getCachedSettings = unstable_cache(
  async () => {
    try {
      return await getSettings();
    } catch {
      return DEFAULT_SETTINGS;
    }
  },
  ['site-settings'],
  { tags: [SETTINGS_CACHE_TAG], revalidate: 60 }
);

export async function updateSettings(data: Partial<SiteSettings>): Promise<SiteSettings> {
  const current = await getSettings();
  const updated = deepMerge(current, data);
  await prisma.siteSettings.upsert({
    where: { id: SINGLETON_ID },
    create: { id: SINGLETON_ID, data: updated as unknown as Prisma.InputJsonValue },
    update: { data: updated as unknown as Prisma.InputJsonValue },
  });
  return updated;
}
