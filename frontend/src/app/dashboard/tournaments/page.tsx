import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';
import { getCurrentUser } from '@/app/auth/actions';
import {
  createTournamentAction,
  deleteTournamentAction,
  registerTeamInTournamentFormAction,
  updateTournamentAction,
} from '@/app/actions/tournaments';
import { generateTournamentFixtureAction } from '@/app/actions/fixtures';
import type { Standing, Team, Tournament } from '@/types';

const formatLabel: Record<Tournament['format'], string> = {
  liga: 'Liga',
  grupos: 'Grupos',
  eliminacion: 'Eliminación',
};

const statusLabel: Record<Tournament['status'], string> = {
  draft: 'Borrador',
  active: 'Activo',
  finished: 'Finalizado',
};

async function createTournamentFormAction(formData: FormData) {
  'use server';
  await createTournamentAction(formData);
}

async function updateTournamentFormAction(tournamentId: string, formData: FormData) {
  'use server';
  await updateTournamentAction(tournamentId, formData);
}

async function deleteTournamentFormAction(tournamentId: string) {
  'use server';
  await deleteTournamentAction(tournamentId);
}

async function generateTournamentFixtureFormAction(tournamentId: string) {
  'use server';
  await generateTournamentFixtureAction(tournamentId);
}

async function registerTeamFormAction(formData: FormData) {
  'use server';
  await registerTeamInTournamentFormAction(formData);
}

