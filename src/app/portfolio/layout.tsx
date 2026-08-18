import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Portfolio de Obras y Trabajos',
  description:
    'Conocé los proyectos realizados por Full Service & Clean: obras de construcción civil, trabajos metalúrgicos, mantenimiento edilicio y más en Paraguay.',
  openGraph: {
    title: 'Portfolio — Full Service & Clean',
    description:
      'Proyectos de construcción civil, metalúrgica y mantenimiento realizados en Paraguay.',
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
