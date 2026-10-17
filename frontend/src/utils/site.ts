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

// --- Video externo (YouTube / Facebook / Vimeo / archivo directo) ------------

export type VideoEmbed =
  | { kind: 'iframe'; src: string }
  | { kind: 'file'; src: string }
  | { kind: 'link'; src: string };

/**
 * Convierte un enlace pegado por el usuario en algo reproducible en la web.
 * Los videos NO se alojan en Supabase: sólo se guarda el enlace externo.
 * Soporta YouTube (watch/shorts/youtu.be/embed), Facebook (facebook.com/fb.watch),
 * Vimeo, archivos directos (.mp4/.webm/.ogg/.mov) y, como último recurso, un enlace.
 */
export function getVideoEmbed(raw: string | null | undefined): VideoEmbed | null {
  if (!raw) return null;
  const url = raw.trim();
  if (!url) return null;

  // YouTube
  const yt = url.match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/
  );
  if (yt) return { kind: 'iframe', src: `https://www.youtube.com/embed/${yt[1]}` };

  // Facebook (incluye fb.watch); se usa el plugin oficial de video.
  if (/(?:^|\.)(facebook\.com|fb\.watch)/i.test(url)) {
    return {
      kind: 'iframe',
      src: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false&width=560`,
    };
  }

  // Vimeo
  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) return { kind: 'iframe', src: `https://player.vimeo.com/video/${vimeo[1]}` };

  // Archivo de video directo alojado en otro servidor.
  if (/\.(mp4|webm|ogg|ogv|mov)(\?.*)?$/i.test(url)) return { kind: 'file', src: url };

  // Cualquier otro enlace: se muestra como enlace externo.
  return { kind: 'link', src: url };
}
