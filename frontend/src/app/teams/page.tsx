import { SmartImage } from '@/components/SmartImage';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';
import type { Team } from '@/types';

export const dynamic = 'force-dynamic';

interface TeamRow extends Pick<Team, 'id' | 'name' | 'logo_url'> {
  players?: { count: number }[];
}

export default async function TeamsPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('teams')
    .select('id, name, logo_url, players(count)')
    .order('name');

  if (error) return <p className="px-6 py-12 text-red-600">Error al cargar equipos.</p>;

  const teams = (data ?? []) as unknown as TeamRow[];

  return (
    <section className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-8">
        <h2 className="text-3xl font-semibold text-uv3-green-dark">Equipos</h2>
        <p className="mt-2 text-sm text-gray-600">
          Directorio de equipos participantes de la Unidad Vecinal 3. Entra a cada uno para ver su
          plantilla.
        </p>
      </div>

      {teams.length === 0 ? (
        <p className="rounded-lg border bg-white p-8 text-center text-gray-500">
          Aún no hay equipos registrados.
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => {
            const playerCount = team.players?.[0]?.count ?? 0;
            return (
              <li
                key={team.id}
                className="rounded-xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <Link href={`/teams/${team.id}`} className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-uv3-bg">
                    {team.logo_url ? (
                      <SmartImage
                        src={team.logo_url}
                        alt={team.name}
                        width={56}
                        height={56}
                        className="h-14 w-14 object-cover"
                      />
                    ) : (
                      <span className="text-xl">⚽</span>
                    )}
                  </div>
                  <div>
                    <h3 className="mb-1 text-lg font-semibold text-stone-800">{team.name}</h3>
                    <p className="text-sm text-gray-600">
                      {playerCount} jugador{playerCount !== 1 ? 'es' : ''} en la plantilla
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
