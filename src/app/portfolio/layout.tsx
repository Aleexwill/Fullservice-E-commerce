import type { Metadata } from 'next';

export const metadata: Metadata = {
  alternates: { canonical: '/portfolio' },
  title: 'Trabajos Destacados',
  description:
    'Conocé los trabajos realizados por Full Service & Clean: construcción civil, metalúrgica, mantenimiento edilicio y más en Paraguay. Galería de fotos y detalles técnicos.',
  openGraph: {
    title: 'Trabajos Destacados — Full Service & Clean',
    description:
      'Galería de trabajos de construcción, metalúrgica y mantenimiento en Paraguay.',
  },
  keywords: [
    'obras construcción civil Paraguay',
    'proyectos metalúrgica Paraguay',
    'trabajos de mantenimiento',
    'empresa constructora Asunción',
    'portfolio obras realizadas',
  ],
};

export default function PortfolioLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
