import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { siteConfig } from '@/config/site';

export const metadata = {
  title: 'Términos y Condiciones',
  description: `Términos y condiciones de uso del sitio y la tienda online de ${siteConfig.name}.`,
};

export default function TerminosPage() {
  return (
    <>
      <div className="border-b border-gray-200">
        <div className="container-main flex items-center gap-2 py-3 font-body text-caption text-[#8094B4]">
          <Link href="/" className="hover:text-[#0B1120]">Inicio</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-[#0B1120]">Términos y condiciones</span>
        </div>
      </div>

      <section className="section-sm border-b border-gray-200 bg-white">
        <div className="container-main">
          <span className="overline mb-2 block">Legal</span>
          <h1 className="font-display text-h1 uppercase text-[#0B1120]">Términos y Condiciones</h1>
          <div className="mt-4 h-[3px] w-12 rounded-sm bg-gradient-to-r from-blue to-orange" />
          <p className="mt-4 max-w-2xl font-body text-body text-[#4A5E80]">
            Última actualización: {new Date().toLocaleDateString('es-PY', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container-main max-w-3xl space-y-8 font-body text-body text-[#4A5E80]">
          <div>
            <h2 className="mb-2 font-display text-h3 text-[#0B1120]">1. Aceptación de los términos</h2>
            <p>
              Al acceder y utilizar el sitio web de {siteConfig.name} ({siteConfig.url}), incluyendo la
              tienda online, la solicitud de presupuestos y cualquier otro servicio ofrecido, aceptás los
              presentes Términos y Condiciones. Si no estás de acuerdo con alguno de sus puntos, te pedimos
              que no utilices el sitio.
            </p>
          </div>

          <div>
            <h2 className="mb-2 font-display text-h3 text-[#0B1120]">2. Sobre nosotros</h2>
            <p>
              {siteConfig.name} brinda servicios de mantenimiento, limpieza, construcción civil, metalúrgica
              y venta de productos de ferretería, con domicilio en {siteConfig.address.street},{' '}
              {siteConfig.address.city}, {siteConfig.address.country}. Podés contactarnos por correo a{' '}
              {siteConfig.email} o por teléfono/WhatsApp al {siteConfig.phone}.
            </p>
          </div>

          <div>
            <h2 className="mb-2 font-display text-h3 text-[#0B1120]">3. Productos y precios</h2>
            <p>
              Los precios publicados en la tienda están expresados en guaraníes (PYG) e incluyen los
              impuestos aplicables, salvo que se indique lo contrario. Nos reservamos el derecho de
              modificar precios, promociones y disponibilidad de stock sin previo aviso. Las imágenes de
              los productos son ilustrativas y pueden presentar variaciones respecto al producto final.
            </p>
          </div>

          <div>
            <h2 className="mb-2 font-display text-h3 text-[#0B1120]">4. Pedidos y formas de pago</h2>
            <p>
              Los pedidos realizados a través del carrito de compras se confirman una vez recibido el pago
              (transferencia bancaria/QR) o, en el caso de pago contra entrega, al momento de la recepción
              del pedido. Nos reservamos el derecho de cancelar un pedido ante indisponibilidad de stock,
              errores de precio o datos de contacto incompletos, notificándolo al comprador.
            </p>
          </div>

          <div>
            <h2 className="mb-2 font-display text-h3 text-[#0B1120]">5. Envíos</h2>
            <p>
              Los costos y tiempos de envío se informan durante el proceso de compra, en base a la
              dirección de entrega. La responsabilidad sobre el pedido se transfiere al comprador una vez
              entregado en el domicilio indicado.
            </p>
          </div>

          <div>
            <h2 className="mb-2 font-display text-h3 text-[#0B1120]">6. Servicios (presupuestos)</h2>
            <p>
              Las solicitudes de presupuesto para servicios de mantenimiento, limpieza, construcción civil
              o metalúrgica no constituyen una contratación automática. El presupuesto final, alcance y
              condiciones de cada trabajo se acuerdan directamente entre {siteConfig.name} y el cliente.
            </p>
          </div>

          <div>
            <h2 className="mb-2 font-display text-h3 text-[#0B1120]">7. Propiedad intelectual</h2>
            <p>
              Todos los contenidos del sitio (textos, imágenes, logotipos, diseño) son propiedad de{' '}
              {siteConfig.name} o se utilizan con la debida autorización, y no pueden ser reproducidos sin
              consentimiento previo.
            </p>
          </div>

          <div>
            <h2 className="mb-2 font-display text-h3 text-[#0B1120]">8. Modificaciones</h2>
            <p>
              Estos Términos y Condiciones pueden ser actualizados en cualquier momento. Los cambios rigen
              a partir de su publicación en esta página.
            </p>
          </div>

          <div>
            <h2 className="mb-2 font-display text-h3 text-[#0B1120]">9. Contacto</h2>
            <p>
              Ante cualquier consulta sobre estos términos, escribinos a {siteConfig.email} o por WhatsApp
              al {siteConfig.phone}.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
