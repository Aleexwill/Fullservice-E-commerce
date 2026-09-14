import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contacto',
  description:
    'Contactate con Full Service & Clean en Lambaré, Paraguay. Consultá por servicios, pedí un presupuesto o escribinos por WhatsApp. Respondemos en 24 h.',
  alternates: { canonical: '/contacto' },
  openGraph: {
    title: 'Contacto — Full Service & Clean',
    description:
      'Escribinos por WhatsApp, email o completá el formulario. Estamos en Ysapy casi Yasy, Lambaré.',
  },
  keywords: [
    'contacto Full Service Paraguay',
    'presupuesto mantenimiento Paraguay',
    'empresa servicios Lambaré',
    'WhatsApp mantenimiento Paraguay',
  ],
};

export default function ContactoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
