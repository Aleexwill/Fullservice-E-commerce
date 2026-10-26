import type { Metadata } from 'next';
import { siteConfig } from '@/config/site';
import ServiciosPageClient from './page-client';

const title = 'Servicios de mantenimiento, obras civiles y metalúrgica';
const description = 'Conocé los servicios de mantenimiento, instalaciones eléctricas, plomería, pintura, obras civiles y metalúrgica de Full Service & Clean en Paraguay. Solicitá un presupuesto.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/servicios' },
  openGraph: { title, description, url: `${siteConfig.url}/servicios` },
};

export default function ServiciosPage() {
  return <ServiciosPageClient />;
}
