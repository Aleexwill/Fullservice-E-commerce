'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { MeDTO } from '@/lib/marcacion/shared';

interface Props { chip?: { texto: string; tono: 'b' | 'o' | 'g' | 'r' | '' }; titulo?: string }

/** Cabecera común: logo, usuario, estado y navegación. Los enlaces dependen de los permisos del usuario. */
export function MarcacionHeader({ chip, titulo }: Props) {
  const path = usePathname();
  const router = useRouter();
  const [me, setMe] = useState<MeDTO | null>(null);
  useEffect(() => { fetch('/api/marcacion/me', { cache: 'no-store' }).then(r => (r.ok ? r.json() : null)).then(setMe).catch(() => {}); }, []);
  async function salir() {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    router.replace('/marcacion/login');
  }
  const link = (href: string, label: string) => <Link key={href} href={href} aria-current={path === href ? 'page' : undefined}>{label}</Link>;
  return (
    <>
      <div className="mc-bar">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/marcacion/isotipo.png" alt="Full Service" />
        <div className="mc-who"><b>{me?.name ?? ' '}</b><span>{titulo ?? me?.rol ?? ' '}</span></div>
        {chip && <span className={`mc-chip ${chip.tono}`}>{chip.texto}</span>}
      </div>
      <nav className="mc-nav" aria-label="Secciones">
        {link('/marcacion', 'Mi jornada')}
        {link('/marcacion/ausencias', 'Ausencias')}
        {me?.aprueba && link('/marcacion/aprobaciones', 'Aprobaciones')}
        {me?.reportes && link('/marcacion/reportes', 'Reportes')}
        {me?.administra && link('/marcacion/parametros', 'Parámetros')}
        {me?.administra && link('/marcacion/sitios', 'Sitios')}
        <button onClick={salir}>Salir</button>
      </nav>
    </>
  );
}
