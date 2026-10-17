'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import type { Gallery } from '@/types';

/**
 * Tarjeta de álbum de la galería pública. Muestra la portada y TODAS las fotos
 * del álbum (no sólo 4) y permite abrir cada una en un visor a pantalla completa.
 */
export function GalleryAlbum({ gallery }: { gallery: Gallery }) {
  const cover = gallery.cover_image_url ?? gallery.images?.[0] ?? null;
  const photos = Array.from(new Set([cover, ...(gallery.images ?? [])].filter(Boolean))) as string[];

  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    if (active === null) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setActive(null);
      if (event.key === 'ArrowRight') setActive((i) => (i === null ? i : (i + 1) % photos.length));
      if (event.key === 'ArrowLeft') setActive((i) => (i === null ? i : (i - 1 + photos.length) % photos.length));
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, photos.length]);

  return (
    <article className="overflow-hidden rounded-lg border bg-white shadow-sm">
      <button
        type="button"
        onClick={() => photos.length > 0 && setActive(0)}
        className="relative block aspect-[16/9] w-full bg-gray-100"
        aria-label={cover ? `Ver fotos de ${gallery.title}` : gallery.title}
      >
        {cover ? (
          <Image src={cover} alt={gallery.title} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
        ) : (
          <span className="flex h-full items-center justify-center text-4xl text-gray-300">📷</span>
        )}
      </button>

      <div className="p-5">
        <h2 className="text-xl font-semibold text-uv3-green-dark">{gallery.title}</h2>
        <p className="mt-2 text-sm text-gray-700">{gallery.description ?? 'Sin descripción'}</p>

        {photos.length > 1 && (
          <div className="mt-4 grid grid-cols-4 gap-2">
            {photos.map((url, index) => (
              <button
                type="button"
                key={url}
                onClick={() => setActive(index)}
                className="relative aspect-square overflow-hidden rounded bg-gray-100"
              >
                <Image
                  src={url}
                  alt={`${gallery.title} — imagen ${index + 1}`}
                  fill
                  sizes="120px"
                  className="object-cover transition-transform duration-300 hover:scale-105"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {active !== null && photos[active] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setActive(null)}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            onClick={() => setActive(null)}
            className="absolute right-4 top-4 rounded-full bg-white/10 px-3 py-1 text-2xl leading-none text-white hover:bg-white/20"
            aria-label="Cerrar"
          >
            ×
          </button>

          {photos.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActive((i) => (i === null ? i : (i - 1 + photos.length) % photos.length));
                }}
                className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/10 px-4 py-3 text-2xl text-white hover:bg-white/20"
                aria-label="Anterior"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActive((i) => (i === null ? i : (i + 1) % photos.length));
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/10 px-4 py-3 text-2xl text-white hover:bg-white/20"
                aria-label="Siguiente"
              >
                ›
              </button>
            </>
          )}

          <div className="relative h-[80vh] w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
            <Image src={photos[active]} alt={`${gallery.title} — imagen ${active + 1}`} fill sizes="100vw" className="object-contain" />
          </div>
        </div>
      )}
    </article>
  );
}
