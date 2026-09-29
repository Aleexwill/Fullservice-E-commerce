'use client';

import { useEffect } from 'react';
import { siteConfig } from '@/config/site';

declare global {
  interface Window {
    FSC_ASSISTANT_CONFIG?: Record<string, unknown>;
    FSCAssistant?: { open: () => void; close: () => void; toggle: () => void; destroy: () => void };
  }
}

export function BotyAssistant() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (document.querySelector('script[data-fsc-assistant]')) return;

    window.FSC_ASSISTANT_CONFIG = {
      businessName: 'Full Service & Clean',
      botName: 'Boty',
      whatsapp: siteConfig.whatsapp,
      hours: 'Lun–Vie 8:00–18:00 · Sáb 8:00–13:00',
      address: 'Asunción, Paraguay',
      position: 'right',
      demo: false,
      autoGreet: false,
      avatar: '/logo.png',
    };

    const script = document.createElement('script');
    script.src = '/fsc-assistant.js';
    script.setAttribute('data-fsc-assistant', '1');
    document.body.appendChild(script);

    return () => {
      window.FSCAssistant?.destroy?.();
      script.remove();
    };
  }, []);

  return null;
}
