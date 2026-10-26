export const siteConfig = {
  name: 'Full Service & Clean',
  shortName: 'FS&C',
  description:
    'Soluciones integrales de mantenimiento, limpieza, construcción civil, metalúrgica y ferretería online. Presupuesto claro, seguimiento del trabajo y garantía.',
  url: (process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://fullservice.com.py').replace(/\\/+$/, ''),
  ogImage: '/og-image.jpg',
  phone: '+595 971 528800',
  email: 'info@fullservice.com.py',
  whatsapp: process.env.WHATSAPP_PHONE || '+595971528800',
  address: {
    street: 'Ysapy casi Yasy',
    city: 'Lambaré',
    state: 'Central',
    zip: '',
    country: 'PY',
  },
  social: {
    facebook: '',
    instagram: '',
    linkedin: '',
  },
  openingHours: 'Lun-Vie 08:00-18:00, Sáb 08:00-13:00',
};
