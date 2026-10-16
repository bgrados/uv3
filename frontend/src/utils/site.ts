import type { BusinessCategory, SiteSettings } from '@/types';

export const DEFAULT_SETTINGS: SiteSettings = {
  id: 1,
  site_name: 'Unidad Vecinal 3',
  slogan: 'El corazón digital de la comunidad',
  logo_url: '/logo.jpg',
  favicon_url: null,
  contact_phone: null,
  whatsapp: null,
  yape_number: null,
  yape_holder: null,
  facebook_url: 'https://www.facebook.com/profile.php?id=61564444126122',
  night_start: '18:00',
  night_end: '06:00',
  updated_at: new Date(0).toISOString(),
};

export const BUSINESS_CATEGORY_LABEL: Record<BusinessCategory, string> = {
  tienda: 'Tienda',
  farmacia: 'Farmacia',
  mercado: 'Mercado',
  restaurante: 'Restaurante',
  servicio: 'Servicio',
  otro: 'Otro',
};

export const BUSINESS_CATEGORIES: BusinessCategory[] = [
  'tienda',
  'farmacia',
  'mercado',
  'restaurante',
  'servicio',
  'otro',
];

/** Enlace de WhatsApp a partir de un número (limpia todo lo que no sea dígito). */
export function whatsappLink(number: string | null | undefined, text?: string): string | null {
  if (!number) return null;
  const digits = number.replace(/\D/g, '');
  if (digits.length < 6) return null;
  const normalized = digits.startsWith('51') ? digits : `51${digits}`;
  const query = text ? `?text=${encodeURIComponent(text)}` : '';
  return `https://wa.me/${normalized}${query}`;
}
