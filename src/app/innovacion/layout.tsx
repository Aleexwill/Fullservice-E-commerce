import type { Metadata } from 'next';

export const metadata: Metadata = {
  alternates: { canonical: '/innovacion' },
  title: 'Innovación',
  description: 'Empresas y organizaciones que confían en Full Service & Clean para sus proyectos de mantenimiento, construcción y metalúrgica en Paraguay.',
  openGraph: {
    title: 'Innovación — Full Service & Clean',
    description: 'Conocé las empresas que trabajan con nosotros en Paraguay.',
  },
};

export default function InnovacionLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
