'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Wrench, HardHat, Factory, Zap, Droplets, Paintbrush, ShieldCheck, Thermometer, ArrowRight, RotateCw } from 'lucide-react';

const ICON_MAP: Record<string, any> = { Zap, Droplets, Paintbrush, Wrench, HardHat, Factory, ShieldCheck, Thermometer };

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  mantenimiento: { bg: '#EBF5FB', text: '#2D8FCC' },
  civil:         { bg: '#FEF3E9', text: '#E8862B' },
  metalurgica:   { bg: '#F0F0F0', text: '#4A5E80' },
  limpieza:      { bg: '#EDF7F0', text: '#2E9E5B' },
};

interface ServiceItem {
  id: string;
  icon: string;
  title: string;
  description: string;
  category: string;
}

function FlipCard({ service }: { service: ServiceItem }) {
  const [flipped, setFlipped] = useState(false);
  const Icon = ICON_MAP[service.icon] || Wrench;
  const color = CATEGORY_COLORS[service.category] || CATEGORY_COLORS.mantenimiento;
  const categoryLabel =
    service.category === 'civil' ? 'Civil' :
    service.category === 'metalurgica' ? 'Metalúrgica' :
    service.category === 'limpieza' ? 'Limpieza' : 'Mantenimiento';
  const href = service.category === 'limpieza'
    ? `/contacto?tipo=presupuesto&servicio=${encodeURIComponent(service.title)}`
    : `/servicios?categoria=${encodeURIComponent(service.category)}`;

  return (
    <div
      className="h-[300px] cursor-pointer select-none"
      style={{ perspective: '1200px' }}
      onMouseEnter={() => setFlipped(true)}
      onMouseLeave={() => setFlipped(false)}
      onClick={() => setFlipped(f => !f)}
    >
      <div
        className="relative h-full w-full"
        style={{
          transformStyle: 'preserve-3d',
          transition: 'transform 0.55s cubic-bezier(0.4, 0.2, 0.2, 1)',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        {/* FRENTE */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-2xl border border-gray-100 bg-white px-6 shadow-sm"
          style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' } as React.CSSProperties}
        >
          <div
            className="flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{ backgroundColor: color.bg, color: color.text }}
          >
            <Icon className="h-8 w-8" />
          </div>
          <h3 className="text-center font-display text-h3 leading-tight text-[#0B1120]">{service.title}</h3>
          <span
            className="rounded-full px-3 py-1 font-body text-[0.65rem] font-semibold uppercase tracking-wider"
            style={{ backgroundColor: color.bg, color: color.text }}
          >
            {categoryLabel}
          </span>
          <div className="flex items-center gap-1.5 font-body text-[0.65rem] text-[#8094B4]">
            <RotateCw className="h-3 w-3" />
            <span className="hidden md:inline">Pasá el cursor</span>
            <span className="md:hidden">Tocá para ver más</span>
          </div>
        </div>

        {/* DORSO */}
        <div
          className="absolute inset-0 flex flex-col rounded-2xl bg-[#0B1120] px-6 py-5 shadow-sm"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          } as React.CSSProperties}
        >
          <div className="mb-4 h-0.5 w-10 rounded-full" style={{ backgroundColor: color.text }} />
          <h3 className="font-display text-[1rem] font-bold leading-tight text-white">{service.title}</h3>
          <p className="mt-2 flex-1 font-body text-[0.78rem] leading-relaxed text-white/70">{service.description}</p>
          <div className="mt-4" onClick={e => e.stopPropagation()}>
            <Link
              href={href}
              className="btn-primary w-full justify-center text-sm"
            >
              {service.category === 'limpieza' ? 'Consultar' : 'Explorar servicio'}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ServiceFlipGrid({ services }: { services: ServiceItem[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {services.map(service => (
        <FlipCard key={service.id} service={service} />
      ))}
    </div>
  );
}
