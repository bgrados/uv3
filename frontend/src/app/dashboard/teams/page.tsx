import { SmartImage } from '@/components/SmartImage';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { createTeamAction, deleteTeamAction } from '@/app/actions/teams';
import { ConfirmSubmitButton } from '@/components/ConfirmSubmitButton';
import type { Team, User } from '@/types';

interface PageProps {
  searchParams: Promise<{ ok?: string; error?: string }>;
}

interface TeamRow extends Pick<Team, 'id' | 'name' | 'logo_url' | 'delegate_id'> {
  delegate?: Pick<User, 'id' | 'full_name' | 'email'> | null;
  players?: { count: number }[];
}

async function createTeamFormAction(formData: FormData) {
  'use server';
  const result = await createTeamAction(formData);
  if (!result.success) {
    redirect(`/dashboard/teams?error=${encodeURIComponent(result.error ?? 'No se pudo crear el equipo.')}`);
  }
  redirect('/dashboard/teams?ok=Equipo creado correctamente.');
}

async function deleteTeamFormAction(formData: FormData) {
  'use server';
  const id = formData.get('team_id') as string;
  const result = await deleteTeamAction(id);
  if (!result.success) {
    redirect(`/dashboard/teams?error=${encodeURIComponent(result.error ?? 'No se pudo eliminar el equipo.')}`);
  }
  redirect('/dashboard/teams?ok=Equipo eliminado.');
}

export default async function TeamsAdminPage({ searchParams }: PageProps) {
  const { ok, error } = await searchParams;

  let teams: TeamRow[] = [];
  let delegates: Pick<User, 'id' | 'full_name' | 'email'>[] = [];

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const { data: profile } = auth.user ? await supabase.from('users').select('id, role').eq('id', auth.user.id).maybeSingle() : { data: null };
  const isDelegate = profile?.role === 'delegate';
  const currentUserId = auth.user?.id ?? null;

  let teamsQuery = supabase
    .from('teams')
    .select('id, name, logo_url, delegate_id, delegate:users!delegate_id(id, full_name, email), players(count)')
    .order('name');
  if (isDelegate && currentUserId) {
    teamsQuery = teamsQuery.eq('delegate_id', currentUserId);
  }

  const delegatesQuery = supabase
    .from('users')
    .select('id, full_name, email')
    .eq('role', 'delegate')
    .order('full_name');

  const [teamsResult, delegatesResult] = await Promise.all([teamsQuery, delegatesQuery]);

  if (!teamsResult.error && teamsResult.data) {
    teams = teamsResult.data as unknown as TeamRow[];
  }
  if (!delegatesResult.error && delegatesResult.data) {
    delegates = delegatesResult.data as Pick<User, 'id' | 'full_name' | 'email'>[];
  }

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-10">
      <section className="mb-8 rounded-2xl bg-gradient-to-br from-uv3-green-dark to-uv3-green p-8 text-white shadow-lg">
        <p className="text-sm uppercase tracking-wide text-white/70">Módulo de equipos</p>
        <h1 className="mt-2 text-3xl font-bold">Equipos y plantillas</h1>
        <p className="mt-3 max-w-3xl text-white/80">
          Registra los equipos participantes, asigna a su delegado y administra la plantilla de
          jugadores (DNI, dorsal, posición y foto) de cada uno.
        </p>
      </section>

      {ok && (
        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800">
          ✅ {ok}
        </div>
      )}
      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
          ⚠️ {error}
        </div>
      )}

      <section className={`grid gap-6 ${isDelegate ? '' : 'lg:grid-cols-[0.9fr_1.1fr]'}`}>
        {!isDelegate && (
          <form action={createTeamFormAction} className="h-fit rounded-xl border bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-uv3-green-dark">Nuevo equipo</h2>
            <p className="mt-1 text-sm text-gray-600">
              El nombre debe ser único dentro de la plataforma.
            </p>

            <div className="mt-5 grid gap-4">
              <label className="grid gap-2">
                <span className="text-sm font-medium text-gray-700">Nombre del equipo</span>
                <input
                  name="name"
                  required
                  minLength={3}
                  placeholder="Deportivo Block 7"
                  className="rounded-lg border px-3 py-2 outline-none focus:border-uv3-green"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-gray-700">Delegado (opcional)</span>
                <select
                  name="delegate_id"
                  defaultValue=""
                  className="rounded-lg border px-3 py-2 outline-none focus:border-uv3-green"
                >
                  <option value="">Sin delegado asignado</option>
                  {delegates.map((delegate) => (
                    <option key={delegate.id} value={delegate.id}>
                      {delegate.full_name || delegate.email}
                    </option>
                  ))}
                </select>
                {delegates.length === 0 && (
                  <span className="text-xs text-gray-500">
                    Aún no hay usuarios con rol de delegado registrados.
                  </span>
                )}
              </label>
            </div>

            <button
              type="submit"
              className="mt-6 w-full rounded-lg bg-uv3-green-dark px-5 py-2.5 font-semibold text-white transition-colors hover:bg-uv3-green"
            >
              Crear equipo
            </button>
          </form>
        )}

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-uv3-green-dark">
              Equipos registrados
            </h2>
            <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-600">
              {teams.length} equipo{teams.length !== 1 ? 's' : ''}
            </span>
          </div>

          {teams.length === 0 ? (
            <div className="rounded-xl border bg-white p-8 text-center shadow-sm">
              <p className="text-4xl">👥</p>
              <p className="mt-3 font-semibold text-gray-700">Todavía no hay equipos</p>
              <p className="mt-1 text-sm text-gray-500">
                Usa el formulario de la izquierda para registrar el primero.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {teams.map((team) => {
                const playerCount = team.players?.[0]?.count ?? 0;
                return (
                  <li
                    key={team.id}
                    className="flex flex-wrap items-center gap-4 rounded-xl border bg-white p-4 shadow-sm"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-uv3-bg">
                      {team.logo_url ? (
                        <SmartImage
                          src={team.logo_url}
                          alt={team.name}
                          width={48}
                          height={48}
                          className="h-12 w-12 object-cover"
                        />
                      ) : (
                        <span className="text-lg">⚽</span>
                      )}
                    </div>

                    <div className="min-w-[10rem] flex-1">
                      <p className="font-semibold text-stone-800">{team.name}</p>
                      <p className="text-xs text-gray-500">
                        {playerCount} jugador{playerCount !== 1 ? 'es' : ''}
                        {team.delegate
                          ? ` · Delegado: ${team.delegate.full_name || team.delegate.email}`
                          : ' · Sin delegado'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/dashboard/teams/${team.id}`}
                        className="rounded-lg border border-uv3-green px-3 py-1.5 text-xs font-semibold text-uv3-green-dark transition-colors hover:bg-uv3-green hover:text-white"
                      >
                        Gestionar plantilla
                      </Link>
                      {!isDelegate && (
                        <form action={deleteTeamFormAction}>
                          <input type="hidden" name="team_id" value={team.id} />
                          <ConfirmSubmitButton
                            label="Eliminar"
                            pendingLabel="Eliminando..."
                            confirmMessage={`¿Eliminar el equipo "${team.name}"? También se eliminarán sus jugadores y su inscripción en torneos.`}
                          />
                        </form>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}
