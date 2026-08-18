import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contacto',
  description:
    'Contactate con Full Service & Clean. Consultá por servicios, pedí un presupuesto o escribinos por WhatsApp. Atención en Asunción y todo Paraguay.',
  openGraph: {
    title: 'Contacto — Full Service & Clean',
    description:
      'Escribinos por WhatsApp, email o completá el formulario. Te respondemos a la brevedad.',
  },
  keywords: [
    'contacto Full Service Paraguay',
    'presupuesto mantenimiento Paraguay',
    'ferretería contacto Asunción',
    'WhatsApp ferretería Paraguay',
  ],
};

export default function ContactoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
