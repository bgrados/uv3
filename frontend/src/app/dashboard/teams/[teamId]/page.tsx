import Image from 'next/image';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import {
  updateTeamAction,
  uploadTeamLogoAction,
  getTeamByIdAction,
} from '@/app/actions/teams';
import {
  createPlayerAction,
  updatePlayerAction,
  deletePlayerAction,
  uploadPlayerPhotoAction,
} from '@/app/actions/players';
import { ConfirmSubmitButton } from '@/components/ConfirmSubmitButton';
import type { Player, Team, User } from '@/types';

interface PageProps {
  params: Promise<{ teamId: string }>;
  searchParams: Promise<{ ok?: string; error?: string }>;
}

const POSITIONS: { value: NonNullable<Player['position']>; label: string }[] = [
  { value: 'arquero', label: 'Arquero' },
  { value: 'defensa', label: 'Defensa' },
  { value: 'mediocampista', label: 'Mediocampista' },
  { value: 'delantero', label: 'Delantero' },
];

function feedbackUrl(teamId: string, type: 'ok' | 'error', message: string) {
  return `/dashboard/teams/${teamId}?${type}=${encodeURIComponent(message)}`;
}

async function uploadIfPresent(
  formData: FormData,
  uploader: (fd: FormData) => Promise<{ success: boolean; data?: string; error?: string }>
): Promise<string | null> {
  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) return null;

  const uploaded = await uploader(formData);
  return uploaded.success ? uploaded.data ?? null : null;
}

