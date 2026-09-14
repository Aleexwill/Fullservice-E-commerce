export const siteConfig = {
  name: 'Full Service & Clean',
  shortName: 'FS&C',
  description:
    'Soluciones integrales de mantenimiento, limpieza, construcción civil, metalúrgica y ferretería online. Presupuesto claro, seguimiento del trabajo y garantía.',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
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
    facebook: 'https://facebook.com/fullserviceclean',
    instagram: 'https://instagram.com/fullserviceclean',
    linkedin: 'https://linkedin.com/company/fullserviceclean',
  },
  openingHours: 'Lun-Vie 08:00-18:00, Sáb 08:00-13:00',
};
