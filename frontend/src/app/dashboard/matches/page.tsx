import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/app/auth/actions';
import { createClient } from '@/utils/supabase/server';
import { SportBadge } from '@/components/SportBadge';
import type { Match, Tournament } from '@/types';

const STATUS_BADGE: Record<Match['status'], { label: string; className: string }> = {
  scheduled: { label: 'Programado', className: 'bg-gray-100 text-gray-700' },
  playing: { label: '🔴 En Vivo', className: 'bg-red-100 text-red-700' },
  completed: { label: 'Finalizado', className: 'bg-stone-200 text-stone-700' },
  cancelled: { label: 'Cancelado', className: 'bg-red-50 text-red-400' },
};

export default async function MatchesAdminPage() {
  const user = await getCurrentUser();
  if (!user || !['admin', 'organizer', 'referee'].includes(user.role)) {
    redirect('/login?message=Se requieren permisos de administrador, organizador o árbitro.');
  }

  let tournaments: Pick<Tournament, 'id' | 'name' | 'sport' | 'status'>[] = [];
  let matches: (Match & { tournament?: Pick<Tournament, 'id' | 'name' | 'sport'> })[] = [];

  try {
    const supabase = await createClient();
    if (supabase) {
      const { data: tournamentsData } = await supabase
        .from('tournaments')
        .select('id, name, sport, status')
        .order('created_at', { ascending: false });

      if (tournamentsData && tournamentsData.length > 0) {
        tournaments = tournamentsData as Pick<Tournament, 'id' | 'name' | 'sport' | 'status'>[];
      }

      const { data: matchesData } = await supabase
        .from('matches')
        .select(
          `*, 
           home_team:teams!home_team_id(id, name),
           away_team:teams!away_team_id(id, name),
           venue:venues(id, name),
           tournament:tournaments(id, name, sport)`
        )
        .order('date_time', { ascending: true });

      if (matchesData && matchesData.length > 0) {
        matches = matchesData as (Match & { tournament?: Pick<Tournament, 'id' | 'name' | 'sport'> })[];
      }
    }
  } catch (err) {
    console.warn('No se pudo conectar a la base de datos para partidos, usando fallbacks:', err);
  }

  if (tournaments.length === 0) {
    tournaments = [
      { id: 'tour-1', name: 'Campeonato Apertura Inter-Bloques 2026', sport: 'futbol', status: 'active' },
      { id: 'tour-2', name: 'Copa Nocturna de Fútbol Sala UV3', sport: 'futbol_sala', status: 'draft' },
    ];
  }

  if (matches.length === 0) {
    matches = [
      {
        id: 'm1',
        tournament_id: 'tour-1',
        home_team_id: 't1',
        away_team_id: 't2',
        venue_id: 'v1',
        date_time: new Date(Date.now() + 86400000).toISOString(),
        referee_id: null,
        status: 'playing',
        home_score: 2,
        away_score: 1,
        round: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        home_team: { id: 't1', name: 'Real Unidad Vecinal 3', logo_url: null, delegate_id: null, created_at: '', updated_at: '' },
        away_team: { id: 't2', name: 'Deportivo Block 5 FC', logo_url: null, delegate_id: null, created_at: '', updated_at: '' },
        venue: { id: 'v1', name: 'Cancha Sintética Principal', location: '', description: '', created_at: '', updated_at: '' },
        tournament: { id: 'tour-1', name: 'Campeonato Apertura Inter-Bloques 2026', sport: 'futbol' },
      },
      {
        id: 'm2',
        tournament_id: 'tour-1',
        home_team_id: 't3',
        away_team_id: 't4',
        venue_id: 'v1',
        date_time: new Date(Date.now() + 172800000).toISOString(),
        referee_id: null,
        status: 'scheduled',
        home_score: 0,
        away_score: 0,
        round: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        home_team: { id: 't3', name: 'Juventud Sector A', logo_url: null, delegate_id: null, created_at: '', updated_at: '' },
        away_team: { id: 't4', name: 'Defensor Block 12', logo_url: null, delegate_id: null, created_at: '', updated_at: '' },
        venue: { id: 'v1', name: 'Cancha Sintética Principal', location: '', description: '', created_at: '', updated_at: '' },
        tournament: { id: 'tour-1', name: 'Campeonato Apertura Inter-Bloques 2026', sport: 'futbol' },
      },
    ];
  }

  // Group by tournament
  const grouped = tournaments.map((t) => ({
    tournament: t,
    matches: matches.filter((m) => m.tournament_id === t.id),
  }));

  const liveMatches = matches.filter((m) => m.status === 'playing');

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-6 py-12">
      {/* Header */}
      <section className="mb-8 rounded-2xl bg-gradient-to-br from-uv3-green-dark to-uv3-green p-8 text-white shadow-lg">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-wide text-white/70">Panel de partidos</p>
            <h1 className="mt-2 text-3xl font-bold">Control de Partidos</h1>
            <p className="mt-2 max-w-2xl text-white/80">
              Selecciona un partido para abrir el panel de marcador en vivo.
              Los cambios se reflejan de inmediato en la vista pública.
            </p>
          </div>
          {liveMatches.length > 0 && (
            <div className="flex items-center gap-2 rounded-xl bg-red-500/30 px-4 py-2 text-sm font-bold backdrop-blur-sm">
              <span className="h-2 w-2 animate-pulse rounded-full bg-red-300"></span>
              {liveMatches.length} partido{liveMatches.length > 1 ? 's' : ''} en vivo
            </div>
          )}
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/dashboard"
            className="rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/20"
          >
            ← Panel principal
          </Link>
          <Link
            href="/dashboard/tournaments"
            className="rounded-lg bg-uv3-gold px-4 py-2 text-sm font-semibold text-uv3-green-dark transition-colors hover:bg-uv3-gold/90"
          >
            Gestionar torneos
          </Link>
        </div>
      </section>

      {/* Live matches quick section */}
      {liveMatches.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-red-700">
            <span className="h-2 w-2 animate-pulse rounded-full bg-red-600"></span>
            Partidos en curso ahora
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {liveMatches.map((match) => (
              <Link
                key={match.id}
                href={`/dashboard/matches/${match.id}`}
                className="group rounded-xl border-2 border-red-300 bg-red-50 p-4 transition-all hover:border-red-400 hover:shadow-md hover:shadow-red-100"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-red-500">
                    🔴 EN VIVO · Jornada {match.round}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="flex-1 text-sm font-bold text-stone-800 truncate">
                    {match.home_team?.name}
                  </span>
                  <span className="rounded-lg bg-red-600 px-3 py-1 font-mono text-lg font-black text-white">
                    {match.home_score} – {match.away_score}
                  </span>
                  <span className="flex-1 text-right text-sm font-bold text-stone-800 truncate">
                    {match.away_team?.name}
                  </span>
                </div>
                <p className="mt-2 text-right text-xs font-semibold text-red-600 group-hover:underline">
                  Controlar →
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* All matches by tournament */}
      {grouped.length === 0 ? (
        <div className="rounded-xl border bg-white p-8 text-center text-gray-500 shadow-sm">
          <p className="text-4xl mb-3">🏆</p>
          <p className="font-semibold text-gray-700">No hay torneos cargados aún</p>
          <p className="mt-1 text-sm">
            Primero{' '}
            <Link href="/dashboard/tournaments" className="text-uv3-green-dark underline hover:no-underline">
              crea un torneo e inscribe equipos
            </Link>
            , luego genera el fixture para que aparezcan los partidos aquí.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map(({ tournament, matches: tMatches }) => (
            <section key={tournament.id}>
              <div className="mb-4 flex items-center gap-3 border-b-2 border-uv3-green-dark/10 pb-3">
                <SportBadge sport={tournament.sport ?? 'futbol'} />
                <h2 className="text-xl font-bold text-uv3-green-dark">{tournament.name}</h2>
                <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs text-stone-500">
                  {tMatches.length} partido{tMatches.length !== 1 ? 's' : ''}
                </span>
                <Link
                  href={`/tournaments/${tournament.id}`}
                  className="ml-auto text-xs font-semibold text-uv3-green hover:underline"
                  target="_blank"
                >
                  Ver público ↗
                </Link>
              </div>

              {tMatches.length === 0 ? (
                <div className="rounded-lg border bg-white px-5 py-4 text-sm text-gray-500 shadow-sm">
                  No hay partidos generados para este torneo.{' '}
                  <Link
                    href="/dashboard/tournaments"
                    className="font-semibold text-uv3-green-dark hover:underline"
                  >
                    Generar fixture →
                  </Link>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {tMatches.map((match) => {
                    const badge = STATUS_BADGE[match.status] ?? STATUS_BADGE.scheduled;
                    const isLive = match.status === 'playing';
                    const formattedDate = match.date_time
                      ? new Intl.DateTimeFormat('es-PE', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        }).format(new Date(match.date_time))
                      : 'Sin fecha';

                    return (
                      <Link
                        key={match.id}
                        href={`/dashboard/matches/${match.id}`}
                        className={`group block rounded-xl border p-4 transition-all hover:shadow-md ${
                          isLive
                            ? 'border-red-300 bg-red-50 hover:shadow-red-100'
                            : 'border-stone-200 bg-white hover:border-uv3-green/30'
                        }`}
                      >
                        {/* Top row */}
                        <div className="mb-3 flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                            Jornada {match.round}
                          </span>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${badge.className}`}
                          >
                            {badge.label}
                          </span>
                        </div>

                        {/* Score row */}
                        <div className="flex items-center justify-between gap-2">
                          <span className="flex-1 truncate text-sm font-bold text-stone-800">
                            {match.home_team?.name ?? 'Local'}
                          </span>
                          <div
                            className={`rounded-lg px-3 py-1 font-mono text-base font-black ${
                              isLive
                                ? 'bg-red-600 text-white'
                                : match.status === 'completed'
                                ? 'bg-stone-200 text-stone-700'
                                : 'bg-stone-100 text-stone-400'
                            }`}
                          >
                            {match.status !== 'scheduled'
                              ? `${match.home_score} – ${match.away_score}`
                              : 'vs'}
                          </div>
                          <span className="flex-1 truncate text-right text-sm font-bold text-stone-800">
                            {match.away_team?.name ?? 'Visita'}
                          </span>
                        </div>

                        {/* Footer */}
                        <div className="mt-3 flex items-center justify-between border-t border-stone-100 pt-2 text-[10px] text-stone-500">
                          <span>📍 {match.venue?.name ?? 'Cancha por definir'}</span>
                          <span>{formattedDate}</span>
                        </div>

                        <p className="mt-1 text-right text-[10px] font-semibold text-uv3-green opacity-0 transition-opacity group-hover:opacity-100">
                          Controlar marcador →
                        </p>
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
