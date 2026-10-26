import type { Metadata } from 'next';
import { siteConfig } from '@/config/site';
import TrabajosPageClient from './page-client';

const title = 'Trabajos y proyectos realizados';
const description = 'Conocé proyectos y trabajos de mantenimiento, construcción civil y metalúrgica de Full Service & Clean. Consultá por tu próximo proyecto.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/trabajos' },
  openGraph: { title, description, url: `${siteConfig.url}/trabajos` },
};

export default function TrabajosPage() {
  return <TrabajosPageClient />;
}
