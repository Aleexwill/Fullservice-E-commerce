'use client';

import { Wrench, HardHat, Factory, Zap, Droplets, Paintbrush, ShieldCheck, Thermometer } from 'lucide-react';

const ICON_MAP: Record<string, any> = { Zap, Droplets, Paintbrush, Wrench, HardHat, Factory, ShieldCheck, Thermometer };

interface ServiceItem {
  id: string;
  icon: string;
  title: string;
  description: string;
  category: string;
}

function ServiceCard({ service, index }: { service: ServiceItem; index: number }) {
  const Icon = ICON_MAP[service.icon] || Wrench;
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-center gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#E8862B] font-body text-[0.7rem] font-bold text-white">
          {index + 1}
        </span>
        <Icon className="h-5 w-5 shrink-0 text-[#E8862B]" />
      </div>
      <h3 className="font-display text-[0.8rem] font-bold uppercase leading-snug tracking-wide text-[#0B1120]">
        {service.title}
      </h3>
      <p className="font-body text-[0.72rem] leading-relaxed text-[#4A5E80]">
        {service.description}
      </p>
    </div>
  );
}

export function ServiceFlipGrid({ services }: { services: ServiceItem[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4">
      {services.map((service, i) => (
        <ServiceCard key={service.id} service={service} index={i} />
      ))}
    </div>
  );
}
