'use client';

import { useParallax } from '@/hooks/use-parallax';

export function ServicesParallax() {
  useParallax('.fs-service-bg', 20);
  return null;
}
