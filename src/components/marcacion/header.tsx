'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

interface Props { nombre: string; chip?: { texto: string; tono: 'b' | 'o' | 'g' | 'r' | '' }; aprueba?: boolean; administra?: boolean; rol: string }

/** Cabecera común: logo, usuario, estado y navegación entre las pantallas de la PWA. */
export function MarcacionHeader({ nombre, chip, aprueba, administra, rol }: Props) {
  const path = usePathname();
  const router = useRouter();
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
        <div className="mc-who"><b>{nombre}</b><span>{rol}</span></div>
        {chip && <span className={`mc-chip ${chip.tono}`}>{chip.texto}</span>}
      </div>
      <nav className="mc-nav" aria-label="Secciones">
        {link('/marcacion', 'Mi jornada')}
        {aprueba && link('/marcacion/aprobaciones', 'Aprobaciones')}
        {administra && link('/marcacion/sitios', 'Sitios')}
        <button onClick={salir}>Salir</button>
      </nav>
    </>
  );
}
