import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Servicios de Mantenimiento y Limpieza',
  description:
    'Servicios profesionales de mantenimiento edilicio, limpieza profunda, construcción civil y metalúrgica en Paraguay. Presupuesto sin cargo, respuesta rápida.',
  openGraph: {
    title: 'Servicios — Full Service & Clean',
    description:
      'Mantenimiento, limpieza profesional, construcción civil y metalúrgica en Paraguay. Pedí tu presupuesto online.',
  },
  keywords: [
    'mantenimiento edilicio Paraguay',
    'limpieza profesional Asunción',
    'construcción civil Paraguay',
    'metalúrgica Paraguay',
    'presupuesto mantenimiento',
    'empresa de servicios Paraguay',
  ],
};

export default function ServiciosLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
