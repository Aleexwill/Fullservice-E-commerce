'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { ChevronRight, Package } from 'lucide-react';

interface Brand { name: string; count: number }

const ALPHABET = ['0-9', 'A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'];

function getGroup(name: string): string {
  const first = name.trim()[0]?.toUpperCase() ?? '';
  if (!first || /[0-9]/.test(first)) return '0-9';
  if (/[A-Z]/.test(first)) return first;
  return '0-9';
}

function brandColor(name: string): string {
  const colors = [
    'bg-blue-50 text-blue-700 border-blue-200',
    'bg-orange-50 text-orange-700 border-orange-200',
    'bg-emerald-50 text-emerald-700 border-emerald-200',
    'bg-violet-50 text-violet-700 border-violet-200',
    'bg-rose-50 text-rose-700 border-rose-200',
    'bg-amber-50 text-amber-700 border-amber-200',
    'bg-cyan-50 text-cyan-700 border-cyan-200',
    'bg-indigo-50 text-indigo-700 border-indigo-200',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

export function MarcasClient({ brands }: { brands: Brand[] }) {
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  const grouped = brands.reduce<Record<string, Brand[]>>((acc, b) => {
    const g = getGroup(b.name);
    if (!acc[g]) acc[g] = [];
    acc[g].push(b);
    return acc;
  }, {});

  const presentGroups = new Set(Object.keys(grouped));

  function scrollTo(letter: string) {
    sectionRefs.current[letter]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const groups = ALPHABET.filter((l) => presentGroups.has(l));

  return (
    <>
      {/* Breadcrumb */}
      <div className="border-b border-gray-200">
        <div className="container-main flex items-center gap-2 py-3 font-body text-caption text-[#4A5E80]">
          <Link href="/" className="hover:text-[#0B1120]">Inicio</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/tienda" className="hover:text-[#0B1120]">Tienda</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-[#0B1120]">Marcas</span>
        </div>
      </div>

      {/* Hero */}
      <section className="border-b border-gray-200 bg-white py-10">
        <div className="container-main">
          <span className="overline mb-2 block">Catálogo completo</span>
          <h1 className="font-display text-h1 uppercase text-[#0B1120]">Busca tu Marca Favorita</h1>
          <div className="mt-4 h-[3px] w-12 rounded-sm bg-gradient-to-r from-blue to-orange" />
          <p className="mt-4 max-w-lg font-body text-body text-[#4A5E80]">
            {brands.length} marcas disponibles. Seleccioná una para ver todos sus productos.
          </p>
        </div>
      </section>

      {/* Alphabet nav */}
      <div className="sticky top-0 z-10 border-b border-gray-200 bg-white/95 backdrop-blur-sm">
        <div className="container-main overflow-x-auto py-3">
          <div className="flex items-center gap-1 font-body text-sm font-semibold whitespace-nowrap">
            <span className="mr-2 text-[#4A5E80]">Marca Inicio:</span>
            {ALPHABET.map((letter) => (
              <button
                key={letter}
                onClick={() => scrollTo(letter)}
                disabled={!presentGroups.has(letter)}
                className={`min-w-[2rem] rounded px-1.5 py-0.5 transition ${
                  presentGroups.has(letter)
                    ? 'text-[#2D8FCC] hover:bg-[#EBF5FB] hover:text-[#0B6FA0]'
                    : 'cursor-default text-[#C0CEDF]'
                }`}
              >
                {letter}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Brand sections */}
      <div className="container-main py-10 space-y-12">
        {groups.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <Package className="h-10 w-10 text-[#C0CEDF]" />
            <p className="font-body text-body text-[#8094B4]">No hay marcas cargadas aún.</p>
          </div>
        )}

        {groups.map((letter) => (
          <section
            key={letter}
            ref={(el) => { sectionRefs.current[letter] = el; }}
            id={`section-${letter}`}
          >
            <div className="mb-5 flex items-center gap-4">
              <h2 className="font-display text-2xl font-bold uppercase text-[#0B1120]">{letter}</h2>
              <div className="h-[2px] flex-1 bg-gradient-to-r from-[#2D8FCC]/30 to-transparent" />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {grouped[letter].map((brand) => (
                <Link
                  key={brand.name}
                  href={`/tienda?marca=${encodeURIComponent(brand.name)}`}
                  className="group flex flex-col items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-[#2D8FCC]/40 hover:shadow-md"
                >
                  <div className={`flex h-14 w-14 items-center justify-center rounded-xl border text-xl font-bold ${brandColor(brand.name)}`}>
                    {brand.name.trim()[0]?.toUpperCase() ?? '?'}
                  </div>
                  <div>
                    <p className="font-body text-sm font-semibold text-[#0B1120] group-hover:text-[#2D8FCC] leading-tight">
                      {brand.name}
                    </p>
                    <p className="mt-0.5 font-body text-xs text-[#8094B4]">
                      {brand.count} {brand.count === 1 ? 'producto' : 'productos'}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
