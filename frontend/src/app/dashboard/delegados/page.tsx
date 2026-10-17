import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export default async function DelegadosPage() {
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
    .select('id, name, delegate_id');

  const teamByDelegate = new Map((teams ?? []).map((t) => [t.delegate_id, t]));

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-10">
      <h1 className="font-heading text-3xl font-bold text-uv3-green-dark">Delegados</h1>
      <p className="mt-2 text-stone-600">
        Gestiona los delegados de equipos. Un delegado se crea promoviendo a un usuario al rol <strong>Delegado</strong> en
        <Link href="/dashboard/usuarios" className="ml-1 font-semibold text-uv3-green hover:underline">Usuarios y roles</Link>.
        Luego se asigna a un equipo en <Link href="/dashboard/teams" className="font-semibold text-uv3-green hover:underline">Equipos</Link>.
      </p>

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