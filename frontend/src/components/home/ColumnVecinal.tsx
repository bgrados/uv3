import Link from 'next/link';
import { SmartImage } from '@/components/SmartImage';
import { SectionHeading, Kicker } from '@/components/home/SectionHeading';
import type { HomeStory } from '@/components/home/types';
import type { CommunityService } from '@/types';

/**
 * Columna 1 — Plomada del diario: noticia principal, sumario, directorio de la
 * unidad y buzón vecinal.
 */
export function ColumnVecinal({
  featuredStory,
  sideStories,
  services,
}: {
  featuredStory: HomeStory;
  sideStories: HomeStory[];
  services: CommunityService[];
}) {
  return (
    <div className="space-y-6">
      <SectionHeading label="Sección Vecinal & Gestión" />

      {/* ── Noticia principal ───────────────────────────────────────── */}
      <article className="space-y-3">
        <Kicker>UV3 Diario · Portada</Kicker>
        <span className="inline-block rounded bg-uv3-green px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
          {featuredStory.category}
        </span>
        <h4 className="font-heading text-2xl font-black leading-[1.1] text-uv3-green-dark transition-colors hover:text-uv3-green sm:text-3xl">
          {featuredStory.title}
        </h4>
        <p className="border-y border-stone-200 py-1 text-[11px] font-semibold uppercase tracking-wider text-stone-500">
          Por: Junta Vecinal UV3 ·{' '}
          {new Date(featuredStory.created_at).toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
        <div className="relative h-[240px] w-full overflow-hidden border border-uv3-green-dark/10 bg-stone-100">
          <SmartImage
            src={featuredStory.image_url || '/uv3-news-1.jpg'}
            alt={featuredStory.title}
            fill
            sizes="(max-width: 1024px) 100vw, 520px"
            className="object-cover transition-transform duration-700 hover:scale-105"
            priority
          />
          {!featuredStory.image_url && (
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 text-xs text-white">
              <p className="font-semibold italic">Archivo Histórico: entorno de la Unidad Vecinal Nº3, Lima.</p>
            </div>
          )}
        </div>
        <p className="hyphens-auto text-justify text-[13px] leading-[1.6] text-[#44403c]">{featuredStory.content}</p>
        <Link
          href={`/announcements#${featuredStory.id}`}
          className="inline-block text-xs font-bold uppercase tracking-wider text-uv3-green hover:underline"
        >
          Seguir leyendo →
        </Link>
      </article>

      {/* ── Sumario ─────────────────────────────────────────────────── */}
      {sideStories.length > 0 && (
        <div className="border-t-2 border-uv3-green-dark/15 pt-3">
          <Kicker>Sumario</Kicker>
          <div className="mt-2 divide-y divide-stone-200">
            {sideStories.map((story) => (
              <div key={story.id} className="flex gap-3 py-3 first:pt-2">
                {story.image_url && (
                  <div className="relative h-[72px] w-[96px] shrink-0 overflow-hidden bg-stone-100">
                    <SmartImage src={story.image_url} alt={story.title} fill sizes="96px" className="object-cover" />
                  </div>
                )}
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-uv3-gold">{story.category}</span>
                  <h5 className="mt-0.5 font-heading text-[15px] font-bold leading-snug text-uv3-green-dark hover:text-uv3-green">
                    <Link href={`/announcements#${story.id}`}>{story.title}</Link>
                  </h5>
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[#57534e]">{story.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Directorio de la Unidad ─────────────────────────────────── */}
      {services.length > 0 && (
        <div className="border border-uv3-green/20 bg-white p-4">
          <div className="flex items-end justify-between gap-2 border-b-2 border-uv3-green pb-1">
            <h4 className="font-heading text-xs font-bold uppercase tracking-[0.2em] text-uv3-green-dark">
              📞 Directorio de la Unidad
            </h4>
            <Link href="/servicios" className="shrink-0 text-[10px] font-bold uppercase text-uv3-green hover:underline">
              Ver todos →
            </Link>
          </div>
          <ul className="mt-3 grid gap-x-4 gap-y-2.5 sm:grid-cols-2">
            {services.slice(0, 6).map((s) => (
              <li key={s.id} className="flex gap-2">
                <span className="text-base leading-none" aria-hidden>
                  {s.icon || '🏛️'}
                </span>
                <div className="min-w-0">
                  <p className="text-[13px] font-bold leading-tight text-uv3-green-dark">{s.name}</p>
                  {s.hours && <p className="text-[11px] leading-snug text-stone-500">{s.hours}</p>}
                  {s.phone && <p className="text-[11px] leading-snug text-stone-500">📞 {s.phone}</p>}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Buzón vecinal ───────────────────────────────────────────── */}
      <div className="border-l-4 border-uv3-gold bg-uv3-bg p-4">
        <h5 className="font-heading text-sm font-bold text-uv3-green-dark">¿Tienes una denuncia o sugerencia vecinal?</h5>
        <p className="mt-1 text-xs leading-relaxed text-[#57534e]">
          La Junta General de Propietarios recibe reclamos sobre mantenimiento, seguridad y deportes en su local oficial
          frente al parque central.
        </p>
      </div>
    </div>
  );
}
