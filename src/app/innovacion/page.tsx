import type { Metadata } from 'next';
import { siteConfig } from '@/config/site';
import InnovacionPageClient from './page-client';

const title = 'Innovación y soluciones';
const description = 'Explorá las iniciativas, soluciones y novedades de Full Service & Clean.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/innovacion' },
  openGraph: { title, description, url: `${siteConfig.url}/innovacion` },
};

export default function InnovacionPage() {
  return <InnovacionPageClient />;
}