export default async function TeamDetailPage({ params, searchParams }: PageProps) {
  const { teamId } = await params;
  const { ok, error } = await searchParams;

  const teamResult = await getTeamByIdAction(teamId);
  if (!teamResult.success || !teamResult.data) {
    notFound();
  }

  const team = teamResult.data as Team & { players?: Player[] };
  const players = [...(team.players ?? [])].sort(
    (a, b) => (a.jersey_number ?? 99) - (b.jersey_number ?? 99)
  );

  const supabase = await createClient();
  const { data: delegatesData } = await supabase
    .from('users')
    .select('id, full_name, email')
    .eq('role', 'delegate')
    .order('full_name');

  const delegates = (delegatesData ?? []) as Pick<User, 'id' | 'full_name' | 'email'>[];

  async function updateTeamFormAction(formData: FormData) {
    'use server';
    const logoUrl = await uploadIfPresent(formData, uploadTeamLogoAction);
    if (logoUrl) formData.set('logo_url', logoUrl);

    const result = await updateTeamAction(teamId, formData);
    if (!result.success) {
      redirect(feedbackUrl(teamId, 'error', result.error ?? 'No se pudo actualizar el equipo.'));
    }
    redirect(feedbackUrl(teamId, 'ok', 'Datos del equipo actualizados.'));
  }

  async function createPlayerFormAction(formData: FormData) {
    'use server';
    const photoUrl = await uploadIfPresent(formData, uploadPlayerPhotoAction);
    if (photoUrl) formData.set('photo_url', photoUrl);

    const result = await createPlayerAction(formData);
    if (!result.success) {
      redirect(feedbackUrl(teamId, 'error', result.error ?? 'No se pudo registrar al jugador.'));
    }
    redirect(feedbackUrl(teamId, 'ok', 'Jugador registrado en la plantilla.'));
  }

  async function updatePlayerFormAction(playerId: string, formData: FormData) {
    'use server';
    const photoUrl = await uploadIfPresent(formData, uploadPlayerPhotoAction);
    if (photoUrl) formData.set('photo_url', photoUrl);

    const result = await updatePlayerAction(playerId, formData);
    if (!result.success) {
      redirect(feedbackUrl(teamId, 'error', result.error ?? 'No se pudo actualizar al jugador.'));
    }
    redirect(feedbackUrl(teamId, 'ok', 'Jugador actualizado.'));
  }

  async function deletePlayerFormAction(formData: FormData) {
    'use server';
    const playerId = formData.get('player_id') as string;
    const result = await deletePlayerAction(playerId, teamId);
    if (!result.success) {
      redirect(feedbackUrl(teamId, 'error', result.error ?? 'No se pudo eliminar al jugador.'));
    }
    redirect(feedbackUrl(teamId, 'ok', 'Jugador eliminado de la plantilla.'));
  }

  const inputClass = 'rounded-lg border px-3 py-2 text-sm outline-none focus:border-uv3-green';

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-10">
      <nav className="mb-5 flex items-center gap-2 text-sm text-gray-500">
        <Link href="/dashboard/teams" className="hover:text-uv3-green-dark">
          Equipos
        </Link>
        <span>›</span>
        <span className="font-semibold text-uv3-green-dark">{team.name}</span>
      </nav>

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

      <section className="mb-8 flex flex-wrap items-center gap-5 rounded-2xl bg-gradient-to-br from-uv3-green-dark to-uv3-green p-8 text-white shadow-lg">
        <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-xl border-2 border-white/30 bg-white/10">
          {team.logo_url ? (
            <Image
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
            {team.delegate
              ? `Delegado: ${team.delegate.full_name || team.delegate.email}`
              : 'Sin delegado asignado'}
          </p>
          <p className="mt-0.5 text-sm text-white/70">
            {players.length} jugador{players.length !== 1 ? 'es' : ''} en la plantilla
          </p>
        </div>
        <Link
          href={`/teams/${team.id}`}
          target="_blank"
          className="ml-auto rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/20"
        >
          Ver ficha pública ↗
        </Link>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        {/* Datos del equipo */}
        <form
          action={updateTeamFormAction}
          className="h-fit space-y-4 rounded-xl border bg-white p-6 shadow-sm"
        >
          <h2 className="text-lg font-semibold text-uv3-green-dark">Datos del equipo</h2>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-gray-700">Nombre</span>
            <input name="name" defaultValue={team.name} required minLength={3} className={inputClass} />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-gray-700">Delegado</span>
            <select name="delegate_id" defaultValue={team.delegate_id ?? ''} className={inputClass}>
              <option value="">Sin delegado asignado</option>
              {delegates.map((delegate) => (
                <option key={delegate.id} value={delegate.id}>
                  {delegate.full_name || delegate.email}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-gray-700">Escudo / logo (imagen)</span>
            <input
              type="file"
              name="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="text-sm"
            />
            <span className="text-xs text-gray-500">
              Máximo 2 MB. Formatos: PNG, JPG, WEBP o SVG.
            </span>
          </label>

          <button
            type="submit"
            className="w-full rounded-lg bg-uv3-green-dark px-5 py-2.5 font-semibold text-white transition-colors hover:bg-uv3-green"
          >
            Guardar cambios
          </button>
        </form>

        {/* Plantilla */}
        <div className="space-y-4">
          <form action={createPlayerFormAction} className="rounded-xl border bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-uv3-green-dark">Registrar jugador</h2>
            <input type="hidden" name="team_id" value={team.id} />

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1.5">
                <span className="text-xs font-semibold text-gray-700">Nombres</span>
                <input name="first_name" required minLength={2} className={inputClass} />
              </label>
              <label className="grid gap-1.5">
                <span className="text-xs font-semibold text-gray-700">Apellidos</span>
                <input name="last_name" required minLength={2} className={inputClass} />
              </label>
              <label className="grid gap-1.5">
                <span className="text-xs font-semibold text-gray-700">DNI (8 dígitos)</span>
                <input
                  name="dni"
                  required
                  inputMode="numeric"
                  pattern="\d{8}"
                  maxLength={8}
                  className={inputClass}
                />
              </label>
              <label className="grid gap-1.5">
                <span className="text-xs font-semibold text-gray-700">Fecha de nacimiento</span>
                <input type="date" name="birth_date" className={inputClass} />
              </label>
              <label className="grid gap-1.5">
                <span className="text-xs font-semibold text-gray-700">Dorsal (1-99)</span>
                <input
                  name="jersey_number"
                  type="number"
                  min={1}
                  max={99}
                  required
                  className={inputClass}
                />
              </label>
              <label className="grid gap-1.5">
                <span className="text-xs font-semibold text-gray-700">Posición</span>
                <select name="position" required defaultValue="delantero" className={inputClass}>
                  {POSITIONS.map((position) => (
                    <option key={position.value} value={position.value}>
                      {position.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1.5 sm:col-span-2">
                <span className="text-xs font-semibold text-gray-700">Foto (opcional)</span>
                <input
                  type="file"
                  name="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="text-sm"
                />
              </label>
            </div>

            <button
              type="submit"
              className="mt-4 w-full rounded-lg border border-uv3-green px-5 py-2.5 font-semibold text-uv3-green-dark transition-colors hover:bg-uv3-green hover:text-white"
            >
              Añadir a la plantilla
            </button>
          </form>

          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-uv3-green-dark">
              Plantilla ({players.length})
            </h2>

            {players.length === 0 ? (
              <p className="mt-3 text-sm text-gray-500">
                Aún no hay jugadores registrados en este equipo.
              </p>
            ) : (
              <ul className="mt-4 divide-y divide-stone-100">
                {players.map((player) => (
                  <li key={player.id} className="py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-uv3-bg text-sm font-bold text-uv3-green-dark">
                        {player.photo_url ? (
                          <Image
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

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-stone-800">
                          #{player.jersey_number ?? '–'} {player.first_name} {player.last_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          DNI: {player.dni ?? '—'} · {player.position ?? 'sin posición'}
                          {player.birth_date ? ` · Nac. ${player.birth_date}` : ''}
                        </p>
                      </div>

                      <form action={deletePlayerFormAction}>
                        <input type="hidden" name="player_id" value={player.id} />
                        <ConfirmSubmitButton
                          label="Quitar"
                          pendingLabel="Quitando..."
                          confirmMessage={`¿Quitar a ${player.first_name} ${player.last_name} de la plantilla?`}
                        />
                      </form>
                    </div>

                    <details className="mt-2 text-xs">
                      <summary className="cursor-pointer font-semibold text-uv3-green">
                        Editar datos
                      </summary>
                      <form
                        action={updatePlayerFormAction.bind(null, player.id)}
                        className="mt-3 grid gap-3 sm:grid-cols-2"
                      >
                        <input type="hidden" name="team_id" value={team.id} />
                        <label className="grid gap-1">
                          <span className="font-semibold text-gray-700">Nombres</span>
                          <input
                            name="first_name"
                            defaultValue={player.first_name}
                            required
                            minLength={2}
                            className={inputClass}
                          />
                        </label>
                        <label className="grid gap-1">
                          <span className="font-semibold text-gray-700">Apellidos</span>
                          <input
                            name="last_name"
                            defaultValue={player.last_name}
                            required
                            minLength={2}
                            className={inputClass}
                          />
                        </label>
                        <label className="grid gap-1">
                          <span className="font-semibold text-gray-700">DNI</span>
                          <input
                            name="dni"
                            defaultValue={player.dni ?? ''}
                            required
                            pattern="\d{8}"
                            maxLength={8}
                            className={inputClass}
                          />
                        </label>
                        <label className="grid gap-1">
                          <span className="font-semibold text-gray-700">Fecha de nacimiento</span>
                          <input
                            type="date"
                            name="birth_date"
                            defaultValue={player.birth_date ?? ''}
                            className={inputClass}
                          />
                        </label>
                        <label className="grid gap-1">
                          <span className="font-semibold text-gray-700">Dorsal</span>
                          <input
                            name="jersey_number"
                            type="number"
                            min={1}
                            max={99}
                            defaultValue={player.jersey_number ?? ''}
                            required
                            className={inputClass}
                          />
                        </label>
                        <label className="grid gap-1">
                          <span className="font-semibold text-gray-700">Posición</span>
                          <select
                            name="position"
                            defaultValue={player.position ?? 'delantero'}
                            className={inputClass}
                          >
                            {POSITIONS.map((position) => (
                              <option key={position.value} value={position.value}>
                                {position.label}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="grid gap-1 sm:col-span-2">
                          <span className="font-semibold text-gray-700">Reemplazar foto</span>
                          <input
                            type="file"
                            name="file"
                            accept="image/png,image/jpeg,image/webp"
                            className="text-sm"
                          />
                        </label>
                        <button
                          type="submit"
                          className="rounded-lg bg-uv3-green-dark px-4 py-2 font-semibold text-white transition-colors hover:bg-uv3-green sm:col-span-2"
                        >
                          Guardar jugador
                        </button>
                      </form>
                    </details>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
