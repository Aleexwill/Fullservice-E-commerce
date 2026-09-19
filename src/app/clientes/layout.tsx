import type { Metadata } from 'next';

export const metadata: Metadata = {
  alternates: { canonical: '/clientes' },
  title: 'Clientes',
  description: 'Empresas y organizaciones que confían en Full Service & Clean para sus proyectos de mantenimiento, construcción y metalúrgica en Paraguay.',
  openGraph: {
    title: 'Clientes — Full Service & Clean',
    description: 'Conocé las empresas que trabajan con nosotros en Paraguay.',
  },
};

export default function ClientesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
