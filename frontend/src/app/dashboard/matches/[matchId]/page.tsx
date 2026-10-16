import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/app/auth/actions';
import { createClient } from '@/utils/supabase/server';
import { MatchScoreControl } from '@/components/MatchScoreControl';
import { SportBadge } from '@/components/SportBadge';
import { scheduleMatchAction } from '@/app/actions/fixtures';
import type { Match, Tournament, Venue } from '@/types';

interface PageProps {
  params: Promise<{ matchId: string }>;
}

const STATUS_DISPLAY: Record<Match['status'], { label: string; color: string }> = {
  scheduled: { label: 'Programado', color: 'text-gray-600' },
  playing: { label: '🔴 En Curso', color: 'text-red-600' },
  completed: { label: '✅ Finalizado', color: 'text-green-700' },
  cancelled: { label: 'Cancelado', color: 'text-red-400' },
};

async function scheduleMatchFormAction(formData: FormData) {
  'use server';
  await scheduleMatchAction(formData);
}

export default async function MatchControlPage({ params }: PageProps) {
  const { matchId } = await params;

  const user = await getCurrentUser();
  if (!user || !['admin', 'organizer', 'referee'].includes(user.role)) {
    redirect('/login?message=Se requieren permisos de administrador, organizador o árbitro.');
  }

  let matchData: any = null;
  let venuesData: any = null;

  try {
    const supabase = await createClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('matches')
        .select(
          `*, 
           home_team:teams!home_team_id(id, name, logo_url),
           away_team:teams!away_team_id(id, name, logo_url),
           venue:venues(id, name),
           tournament:tournaments(id, name, sport, status),
           referee:users!referee_id(id, full_name)`
        )
        .eq('id', matchId)
        .single();

      if (!error && data) {
        matchData = data;
      }

      const { data: vData } = await supabase.from('venues').select('id, name').order('name');
      venuesData = vData;
    }
  } catch (err) {
    console.warn('Error al consultar partido en Supabase:', err);
  }

  if (!matchData && (matchId === 'm1' || matchId === 'm2')) {
    matchData = {
      id: matchId,
      tournament_id: 'tour-1',
      home_team_id: 't1',
      away_team_id: 't2',
      venue_id: 'v1',
      date_time: new Date(Date.now() + 86400000).toISOString(),
      referee_id: null,
      status: matchId === 'm1' ? 'playing' : 'scheduled',
      home_score: matchId === 'm1' ? 2 : 0,
      away_score: matchId === 'm1' ? 1 : 0,
      round: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      home_team: { id: 't1', name: 'Real Unidad Vecinal 3', logo_url: null },
      away_team: { id: 't2', name: 'Deportivo Block 5 FC', logo_url: null },
      venue: { id: 'v1', name: 'Cancha Sintética Principal' },
      tournament: { id: 'tour-1', name: 'Campeonato Apertura Inter-Bloques 2026', sport: 'futbol', status: 'active' },
      referee: null,
    };
  }

  if (!matchData) notFound();

  const match = matchData as Match & {
    tournament?: Pick<Tournament, 'id' | 'name' | 'sport' | 'status'>;
  };

  const venues = (venuesData ?? [
    { id: 'v1', name: 'Cancha Sintética Principal' },
    { id: 'v2', name: 'Losa Deportiva Sector A' },
  ]) as Pick<Venue, 'id' | 'name'>[];

  const statusDisplay = STATUS_DISPLAY[match.status];
  const formattedDate = match.date_time
    ? new Intl.DateTimeFormat('es-PE', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(match.date_time))
    : 'Fecha por definir';

  // Format date_time for datetime-local input
  const dateTimeLocal = match.date_time
    ? new Date(match.date_time).toISOString().slice(0, 16)
    : '';

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-12">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-gray-500">
        <Link href="/dashboard" className="hover:text-uv3-green-dark">Panel</Link>
        <span>›</span>
        <Link href="/dashboard/matches" className="hover:text-uv3-green-dark">Partidos</Link>
        <span>›</span>
        <span className="font-semibold text-uv3-green-dark">Control de partido</span>
      </nav>

      {/* Match Header */}
      <section className="mb-8 rounded-2xl bg-gradient-to-br from-uv3-green-dark to-uv3-green p-8 text-white shadow-lg">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            {match.tournament && (
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <SportBadge sport={match.tournament.sport ?? 'futbol'} size="sm" />
                <span className="text-xs font-semibold text-white/70">
                  {match.tournament.name}
                </span>
              </div>
            )}
            <p className="text-sm font-semibold uppercase tracking-wider text-white/60">
              Jornada {match.round}
            </p>
            <h1 className="mt-1 text-2xl font-black sm:text-3xl">
              {match.home_team?.name ?? 'Local'} vs {match.away_team?.name ?? 'Visita'}
            </h1>
            <p className={`mt-2 text-sm font-bold ${statusDisplay.color.replace('text-', 'text-white/')} text-white/80`}>
              Estado actual: <span className="font-black">{statusDisplay.label}</span>
            </p>
            <p className="mt-1 text-xs text-white/60">📅 {formattedDate}</p>
            {match.venue && <p className="mt-0.5 text-xs text-white/60">📍 {match.venue.name}</p>}
            {match.referee && (
              <p className="mt-0.5 text-xs text-white/60">👤 Árbitro: {match.referee.full_name}</p>
            )}
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="rounded-xl bg-white/10 px-6 py-3 text-center backdrop-blur-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-white/60">Marcador actual</p>
              <p className="mt-1 font-mono text-4xl font-black">
                {match.home_score} – {match.away_score}
              </p>
            </div>
            <Link
              href={`/tournaments/${match.tournament_id}`}
              target="_blank"
              className="text-xs font-semibold text-white/70 hover:text-white underline"
            >
              Ver página pública ↗
            </Link>
          </div>
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        {/* Left: Score Control */}
        <section>
          <div className="mb-4">
            <h2 className="text-xl font-bold text-uv3-green-dark">Control de Marcador</h2>
            <p className="mt-1 text-sm text-gray-600">
              Usa los botones para ajustar el score. Recuerda guardar después de cada cambio.
            </p>
          </div>
          <MatchScoreControl match={match} />
        </section>

        {/* Right: Schedule & Info */}
        <aside className="space-y-6">
          {/* Schedule form */}
          <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-gray-600">
              Programar partido
            </h3>
            <form action={scheduleMatchFormAction} className="space-y-4">
              <input type="hidden" name="match_id" value={match.id} />

              <label className="grid gap-1.5">
                <span className="text-xs font-semibold text-gray-700">Fecha y hora</span>
                <input
                  id="match-datetime"
                  type="datetime-local"
                  name="date_time"
                  defaultValue={dateTimeLocal}
                  className="rounded-lg border px-3 py-2 text-sm outline-none focus:border-uv3-green"
                />
              </label>

              {venues.length > 0 && (
                <label className="grid gap-1.5">
                  <span className="text-xs font-semibold text-gray-700">Sede / Cancha</span>
                  <select
                    id="match-venue"
                    name="venue_id"
                    defaultValue={match.venue_id ?? ''}
                    className="rounded-lg border px-3 py-2 text-sm outline-none focus:border-uv3-green"
                  >
                    <option value="">Sin sede asignada</option>
                    {venues.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              <button
                id="save-schedule"
                type="submit"
                className="w-full rounded-lg border border-uv3-green px-4 py-2 text-sm font-semibold text-uv3-green-dark transition-colors hover:bg-uv3-green hover:text-white"
              >
                Guardar programación
              </button>
            </form>
          </div>

          {/* Quick Stats */}
          <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-gray-600">
              Información del partido
            </h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Torneo</dt>
                <dd className="font-semibold text-gray-800">{match.tournament?.name ?? '—'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Jornada</dt>
                <dd className="font-semibold text-gray-800">{match.round}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Estado</dt>
                <dd className={`font-bold ${statusDisplay.color}`}>{statusDisplay.label}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Local</dt>
                <dd className="font-semibold text-gray-800">{match.home_team?.name ?? '—'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Visita</dt>
                <dd className="font-semibold text-gray-800">{match.away_team?.name ?? '—'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Árbitro</dt>
                <dd className="font-semibold text-gray-800">{match.referee?.full_name ?? 'Sin asignar'}</dd>
              </div>
            </dl>
          </div>

          {/* Navigation */}
          <div className="flex gap-3">
            <Link
              href="/dashboard/matches"
              className="flex-1 rounded-lg border border-stone-300 px-4 py-2.5 text-center text-sm font-semibold text-stone-600 transition-colors hover:border-uv3-green hover:text-uv3-green-dark"
            >
              ← Volver a partidos
            </Link>
            <Link
              href={`/tournaments/${match.tournament_id}`}
              target="_blank"
              className="flex-1 rounded-lg bg-uv3-gold px-4 py-2.5 text-center text-sm font-semibold text-uv3-green-dark transition-colors hover:bg-uv3-gold/90"
            >
              Vista pública ↗
            </Link>
          </div>
        </aside>
      </div>
    </main>
  );
}
