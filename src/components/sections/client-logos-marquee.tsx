'use client';

import { useEffect, useState } from 'react';

interface ClienteLogo {
  id: string;
  name: string;
  logoUrl: string;
  website: string;
  parentId: string | null;
  children?: ClienteLogo[];
  isActive: boolean;
  order: number;
}

const FALLBACK: ClienteLogo[] = [
  { id: 'mao',      name: 'Grupo MAO',                   logoUrl: '', website: '', parentId: null, isActive: true, order: 0,  children: [] },
  { id: 'tigre',    name: 'Tigre',                        logoUrl: '', website: '', parentId: null, isActive: true, order: 1,  children: [] },
  { id: 'py-textil',name: 'Paraguay Textil',              logoUrl: '', website: '', parentId: null, isActive: true, order: 2,  children: [] },
  { id: 'agpar',    name: 'Agpar Gruppo Farrini',         logoUrl: '', website: '', parentId: null, isActive: true, order: 3,  children: [] },
  { id: 'inyeplast',name: 'Inyeplast',                    logoUrl: '', website: '', parentId: null, isActive: true, order: 4,  children: [] },
  { id: 'innova',   name: 'Innova Technology Paraguay',   logoUrl: '', website: '', parentId: null, isActive: true, order: 5,  children: [] },
  { id: 'ball',     name: 'Ball',                         logoUrl: '', website: '', parentId: null, isActive: true, order: 6,  children: [] },
  { id: 'granusa',  name: 'Granusa',                      logoUrl: '', website: '', parentId: null, isActive: true, order: 7,  children: [] },
  { id: 'rodan',    name: 'Rodan Inmobiliaria',           logoUrl: '', website: '', parentId: null, isActive: true, order: 8,  children: [] },
  { id: 'gala',     name: 'Gala',                         logoUrl: '', website: '', parentId: null, isActive: true, order: 9,  children: [] },
  { id: 'sena',     name: 'Sena Ingeniería',              logoUrl: '', website: '', parentId: null, isActive: true, order: 10, children: [] },
  { id: 'agriplus', name: 'Agriplus',                     logoUrl: '', website: '', parentId: null, isActive: true, order: 11, children: [] },
];

// Sprite /partners/empresas.jpeg (788×663) — same crops as clientes page
const CROPS_BY_NAME: Record<string, [number, number, number, number]> = {
  tigre:            [5,   15,  250, 115],
  grupomao:         [258, 15,  275, 115],
  mao:              [258, 15,  275, 115],
  paraguaytextil:   [535, 15,  247, 115],
  agpar:            [5,   145, 250, 145],
  agpargruppofarrini:[5,  145, 250, 145],
  inyeplast:        [258, 145, 275, 145],
  innova:           [535, 145, 247, 145],
  innovatechnology: [535, 145, 247, 145],
  ball:             [5,   305, 250, 165],
  granusa:          [258, 305, 275, 165],
  rodan:            [535, 305, 247, 165],
  rodaninmobiliaria:[535, 305, 247, 165],
  gala:             [5,   487, 250, 113],
  sena:             [258, 487, 275, 113],
  senaingenieria:   [258, 487, 275, 113],
  agriplus:         [535, 487, 247, 113],
};

function normalizeName(name: string): string {
  return name.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function getCrop(client: ClienteLogo): [number, number, number, number] | undefined {
  return (CROPS_BY_NAME as Record<string, [number, number, number, number]>)[client.id]
    ?? CROPS_BY_NAME[normalizeName(client.name)];
}

function LogoTile({ client }: { client: ClienteLogo }) {
  const crop = getCrop(client);

  if (client.logoUrl) {
    return (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img src={client.logoUrl} alt={client.name} className="max-h-9 max-w-[110px] object-contain" loading="lazy" />
    );
  }
  if (crop) {
    const [cx, cy, cw, ch] = crop;
    const scale = Math.min(110 / cw, 44 / ch);
    const dw = Math.round(cw * scale);
    const dh = Math.round(ch * scale);
    return (
      <div
        role="img"
        aria-label={client.name}
        style={{
          width: dw,
          height: dh,
          backgroundImage: 'url(/partners/empresas.jpeg)',
          backgroundSize: `${Math.round(788 * scale)}px ${Math.round(663 * scale)}px`,
          backgroundPosition: `-${Math.round(cx * scale)}px -${Math.round(cy * scale)}px`,
          backgroundRepeat: 'no-repeat',
        }}
      />
    );
  }
  return (
    <span className="font-display text-[0.8rem] font-bold tracking-tight text-[#4A5E80]">
      {client.name}
    </span>
  );
}

export function ClientLogosMarquee() {
  const [logos, setLogos] = useState<ClienteLogo[]>(FALLBACK);

  useEffect(() => {
    fetch('/api/clientes-logo')
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.clientes) && d.clientes.length > 0) {
          const active = (d.clientes as ClienteLogo[])
            .filter((c) => c.isActive)
            .sort((a, b) => a.order - b.order);
          if (active.length > 0) setLogos(active);
        }
      })
      .catch(() => {});
  }, []);

  const doubled = [...logos, ...logos];
  const duration = Math.max(logos.length * 3, 20);

  return (
    <section className="border-t border-gray-200 bg-white py-10">
      <style>{`
        @keyframes logos-marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .logos-track { animation-play-state: paused !important; }
        }
      `}</style>
      <div className="container-main mb-7">
        <span className="mb-1 block font-body text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-[#2D8FCC]">Clientes</span>
        <h2 className="font-display text-h2 uppercase text-[#0B1120]">Clientes que confían en nosotros</h2>
        <div className="mt-3 h-[3px] w-12 rounded-sm bg-gradient-to-r from-[#2D8FCC] to-[#E8862B]" />
      </div>

      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-16 bg-gradient-to-r from-white to-transparent" />
        <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-16 bg-gradient-to-l from-white to-transparent" />

        <div
          className="logos-track flex items-center gap-6 will-change-transform"
          style={{ width: 'max-content', animation: `logos-marquee ${duration}s linear infinite` }}
        >
          {doubled.map((logo, i) => (
            <div
              key={`${logo.id}-${i}`}
              className="flex h-16 w-36 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-[#F4F7FB] px-4 py-3 opacity-60 transition-opacity duration-300 hover:opacity-100"
            >
              <LogoTile client={logo} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
