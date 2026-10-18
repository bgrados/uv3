import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { createRefereeAction, updateRefereeAction, deleteRefereeAction } from '@/app/actions/users';
import { ConfirmSubmitButton } from '@/components/ConfirmSubmitButton';
import { SubmitButton } from '@/components/SubmitButton';

export const dynamic = 'force-dynamic';

export default async function ArbitrosPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { ok, error } = await searchParams;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect('/login');
  const { data: profile } = await supabase.from('users').select('role').eq('id', auth.user.id).maybeSingle();
  if (profile?.role !== 'admin' && profile?.role !== 'organizer') {
    return <main className="px-6 py-12 text-amber-700">Este módulo es exclusivo del personal autorizado.</main>;
  }

  const { data: referees } = await supabase
    .from('users')
    .select('id, full_name, email, username')
    .eq('role', 'referee')
    .order('full_name');

  const { data: matches } = await supabase
    .from('matches')
    .select('id, referee_id, status, date_time, home_team:teams!home_team_id(name), away_team:teams!away_team_id(name)');

  const matchesByReferee = new Map<string, number>();
  (matches ?? []).forEach((m) => {
    if (m.referee_id) {
      matchesByReferee.set(m.referee_id, (matchesByReferee.get(m.referee_id) ?? 0) + 1);
    }
  });

  async function createForm(formData: FormData) {
    'use server';
    const result = await createRefereeAction(formData);
    if (!result.success) {
      redirect(`/dashboard/arbitros?error=${encodeURIComponent(result.error ?? 'No se pudo crear el árbitro.')}`);
    }
    redirect('/dashboard/arbitros?ok=Árbitro creado correctamente.');
  }
  async function updateForm(formData: FormData) {
    'use server';
    const result = await updateRefereeAction(formData);
    if (!result.success) {
      redirect(`/dashboard/arbitros?error=${encodeURIComponent(result.error ?? 'No se pudo actualizar el árbitro.')}`);
    }
    redirect('/dashboard/arbitros?ok=Árbitro actualizado.');
  }
  async function deleteForm(formData: FormData) {
    'use server';
    const result = await deleteRefereeAction(String(formData.get('id') ?? ''));
    if (!result.success) {
      redirect(`/dashboard/arbitros?error=${encodeURIComponent(result.error ?? 'No se pudo eliminar el árbitro.')}`);
    }
    redirect('/dashboard/arbitros?ok=Árbitro eliminado.');
  }

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-10">
      <h1 className="font-heading text-3xl font-bold text-uv3-green-dark">Árbitros</h1>
      <p className="mt-2 text-stone-600">
        Gestiona los árbitros. Un árbitro es una persona que dirige partidos; para crear uno, primero se registra una cuenta
        y luego se promueve a rol <strong>Árbitro</strong>.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <a
          href="/register?rol=referee"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg bg-uv3-green px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-uv3-green-dark"
        >
          + Registrar nuevo árbitro
        </a>
        <Link href="/dashboard/usuarios" className="text-sm font-semibold text-uv3-green hover:underline">
          Promover a Árbitro en Usuarios y roles →
        </Link>
        <Link href="/dashboard/matches" className="text-sm font-semibold text-uv3-green hover:underline">
          Asignar a partido en Partidos →
        </Link>
      </div>

      <details className="mt-4 rounded-lg border border-uv3-green/20 bg-white p-4 shadow-sm">
        <summary className="cursor-pointer font-semibold text-uv3-green-dark">+ Nuevo árbitro</summary>
        <form action={createForm} className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-medium text-gray-700">Nombre completo</span>
            <input name="full_name" required className="rounded-lg border px-3 py-2 outline-none focus:border-uv3-green" />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-medium text-gray-700">Correo electrónico</span>
            <input name="email" type="email" required className="rounded-lg border px-3 py-2 outline-none focus:border-uv3-green" />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-medium text-gray-700">Contraseña</span>
            <input name="password" type="password" required minLength={6} className="rounded-lg border px-3 py-2 outline-none focus:border-uv3-green" />
          </label>
          <div className="sm:col-span-2">
            <button type="submit" className="rounded-lg bg-uv3-green px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-uv3-green-dark">
              Crear árbitro
            </button>
          </div>
        </form>
      </details>

      <div className="mt-4 rounded-lg border border-uv3-green/20 bg-uv3-green/5 px-4 py-3 text-sm text-stone-700">
        <p className="font-semibold text-uv3-green-dark">Guía rápida</p>
        <ol className="mt-1 list-decimal pl-5 space-y-1">
          <li>Haz clic en <strong>“Registrar nuevo árbitro”</strong> (se abre el registro en una nueva pestaña).</li>
          <li>La persona crea su cuenta con su correo y contraseña.</li>
          <li>En <strong>Usuarios y roles</strong>, promueve esa cuenta a rol <strong>Árbitro</strong>.</li>
          <li>En <strong>Partidos</strong>, edita el partido y selecciona al árbitro en el campo correspondiente.</li>
        </ol>
      </div>

      {ok && <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">✅ {ok}</div>}
      {error && <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">⚠️ {error}</div>}

      <section className="mt-6">
        {(referees ?? []).length === 0 ? (
          <div className="rounded-xl border bg-white p-8 text-center text-stone-600 shadow-sm">
            Aún no hay usuarios con rol de árbitro. Promueve uno desde Usuarios y roles.
          </div>
        ) : (
          <ul className="space-y-3">
            {(referees ?? []).map((r) => (
              <li key={r.id} className="rounded-xl border bg-white p-4 shadow-sm">
                <details>
                  <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-stone-800">{r.full_name || r.username || r.email}</p>
                      <p className="text-xs text-gray-500">{r.email}</p>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-stone-600">
                        Partidos asignados: <span className="font-bold text-uv3-green-dark">{matchesByReferee.get(r.id) ?? 0}</span>
                      </span>
                      <span className="text-xs font-semibold text-uv3-green">Editar ▾</span>
                    </div>
                  </summary>
                  <form action={updateForm} className="mt-4 grid gap-4 border-t pt-4 sm:grid-cols-2">
                    <input type="hidden" name="id" value={r.id} />
                    <label className="grid gap-2">
                      <span className="text-sm font-medium text-gray-700">Nombre completo</span>
                      <input name="full_name" required defaultValue={r.full_name ?? ''} className="rounded-lg border px-3 py-2 outline-none focus:border-uv3-green" />
                    </label>
                    <label className="grid gap-2">
                      <span className="text-sm font-medium text-gray-700">Correo electrónico</span>
                      <input name="email" type="email" defaultValue={r.email ?? ''} className="rounded-lg border px-3 py-2 outline-none focus:border-uv3-green" />
                    </label>
                    <label className="grid gap-2 sm:col-span-2">
                      <span className="text-sm font-medium text-gray-700">Nueva contraseña (opcional)</span>
                      <input name="password" type="password" minLength={6} placeholder="Dejar en blanco para no cambiar" className="rounded-lg border px-3 py-2 outline-none focus:border-uv3-green" />
                    </label>
                    <div className="sm:col-span-2">
                      <SubmitButton label="Guardar cambios" pendingLabel="Guardando…" />
                    </div>
                  </form>
                  <form action={deleteForm} className="mt-4 border-t pt-4">
                    <input type="hidden" name="id" value={r.id} />
                    <ConfirmSubmitButton
                      label="Eliminar árbitro"
                      pendingLabel="Eliminando..."
                      confirmMessage={`¿Eliminar la cuenta de "${r.full_name || r.email}"? Se quitará de sus partidos.`}
                    />
                  </form>
                </details>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}