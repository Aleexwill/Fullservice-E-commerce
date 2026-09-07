'use client';

import { useEffect, useState } from 'react';
import { fetchJson } from '@/lib/utils';
import {
  Save,
  Loader2,
  Settings,
  Globe,
  Phone,
  Mail,
  MapPin,
  Share2,
  Clock,
  Bell,
  Search as SearchIcon,
  CheckCircle2,
  DollarSign,
  Truck,
  CreditCard,
  X,
  Database,
  RefreshCw,
  HardDrive,
} from 'lucide-react';

interface DbStats {
  totalBytes: number;
  version: string;
  tables: { table: string; rows: number | null }[];
  sizes: { table: string; totalBytes: number; tableBytes: number; indexBytes: number }[];
}

function formatBytes(b: number) {
  if (b < 1024) return b + ' B';
  if (b < 1024 * 1024) return (b / 1024).toFixed(1) + ' KB';
  return (b / 1024 / 1024).toFixed(2) + ' MB';
}

function DbStatsPanel() {
  const [stats, setStats] = useState<DbStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    const data = await fetchJson<DbStats>('/api/admin/db-stats');
    if (data) setStats(data);
    else setError('No se pudo obtener la información de la base de datos.');
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const TABLE_LABELS: Record<string, string> = {
    Presupuesto: 'Presupuestos', Pedido: 'Pedidos', Product: 'Productos',
    Cliente: 'Clientes', Lead: 'Leads', Service: 'Servicios',
    Portfolio: 'Portfolio', Material: 'Materiales', User: 'Usuarios',
    CarouselSlide: 'Carousel', PromoBanner: 'Banners', SiteSettings: 'Config',
  };

  return (
    <div className="card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-display text-h4 text-arctic">
          <Database className="h-4 w-4 text-blue-bright" /> Base de datos
        </h2>
        <button onClick={load} disabled={loading} className="flex items-center gap-1.5 rounded-md px-3 py-1.5 font-body text-caption text-steel-400 transition-colors hover:bg-steel-900 hover:text-arctic disabled:opacity-40">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      {error && <p className="mb-3 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 font-body text-caption text-red-400">{error}</p>}

      {stats && (
        <>
          {/* Summary row */}
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-md bg-steel-900/50 p-3">
              <p className="mb-0.5 font-body text-[0.6rem] uppercase tracking-widest text-steel-500">Tamaño total</p>
              <p className="font-display text-h4 text-arctic">{formatBytes(stats.totalBytes)}</p>
            </div>
            <div className="rounded-md bg-steel-900/50 p-3">
              <p className="mb-0.5 font-body text-[0.6rem] uppercase tracking-widest text-steel-500">Tablas</p>
              <p className="font-display text-h4 text-arctic">{stats.sizes.length}</p>
            </div>
            <div className="rounded-md bg-steel-900/50 p-3 col-span-2 sm:col-span-1">
              <p className="mb-0.5 font-body text-[0.6rem] uppercase tracking-widest text-steel-500">Motor</p>
              <p className="truncate font-body text-body-sm font-medium text-arctic">{stats.version}</p>
            </div>
          </div>

          {/* Row counts */}
          <p className="mb-2 font-body text-[0.6rem] font-semibold uppercase tracking-widest text-steel-500">Registros por tabla</p>
          <div className="mb-4 grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-3">
            {stats.tables.filter(t => t.rows !== null).map(t => (
              <div key={t.table} className="flex items-center justify-between py-1 border-b border-steel-900/40 last:border-0">
                <span className="font-body text-caption text-steel-400">{TABLE_LABELS[t.table] ?? t.table}</span>
                <span className="font-body text-caption font-semibold tabular-nums text-arctic">{t.rows?.toLocaleString('es-PY')}</span>
              </div>
            ))}
          </div>

          {/* Top tables by size */}
          <p className="mb-2 font-body text-[0.6rem] font-semibold uppercase tracking-widest text-steel-500">Tamaño por tabla</p>
          <div className="space-y-1.5">
            {stats.sizes.slice(0, 8).map(s => {
              const pct = stats.totalBytes > 0 ? (s.totalBytes / stats.totalBytes) * 100 : 0;
              return (
                <div key={s.table}>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-body text-caption text-steel-400">{TABLE_LABELS[s.table] ?? s.table}</span>
                    <span className="font-body text-[0.6rem] tabular-nums text-steel-500">{formatBytes(s.totalBytes)}</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-steel-900">
                    <div className="h-full rounded-full bg-blue-bright/60 transition-all" style={{ width: `${Math.max(pct, 0.5)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {loading && !stats && (
        <div className="flex items-center justify-center gap-2 py-8 text-steel-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="font-body text-caption">Consultando base de datos…</span>
        </div>
      )}
    </div>
  );
}

interface SiteSettings {
  general: { siteName: string; siteDescription: string; siteUrl: string; logo: string };
  contact: { phone: string; email: string; address: string; city: string; whatsapp: string; mapUrl: string };
  social: { facebook: string; instagram: string; linkedin: string; youtube: string; tiktok: string };
  business: { openingHours: { weekdays: string; saturday: string; sunday: string }; currency: string; taxRate: number; shippingBase: number; freeShippingThreshold: number };
  notifications: { emailOnNewOrder: boolean; emailOnNewLead: boolean; whatsappOnNewOrder: boolean; adminEmail: string };
  seo: { metaTitle: string; metaDescription: string; ogImage: string; googleAnalyticsId: string; metaPixelId: string };
  payment: {
    gatewayEnabled: boolean;
    bankTransferEnabled: boolean;
    cashOnDeliveryEnabled: boolean;
    bankName: string;
    accountHolder: string;
    accountNumber: string;
    accountType: string;
    qrImageUrl: string;
    instructions: string;
  };
}

export default function AdminConfigPage() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    fetchJson<SiteSettings>('/api/config').then((d) => { setSettings(d); setLoading(false); });
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true); setError(''); setSaved(false);
    try {
      const res = await fetch('/api/config', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings) });
      if (!res.ok) throw new Error('Error al guardar');
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  const update = (section: keyof SiteSettings, field: string, value: any) => {
    if (!settings) return;
    setSettings({ ...settings, [section]: { ...settings[section], [field]: value } });
    setSaved(false);
  };

  const updateNested = (section: keyof SiteSettings, parent: string, field: string, value: any) => {
    if (!settings) return;
    const sec = settings[section] as any;
    setSettings({ ...settings, [section]: { ...sec, [parent]: { ...sec[parent], [field]: value } } });
    setSaved(false);
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Globe },
    { id: 'contact', label: 'Contacto', icon: Phone },
    { id: 'social', label: 'Redes sociales', icon: Share2 },
    { id: 'business', label: 'Negocio', icon: DollarSign },
    { id: 'payment', label: 'Pagos', icon: CreditCard },
    { id: 'notifications', label: 'Notificaciones', icon: Bell },
    { id: 'seo', label: 'SEO', icon: SearchIcon },
  ];

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <h1 className="mb-6 font-display text-h1 uppercase text-arctic">Configuracion</h1>
        <div className="card animate-pulse p-6"><div className="space-y-4">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-12 rounded bg-steel-900" />)}</div></div>
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-h1 uppercase text-arctic">Configuracion</h1>
          <p className="mt-1 font-body text-body-sm text-steel-300">Ajustes generales del sitio</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-primary gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {saving ? 'Guardando...' : saved ? 'Guardado!' : 'Guardar cambios'}
        </button>
      </div>

      {error && <div className="alert-danger mb-4"><X className="h-4 w-4 shrink-0" />{error}</div>}
      {saved && <div className="alert-success mb-4"><CheckCircle2 className="h-4 w-4 shrink-0" />Configuracion guardada correctamente</div>}

      <div className="flex gap-6">
        {/* Tabs sidebar */}
        <div className="hidden w-48 shrink-0 space-y-1 lg:block">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex w-full items-center gap-2 rounded-md px-3 py-2.5 font-body text-body-sm transition-all ${activeTab === tab.id ? 'bg-blue-muted text-blue-bright font-medium' : 'text-steel-300 hover:bg-steel-900 hover:text-arctic'}`}
              >
                <Icon className="h-4 w-4 shrink-0" />{tab.label}
              </button>
            );
          })}
        </div>

        {/* Mobile tabs */}
        <div className="mb-4 flex gap-1 overflow-x-auto lg:hidden">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`shrink-0 rounded-md px-3 py-2 font-body text-caption ${activeTab === tab.id ? 'bg-blue-muted text-blue-bright' : 'text-steel-500'}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1">
          {/* General */}
          {activeTab === 'general' && (
            <div className="card p-6">
              <h2 className="mb-4 flex items-center gap-2 border-b border-steel-900/40 pb-4 font-display text-h3 text-arctic"><Globe className="h-5 w-5 text-blue-bright" /> Informacion general</h2>
              <div className="space-y-4">
                <Field label="Nombre del sitio" value={settings.general.siteName} onChange={(v) => update('general', 'siteName', v)} />
                <Field label="Descripcion" value={settings.general.siteDescription} onChange={(v) => update('general', 'siteDescription', v)} />
                <Field label="URL del sitio" value={settings.general.siteUrl} onChange={(v) => update('general', 'siteUrl', v)} />
                <Field label="URL del logo" value={settings.general.logo} onChange={(v) => update('general', 'logo', v)} placeholder="https://..." />
              </div>
            </div>
          )}

          {/* Contact */}
          {activeTab === 'contact' && (
            <div className="card p-6">
              <h2 className="mb-4 flex items-center gap-2 border-b border-steel-900/40 pb-4 font-display text-h3 text-arctic"><Phone className="h-5 w-5 text-blue-bright" /> Datos de contacto</h2>
              <div className="space-y-4">
                <Field label="Telefono" value={settings.contact.phone} onChange={(v) => update('contact', 'phone', v)} />
                <Field label="Email" value={settings.contact.email} onChange={(v) => update('contact', 'email', v)} />
                <Field label="WhatsApp" value={settings.contact.whatsapp} onChange={(v) => update('contact', 'whatsapp', v)} />
                <Field label="Direccion" value={settings.contact.address} onChange={(v) => update('contact', 'address', v)} />
                <Field label="Ciudad" value={settings.contact.city} onChange={(v) => update('contact', 'city', v)} />
                <Field label="URL Google Maps" value={settings.contact.mapUrl} onChange={(v) => update('contact', 'mapUrl', v)} placeholder="https://maps.google.com/..." />
              </div>
            </div>
          )}

          {/* Social */}
          {activeTab === 'social' && (
            <div className="card p-6">
              <h2 className="mb-4 flex items-center gap-2 border-b border-steel-900/40 pb-4 font-display text-h3 text-arctic"><Share2 className="h-5 w-5 text-blue-bright" /> Redes sociales</h2>
              <div className="space-y-4">
                <Field label="Facebook" value={settings.social.facebook} onChange={(v) => update('social', 'facebook', v)} placeholder="https://facebook.com/..." />
                <Field label="Instagram" value={settings.social.instagram} onChange={(v) => update('social', 'instagram', v)} placeholder="https://instagram.com/..." />
                <Field label="LinkedIn" value={settings.social.linkedin} onChange={(v) => update('social', 'linkedin', v)} placeholder="https://linkedin.com/..." />
                <Field label="YouTube" value={settings.social.youtube} onChange={(v) => update('social', 'youtube', v)} placeholder="https://youtube.com/..." />
                <Field label="TikTok" value={settings.social.tiktok} onChange={(v) => update('social', 'tiktok', v)} placeholder="https://tiktok.com/..." />
              </div>
            </div>
          )}

          {/* Business */}
          {activeTab === 'business' && (
            <div className="card p-6">
              <h2 className="mb-4 flex items-center gap-2 border-b border-steel-900/40 pb-4 font-display text-h3 text-arctic"><DollarSign className="h-5 w-5 text-success-bright" /> Configuracion de negocio</h2>
              <div className="space-y-4">
                <h3 className="flex items-center gap-2 font-display text-h4 text-arctic"><Clock className="h-4 w-4 text-steel-300" /> Horarios de atencion</h3>
                <Field label="Lunes a Viernes" value={settings.business.openingHours.weekdays} onChange={(v) => updateNested('business', 'openingHours', 'weekdays', v)} />
                <Field label="Sabados" value={settings.business.openingHours.saturday} onChange={(v) => updateNested('business', 'openingHours', 'saturday', v)} />
                <Field label="Domingos" value={settings.business.openingHours.sunday} onChange={(v) => updateNested('business', 'openingHours', 'sunday', v)} />
                <div className="border-t border-steel-900/30 pt-4" />
                <h3 className="flex items-center gap-2 font-display text-h4 text-arctic"><Truck className="h-4 w-4 text-steel-300" /> Envios y pagos</h3>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="IVA (%)" value={settings.business.taxRate.toString()} onChange={(v) => update('business', 'taxRate', Number(v))} type="number" />
                  <Field label="Costo envio base (Gs.)" value={settings.business.shippingBase.toString()} onChange={(v) => update('business', 'shippingBase', Number(v))} type="number" />
                  <Field label="Envio gratis desde (Gs.)" value={settings.business.freeShippingThreshold.toString()} onChange={(v) => update('business', 'freeShippingThreshold', Number(v))} type="number" />
                  <Field label="Moneda" value={settings.business.currency} onChange={(v) => update('business', 'currency', v)} />
                </div>
              </div>
            </div>
          )}

          {/* Payment */}
          {activeTab === 'payment' && (
            <div className="card p-6">
              <h2 className="mb-4 flex items-center gap-2 border-b border-steel-900/40 pb-4 font-display text-h3 text-arctic"><CreditCard className="h-5 w-5 text-blue-bright" /> Metodos de pago</h2>
              <div className="space-y-4">
                <Toggle label="Transferencia bancaria (QR)" checked={settings.payment.bankTransferEnabled} onChange={(v) => update('payment', 'bankTransferEnabled', v)} />
                <Toggle label="Efectivo contra entrega" checked={settings.payment.cashOnDeliveryEnabled} onChange={(v) => update('payment', 'cashOnDeliveryEnabled', v)} />
                <Toggle label="Pasarela de pago online (proximamente)" checked={settings.payment.gatewayEnabled} onChange={(v) => update('payment', 'gatewayEnabled', v)} />
                <div className="border-t border-steel-900/30 pt-4" />
                <h3 className="font-display text-h4 text-arctic">Datos para transferencia</h3>
                <Field label="Banco" value={settings.payment.bankName} onChange={(v) => update('payment', 'bankName', v)} />
                <Field label="Titular de la cuenta" value={settings.payment.accountHolder} onChange={(v) => update('payment', 'accountHolder', v)} />
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Numero de cuenta" value={settings.payment.accountNumber} onChange={(v) => update('payment', 'accountNumber', v)} />
                  <Field label="Tipo de cuenta" value={settings.payment.accountType} onChange={(v) => update('payment', 'accountType', v)} placeholder="Ahorro / Corriente" />
                </div>
                <Field label="URL de imagen QR" value={settings.payment.qrImageUrl} onChange={(v) => update('payment', 'qrImageUrl', v)} placeholder="https://..." />
                <div>
                  <label className="label mb-1.5 block">Instrucciones para el cliente</label>
                  <textarea
                    value={settings.payment.instructions}
                    onChange={(e) => update('payment', 'instructions', e.target.value)}
                    className="input min-h-[80px] resize-y"
                    rows={3}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Notifications */}
          {activeTab === 'notifications' && (
            <div className="card p-6">
              <h2 className="mb-4 flex items-center gap-2 border-b border-steel-900/40 pb-4 font-display text-h3 text-arctic"><Bell className="h-5 w-5 text-yellow-bright" /> Notificaciones</h2>
              <div className="space-y-4">
                <Field label="Email del administrador" value={settings.notifications.adminEmail} onChange={(v) => update('notifications', 'adminEmail', v)} />
                <Toggle label="Email al recibir nuevo pedido" checked={settings.notifications.emailOnNewOrder} onChange={(v) => update('notifications', 'emailOnNewOrder', v)} />
                <Toggle label="Email al recibir nuevo lead" checked={settings.notifications.emailOnNewLead} onChange={(v) => update('notifications', 'emailOnNewLead', v)} />
                <Toggle label="WhatsApp al recibir nuevo pedido" checked={settings.notifications.whatsappOnNewOrder} onChange={(v) => update('notifications', 'whatsappOnNewOrder', v)} />
              </div>
            </div>
          )}

          {/* SEO */}
          {activeTab === 'seo' && (
            <div className="card p-6">
              <h2 className="mb-4 flex items-center gap-2 border-b border-steel-900/40 pb-4 font-display text-h3 text-arctic"><SearchIcon className="h-5 w-5 text-blue-bright" /> SEO y Analytics</h2>
              <div className="space-y-4">
                <Field label="Meta titulo" value={settings.seo.metaTitle} onChange={(v) => update('seo', 'metaTitle', v)} />
                <div>
                  <label className="label mb-1.5 block">Meta descripcion</label>
                  <textarea
                    value={settings.seo.metaDescription}
                    onChange={(e) => update('seo', 'metaDescription', e.target.value)}
                    className="input min-h-[80px] resize-y"
                    rows={3}
                  />
                  <p className="mt-1 font-mono text-[0.6rem] text-steel-700">{settings.seo.metaDescription.length}/160 caracteres</p>
                </div>
                <Field label="OG Image URL" value={settings.seo.ogImage} onChange={(v) => update('seo', 'ogImage', v)} placeholder="https://..." />
                <Field label="Google Analytics ID" value={settings.seo.googleAnalyticsId} onChange={(v) => update('seo', 'googleAnalyticsId', v)} placeholder="G-XXXXXXXXXX" />
                <Field label="Meta Pixel ID" value={settings.seo.metaPixelId} onChange={(v) => update('seo', 'metaPixelId', v)} placeholder="000000000000000" />
              </div>
            </div>
          )}

          {/* DB Stats */}
          <DbStatsPanel />
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   SUBCOMPONENTS
   ============================================================ */

function Field({ label, value, onChange, placeholder, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <div>
      <label className="label mb-1.5 block">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="input" />
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between rounded-md p-3 transition-colors hover:bg-steel-900/30">
      <span className="font-body text-body-sm text-arctic">{label}</span>
      <div className={`relative h-6 w-11 rounded-full transition-colors ${checked ? 'bg-blue' : 'bg-steel-700'}`} onClick={() => onChange(!checked)}>
        <div className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-arctic transition-transform shadow ${checked ? 'translate-x-5' : ''}`} />
      </div>
    </label>
  );
}
