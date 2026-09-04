import Link from 'next/link';
import { ChevronRight, FileCheck2, ShoppingBag, CreditCard, Truck, BriefcaseBusiness, Copyright, RefreshCw, MessageCircle } from 'lucide-react';
import { siteConfig } from '@/config/site';

export const metadata = {
  title: 'Términos y Condiciones',
  description: `Términos y condiciones de uso del sitio y la tienda online de ${siteConfig.name}.`,
};

const sections = [
  ['Aceptación de los términos', FileCheck2, `Al acceder y utilizar el sitio web de ${siteConfig.name}, incluyendo la tienda online, la solicitud de presupuestos y cualquier otro servicio ofrecido, aceptás los presentes Términos y Condiciones.`],
  ['Sobre nosotros', BriefcaseBusiness, `${siteConfig.name} brinda servicios de mantenimiento, limpieza, construcción civil, metalúrgica y venta de productos de ferretería, con domicilio en ${siteConfig.address.street}, ${siteConfig.address.city}, ${siteConfig.address.country}.`],
  ['Productos y precios', ShoppingBag, 'Los precios publicados están expresados en guaraníes (PYG) e incluyen los impuestos aplicables, salvo que se indique lo contrario. Los precios, promociones y disponibilidad de stock pueden modificarse sin previo aviso.'],
  ['Pedidos y formas de pago', CreditCard, 'Los pedidos realizados a través del carrito se confirman una vez recibido el pago (transferencia bancaria/QR) o, en el caso de pago contra entrega, al momento de la recepción.'],
  ['Envíos', Truck, 'Los costos y tiempos de envío se informan durante el proceso de compra según la dirección de entrega. La responsabilidad sobre el pedido se transfiere al comprador una vez entregado en el domicilio indicado.'],
  ['Servicios y presupuestos', BriefcaseBusiness, 'Las solicitudes de presupuesto para mantenimiento, limpieza, construcción civil o metalúrgica no constituyen una contratación automática. El alcance y condiciones finales se acuerdan directamente con el cliente.'],
  ['Propiedad intelectual', Copyright, `Los contenidos del sitio, incluyendo textos, imágenes, logotipos y diseño, son propiedad de ${siteConfig.name} o se utilizan con la debida autorización y no pueden reproducirse sin consentimiento previo.`],
  ['Modificaciones', RefreshCw, 'Estos Términos y Condiciones pueden actualizarse en cualquier momento. Los cambios rigen a partir de su publicación en esta página.'],
];

export default function TerminosPage() {
  const updated = new Date().toLocaleDateString('es-PY', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <main className="bg-[#F4F7FB]">
      <div className="border-b border-gray-200 bg-white"><div className="container-main flex items-center gap-2 py-3 font-body text-caption text-[#8094B4]"><Link href="/" className="hover:text-[#2D8FCC]">Inicio</Link><ChevronRight className="h-3 w-3" /><span className="text-[#0B1120]">Términos y condiciones</span></div></div>
      <section className="relative overflow-hidden bg-[#0B1120] py-16 md:py-20">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[#E8862B]/10 blur-3xl" />
        <div className="container-main relative"><span className="overline text-[#F3B477]">Legal · Condiciones</span><h1 className="mt-3 max-w-3xl font-display text-[clamp(2.2rem,5vw,4rem)] font-bold uppercase leading-[.95] text-white">Comprá con <span className="text-[#F3B477]">claridad.</span></h1><p className="mt-5 max-w-2xl font-body text-body-lg leading-relaxed text-[#B7C5D9]">Condiciones claras para que conozcas tus derechos, responsabilidades y el funcionamiento de nuestra tienda y servicios.</p><div className="mt-6 font-body text-caption text-[#8FA4C0]">Última actualización: {updated}</div></div>
      </section>
      <section className="section"><div className="container-main"><div className="mx-auto max-w-4xl grid gap-3 md:grid-cols-2">{sections.map(([title, Icon, text], index) => { const I = Icon as typeof FileCheck2; return <article key={title as string} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"><div className="flex gap-4"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EBF5FB] text-[#2D8FCC]"><I className="h-5 w-5" /></div><div><span className="font-body text-[0.65rem] font-semibold uppercase tracking-[.12em] text-[#9AAAC0]">{String(index + 1).padStart(2, '0')}</span><h2 className="mt-1 font-display text-h3 text-[#0B1120]">{title as string}</h2><p className="mt-3 font-body text-body leading-7 text-[#4A5E80]">{text as string}</p></div></div></article> })}</div><div className="mx-auto mt-4 max-w-4xl rounded-2xl bg-[#0B1120] p-7 md:p-8"><div className="flex gap-4"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#6FC3F5]"><MessageCircle className="h-5 w-5" /></div><div><h2 className="font-display text-h3 text-white">¿Necesitás ayuda?</h2><p className="mt-2 font-body text-body leading-7 text-[#B7C5D9]">Si tenés dudas sobre un pedido, servicio o estas condiciones, nuestro equipo puede orientarte.</p><Link href="/contacto" className="mt-4 inline-flex items-center gap-2 font-body text-sm font-semibold text-[#6FC3F5] hover:underline">Contactar al equipo <ChevronRight className="h-4 w-4" /></Link></div></div></div></div></section>
    </main>
  );
}
