'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import type { Business } from '@/types';

const CATEGORY_LABEL: Record<string, string> = {
  tienda: 'Tienda',
  farmacia: 'Farmacia',
  mercado: 'Mercado',
  restaurante: 'Restaurante',
  servicio: 'Servicio',
  otro: 'Comercio',
};

interface BusinessCarouselProps {
  businesses: Business[];
  /** Milisegundos entre diapositivas (0 = sin autoplay). */
  interval?: number;
}

export function BusinessCarousel({ businesses, interval = 5000 }: BusinessCarouselProps) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const count = businesses.length;

  const go = useCallback(
    (next: number) => {
      if (count === 0) return;
      setIndex(((next % count) + count) % count);
    },
    [count]
  );

  useEffect(() => {
    if (!interval || paused || count <= 1) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % count), interval);
    return () => clearInterval(id);
  }, [interval, paused, count]);

  if (count === 0) return null;

  return (
    <div
      className="relative overflow-hidden rounded-lg border border-uv3-green-dark/15 bg-white shadow-sm"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onTouchStart={(e) => {
        touchStartX.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        if (touchStartX.current === null) return;
        const delta = e.changedTouches[0].clientX - touchStartX.current;
        if (Math.abs(delta) > 40) go(delta < 0 ? index + 1 : index - 1);
        touchStartX.current = null;
      }}
      role="region"
      aria-roledescription="carrusel"
      aria-label="Comercios de la Unidad Vecinal 3"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') go(index + 1);
        if (e.key === 'ArrowLeft') go(index - 1);
      }}
    >
      <div
        className="flex transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {businesses.map((b) => {
          const whatsapp = b.whatsapp || b.phone;
          const waHref = whatsapp
            ? `https://wa.me/${whatsapp.replace(/\D/g, '').startsWith('51') ? whatsapp.replace(/\D/g, '') : '51' + whatsapp.replace(/\D/g, '')}`
            : null;
          return (
            <article key={b.id} className="flex w-full shrink-0 flex-col sm:flex-row">
              <div className="relative h-52 w-full shrink-0 bg-stone-100 sm:h-auto sm:w-1/2">
                {b.image_url ? (
                  <Image src={b.image_url} alt={b.name} fill sizes="(max-width: 640px) 100vw, 50vw" className="object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-4xl">🏬</div>
                )}
              </div>
              <div className="flex flex-1 flex-col justify-center gap-2 p-6">
                <span className="w-fit rounded-full bg-uv3-green/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-uv3-green">
                  {CATEGORY_LABEL[b.category] ?? 'Comercio'}
                </span>
                <h3 className="font-heading text-xl font-bold text-uv3-green-dark">{b.name}</h3>
                {b.description && <p className="text-sm leading-relaxed text-stone-600">{b.description}</p>}
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-500">
                  {b.address && <span>📍 {b.address}</span>}
                  {b.phone && <span>📞 {b.phone}</span>}
                </div>
                {waHref && (
                  <a
                    href={waHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 w-fit rounded bg-[#25D366] px-3 py-1.5 text-xs font-bold text-white transition hover:brightness-95"
                  >
                    Escribir por WhatsApp
                  </a>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(index - 1)}
            aria-label="Anterior"
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/85 p-2 text-uv3-green-dark shadow transition hover:bg-white"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => go(index + 1)}
            aria-label="Siguiente"
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/85 p-2 text-uv3-green-dark shadow transition hover:bg-white"
          >
            ›
          </button>

          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {businesses.map((b, i) => (
              <button
                key={b.id}
                type="button"
                aria-label={`Ir al comercio ${i + 1}`}
                onClick={() => go(i)}
                className={`h-2 rounded-full transition-all ${
                  i === index ? 'w-5 bg-uv3-green' : 'w-2 bg-uv3-green-dark/30'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
