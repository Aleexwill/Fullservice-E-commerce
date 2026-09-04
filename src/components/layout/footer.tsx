import Link from 'next/link';
import Image from 'next/image';
import { Phone, Mail, MapPin, Clock, Facebook, Instagram, Linkedin, ArrowUpRight } from 'lucide-react';
import { siteConfig } from '@/config/site';
import type { SiteSettings } from '@/lib/settings-store';

const footerLinks = {
  servicios: [
    { label: 'Mantenimiento general', href: '/servicios' }, { label: 'Limpieza profesional', href: '/servicios' }, { label: 'Construcción civil', href: '/servicios' }, { label: 'Pedir presupuesto', href: '/contacto?tipo=presupuesto' },
  ],
  tienda: [
    { label: 'Herramientas', href: '/tienda' }, { label: 'Electricidad', href: '/tienda' }, { label: 'Plomería', href: '/tienda' }, { label: 'Productos de limpieza', href: '/tienda' },
  ],
  empresa: [
    { label: 'Portfolio', href: '/portfolio' }, { label: 'Contacto', href: '/contacto' }, { label: 'Privacidad', href: '/privacidad' }, { label: 'Términos', href: '/terminos' },
  ],
};

export function Footer({ settings }: { settings?: SiteSettings }) {
  const description = settings?.general.siteDescription || siteConfig.description;
  const social = { facebook: settings?.social.facebook || siteConfig.social.facebook, instagram: settings?.social.instagram || siteConfig.social.instagram, linkedin: settings?.social.linkedin || siteConfig.social.linkedin };
  const address = settings?.contact.address ? `${settings.contact.address}, ${settings.contact.city}` : `${siteConfig.address.street}, ${siteConfig.address.city}`;
  const phone = settings?.contact.phone || siteConfig.phone;
  const email = settings?.contact.email || siteConfig.email;
  const openingHours = settings?.business.openingHours.weekdays || siteConfig.openingHours;
  const siteName = settings?.general.siteName || siteConfig.name;
  const secondary = 'text-[#9AAAC0]';

  return (
    <footer className="border-t border-white/10 bg-[#080D18]">
      <div className="container-main py-10 sm:py-14 md:py-16">
        <div className="mb-10 grid gap-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6 md:mb-12 md:grid-cols-[1.4fr_.8fr] md:p-8">
          <div>
            <span className="font-body text-[0.68rem] font-bold uppercase tracking-[.14em] text-[#6FC3F5]">¿Hablamos?</span>
            <h2 className="mt-2 max-w-xl font-display text-h2 uppercase text-white">Llevemos tu proyecto al siguiente nivel.</h2>
            <p className="mt-3 max-w-xl font-body text-body text-[#B7C5D9]">Cuéntanos qué necesitas y te ayudamos a encontrar la solución adecuada.</p>
          </div>
          <div className="flex items-center md:justify-end"><Link href="/contacto" className="btn-primary w-full justify-center sm:w-auto">Contactar <ArrowUpRight className="h-4 w-4" /></Link></div>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1.2fr] lg:gap-10">
          <div>
            <Link href="/" className="inline-flex rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6FC3F5]" aria-label="Full Service & Clean — inicio"><Image src="/logo.png" alt="Full Service & Clean" width={190} height={76} className="h-auto w-[150px] object-contain" /></Link>
            <p className="mt-5 max-w-sm font-body text-body-sm leading-relaxed text-[#9AAAC0]">{description}</p>
            <div className="mt-5 flex gap-2">{[
              { href: social.facebook, label: 'Facebook', icon: Facebook }, { href: social.instagram, label: 'Instagram', icon: Instagram }, { href: social.linkedin, label: 'LinkedIn', icon: Linkedin },
            ].map(({ href, label, icon: Icon }) => <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="rounded-lg border border-white/15 p-2.5 text-[#B7C5D9] transition hover:border-[#6FC3F5]/60 hover:bg-white/5 hover:text-white focus:outline-none focus:ring-2 focus:ring-[#6FC3F5]"><Icon className="h-4 w-4" /></a>)}</div>
          </div>

          <div><h3 className="mb-4 font-body text-xs font-bold uppercase tracking-[.12em] text-white">Servicios</h3><ul className="space-y-2.5">{footerLinks.servicios.map((link) => <li key={link.label}><Link href={link.href} className={`font-body text-body-sm ${secondary} transition hover:text-white`}>{link.label}</Link></li>)}</ul></div>
          <div><h3 className="mb-4 font-body text-xs font-bold uppercase tracking-[.12em] text-white">Tienda & empresa</h3><ul className="space-y-2.5">{[...footerLinks.tienda.slice(0, 2), ...footerLinks.empresa].map((link) => <li key={link.label}><Link href={link.href} className={`font-body text-body-sm ${secondary} transition hover:text-white`}>{link.label}</Link></li>)}</ul></div>
          <div><h3 className="mb-4 font-body text-xs font-bold uppercase tracking-[.12em] text-white">Contacto</h3><ul className="space-y-3.5">
            <li className={`flex items-start gap-2.5 font-body text-body-sm ${secondary}`}><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#6FC3F5]" /><span>{address}</span></li>
            <li className={`flex items-center gap-2.5 font-body text-body-sm ${secondary}`}><Phone className="h-4 w-4 shrink-0 text-[#6FC3F5]" /><a href={`tel:${phone}`} className="break-all hover:text-white">{phone}</a></li>
            <li className={`flex items-center gap-2.5 font-body text-body-sm ${secondary}`}><Mail className="h-4 w-4 shrink-0 text-[#6FC3F5]" /><a href={`mailto:${email}`} className="break-all hover:text-white">{email}</a></li>
            <li className={`flex items-start gap-2.5 font-body text-body-sm ${secondary}`}><Clock className="mt-0.5 h-4 w-4 shrink-0 text-[#6FC3F5]" /><span>{openingHours}</span></li>
          </ul></div>
        </div>
      </div>

      <div className="border-t border-white/10"><div className="container-main flex flex-col items-center justify-between gap-3 py-5 text-center sm:flex-row sm:text-left">
        <p className="font-mono text-[0.7rem] text-[#9AAAC0]">© {new Date().getFullYear()} {siteName}. Todos los derechos reservados.</p>
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-2"><Link href="/privacidad" className="font-body text-[0.75rem] text-[#9AAAC0] hover:text-white">Privacidad</Link><Link href="/terminos" className="font-body text-[0.75rem] text-[#9AAAC0] hover:text-white">Términos</Link></div>
      </div></div>
    </footer>
  );
}
