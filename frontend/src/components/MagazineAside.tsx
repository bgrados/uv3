import Link from 'next/link';
import { SmartImage } from '@/components/SmartImage';
import type { Announcement, Business, Gallery } from '@/types';

interface MagazineAsideProps {
  announcements?: Announcement[];
  businesses?: Business[];
  galleries?: Gallery[];
}

/**
 * Barra lateral derecha "magazine" reutilizable.
 * Mezcla mini-galería, comercios destacados y últimos comunicados.
 * Solo muestra los bloques que tienen datos.
 */
export function MagazineAside({ announcements, businesses, galleries }: MagazineAsideProps) {
  const anns = (announcements ?? []).slice(0, 3);
  const biz = (businesses ?? []).slice(0, 3);
  const gal = (galleries ?? []).slice(0, 3);

  if (anns.length === 0 && biz.length === 0 && gal.length === 0) return null;

  return (
    <aside className="space-y-6">
      {anns.length > 0 && (
        <section className="rounded-xl border bg-white p-4 shadow-sm">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-uv3-green-dark">
            <span>📰</span> Últimos comunicados
          </h3>
          <ul className="space-y-2.5">
            {anns.map((a) => (
              <li key={a.id}>
                <Link href={`/announcements#${a.id}`} className="group block">
                  <p className="text-sm font-medium text-stone-800 group-hover:text-uv3-green group-hover:underline">
                    {a.title}
                  </p>
                  <p className="mt-0.5 text-xs text-stone-400">
                    {new Date(a.created_at).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {biz.length > 0 && (
        <section className="rounded-xl border bg-white p-4 shadow-sm">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-uv3-green-dark">
            <span>🏬</span> Comercios destacados
          </h3>
          <ul className="space-y-2.5">
            {biz.map((b) => (
              <li key={b.id}>
                <Link href="/comercios" className="group flex items-center gap-2.5">
                  <div className="h-9 w-9 shrink-0 overflow-hidden rounded-lg border bg-uv3-bg">
                    {b.logo_url ? (
                      <SmartImage src={b.logo_url} alt={b.name} width={36} height={36} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs">🏪</div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-stone-800 group-hover:text-uv3-green">{b.name}</p>
                    <p className="text-xs capitalize text-stone-400">{b.category}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {gal.length > 0 && (
        <section className="rounded-xl border bg-white p-4 shadow-sm">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-uv3-green-dark">
            <span>📷</span> Galería
          </h3>
          <ul className="space-y-2.5">
            {gal.map((g) => (
              <li key={g.id}>
                <Link href="/gallery" className="group flex items-center gap-2.5">
                  <div className="h-9 w-9 shrink-0 overflow-hidden rounded-lg border bg-uv3-bg">
                    {g.cover_image_url ? (
                      <SmartImage src={g.cover_image_url} alt={g.title} width={36} height={36} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs">🖼️</div>
                    )}
                  </div>
                  <p className="truncate text-sm font-medium text-stone-800 group-hover:text-uv3-green">{g.title}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-xl bg-gradient-to-br from-uv3-green-dark to-uv3-green p-4 text-white shadow-sm">
        <p className="text-sm font-bold">¿Necesitas una cancha?</p>
        <p className="mt-1 text-xs text-white/85">Reserva la cancha sintética de la UV3 en minutos.</p>
        <Link
          href="/reservas"
          className="mt-3 inline-block rounded-lg bg-white px-4 py-2 text-xs font-bold uppercase tracking-wide text-uv3-green-dark transition-colors hover:bg-uv3-gold"
        >
          Reservar ahora
        </Link>
      </section>

      <section className="rounded-xl border border-uv3-green/30 bg-uv3-green/5 p-4 text-sm">
        <p className="font-semibold text-uv3-green-dark">Transparencia</p>
        <p className="mt-1 text-xs text-stone-600">Conoce en qué se gasta el dinero de la junta vecinal.</p>
        <Link href="/transparencia" className="mt-2 inline-block text-xs font-semibold text-uv3-green hover:underline">
          Ver ingresos y egresos →
        </Link>
      </section>
    </aside>
  );
}
