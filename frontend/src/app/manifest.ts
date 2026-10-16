import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'UV3 — Unidad Vecinal 3',
    short_name: 'UV3',
    description:
      'Campeonatos, fixtures, resultados, noticias vecinales y reserva de canchas de la Unidad Vecinal 3.',
    start_url: '/',
    display: 'standalone',
    background_color: '#F5F7F2',
    theme_color: '#14833B',
    lang: 'es-PE',
    icons: [
      { src: '/icon', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/apple-icon', sizes: '180x180', type: 'image/png' },
    ],
  };
}
