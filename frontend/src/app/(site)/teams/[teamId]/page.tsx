import { SmartImage } from '@/components/SmartImage';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { notFound } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import type { Player, Team } from '@/types';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ teamId: string }>;
}

const POSITION_LABEL: Record<NonNullable<Player['position']>, string> = {
  arquero: 'Arquero',
  defensa: 'Defensa',
  mediocampista: 'Mediocampista',
  delantero: 'Delantero',
};

export default async function PublicTeamPage({ params }: PageProps) {
  const { teamId } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('teams')
    .select(
      'id, name, logo_url, delegate:users!delegate_id(id, full_name), players(*)'
    )
    .eq('id', teamId)
    .single();

  if (error || !data) notFound();

  const team = data as unknown as Team & { players?: Player[] };
  const players = [...(team.players ?? [])].sort(
    (a, b) => (a.jersey_number ?? 99) - (b.jersey_number ?? 99)
  );

  const grouped = (['arquero', 'defensa', 'mediocampista', 'delantero'] as const).map(
    (position) => ({
      position,
      players: players.filter((player) => player.position === position),
    })
  );

  return (
    <section className="mx-auto max-w-5xl px-6 py-12">
      <Breadcrumbs items={[{ label: 'Equipos', href: '/teams' }, { label: team.name }]} />

      <header className="flex flex-wrap items-center gap-5 rounded-2xl bg-gradient-to-br from-uv3-green-dark to-uv3-green p-8 text-white shadow-lg">
        <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-xl border-2 border-white/30 bg-white/10">
          {team.logo_url ? (
            <SmartImage
              src={team.logo_url}
              alt={team.name}
              width={80}
              height={80}
              className="h-20 w-20 object-cover"
            />
          ) : (
            <span className="text-3xl">⚽</span>
          )}
        </div>
        <div>
          <h1 className="text-3xl font-bold">{team.name}</h1>
          <p className="mt-1 text-sm text-white/80">
            {team.delegate ? `Delegado: ${team.delegate.full_name ?? '—'}` : 'Sin delegado asignado'}
          </p>
          <p className="mt-0.5 text-sm text-white/70">
            {players.length} jugador{players.length !== 1 ? 'es' : ''} en la plantilla
          </p>
        </div>
      </header>

      <div className="mt-8 space-y-6">
        {players.length === 0 ? (
          <p className="rounded-xl border bg-white p-8 text-center text-gray-500">
            Este equipo todavía no ha registrado jugadores.
          </p>
        ) : (
          grouped
            .filter((group) => group.players.length > 0)
            .map((group) => (
              <div key={group.position} className="rounded-xl border bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold text-uv3-green-dark">
                  {POSITION_LABEL[group.position]}s
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    ({group.players.length})
                  </span>
                </h2>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {group.players.map((player) => (
                    <li
                      key={player.id}
                      className="flex items-center gap-3 rounded-lg border border-stone-100 p-3"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-uv3-bg text-sm font-bold text-uv3-green-dark">
                        {player.photo_url ? (
                          <SmartImage
                            src={player.photo_url}
                            alt={`${player.first_name} ${player.last_name}`}
                            width={40}
                            height={40}
                            className="h-10 w-10 object-cover"
                          />
                        ) : (
                          player.jersey_number ?? '–'
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-stone-800">
                          #{player.jersey_number ?? '–'} {player.first_name} {player.last_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {POSITION_LABEL[group.position]}
                          {player.birth_date
                            ? ` · ${new Date(player.birth_date).getFullYear()}`
                            : ''}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))
        )}
      </div>
    </section>
  );
}
