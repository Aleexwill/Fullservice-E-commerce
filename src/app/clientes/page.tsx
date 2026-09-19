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

// Fallback data — Mao primero con sus subdivisiones, luego el resto
const FALLBACK: ClienteLogo[] = [
  {
    id: 'mao', name: 'Grupo MAO', logoUrl: '', website: 'https://grupomao.com.py', parentId: null, isActive: true, order: 0,
    children: [
      { id: 'mao-1', name: 'MAO Construcciones', logoUrl: '', website: '', parentId: 'mao', isActive: true, order: 0, children: [] },
      { id: 'mao-2', name: 'MAO Industrias', logoUrl: '', website: '', parentId: 'mao', isActive: true, order: 1, children: [] },
      { id: 'mao-3', name: 'MAO Servicios', logoUrl: '', website: '', parentId: 'mao', isActive: true, order: 2, children: [] },
    ],
  },
  { id: 'tigre', name: 'Tigre', logoUrl: '', website: 'https://www.tigre.com', parentId: null, isActive: true, order: 1, children: [] },
  { id: 'py-textil', name: 'Paraguay Textil', logoUrl: '', website: '', parentId: null, isActive: true, order: 2, children: [] },
  { id: 'agpar', name: 'Agpar Gruppo Farrini', logoUrl: '', website: '', parentId: null, isActive: true, order: 3, children: [] },
  { id: 'inyeplast', name: 'Inyeplast', logoUrl: '', website: '', parentId: null, isActive: true, order: 4, children: [] },
  { id: 'innova', name: 'Innova Technology Paraguay', logoUrl: '', website: '', parentId: null, isActive: true, order: 5, children: [] },
  { id: 'ball', name: 'Ball', logoUrl: '', website: 'https://www.ball.com', parentId: null, isActive: true, order: 6, children: [] },
  { id: 'granusa', name: 'Granusa — Excelencia en nutrición', logoUrl: '', website: '', parentId: null, isActive: true, order: 7, children: [] },
  { id: 'rodan', name: 'Rodan Inmobiliaria', logoUrl: '', website: '', parentId: null, isActive: true, order: 8, children: [] },
  { id: 'gala', name: 'Gala — Alquiler de Muebles de Lujo', logoUrl: '', website: '', parentId: null, isActive: true, order: 9, children: [] },
  { id: 'sena', name: 'Sena Ingeniería', logoUrl: '', website: '', parentId: null, isActive: true, order: 10, children: [] },
  { id: 'agriplus', name: 'Agriplus', logoUrl: '', website: '', parentId: null, isActive: true, order: 11, children: [] },
];

// Datos de crop de la imagen sprite /partners/empresas.jpeg (788×663)
const CROPS: Record<string, [number, number, number, number]> = {
  tigre:      [24,  32,  190, 75],
  mao:        [279, 32,  204, 88],
  'py-textil':[575, 42,  168, 77],
  agpar:      [42,  168, 153, 100],
  inyeplast:  [303, 187, 156, 63],
  innova:     [586, 146, 159, 157],
  ball:       [20,  317, 156, 153],
  granusa:    [267, 375, 210, 72],
  rodan:      [541, 344, 211, 112],
  gala:       [38,  518, 160, 72],
  sena:       [262, 524, 254, 81],
  agriplus:   [560, 522, 181, 72],
};

function LogoCard({ client }: { client: ClienteLogo }) {
  const crop = CROPS[client.id];
  const hasImage = Boolean(client.logoUrl || crop);
  const inner = (
    <div className="group flex flex-col items-center justify-center gap-3 rounded-2xl border border-gray-200 bg-white p-5 text-center shadow-sm transition-all duration-300 hover:border-[#2D8FCC]/40 hover:shadow-lg hover:-translate-y-1 min-h-[110px]">
      {client.logoUrl ? (
        <img
          src={client.logoUrl} alt={client.name}
          className="h-14 w-auto max-w-[130px] object-contain transition-all duration-300 group-hover:grayscale group-hover:scale-105"
        />
      ) : crop ? (
        <div
          role="img" aria-label={client.name}
          className="overflow-hidden transition-all duration-300 group-hover:grayscale group-hover:scale-105"
          style={{ position: 'relative', width: Math.min(crop[2], 130), height: Math.min(crop[3], 85), maxWidth: '100%' }}
        >
          <img
            src="/partners/empresas.jpeg" alt=""
            style={{
              position: 'absolute',
              width: `${788 / crop[2] * Math.min(crop[2], 130)}px`,
              height: `${663 / crop[3] * Math.min(crop[3], 85)}px`,
              left: `-${crop[0] / crop[2] * Math.min(crop[2], 130)}px`,
              top: `-${crop[1] / crop[3] * Math.min(crop[3], 85)}px`,
            }}
          />
        </div>
      ) : (
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#EBF5FB]">
          <Building2 className="h-7 w-7 text-[#2D8FCC]" />
        </div>
      )}
      {!hasImage && <span className="font-body text-xs font-semibold text-[#4A5E80]">{client.name}</span>}
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
      <section className="section relative overflow-hidden bg-[#F4F7FB]">
        {/* Blobs animados de fondo */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-[#2D8FCC] opacity-[0.07] blur-3xl animate-blob" />
          <div className="absolute -right-40 top-1/3 h-[420px] w-[420px] rounded-full bg-[#E8862B] opacity-[0.06] blur-3xl animate-blob animation-delay-2000" />
          <div className="absolute bottom-0 left-1/3 h-[380px] w-[380px] rounded-full bg-[#2D8FCC] opacity-[0.05] blur-3xl animate-blob animation-delay-4000" />
        </div>
        <div className="container-main relative">
          {activeClientes.length === 0 ? (
            <div className="py-24 text-center">
              <Isotipo size={72} color="#2D8FCC18" />
              <p className="mt-4 font-body text-body text-[#8094B4]">Próximamente publicaremos nuestros clientes destacados.</p>
            </div>
          ) : (() => {
            const grouped = activeClientes.filter((c) => c.children && c.children.length > 0);
            const singles = activeClientes.filter((c) => !c.children || c.children.length === 0);
            return (
              <div className="space-y-16">
                {/* Grupos con subdivisiones */}
                {grouped.map((cliente) => (
                  <div key={cliente.id}>
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
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                      <LogoCard client={cliente} />
                      {cliente.children.filter((c) => c.isActive).map((sub) => (
                        <LogoCard key={sub.id} client={sub} />
                      ))}
                    </div>
                  </div>
                ))}

                {/* Grilla plana de clientes individuales */}
                {singles.length > 0 && (
                  <div>
                    {grouped.length > 0 && (
                      <div className="mb-8 flex items-center gap-3">
                        <div className="h-px flex-1 bg-gray-200" />
                        <span className="font-body text-xs font-semibold uppercase tracking-widest text-[#8094B4]">Otras empresas</span>
                        <div className="h-px flex-1 bg-gray-200" />
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                      {singles.map((c) => <LogoCard key={c.id} client={c} />)}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
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
