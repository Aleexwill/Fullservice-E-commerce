import type { Metadata } from 'next';
import { siteConfig } from '@/config/site';
import ContactoPageClient from './page-client';

const title = 'Contacto y solicitud de presupuesto';
const description = 'Contactá a Full Service & Clean para consultas, productos o presupuestos de mantenimiento, obras civiles y metalúrgica en Paraguay.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/contacto' },
  openGraph: { title, description, url: `${siteConfig.url}/contacto` },
};

export default function ContactoPage() {
  return <ContactoPageClient />;
}
