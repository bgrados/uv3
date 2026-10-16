import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { SportBadge } from '@/components/SportBadge';
import { LiveMatchCard } from '@/components/LiveMatchCard';
import { LiveAutoRefresh } from '@/components/LiveAutoRefresh';
import type { Match, Standing, Tournament } from '@/types';

interface PageProps {
  params: Promise<{ tournamentId: string }>;
}

const SPORT_SCORE_LABEL: Record<string, string> = {
  futbol: 'Goles',
  futbol_sala: 'Goles',
  basquet: 'Puntos',
};

const FORMAT_LABEL: Record<Tournament['format'], string> = {
  liga: 'Liga',
  grupos: 'Grupos',
  eliminacion: 'Eliminación Directa',
};

const STATUS_LABEL: Record<Tournament['status'], { label: string; className: string }> = {
  draft: { label: 'Por iniciar', className: 'bg-gray-100 text-gray-700' },
  active: { label: '🟢 Activo', className: 'bg-green-100 text-green-700' },
  finished: { label: '🏁 Finalizado', className: 'bg-stone-200 text-stone-600' },
};

export default async function TournamentDetailPage({ params }: PageProps) {
  const { tournamentId } = await params;

  const supabase = await createClient();

  const { data: tournamentData, error } = await supabase
    .from('tournaments')
    .select('*')
    .eq('id', tournamentId)
    .single();

  if (error || !tournamentData) notFound();
  const tournament = tournamentData as Tournament;

  const [{ data: matchesData }, { data: standingsData }] = await Promise.all([
    supabase
      .from('matches')
      .select(
        `*, 
         home_team:teams!home_team_id(id, name, logo_url),
         away_team:teams!away_team_id(id, name, logo_url),
         venue:venues(id, name)`
      )
      .eq('tournament_id', tournamentId)
      .order('round', { ascending: true })
      .order('date_time', { ascending: true }),

    supabase
      .from('standings')
      .select('*, team:teams(id, name, logo_url)')
      .eq('tournament_id', tournamentId)
      .order('points', { ascending: false })
      .order('goal_difference', { ascending: false })
      .order('goals_for', { ascending: false }),
  ]);

  const matches = (matchesData ?? []) as Match[];
  const standings = (standingsData ?? []) as Standing[];

  // Group matches by round
  const rounds = matches.reduce<Record<number, Match[]>>((acc, m) => {
    if (!acc[m.round]) acc[m.round] = [];
    acc[m.round].push(m);
    return acc;
  }, {});

  const liveMatches = matches.filter((m) => m.status === 'playing');
  const hasLive = liveMatches.length > 0;

  const scoreLabel = SPORT_SCORE_LABEL[tournament.sport] ?? 'Goles';
  const statusInfo = STATUS_LABEL[tournament.status] ?? STATUS_LABEL.draft;

  const formattedDateRange =
    tournament.start_date && tournament.end_date
      ? `${new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(tournament.start_date))} — ${new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(tournament.end_date))}`
      : null;

  return (
    <main className="min-h-screen bg-uv3-bg">
      {/* Auto-refresh every 30 seconds when there are live matches */}
      {hasLive && <LiveAutoRefresh intervalMs={30000} />}

      {/* Tournament Header */}
      <div className="bg-gradient-to-br from-uv3-green-dark via-uv3-green to-emerald-600 text-white">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <nav className="mb-4 flex items-center gap-2 text-sm text-white/60">
            <Link href="/" className="hover:text-white">Inicio</Link>
            <span>›</span>
            <Link href="/tournaments" className="hover:text-white">Campeonatos</Link>
            <span>›</span>
            <span className="text-white/80">{tournament.name}</span>
          </nav>

          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <SportBadge sport={tournament.sport ?? 'futbol'} size="sm" />
                <span
                  className={`rounded-full px-3 py-0.5 text-xs font-bold ${statusInfo.className}`}
                >
                  {statusInfo.label}
                </span>
                <span className="rounded-full bg-white/10 px-3 py-0.5 text-xs font-semibold text-white/80">
                  {FORMAT_LABEL[tournament.format]}
                </span>
                <span className="rounded-full bg-uv3-gold/20 px-3 py-0.5 text-xs font-semibold text-uv3-gold">
                  {tournament.category}
                </span>
              </div>
              <h1 className="text-3xl font-black sm:text-4xl">{tournament.name}</h1>
              {tournament.description && (
                <p className="mt-2 max-w-2xl text-sm text-white/75">{tournament.description}</p>
              )}
              {formattedDateRange && (
                <p className="mt-2 text-xs text-white/60">📅 {formattedDateRange}</p>
              )}
            </div>

            {hasLive && (
              <div className="flex items-center gap-2 rounded-xl bg-red-500/30 px-5 py-3 font-bold backdrop-blur-sm">
                <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-300"></span>
                <span className="text-sm">
                  {liveMatches.length} partido{liveMatches.length > 1 ? 's' : ''} EN VIVO
                </span>
              </div>
            )}
          </div>

          {/* Quick stats */}
          <div className="mt-6 flex flex-wrap gap-6 text-sm">
            <div>
              <span className="font-black text-2xl">{standings.length}</span>
              <span className="ml-1.5 text-white/60">equipos</span>
            </div>
            <div>
              <span className="font-black text-2xl">{matches.length}</span>
              <span className="ml-1.5 text-white/60">partidos</span>
            </div>
            <div>
              <span className="font-black text-2xl">
                {matches.filter((m) => m.status === 'completed').length}
              </span>
              <span className="ml-1.5 text-white/60">jugados</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid gap-10 lg:grid-cols-[1fr_340px]">
          {/* Left: Fixture */}
          <section>
            <h2 className="mb-6 text-2xl font-bold text-uv3-green-dark">Fixture y Resultados</h2>

            {/* Live matches highlight */}
            {hasLive && (
              <div className="mb-6">
                <h3 className="mb-3 flex items-center gap-2 text-base font-bold text-red-700">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-red-600"></span>
                  Jugando ahora
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {liveMatches.map((m) => (
                    <LiveMatchCard key={m.id} match={m} />
                  ))}
                </div>
              </div>
            )}

            {/* All rounds */}
            {Object.keys(rounds).length === 0 ? (
              <div className="rounded-xl border bg-white p-8 text-center text-gray-500 shadow-sm">
                <p className="text-3xl mb-2">📅</p>
                <p>El fixture aún no ha sido generado para este torneo.</p>
              </div>
            ) : (
              <div className="space-y-8">
                {Object.entries(rounds)
                  .sort(([a], [b]) => Number(a) - Number(b))
                  .map(([round, roundMatches]) => (
                    <div key={round}>
                      <h3 className="mb-3 flex items-center gap-3 text-sm font-bold uppercase tracking-wider text-stone-500">
                        <span className="h-px flex-1 bg-stone-200"></span>
                        Jornada {round}
                        <span className="h-px flex-1 bg-stone-200"></span>
                      </h3>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {roundMatches.map((m) => (
                          <LiveMatchCard key={m.id} match={m} />
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </section>

          {/* Right: Standings */}
          <aside className="space-y-6">
            {/* Standings Table */}
            <div className="rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden">
              <div className="bg-uv3-green-dark px-5 py-4 text-white">
                <h2 className="font-bold">🏆 Tabla de Posiciones</h2>
              </div>
              {standings.length === 0 ? (
                <p className="px-5 py-4 text-sm text-gray-500">
                  Aún no hay equipos registrados en la tabla.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-stone-100 bg-stone-50 text-[10px] font-bold uppercase tracking-wider text-stone-500">
                        <th className="px-3 py-2.5 text-left">Pos</th>
                        <th className="px-3 py-2.5 text-left">Equipo</th>
                        <th className="px-2 py-2.5 text-center">PJ</th>
                        <th className="px-2 py-2.5 text-center">G</th>
                        <th className="px-2 py-2.5 text-center">E</th>
                        <th className="px-2 py-2.5 text-center">P</th>
                        <th className="px-2 py-2.5 text-center">DG</th>
                        <th className="px-2 py-2.5 text-center font-black text-uv3-green-dark">Pts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {standings.map((s, idx) => (
                        <tr
                          key={s.id}
                          className={`border-b border-stone-50 transition-colors hover:bg-stone-50 ${
                            idx === 0 ? 'bg-uv3-green/5' : ''
                          }`}
                        >
                          <td className="px-3 py-3 font-bold text-stone-400">{idx + 1}</td>
                          <td className="px-3 py-3">
                            <span className={`font-semibold ${idx === 0 ? 'text-uv3-green-dark' : 'text-stone-800'}`}>
                              {idx === 0 && <span className="mr-1">🥇</span>}
                              {idx === 1 && <span className="mr-1">🥈</span>}
                              {idx === 2 && <span className="mr-1">🥉</span>}
                              {s.team?.name ?? '—'}
                            </span>
                          </td>
                          <td className="px-2 py-3 text-center text-stone-600">{s.played}</td>
                          <td className="px-2 py-3 text-center text-stone-600">{s.won}</td>
                          <td className="px-2 py-3 text-center text-stone-600">{s.drawn}</td>
                          <td className="px-2 py-3 text-center text-stone-600">{s.lost}</td>
                          <td className="px-2 py-3 text-center text-stone-600">
                            {s.goal_difference > 0 ? `+${s.goal_difference}` : s.goal_difference}
                          </td>
                          <td className="px-2 py-3 text-center font-black text-uv3-green-dark">
                            {s.points}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="border-t border-stone-100 px-5 py-3 text-[10px] text-stone-400">
                PJ = Jugados · G = Ganados · E = Empatados · P = Perdidos · DG = Diferencia de {scoreLabel}
              </div>
            </div>

            {/* Top Scorers placeholder */}
            {hasLive && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                <p className="flex items-center gap-2 text-xs font-bold text-red-700">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-600"></span>
                  Resultados actualizados automáticamente cada 30 segundos
                </p>
              </div>
            )}

            {/* Back link */}
            <Link
              href="/tournaments"
              className="block rounded-xl border border-stone-200 bg-white px-5 py-3 text-center text-sm font-semibold text-uv3-green-dark shadow-sm transition-colors hover:border-uv3-green hover:bg-uv3-green/5"
            >
              ← Ver todos los campeonatos
            </Link>
          </aside>
        </div>
      </div>
    </main>
  );
}
