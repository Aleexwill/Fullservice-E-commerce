import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Nosotros',
  description:
    'Conocé a Full Service & Clean: misión, visión y valores de la empresa paraguaya especializada en mantenimiento, construcción civil y metalúrgica en Lambaré.',
  openGraph: {
    title: 'Nosotros — Full Service & Clean',
    description:
      'Empresa paraguaya con compromiso, confianza y excelencia. Conocé nuestra misión, visión y valores.',
  },
  keywords: [
    'Full Service Clean Paraguay',
    'empresa mantenimiento Lambaré',
    'construcción civil Paraguay',
    'metalúrgica Paraguay',
    'quiénes somos',
    'misión visión valores empresa',
  ],
};

export default function NosotrosLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
