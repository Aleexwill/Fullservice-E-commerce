import type { Metadata } from 'next';
import { siteConfig } from '@/config/site';
import ClientesPageClient from './page-client';

const title = 'Clientes de Full Service & Clean';
const description = 'Conocé algunas de las empresas y organizaciones que confían en Full Service & Clean para sus servicios y proyectos.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/clientes' },
  openGraph: { title, description, url: `${siteConfig.url}/clientes` },
};

export default function ClientesPage() {
  return <ClientesPageClient />;
}
