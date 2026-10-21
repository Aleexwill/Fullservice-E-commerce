'use client';

import { useState } from 'react';
import { Wrench, HardHat, Factory, Zap, Droplets, Paintbrush, ShieldCheck, Thermometer } from 'lucide-react';

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

  return (
    <div
      className="h-[220px] cursor-pointer select-none"
      style={{ perspective: '1200px' }}
      onMouseEnter={() => setFlipped(true)}
      onMouseLeave={() => setFlipped(false)}
      onClick={() => setFlipped(f => !f)}
    >
      <div
        className="relative h-full w-full"
        style={{
          transformStyle: 'preserve-3d',
          transition: 'transform 0.5s cubic-bezier(0.4, 0.2, 0.2, 1)',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        {/* FRENTE */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-xl border border-gray-100 bg-white px-5 shadow-sm"
          style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' } as React.CSSProperties}
        >
          <div
            className="flex h-11 w-11 items-center justify-center rounded-xl"
            style={{ backgroundColor: color.bg, color: color.text }}
          >
            <Icon className="h-5 w-5" />
          </div>
          <h3 className="text-center font-display text-[0.85rem] font-semibold leading-tight text-[#0B1120]">
            {service.title}
          </h3>
          <span
            className="rounded-full px-2.5 py-0.5 font-body text-[0.6rem] font-semibold uppercase tracking-wider"
            style={{ backgroundColor: color.bg, color: color.text }}
          >
            {categoryLabel}
          </span>
        </div>

        {/* DORSO */}
        <div
          className="absolute inset-0 flex flex-col rounded-xl bg-[#0B1120] px-5 py-5 shadow-sm"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          } as React.CSSProperties}
        >
          <div className="mb-3 h-px w-8 rounded-full" style={{ backgroundColor: color.text }} />
          <h3 className="font-display text-[0.85rem] font-bold leading-tight text-white">{service.title}</h3>
          <p className="mt-2 flex-1 font-body text-[0.72rem] leading-relaxed text-white/65">{service.description}</p>
        </div>
      </div>
    </div>
  );
}

export function ServiceFlipGrid({ services }: { services: ServiceItem[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4">
      {services.map(service => (
        <FlipCard key={service.id} service={service} />
      ))}
    </div>
  );
}
