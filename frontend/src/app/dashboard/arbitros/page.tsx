import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export default async function ArbitrosPage() {
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

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-10">
      <h1 className="font-heading text-3xl font-bold text-uv3-green-dark">Árbitros</h1>
      <p className="mt-2 text-stone-600">
        Gestiona los árbitros. Un árbitro se crea promoviendo a un usuario al rol <strong>Árbitro</strong> en
        <Link href="/dashboard/usuarios" className="ml-1 font-semibold text-uv3-green hover:underline">Usuarios y roles</Link>.
        Luego se asigna a un partido en <Link href="/dashboard/matches" className="font-semibold text-uv3-green hover:underline">Partidos</Link>.
      </p>

      <section className="mt-6">
        {(referees ?? []).length === 0 ? (
          <div className="rounded-xl border bg-white p-8 text-center text-stone-600 shadow-sm">
            Aún no hay usuarios con rol de árbitro. Promueve uno desde Usuarios y roles.
          </div>
        ) : (
          <ul className="space-y-3">
            {(referees ?? []).map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-white p-4 shadow-sm">
                <div>
                  <p className="font-semibold text-stone-800">{r.full_name || r.username || r.email}</p>
                  <p className="text-xs text-gray-500">{r.email}</p>
                </div>
                <div className="text-sm text-stone-600">
                  Partidos asignados: <span className="font-bold text-uv3-green-dark">{matchesByReferee.get(r.id) ?? 0}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}