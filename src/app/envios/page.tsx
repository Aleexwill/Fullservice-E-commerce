import Link from 'next/link';
import { ChevronRight, MapPin, Phone, Truck } from 'lucide-react';
import { siteConfig } from '@/config/site';

export const metadata = {
  title: 'Envíos y Entregas — Full Service & Clean',
  description: 'Conocé nuestras zonas de entrega, costos y tiempos estimados para tu pedido.',
};

const zones = [
  {
    zone: '0',
    label: 'Retiro en local',
    cities: 'Retiro en el centro logístico',
    cost: 'GRATIS',
    costColor: 'text-emerald-600',
  },
  {
    zone: '1',
    label: 'Zona Metropolitana',
    cities: 'Asunción, Lambaré, F. de la Mora, San Lorenzo, Luque, Villa Elisa, Ñemby, San Antonio, Mariano R. Alonso, Capiatá',
    cost: '30.000 Gs.',
    costColor: 'text-[#0B1120]',
  },
  {
    zone: '2',
    label: 'Gran Asunción Extendida',
    cities: 'Limpio, Itauguá, Areguá, Ypané, Guarambaré, Nueva Italia, Villeta, J. A. Saldívar, Ypacaraí',
    cost: 'Cliente paga transportadora externa',
    costColor: 'text-[#4A5E80]',
  },
  {
    zone: '3',
    label: 'Interior del País',
    cities: 'Resto del territorio nacional',
    cost: 'Consultar por WhatsApp',
    costColor: 'text-[#4A5E80]',
  },
];

export default function EnviosPage() {
  return (
    <>
      {/* Breadcrumb */}
      <div className="border-b border-gray-200">
        <div className="container-main flex items-center gap-2 py-3 font-body text-caption text-[#8094B4]">
          <Link href="/" className="hover:text-[#0B1120]">Inicio</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/tienda" className="hover:text-[#0B1120]">Tienda</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-[#0B1120]">Envíos</span>
        </div>
      </div>

      {/* Hero */}
      <section className="border-b border-gray-200 bg-white py-10">
        <div className="container-main">
          <span className="overline mb-2 block">Logística</span>
          <h1 className="font-display text-h1 uppercase text-[#0B1120]">Servicio de Entregas a Domicilio</h1>
          <div className="mt-4 h-[3px] w-12 rounded-sm bg-gradient-to-r from-blue to-orange" />
          <p className="mt-4 max-w-lg font-body text-body text-[#4A5E80]">
            Entregamos en todo el país. Conocé los costos según tu zona.
          </p>
        </div>
      </section>

      {/* Table */}
      <section className="container-main py-12">
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          {/* Header row */}
          <div className="grid grid-cols-[1fr_auto_1fr] border-b border-gray-200 bg-gray-50 px-6 py-3">
            <span className="font-body text-[0.65rem] font-bold uppercase tracking-widest text-[#8094B4]">Ciudades</span>
            <span className="px-8 text-center font-body text-[0.65rem] font-bold uppercase tracking-widest text-[#8094B4]">Zona</span>
            <span className="text-right font-body text-[0.65rem] font-bold uppercase tracking-widest text-[#8094B4]">Costo</span>
          </div>

          {zones.map((z, i) => (
            <div
              key={z.zone}
              className={`grid grid-cols-[1fr_auto_1fr] items-center gap-4 px-6 py-6 ${i < zones.length - 1 ? 'border-b border-gray-100' : ''}`}
            >
              {/* Cities */}
              <div>
                <p className="font-body text-sm font-medium text-[#0B1120]">{z.label}</p>
                <p className="mt-1 font-body text-sm text-[#4A5E80] leading-relaxed">{z.cities}</p>
              </div>

              {/* Zone number */}
              <div className="flex justify-center px-8">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#2D8FCC] to-[#1a6fa0] font-display text-2xl font-bold text-white shadow-md">
                  {z.zone}
                </span>
              </div>

              {/* Cost */}
              <div className="text-right">
                <span className={`font-body text-sm font-semibold ${z.costColor}`}>{z.cost}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Interior note */}
        <div className="mt-8 rounded-xl border border-[#2D8FCC]/20 bg-[#EBF5FB] p-5">
          <p className="mb-1 font-body text-sm font-semibold text-[#0B6FA0]">Para el interior del país:</p>
          <p className="font-body text-sm text-[#4A5E80]">
            Aguardamos que nos confirmes el pago al{' '}
            <a
              href={`https://wa.me/${siteConfig.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[#2D8FCC] hover:underline"
            >
              {siteConfig.phone}
            </a>{' '}
            (solo WhatsApp) para preparar tu pedido y enviártelo a través de una transportadora de tu confianza.
          </p>
        </div>

        {/* Contact strip */}
        <div className="mt-6 flex flex-wrap items-center gap-4 rounded-xl border border-gray-200 bg-white p-5">
          <Truck className="h-5 w-5 shrink-0 text-[#2D8FCC]" />
          <div className="flex-1 min-w-0">
            <p className="font-body text-sm font-medium text-[#0B1120]">¿Tenés dudas sobre tu envío?</p>
            <p className="font-body text-sm text-[#4A5E80]">Contactanos y te ayudamos a coordinar la entrega.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href={`https://wa.me/${siteConfig.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary text-sm"
            >
              <Phone className="h-4 w-4" />
              WhatsApp
            </a>
            <Link href="/contacto" className="btn-secondary text-sm">
              <MapPin className="h-4 w-4" />
              Contacto
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
