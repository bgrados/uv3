import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { createClient } from '@/utils/supabase/server';
import type { Tournament } from '@/types';
import { SportBadge } from '@/components/SportBadge';

const STATUS_LABEL: Record<Tournament['status'], string> = {
  draft: 'En preparación',
  active: 'En juego',
  finished: 'Finalizado',
};

export default async function TournamentsPage() {
  const supabase = await createClient();

  if (!supabase) {
    return <p className="px-6 py-12 text-red-600">Faltan las variables de Supabase.</p>;
  }

  const { data, error } = await supabase
    .from('tournaments')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return <p className="px-6 py-12 text-red-600">Error al cargar campeonatos.</p>;

  const tournaments = (data ?? []) as Tournament[];

  return (
    <section className="mx-auto max-w-7xl px-6 py-12">
      <Breadcrumbs items={[{ label: 'Campeonatos' }]} />
      <h2 className="mb-6 text-3xl font-semibold text-uv3-green-dark">Campeonatos</h2>

      {tournaments.length === 0 ? (
        <p className="rounded-lg border bg-white p-8 text-center text-gray-500">
          Aún no hay campeonatos publicados.
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {tournaments.map((t) => (
            <li key={t.id}>
              <Link
                href={`/tournaments/${t.id}`}
                className="block h-full rounded-lg border bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="mb-2 flex items-center gap-2">
                  <SportBadge sport={t.sport} size="sm" />
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    {STATUS_LABEL[t.status] ?? t.status}
                  </span>
                </div>
                <h3 className="mb-2 text-lg font-semibold text-uv3-green-dark">{t.name}</h3>
                <p className="text-sm text-gray-600">{t.description ?? 'Sin descripción'}</p>
                <span className="mt-3 inline-block text-sm font-semibold text-uv3-green">
                  Ver fixture y posiciones →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
