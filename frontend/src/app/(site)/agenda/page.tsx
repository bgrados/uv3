import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { getCommunityEventsAction } from '@/app/actions/services';
import { EVENT_CATEGORY_LABEL, EVENT_CATEGORY_STYLE, formatEventDate, shortTime } from '@/utils/community';

export const metadata = {
  title: 'Agenda de la Comunidad — UV3',
  description: 'Asambleas, campañas de salud, actividades deportivas y ferias en la Unidad Vecinal 3.',
};

export const dynamic = 'force-dynamic';

export default async function AgendaPage() {
  const result = await getCommunityEventsAction({ limit: 50 });
  const events = result.success ? result.data ?? [] : [];

  // Agrupa por fecha para mostrarlo como agenda de periódico.
  const groups = events.reduce<Record<string, typeof events>>((acc, e) => {
    (acc[e.event_date] ??= []).push(e);
    return acc;
  }, {});

  return (
    <main className="min-h-screen pb-16">
      <Breadcrumbs items={[{ label: 'Agenda' }]} />
      <div className="bg-uv3-green-dark text-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-uv3-gold">Unidad Vecinal 3</p>
            <h1 className="font-heading text-2xl font-black uppercase tracking-tight">Agenda de la Comunidad</h1>
          </div>
          <Link href="/" className="rounded-lg border border-white/30 px-3 py-1.5 text-xs font-semibold hover:bg-white/10">
            ← Portada
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-6 py-8">
        {events.length === 0 ? (
          <p className="rounded-lg border bg-white p-8 text-center text-stone-500">Aún no hay eventos programados.</p>
        ) : (
          <div className="space-y-8">
            {Object.entries(groups).map(([date, dayEvents]) => (
              <section key={date}>
                <h2 className="border-b-2 border-uv3-green pb-1 font-heading text-sm font-bold uppercase tracking-[0.2em] text-uv3-green-dark">
                  {formatEventDate(date)}
                </h2>
                <ul className="mt-3 divide-y divide-stone-200">
                  {dayEvents.map((e) => (
                    <li key={e.id} className="py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${EVENT_CATEGORY_STYLE[e.category] ?? 'bg-stone-200 text-stone-700'}`}>
                          {EVENT_CATEGORY_LABEL[e.category] ?? 'Actividad'}
                        </span>
                        {shortTime(e.start_time) && (
                          <span className="text-xs font-semibold text-stone-500">
                            🕒 {shortTime(e.start_time)}
                            {shortTime(e.end_time) ? `–${shortTime(e.end_time)}` : ''}
                          </span>
                        )}
                        {e.is_featured && <span className="text-[10px] font-bold uppercase text-uv3-gold">★ Destacado</span>}
                      </div>
                      <h3 className="mt-1 font-heading text-lg font-bold text-uv3-green-dark">{e.title}</h3>
                      {e.description && <p className="mt-1 text-sm leading-relaxed text-stone-600">{e.description}</p>}
                      {e.location && <p className="mt-1 text-xs text-stone-500">📍 {e.location}</p>}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
