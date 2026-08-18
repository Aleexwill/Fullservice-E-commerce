import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tienda Online de Ferretería',
  description:
    'Comprá herramientas eléctricas, manuales, materiales de plomería, electricidad, pinturas y más. Envío a domicilio en Paraguay. Stock disponible y precios actualizados.',
  openGraph: {
    title: 'Tienda Online — Full Service & Clean',
    description:
      'Ferretería online con envío a todo el país. Herramientas, electricidad, plomería, pinturas y seguridad industrial.',
  },
  keywords: [
    'ferretería online Paraguay',
    'herramientas eléctricas Asunción',
    'comprar herramientas online Paraguay',
    'electricidad plomería materiales',
    'pinturas y acabados Paraguay',
    'seguridad industrial EPP',
  ],
};

export default function TiendaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
