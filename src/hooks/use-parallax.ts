'use client';

import { useEffect } from 'react';

export function useParallax(selector: string, yPercent = 25) {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let gsapInstance: any;
    let scrollTriggerInstance: any;
    const triggers: any[] = [];

    import('gsap').then(({ gsap }) => {
      import('gsap/ScrollTrigger').then(({ ScrollTrigger }) => {
        gsap.registerPlugin(ScrollTrigger);
        gsapInstance = gsap;
        scrollTriggerInstance = ScrollTrigger;

        document.querySelectorAll<HTMLElement>(selector).forEach((el) => {
          gsap.fromTo(
            el,
            { yPercent: -yPercent / 2 },
            {
              yPercent: yPercent / 2,
              ease: 'none',
              scrollTrigger: {
                trigger: el.parentElement,
                start: 'top bottom',
                end: 'bottom top',
                scrub: true,
              },
            }
          );
        });

        triggers.push(...ScrollTrigger.getAll());
      });
    });

    return () => {
      triggers.forEach((t) => t.kill());
    };
  }, [selector, yPercent]);
}
