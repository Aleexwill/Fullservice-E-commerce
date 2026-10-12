import Link from 'next/link';
import { ChevronRight, Banknote, CreditCard, Wallet, Phone, Copy, CheckCircle2 } from 'lucide-react';
import { getSettings } from '@/lib/settings-store';
import { siteConfig } from '@/config/site';
import { PayCopyButton } from './pay-copy-button';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: '¿Cómo y cuándo pago? — Full Service & Clean',
  description: 'Conocé todos los métodos de pago aceptados y los datos para transferencias bancarias.',
};

export default async function PagosPage() {
  const settings = await getSettings();
  const payment = settings.payment;
  const phone = settings.contact.phone || siteConfig.phone;
  const whatsapp = settings.contact.whatsapp || siteConfig.whatsapp;

  const hasBankData = payment.bankName || payment.accountHolder || payment.accountNumber;

  return (
    <>
      {/* Breadcrumb */}
      <div className="border-b border-gray-200">
        <div className="container-main flex items-center gap-2 py-3 font-body text-caption text-[#8094B4]">
          <Link href="/" className="hover:text-[#0B1120]">Inicio</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/tienda" className="hover:text-[#0B1120]">Tienda</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-[#0B1120]">¿Cómo y cuándo pago?</span>
        </div>
      </div>

      {/* Hero */}
      <section className="border-b border-gray-200 bg-white py-10">
        <div className="container-main">
          <span className="overline mb-2 block">Pagos y cobertura</span>
          <h1 className="font-display text-h1 uppercase text-[#0B1120]">¿Cómo y cuándo pago?</h1>
          <div className="mt-4 h-[3px] w-12 rounded-sm bg-gradient-to-r from-blue to-orange" />
          <p className="mt-4 max-w-lg font-body text-body text-[#4A5E80]">
            Ofrecemos distintas formas de pago según tu ubicación para que tu compra sea simple y segura.
          </p>
        </div>
      </section>

      <section className="container-main py-12 space-y-6">

        {/* Banner */}
        <div className="rounded-xl bg-gradient-to-r from-[#0B1120] to-[#1a2740] px-6 py-4 text-center">
          <p className="font-display text-base font-bold uppercase tracking-widest text-white">
            Métodos de Pago y Cobertura
          </p>
        </div>

        {/* Zone 1 — Asunción */}
        <div className="rounded-xl border border-[#2D8FCC]/25 bg-[#F4F9FF] p-6">
          <h2 className="mb-4 font-display text-base font-bold uppercase tracking-wide text-[#2D8FCC]">
            Asunción y Alrededores
          </h2>
          <p className="mb-3 font-body text-sm font-semibold text-[#0B1120]">Podés pagar con:</p>
          <ul className="space-y-2.5">
            {payment.bankTransferEnabled && (
              <li className="flex items-start gap-2 font-body text-sm text-[#4A5E80]">
                <Banknote className="mt-0.5 h-4 w-4 shrink-0 text-[#2D8FCC]" />
                <span>Transferencia Bancaria o Depósito Bancario.</span>
              </li>
            )}
            <li className="flex items-start gap-2 font-body text-sm text-[#4A5E80]">
              <CreditCard className="mt-0.5 h-4 w-4 shrink-0 text-[#2D8FCC]" />
              <span>Tarjeta de Crédito o Débito <em className="text-[#8094B4]">(te llevamos el POS)</em>.</span>
            </li>
            {payment.cashOnDeliveryEnabled && (
              <li className="flex items-start gap-2 font-body text-sm text-[#4A5E80]">
                <Wallet className="mt-0.5 h-4 w-4 shrink-0 text-[#2D8FCC]" />
                <span>Efectivo <em className="text-[#8094B4]">(solo guaraníes)</em>.</span>
              </li>
            )}
          </ul>
        </div>

        {/* Zone 2 — Interior */}
        <div className="rounded-xl border border-gray-200 bg-[#F8FAFC] p-6">
          <h2 className="mb-4 font-display text-base font-bold uppercase tracking-wide text-[#2D8FCC]">
            Interior del País
          </h2>
          <p className="mb-3 font-body text-sm font-semibold text-[#0B1120]">Podés pagar con:</p>
          <ul className="space-y-2.5">
            {payment.bankTransferEnabled && (
              <li className="flex items-start gap-2 font-body text-sm text-[#4A5E80]">
                <Banknote className="mt-0.5 h-4 w-4 shrink-0 text-[#2D8FCC]" />
                <span>Transferencia Bancaria o Depósito Bancario.</span>
              </li>
            )}
          </ul>
        </div>

        {/* Bank data */}
        {payment.bankTransferEnabled && hasBankData && (
          <div className="rounded-xl border-2 border-[#2D8FCC]/40 bg-white p-6">
            <h2 className="mb-4 font-display text-base font-bold text-[#2D8FCC]">
              Datos para Transferencias y Depósitos Bancarios:
            </h2>
            <div className="h-px bg-gray-100 mb-4" />
            <dl className="space-y-2.5">
              {payment.bankName && (
                <div className="flex items-center gap-2">
                  <dt className="w-36 shrink-0 font-body text-sm text-[#4A5E80]">Banco:</dt>
                  <dd className="font-body text-sm font-medium text-[#0B1120]">{payment.bankName}</dd>
                </div>
              )}
              {payment.accountNumber && (
                <div className="flex items-center gap-2">
                  <dt className="w-36 shrink-0 font-body text-sm text-[#4A5E80]">Cuenta N°:</dt>
                  <dd className="flex items-center gap-2 font-body text-sm font-bold text-[#0B1120]">
                    {payment.accountNumber}
                    <PayCopyButton text={payment.accountNumber} />
                  </dd>
                </div>
              )}
              {payment.accountType && (
                <div className="flex items-center gap-2">
                  <dt className="w-36 shrink-0 font-body text-sm text-[#4A5E80]">Tipo de cuenta:</dt>
                  <dd className="font-body text-sm text-[#0B1120]">{payment.accountType}</dd>
                </div>
              )}
              {payment.accountHolder && (
                <div className="flex items-center gap-2">
                  <dt className="w-36 shrink-0 font-body text-sm text-[#4A5E80]">Titular:</dt>
                  <dd className="font-body text-sm text-[#0B1120]">{payment.accountHolder}</dd>
                </div>
              )}
            </dl>
            {payment.qrImageUrl && (
              <div className="mt-5 flex justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={payment.qrImageUrl} alt="QR de pago" className="h-36 w-36 object-contain rounded-lg border border-gray-200" />
              </div>
            )}
          </div>
        )}

        {/* Instructions / interior note */}
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
          <p className="font-body text-sm text-emerald-800">
            <strong>Para el interior del país:</strong>{' '}
            {payment.instructions ||
              `Aguardamos que nos confirmes el pago al ${phone} (solo WhatsApp) para preparar tu pedido y enviártelo.`}
          </p>
        </div>

        {/* Contact strip */}
        <div className="flex flex-wrap items-center gap-4 rounded-xl border border-gray-200 bg-white p-5">
          <Phone className="h-5 w-5 shrink-0 text-[#2D8FCC]" />
          <div className="flex-1 min-w-0">
            <p className="font-body text-sm font-medium text-[#0B1120]">¿Tenés dudas sobre cómo pagar?</p>
            <p className="font-body text-sm text-[#4A5E80]">Escribinos por WhatsApp y te ayudamos.</p>
          </div>
          <a
            href={`https://wa.me/${whatsapp.replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary text-sm"
          >
            <Phone className="h-4 w-4" />
            {phone}
          </a>
        </div>

      </section>
    </>
  );
}
