import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { createDelegateAction } from '@/app/actions/users';

export const dynamic = 'force-dynamic';

export default async function DelegadosPage({
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

  const { data: delegates } = await supabase
    .from('users')
    .select('id, full_name, email, username')
    .eq('role', 'delegate')
    .order('full_name');

  const { data: teams } = await supabase
    .from('teams')
    .select('id, name, delegate_id')
    .order('name');

  const teamByDelegate = new Map((teams ?? []).map((t) => [t.delegate_id, t]));

  async function createForm(formData: FormData) {
    'use server';
    const result = await createDelegateAction(formData);
    if (!result.success) {
      redirect(`/dashboard/delegados?error=${encodeURIComponent(result.error ?? 'No se pudo crear el delegado.')}`);
    }
    redirect('/dashboard/delegados?ok=Delegado creado correctamente.');
  }

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-10">
      <h1 className="font-heading text-3xl font-bold text-uv3-green-dark">Delegados</h1>
      <p className="mt-2 text-stone-600">
        Gestiona los delegados de equipos. Un delegado es una persona que representa a un equipo; para crear uno, primero se registra
        una cuenta y luego se promueve a rol <strong>Delegado</strong>.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <a
          href="/register?rol=delegate"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg bg-uv3-green px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-uv3-green-dark"
        >
          + Registrar nuevo delegado
        </a>
        <Link href="/dashboard/usuarios" className="text-sm font-semibold text-uv3-green hover:underline">
          Promover a Delegado en Usuarios y roles →
        </Link>
        <Link href="/dashboard/teams" className="text-sm font-semibold text-uv3-green hover:underline">
          Asignar a equipo en Equipos →
        </Link>
      </div>

      <details className="mt-4 rounded-lg border border-uv3-green/20 bg-white p-4 shadow-sm">
        <summary className="cursor-pointer font-semibold text-uv3-green-dark">+ Nuevo delegado</summary>
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
          <label className="grid gap-2">
            <span className="text-sm font-medium text-gray-700">Asignar a equipo (opcional)</span>
            <select name="team_id" defaultValue="" className="rounded-lg border px-3 py-2 outline-none focus:border-uv3-green">
              <option value="">Sin equipo</option>
              {(teams ?? []).map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </label>
          <div className="sm:col-span-2">
            <button type="submit" className="rounded-lg bg-uv3-green px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-uv3-green-dark">
              Crear delegado
            </button>
          </div>
        </form>
      </details>

      <div className="mt-4 rounded-lg border border-uv3-green/20 bg-uv3-green/5 px-4 py-3 text-sm text-stone-700">
        <p className="font-semibold text-uv3-green-dark">Guía rápida</p>
        <ol className="mt-1 list-decimal pl-5 space-y-1">
          <li>Haz clic en <strong>“Registrar nuevo delegado”</strong> (se abre el registro en una nueva pestaña).</li>
          <li>La persona crea su cuenta con su correo y contraseña.</li>
          <li>En <strong>Usuarios y roles</strong>, promueve esa cuenta a rol <strong>Delegado</strong>.</li>
          <li>En <strong>Equipos</strong>, edita el equipo y selecciona al delegado en “Delegado (opcional)”.</li>
        </ol>
      </div>

      {ok && <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">✅ {ok}</div>}
      {error && <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">⚠️ {error}</div>}

      <section className="mt-6">
        {(delegates ?? []).length === 0 ? (
          <div className="rounded-xl border bg-white p-8 text-center text-stone-600 shadow-sm">
            Aún no hay usuarios con rol de delegado. Promueve uno desde Usuarios y roles.
          </div>
        ) : (
          <ul className="space-y-3">
            {(delegates ?? []).map((d) => {
              const team = teamByDelegate.get(d.id);
              return (
                <li key={d.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-white p-4 shadow-sm">
                  <div>
                    <p className="font-semibold text-stone-800">{d.full_name || d.username || d.email}</p>
                    <p className="text-xs text-gray-500">{d.email}</p>
                  </div>
                  <div className="text-sm">
                    {team ? (
                      <Link href={`/dashboard/teams/${team.id}`} className="font-semibold text-uv3-green hover:underline">
                        Equipo: {team.name}
                      </Link>
                    ) : (
                      <span className="text-stone-500">Sin equipo asignado</span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}