import Link from 'next/link';
import { ChevronRight, ShieldCheck, Database, Cookie, UserRound, Mail, ArrowRight } from 'lucide-react';
import { siteConfig } from '@/config/site';

export const metadata = {
  title: 'Política de Privacidad',
  description: `Política de privacidad y tratamiento de datos personales de ${siteConfig.name}.`,
};

const sections = [
  { title: 'Datos que recopilamos', icon: UserRound, text: `Cuando comprás en la tienda, solicitás un presupuesto o nos contactás a través del sitio, podemos recopilar datos como nombre, teléfono, correo electrónico, dirección de entrega y detalles del pedido o consulta.` },
  { title: 'Uso de los datos', icon: ShieldCheck, text: `Utilizamos tus datos para procesar pedidos y presupuestos, coordinar envíos y servicios, responder consultas y comunicarnos con vos por correo, teléfono o WhatsApp respecto a tu pedido o solicitud. No vendemos ni compartimos tus datos con terceros con fines comerciales.` },
  { title: 'Almacenamiento', icon: Database, text: `Tus datos se almacenan en bases de datos con acceso restringido, utilizadas exclusivamente para la operación del sitio y la gestión de pedidos, presupuestos y consultas de ${siteConfig.name}.` },
  { title: 'Cookies y almacenamiento local', icon: Cookie, text: `El sitio puede utilizar almacenamiento local del navegador, por ejemplo para mantener el contenido de tu carrito de compras, con el único fin de mejorar tu experiencia de navegación.` },
];

export default function PrivacidadPage() {
  const updated = new Date().toLocaleDateString('es-PY', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <main className="bg-[#F4F7FB]">
      <div className="border-b border-gray-200 bg-white">
        <div className="container-main flex items-center gap-2 py-3 font-body text-caption text-[#8094B4]">
          <Link href="/" className="transition-colors hover:text-[#2D8FCC]">Inicio</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-[#0B1120]">Política de privacidad</span>
        </div>
      </div>

      <section className="relative overflow-hidden bg-[#0B1120] py-16 md:py-20">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#2D8FCC]/15 blur-3xl" />
        <div className="container-main relative">
          <span className="overline text-[#6FC3F5]">Legal · Privacidad</span>
          <h1 className="mt-3 max-w-3xl font-display text-[clamp(2.2rem,5vw,4rem)] font-bold uppercase leading-[.95] text-white">
            Tus datos, <span className="text-[#6FC3F5]">bajo control.</span>
          </h1>
          <p className="mt-5 max-w-2xl font-body text-body-lg leading-relaxed text-[#B7C5D9]">
            Te explicamos de forma clara qué información recopilamos, para qué la utilizamos y cómo podés ejercer tus derechos.
          </p>
          <div className="mt-6 flex items-center gap-3 font-body text-caption text-[#8FA4C0]">
            <ShieldCheck className="h-4 w-4 text-[#6FC3F5]" />
            Última actualización: {updated}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container-main">
          <div className="mx-auto max-w-4xl">
            <div className="grid gap-4 md:grid-cols-2">
              {sections.map(({ title, icon: Icon, text }, index) => (
                <article key={title} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EBF5FB] text-[#2D8FCC]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="font-body text-[0.65rem] font-semibold uppercase tracking-[.12em] text-[#9AAAC0]">0{index + 1}</span>
                      <h2 className="mt-1 font-display text-h3 text-[#0B1120]">{title}</h2>
                      <p className="mt-3 font-body text-body leading-7 text-[#4A5E80]">{text}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-6 md:p-8">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FFF4E8] text-[#E8862B]"><Mail className="h-5 w-5" /></div>
                <div className="space-y-6">
                  <div><h2 className="font-display text-h3 text-[#0B1120]">Tus derechos</h2><p className="mt-2 font-body text-body leading-7 text-[#4A5E80]">Podés solicitar en cualquier momento el acceso, la corrección o la eliminación de tus datos personales escribiendo a {siteConfig.email} o por WhatsApp al {siteConfig.phone}.</p></div>
                  <div><h2 className="font-display text-h3 text-[#0B1120]">Cambios en esta política</h2><p className="mt-2 font-body text-body leading-7 text-[#4A5E80]">Podemos actualizar esta política periódicamente. Los cambios entran en vigencia al momento de su publicación en esta página.</p></div>
                  <Link href="/contacto" className="inline-flex items-center gap-2 font-body text-sm font-semibold text-[#2D8FCC] hover:underline">¿Tenés una consulta? Contactanos <ArrowRight className="h-4 w-4" /></Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
