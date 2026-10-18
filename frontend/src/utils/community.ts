// UV3 Platform — utilidades del directorio y la agenda de la comunidad

import type { CommunityEventCategory, CommunityServiceCategory } from '@/types';

export const SERVICE_CATEGORY_LABEL: Record<CommunityServiceCategory, string> = {
  salud: 'Salud',
  seguridad: 'Seguridad',
  religioso: 'Religioso',
  social: 'Social',
  deporte: 'Deportes',
  abasto: 'Abastos',
  educacion: 'Educación',
  municipal: 'Municipal',
  otro: 'Servicio',
};

export const EVENT_CATEGORY_LABEL: Record<CommunityEventCategory, string> = {
  asamblea: 'Asamblea',
  deporte: 'Deportes',
  salud: 'Salud',
  social: 'Social',
  religioso: 'Religioso',
  mantenimiento: 'Mantenimiento',
  otro: 'Actividad',
};

/** Color de etiqueta por categoría de evento (clases Tailwind). */
export const EVENT_CATEGORY_STYLE: Record<CommunityEventCategory, string> = {
  asamblea: 'bg-uv3-green/10 text-uv3-green-dark',
  deporte: 'bg-uv3-gold/20 text-uv3-green-dark',
  salud: 'bg-sky-100 text-sky-800',
  social: 'bg-fuchsia-100 text-fuchsia-800',
  religioso: 'bg-indigo-100 text-indigo-800',
  mantenimiento: 'bg-amber-100 text-amber-800',
  otro: 'bg-stone-200 text-stone-700',
};

const LIMA_TZ = 'America/Lima';

/** "2026-03-14" → "sáb 14 mar" (en hora de Lima). */
export function formatEventDate(date: string): string {
  const d = new Date(`${date}T12:00:00-05:00`);
  return d
    .toLocaleDateString('es-PE', { weekday: 'short', day: 'numeric', month: 'short', timeZone: LIMA_TZ })
    .replace('.', '');
}

/** "18:00" / "18:00:00" → "18:00". */
export function shortTime(value: string | null | undefined): string {
  if (!value) return '';
  return value.slice(0, 5);
}