export default async function TournamentAdminPage() {
  const user = await getCurrentUser();
  const supabase = await createClient();

  const [
    { data: tournamentsData, error: tournamentsError },
    { data: teamsData, error: teamsError },
  ] = await Promise.all([
    supabase.from('tournaments').select('*').order('created_at', { ascending: false }),
    supabase.from('teams').select('id, name, logo_url').order('name'),
  ]);

  if (tournamentsError) {
    return <p className="px-6 py-12 text-red-600">Error al cargar campeonatos.</p>;
  }

  if (teamsError) {
    return <p className="px-6 py-12 text-red-600">Error al cargar equipos.</p>;
  }

  const tournaments = (tournamentsData ?? []) as Tournament[];
  const teams = (teamsData ?? []) as Pick<Team, 'id' | 'name' | 'logo_url'>[];

  const tournamentsWithData = await Promise.all(
    tournaments.map(async (tournament) => {
      const [{ data: standingsData }, { count: matchesCount }] = await Promise.all([
        supabase
          .from('standings')
          .select('*, team:teams(id, name, logo_url)')
          .eq('tournament_id', tournament.id)
          .order('points', { ascending: false })
          .order('goal_difference', { ascending: false })
          .order('goals_for', { ascending: false }),
        supabase
          .from('matches')
          .select('*', { count: 'exact', head: true })
          .eq('tournament_id', tournament.id),
      ]);

      return {
        ...tournament,
        standings: (standingsData ?? []) as Standing[],
        matchesCount: matchesCount ?? 0,
      };
    })
  );

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-6 py-12">
      <section className="mb-8 rounded-2xl bg-gradient-to-br from-uv3-green-dark to-uv3-green p-8 text-white shadow-lg">
        <p className="text-sm uppercase tracking-wide text-white/70">Módulo de campeonatos</p>
        <h1 className="mt-2 text-3xl font-bold">Organizar torneos</h1>
        <p className="mt-3 max-w-3xl text-white/80">
          Aquí se cargan los campeonatos, se inscriben equipos y se genera el calendario de partidos.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/dashboard"
            className="rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/20"
          >
            Volver al panel
          </Link>
          <Link
            href="/tournaments"
            className="rounded-lg bg-uv3-gold px-4 py-2 text-sm font-semibold text-uv3-green-dark transition-colors hover:bg-uv3-gold/90"
          >
            Ver vista pública
          </Link>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <form action={createTournamentFormAction} className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-uv3-green-dark">Nuevo campeonato</h2>
            <p className="mt-1 text-sm text-gray-600">
              Crea un torneo nuevo y luego agrega equipos para empezar a armarlo.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm font-medium text-gray-700">Nombre</span>
              <input
                name="name"
                required
                className="rounded-lg border px-3 py-2 outline-none focus:border-uv3-green"
                placeholder="Campeonato Apertura 2026"
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium text-gray-700">Categoría</span>
              <input
                name="category"
                required
                defaultValue="libre"
                className="rounded-lg border px-3 py-2 outline-none focus:border-uv3-green"
                placeholder="libre"
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium text-gray-700">Formato</span>
              <select
                name="format"
                defaultValue="liga"
                className="rounded-lg border px-3 py-2 outline-none focus:border-uv3-green"
              >
                <option value="liga">Liga</option>
                <option value="grupos">Grupos</option>
                <option value="eliminacion">Eliminación</option>
              </select>
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium text-gray-700">Inicio</span>
              <input
                name="start_date"
                type="date"
                required
                className="rounded-lg border px-3 py-2 outline-none focus:border-uv3-green"
              />
            </label>
            <label className="grid gap-2 md:col-span-2">
              <span className="text-sm font-medium text-gray-700">Fin</span>
              <input
                name="end_date"
                type="date"
                required
                className="rounded-lg border px-3 py-2 outline-none focus:border-uv3-green"
              />
            </label>
            <label className="grid gap-2 md:col-span-2">
              <span className="text-sm font-medium text-gray-700">Descripción</span>
              <textarea
                name="description"
                rows={4}
                className="rounded-lg border px-3 py-2 outline-none focus:border-uv3-green"
                placeholder="Describe el campeonato y sus reglas básicas."
              />
            </label>
          </div>

          <button
            type="submit"
            className="mt-6 rounded-lg bg-uv3-green-dark px-5 py-2.5 font-semibold text-white transition-colors hover:bg-uv3-green"
          >
            Guardar campeonato
          </button>
        </form>

        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-uv3-green-dark">Resumen</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg bg-uv3-bg px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-gray-500">Equipos</p>
              <p className="mt-2 text-2xl font-bold text-uv3-green-dark">{teams.length}</p>
            </div>
            <div className="rounded-lg bg-uv3-bg px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-gray-500">Campeonatos</p>
              <p className="mt-2 text-2xl font-bold text-uv3-green-dark">{tournaments.length}</p>
            </div>
            <div className="rounded-lg bg-uv3-bg px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-gray-500">Cargado por</p>
              <p className="mt-2 text-sm font-semibold text-uv3-green-dark">
                {user?.full_name || user?.username || 'Usuario'}
              </p>
            </div>
          </div>
          <p className="mt-4 text-sm text-gray-600">
            Este módulo sirve para dejar cada campeonato con sus datos base antes de generar partidos y tabla.
          </p>
        </div>
      </section>

      <section className="mt-10 space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-uv3-green-dark">Campeonatos cargados</h2>
          <p className="mt-1 text-sm text-gray-600">
            Cada bloque permite cambiar la información del torneo, inscribir equipos y generar el fixture.
          </p>
        </div>

        {tournamentsWithData.length === 0 ? (
          <div className="rounded-lg border bg-white p-6 text-sm text-gray-600 shadow-sm">
            Todavía no hay campeonatos cargados.
          </div>
        ) : (
          tournamentsWithData.map((tournament) => {
            const registeredTeamIds = tournament.standings.map((standing) => standing.team_id);
            const availableTeams = teams.filter((team) => !registeredTeamIds.includes(team.id));

            return (
              <article key={tournament.id} className="rounded-lg border bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wide">
                      <span className="rounded-full bg-uv3-green/10 px-3 py-1 text-uv3-green-dark">
                        {statusLabel[tournament.status]}
                      </span>
                      <span className="rounded-full bg-uv3-gold/20 px-3 py-1 text-uv3-green-dark">
                        {formatLabel[tournament.format]}
                      </span>
                      <span className="rounded-full bg-gray-100 px-3 py-1 text-gray-700">
                        {tournament.category}
                      </span>
                    </div>
                    <h3 className="text-2xl font-semibold text-uv3-green-dark">{tournament.name}</h3>
                    <p className="max-w-3xl text-sm text-gray-600">
                      {tournament.description || 'Sin descripción.'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {tournament.start_date || 'Sin inicio'} - {tournament.end_date || 'Sin fin'}
                      {' · '}
                      {tournament.matchesCount} partidos
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <form action={generateTournamentFixtureFormAction.bind(null, tournament.id)}>
                      <button
                        type="submit"
                        className="rounded-lg border border-uv3-green px-4 py-2 text-sm font-semibold text-uv3-green-dark transition-colors hover:bg-uv3-green hover:text-white"
                      >
                        Generar fixture
                      </button>
                    </form>
                    <form action={deleteTournamentFormAction.bind(null, tournament.id)}>
                      <button
                        type="submit"
                        className="rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50"
                      >
                        Eliminar
                      </button>
                    </form>
                  </div>
                </div>

                <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                  <form action={updateTournamentFormAction.bind(null, tournament.id)} className="rounded-lg bg-uv3-bg p-4">
                    <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-600">
                      Editar información
                    </h4>
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <label className="grid gap-2">
                        <span className="text-sm font-medium text-gray-700">Nombre</span>
                        <input
                          name="name"
                          defaultValue={tournament.name}
                          required
                          className="rounded-lg border px-3 py-2 outline-none focus:border-uv3-green"
                        />
                      </label>
                      <label className="grid gap-2">
                        <span className="text-sm font-medium text-gray-700">Categoría</span>
                        <input
                          name="category"
                          defaultValue={tournament.category}
                          required
                          className="rounded-lg border px-3 py-2 outline-none focus:border-uv3-green"
                        />
                      </label>
                      <label className="grid gap-2">
                        <span className="text-sm font-medium text-gray-700">Formato</span>
                        <select
                          name="format"
                          defaultValue={tournament.format}
                          className="rounded-lg border px-3 py-2 outline-none focus:border-uv3-green"
                        >
                          <option value="liga">Liga</option>
                          <option value="grupos">Grupos</option>
                          <option value="eliminacion">Eliminación</option>
                        </select>
                      </label>
                      <label className="grid gap-2">
                        <span className="text-sm font-medium text-gray-700">Estado</span>
                        <select
                          name="status"
                          defaultValue={tournament.status}
                          className="rounded-lg border px-3 py-2 outline-none focus:border-uv3-green"
                        >
                          <option value="draft">Borrador</option>
                          <option value="active">Activo</option>
                          <option value="finished">Finalizado</option>
                        </select>
                      </label>
                      <label className="grid gap-2">
                        <span className="text-sm font-medium text-gray-700">Inicio</span>
                        <input
                          name="start_date"
                          type="date"
                          defaultValue={tournament.start_date ?? ''}
                          required
                          className="rounded-lg border px-3 py-2 outline-none focus:border-uv3-green"
                        />
                      </label>
                      <label className="grid gap-2">
                        <span className="text-sm font-medium text-gray-700">Fin</span>
                        <input
                          name="end_date"
                          type="date"
                          defaultValue={tournament.end_date ?? ''}
                          required
                          className="rounded-lg border px-3 py-2 outline-none focus:border-uv3-green"
                        />
                      </label>
                      <label className="grid gap-2 md:col-span-2">
                        <span className="text-sm font-medium text-gray-700">Descripción</span>
                        <textarea
                          name="description"
                          rows={3}
                          defaultValue={tournament.description ?? ''}
                          className="rounded-lg border px-3 py-2 outline-none focus:border-uv3-green"
                        />
                      </label>
                    </div>
                    <button
                      type="submit"
                      className="mt-4 rounded-lg bg-uv3-green-dark px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-uv3-green"
                    >
                      Guardar cambios
                    </button>
                  </form>

                  <div className="space-y-4 rounded-lg border border-gray-200 p-4">
                    <div>
                      <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-600">
                        Inscribir equipo
                      </h4>
                      <p className="mt-1 text-sm text-gray-600">
                        Agrega equipos al campeonato antes de generar el fixture.
                      </p>
                    </div>

                    {availableTeams.length === 0 ? (
                      <p className="text-sm text-gray-600">No quedan equipos disponibles para inscribir.</p>
                    ) : (
                      <form action={registerTeamFormAction} className="grid gap-3">
                        <input type="hidden" name="tournament_id" value={tournament.id} />
                        <label className="grid gap-2">
                          <span className="text-sm font-medium text-gray-700">Equipo</span>
                          <select
                            name="team_id"
                            required
                            defaultValue=""
                            className="rounded-lg border px-3 py-2 outline-none focus:border-uv3-green"
                          >
                            <option value="" disabled>
                              Selecciona un equipo
                            </option>
                            {availableTeams.map((team) => (
                              <option key={team.id} value={team.id}>
                                {team.name}
                              </option>
                            ))}
                          </select>
                        </label>
                        <button
                          type="submit"
                          className="rounded-lg border border-uv3-green px-4 py-2 text-sm font-semibold text-uv3-green-dark transition-colors hover:bg-uv3-green hover:text-white"
                        >
                          Inscribir
                        </button>
                      </form>
                    )}

                    <div>
                      <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-600">
                        Equipos inscritos
                      </h4>
                      {tournament.standings.length === 0 ? (
                        <p className="text-sm text-gray-600">Todavía no hay equipos inscritos.</p>
                      ) : (
                        <ul className="space-y-2">
                          {tournament.standings.map((standing) => (
                            <li
                              key={standing.id}
                              className="flex items-center justify-between rounded-md bg-uv3-bg px-3 py-2 text-sm"
                            >
                              <span className="font-medium text-gray-800">{standing.team?.name ?? 'Equipo'}</span>
                              <span className="text-gray-600">{standing.points} pts</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </section>
    </main>
  );
}
