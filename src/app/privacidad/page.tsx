import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { siteConfig } from '@/config/site';

export const metadata = {
  title: 'Política de Privacidad',
  description: `Política de privacidad y tratamiento de datos personales de ${siteConfig.name}.`,
};

export default function PrivacidadPage() {
  return (
    <>
      <div className="border-b border-gray-200">
        <div className="container-main flex items-center gap-2 py-3 font-body text-caption text-[#8094B4]">
          <Link href="/" className="hover:text-[#0B1120]">Inicio</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-[#0B1120]">Política de privacidad</span>
        </div>
      </div>

      <section className="section-sm border-b border-gray-200 bg-white">
        <div className="container-main">
          <span className="overline mb-2 block">Legal</span>
          <h1 className="font-display text-h1 uppercase text-[#0B1120]">Política de Privacidad</h1>
          <div className="mt-4 h-[3px] w-12 rounded-sm bg-gradient-to-r from-blue to-orange" />
          <p className="mt-4 max-w-2xl font-body text-body text-[#4A5E80]">
            Última actualización: {new Date().toLocaleDateString('es-PY', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container-main max-w-3xl space-y-8 font-body text-body text-[#4A5E80]">
          <div>
            <h2 className="mb-2 font-display text-h3 text-[#0B1120]">1. Datos que recopilamos</h2>
            <p>
              Cuando comprás en la tienda, solicitás un presupuesto o nos contactás a través del sitio,
              podemos recopilar datos como nombre, teléfono, correo electrónico, dirección de entrega y
              detalles del pedido o consulta.
            </p>
          </div>

          <div>
            <h2 className="mb-2 font-display text-h3 text-[#0B1120]">2. Uso de los datos</h2>
            <p>
              Utilizamos tus datos para procesar pedidos y presupuestos, coordinar envíos y servicios,
              responder consultas, y comunicarnos con vos por correo, teléfono o WhatsApp respecto a tu
              pedido o solicitud. No vendemos ni compartimos tus datos con terceros con fines comerciales.
            </p>
          </div>

          <div>
            <h2 className="mb-2 font-display text-h3 text-[#0B1120]">3. Almacenamiento</h2>
            <p>
              Tus datos se almacenan en bases de datos con acceso restringido, utilizadas exclusivamente
              para la operación del sitio y la gestión de pedidos, presupuestos y consultas de{' '}
              {siteConfig.name}.
            </p>
          </div>

          <div>
            <h2 className="mb-2 font-display text-h3 text-[#0B1120]">4. Cookies</h2>
            <p>
              El sitio puede utilizar almacenamiento local del navegador (por ejemplo, para mantener el
              contenido de tu carrito de compras) con el único fin de mejorar tu experiencia de navegación.
            </p>
          </div>

          <div>
            <h2 className="mb-2 font-display text-h3 text-[#0B1120]">5. Tus derechos</h2>
            <p>
              Podés solicitarnos en cualquier momento el acceso, la corrección o la eliminación de tus
              datos personales escribiendo a {siteConfig.email} o por WhatsApp al {siteConfig.phone}.
            </p>
          </div>

          <div>
            <h2 className="mb-2 font-display text-h3 text-[#0B1120]">6. Cambios en esta política</h2>
            <p>
              Podemos actualizar esta política de privacidad periódicamente. Los cambios entran en vigencia
              al momento de su publicación en esta página.
            </p>
          </div>

          <div>
            <h2 className="mb-2 font-display text-h3 text-[#0B1120]">7. Contacto</h2>
            <p>
              Ante cualquier consulta sobre el tratamiento de tus datos, escribinos a {siteConfig.email} o
              por teléfono al {siteConfig.phone}.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
