import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/app/auth/actions';
import { createClient } from '@/utils/supabase/server';

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') {
    redirect('/login?message=Solo el administrador puede entrar al panel.');
  }
  const supabase = await createClient();

  const [{ count: teamsCount }, { count: tournamentsCount }, { count: matchesCount }] =
    await Promise.all([
      supabase.from('teams').select('*', { count: 'exact', head: true }),
      supabase.from('tournaments').select('*', { count: 'exact', head: true }),
      supabase.from('matches').select('*', { count: 'exact', head: true }),
    ]);

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-6 py-12">
      <section className="mb-8 rounded-2xl bg-gradient-to-br from-uv3-green-dark to-uv3-green p-8 text-white shadow-lg">
        <p className="text-sm uppercase tracking-wide text-white/70">Panel principal</p>
        <h1 className="mt-2 text-3xl font-bold">{user?.full_name || user?.username || 'Usuario UV3'}</h1>
        <p className="mt-3 max-w-2xl text-white/80">
          Aquí ves el estado general del sistema y los accesos rápidos a las partes más importantes.
        </p>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <p className="text-sm text-muted">Equipos</p>
          <p className="mt-2 text-3xl font-bold text-uv3-green-dark">{teamsCount ?? 0}</p>
        </div>
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <p className="text-sm text-muted">Campeonatos</p>
          <p className="mt-2 text-3xl font-bold text-uv3-green-dark">{tournamentsCount ?? 0}</p>
        </div>
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <p className="text-sm text-muted">Partidos</p>
          <p className="mt-2 text-3xl font-bold text-uv3-green-dark">{matchesCount ?? 0}</p>
        </div>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        <Link
          href="/dashboard/tournaments"
          className="rounded-lg border bg-white p-6 shadow-sm transition-colors hover:border-uv3-green hover:bg-uv3-green/5"
        >
          <h2 className="text-lg font-semibold text-uv3-green-dark">Organizar campeonatos</h2>
          <p className="mt-2 text-sm text-gray-600">Crea, edita e inscribe equipos en cada torneo.</p>
        </Link>
        <Link
          href="/announcements"
          className="rounded-lg border bg-white p-6 shadow-sm transition-colors hover:border-uv3-green hover:bg-uv3-green/5"
        >
          <h2 className="text-lg font-semibold text-uv3-green-dark">Comunicados</h2>
          <p className="mt-2 text-sm text-gray-600">Revisa los avisos publicados para la comunidad.</p>
        </Link>
        <Link
          href="/gallery"
          className="rounded-lg border bg-white p-6 shadow-sm transition-colors hover:border-uv3-green hover:bg-uv3-green/5"
        >
          <h2 className="text-lg font-semibold text-uv3-green-dark">Galería</h2>
          <p className="mt-2 text-sm text-gray-600">Mira las imágenes cargadas del torneo y la comunidad.</p>
        </Link>
      </section>
    </main>
  );
}
