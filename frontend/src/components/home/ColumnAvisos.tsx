import Link from 'next/link';
import { SmartImage } from '@/components/SmartImage';
import { SectionHeading, Kicker } from '@/components/home/SectionHeading';
import { BUSINESS_CATEGORY_LABEL } from '@/utils/site';
import { EVENT_CATEGORY_LABEL, EVENT_CATEGORY_STYLE, formatEventDate, shortTime } from '@/utils/community';
import type { Business, CommunityEvent, Notice } from '@/types';

export interface HomeStats {
  teams: number;
  businesses: number;
  notices: number;
  services: number;
  events: number;
}

/**
 * Columna 3 — Avisos y utilidad: avisos oficiales, comercio de la unidad,
 * agenda de la semana, archivo histórico y cifras de la comunidad.
 */
export function ColumnAvisos({
  notices,
  businesses,
  events,
  latestGalleryImage,
  stats,
}: {
  notices: Notice[];
  businesses: Business[];
  events: CommunityEvent[];
  latestGalleryImage: string | null;
  stats: HomeStats;
}) {
  return (
    <div className="space-y-6">
      <SectionHeading label="Avisos y Utilidad" accent="stone" />

      {/* ── Avisos ──────────────────────────────────────────────────── */}
      {notices.length > 0 ? (
        <div className="space-y-4">
          {notices.slice(0, 5).map((notice) => (
            <article key={notice.id} className="border-t-2 border-stone-800 pt-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-uv3-green">
                {notice.is_featured ? '★ Aviso destacado' : 'Aviso de utilidad'}
              </p>
              <h4 className="mt-1 font-heading text-base font-bold leading-snug text-uv3-green-dark">
                {notice.icon ? `${notice.icon} ` : ''}
                {notice.title}
              </h4>
              {notice.content && (
                <p className="mt-2 whitespace-pre-line text-xs leading-relaxed text-stone-600">{notice.content}</p>
              )}
              {notice.link_url && (
                <a
                  href={notice.link_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-xs font-bold text-uv3-green hover:underline"
                >
                  {notice.link_label || 'Ver más'} →
                </a>
              )}
            </article>
          ))}
        </div>
      ) : (
        <p className="text-xs text-stone-500">
          Aún no hay avisos publicados. Agrégalos desde el panel en “Avisos y utilidad”.
        </p>
      )}

      {/* ── Comercio de la Unidad ───────────────────────────────────── */}
      {businesses.length > 0 && (
        <div className="border-t-2 border-uv3-green-dark/15 pt-3">
          <div className="flex items-end justify-between gap-2">
            <h4 className="font-heading text-sm font-bold uppercase tracking-wider text-uv3-green-dark">
              🛒 Comercio de la Unidad
            </h4>
            <Link href="/comercios" className="shrink-0 text-[10px] font-bold uppercase text-uv3-green hover:underline">
              Ver todos →
            </Link>
          </div>
          <ul className="mt-2 divide-y divide-stone-200">
            {businesses.slice(0, 6).map((b) => {
              const wa = (b.whatsapp || b.phone || '').replace(/\D/g, '');
              const waHref = wa.length >= 6 ? `https://wa.me/${wa.startsWith('51') ? wa : `51${wa}`}` : null;
              return (
                <li key={b.id} className="flex items-center justify-between gap-2 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-bold leading-tight text-uv3-green-dark">{b.name}</p>
                    <p className="truncate text-[11px] text-stone-500">
                      {BUSINESS_CATEGORY_LABEL[b.category] ?? 'Comercio'}
                      {b.address ? ` · ${b.address}` : ''}
                    </p>
                  </div>
                  {waHref && (
                    <a
                      href={waHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 rounded bg-[#25D366] px-2 py-1 text-[10px] font-bold text-white"
                    >
                      WhatsApp
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* ── Agenda de la semana ─────────────────────────────────────── */}
      {events.length > 0 && (
        <div className="border-t-2 border-uv3-green-dark/15 pt-3">
          <div className="flex items-end justify-between gap-2">
            <h4 className="font-heading text-sm font-bold uppercase tracking-wider text-uv3-green-dark">
              📅 Agenda de la semana
            </h4>
            <Link href="/agenda" className="shrink-0 text-[10px] font-bold uppercase text-uv3-green hover:underline">
              Ver agenda →
            </Link>
          </div>
          <ul className="mt-2 divide-y divide-stone-200">
            {events.slice(0, 5).map((e) => (
              <li key={e.id} className="py-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                    {formatEventDate(e.event_date)}
                  </span>
                  {shortTime(e.start_time) && (
                    <span className="text-[11px] text-stone-500">· {shortTime(e.start_time)}</span>
                  )}
                  <span
                    className={`ml-auto rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                      EVENT_CATEGORY_STYLE[e.category] ?? 'bg-stone-200 text-stone-700'
                    }`}
                  >
                    {EVENT_CATEGORY_LABEL[e.category] ?? 'Actividad'}
                  </span>
                </div>
                <p className="mt-0.5 text-[13px] font-bold leading-tight text-uv3-green-dark">{e.title}</p>
                {e.location && <p className="text-[11px] text-stone-500">📍 {e.location}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Archivo histórico ───────────────────────────────────────── */}
      <div className="border border-stone-200 bg-white p-3">
        <div className="flex items-center justify-between border-b border-stone-100 pb-1.5">
          <h4 className="font-heading text-xs font-bold uppercase tracking-wider text-uv3-green-dark">
            📷 Archivo Histórico
          </h4>
          <Link href="/gallery" className="text-[10px] font-bold text-uv3-green hover:underline">
            Abrir galería
          </Link>
        </div>
        <div className="relative mt-3 h-40 w-full overflow-hidden bg-stone-100">
          <SmartImage
            src={latestGalleryImage || '/uv3-news-2.jpg'}
            alt="Patrimonio Unidad Vecinal 3"
            fill
            sizes="(max-width: 1024px) 100vw, 320px"
            className="object-cover transition-transform duration-500 hover:scale-105"
          />
        </div>
        <p className="mt-2 text-[11px] italic leading-relaxed text-stone-500">
          Inaugurada a mediados del siglo XX como el primer gran complejo habitacional moderno de Lima, la UV3 destaca por
          sus grandes espacios libres.
        </p>
      </div>

      {/* ── Cifras de la comunidad ──────────────────────────────────── */}
      <div className="border-t-2 border-uv3-green-dark/15 pt-3">
        <Kicker>UV3 en cifras</Kicker>
        <dl className="mt-2 grid grid-cols-2 gap-2 text-center">
          {[
            { label: 'Equipos', value: stats.teams },
            { label: 'Comercios', value: stats.businesses },
            { label: 'Servicios', value: stats.services },
            { label: 'Avisos', value: stats.notices },
          ].map((s) => (
            <div key={s.label} className="border border-stone-200 bg-white py-2">
              <dd className="font-heading text-xl font-black text-uv3-green-dark">{s.value}</dd>
              <dt className="text-[10px] uppercase tracking-wider text-stone-500">{s.label}</dt>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
