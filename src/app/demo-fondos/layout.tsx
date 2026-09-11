import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Demo de fondos animados | Fullservice',
  description: 'Laboratorio visual para comparar fondos animados de la web pública de Fullservice.',
  robots: { index: false, follow: false },
};

export default function DemoFondosLayout({ children }: { children: React.ReactNode }) {
  return children;
}
