'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronRight, ArrowRight, Building2 } from 'lucide-react';
import { Isotipo } from '@/components/ui/isotipo';

interface ClienteLogo {
  id: string;
  name: string;
  logoUrl: string;
  website: string;
  parentId: string | null;
  children: ClienteLogo[];
  isActive: boolean;
  order: number;
}

// Fallback data — Mao primero con sus subdivisiones
const FALLBACK: ClienteLogo[] = [
  {
    id: 'mao', name: 'Grupo MAO', logoUrl: '', website: '', parentId: null, isActive: true, order: 0,
    children: [
      { id: 'mao-1', name: 'MAO Construcciones', logoUrl: '', website: '', parentId: 'mao', isActive: true, order: 0, children: [] },
      { id: 'mao-2', name: 'MAO Industrias', logoUrl: '', website: '', parentId: 'mao', isActive: true, order: 1, children: [] },
      { id: 'mao-3', name: 'MAO Servicios', logoUrl: '', website: '', parentId: 'mao', isActive: true, order: 2, children: [] },
    ],
  },
];

function LogoCard({ client }: { client: ClienteLogo }) {
  const inner = (
    <div className="group flex flex-col items-center justify-center gap-3 rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm transition-all hover:border-[#2D8FCC]/40 hover:shadow-md">
      {client.logoUrl ? (
        <img src={client.logoUrl} alt={client.name} className="h-14 w-auto max-w-[120px] object-contain transition-transform duration-300 group-hover:scale-105" />
      ) : (
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#EBF5FB]">
          <Building2 className="h-7 w-7 text-[#2D8FCC]" />
        </div>
      )}
      <span className="font-body text-sm font-semibold text-[#0B1120]">{client.name}</span>
    </div>
  );
  return client.website
    ? <a href={client.website} target="_blank" rel="noopener noreferrer">{inner}</a>
    : <div>{inner}</div>;
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<ClienteLogo[]>(FALLBACK);

  useEffect(() => {
    fetch('/api/clientes-logo')
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d.clientes) && d.clientes.length > 0) setClientes(d.clientes); })
      .catch(() => {});
  }, []);

  const activeClientes = clientes.filter((c) => c.isActive);

  return (
    <>
      {/* Breadcrumb */}
      <div className="border-b border-gray-200 bg-white">
        <div className="container-main flex items-center gap-2 py-3 font-body text-caption text-[#8094B4]">
          <Link href="/" className="hover:text-[#2D8FCC]">Inicio</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-[#0B1120]">Clientes</span>
        </div>
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-gray-200 bg-[#0B1120] py-20 md:py-24">
        <div className="pointer-events-none absolute -left-24 top-0 h-80 w-80 rounded-full bg-[#E8862B] opacity-[0.05] blur-3xl" />
        <div className="container-main relative">
          <span className="overline text-[#7CC4EF]">Empresas que confían en nosotros</span>
          <h1 className="mt-3 max-w-3xl font-display text-[clamp(2.4rem,6vw,4.8rem)] font-bold uppercase leading-[.92] tracking-tight text-white">
            Nuestros<br />Clientes
          </h1>
          <p className="mt-6 max-w-2xl font-body text-body-lg leading-relaxed text-[#C0CEDF]">
            Empresas y organizaciones de Paraguay que eligen Full Service &amp; Clean para sus proyectos de mantenimiento, construcción y metalúrgica.
          </p>
          <div className="mt-8">
            <Link href="/portfolio" className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-2.5 font-body text-sm font-semibold text-white hover:bg-white/15 transition-colors">
              Ver trabajos realizados <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Clientes */}
      <section className="section bg-[#F4F7FB]">
        <div className="container-main">
          {activeClientes.length === 0 ? (
            <div className="py-24 text-center">
              <Isotipo size={72} color="#2D8FCC18" />
              <p className="mt-4 font-body text-body text-[#8094B4]">Próximamente publicaremos nuestros clientes destacados.</p>
            </div>
          ) : (
            <div className="space-y-16">
              {activeClientes.map((cliente) => (
                <div key={cliente.id}>
                  {/* Cliente principal */}
                  <div className="mb-6 flex items-center gap-3">
                    <div className="h-px flex-1 bg-gray-200" />
                    <div className="flex items-center gap-2 rounded-full border border-[#2D8FCC]/30 bg-white px-4 py-2">
                      {cliente.logoUrl
                        ? <img src={cliente.logoUrl} alt={cliente.name} className="h-6 w-auto max-w-[80px] object-contain" />
                        : <Building2 className="h-4 w-4 text-[#2D8FCC]" />
                      }
                      <span className="font-display text-sm font-bold uppercase tracking-wide text-[#0B1120]">{cliente.name}</span>
                    </div>
                    <div className="h-px flex-1 bg-gray-200" />
                  </div>

                  {/* Subdivisiones o tarjeta directa */}
                  {cliente.children && cliente.children.length > 0 ? (
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                      {/* Tarjeta del grupo */}
                      <LogoCard client={cliente} />
                      {/* Tarjetas de subdivisiones */}
                      {cliente.children.filter((c) => c.isActive).map((sub) => (
                        <LogoCard key={sub.id} client={sub} />
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                      <LogoCard client={cliente} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-gray-200 bg-white py-16">
        <div className="container-main text-center">
          <span className="overline">Sumate a nuestros clientes</span>
          <h2 className="mt-2 font-display text-h2 text-[#0B1120]">¿Trabajamos juntos?</h2>
          <p className="mx-auto mt-3 max-w-md font-body text-body text-[#4A5E80]">Consultanos sin cargo y recibí un presupuesto adaptado a tu proyecto.</p>
          <div className="mt-6">
            <Link href="/contacto?tipo=presupuesto" className="btn-primary">Pedir presupuesto <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </section>
    </>
  );
}
