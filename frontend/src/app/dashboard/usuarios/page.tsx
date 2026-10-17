import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { getAllUsersAction } from '@/app/actions/users';
import { UsersTable } from './UsersTable';

export const dynamic = 'force-dynamic';

export default async function UsuariosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; ok?: string; error?: string }>;
}) {
  const params = await searchParams;
  const q = params.q ?? '';
  const ok = params.ok;
  const error = params.error;

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect('/login');
  const { data: profile } = await supabase.from('users').select('role').eq('id', auth.user.id).maybeSingle();
  if (profile?.role !== 'admin') {
    return <main className="px-6 py-12 text-amber-700">Este módulo es exclusivo del administrador.</main>;
  }

  const res = await getAllUsersAction(q);
  const users = res.success ? res.data ?? [] : [];

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-10">
      <h1 className="font-heading text-3xl font-bold text-uv3-green-dark">Usuarios y roles</h1>
      <p className="mt-2 text-stone-600">
        Asigna el rol (Vecino, Delegado, Árbitro, Organizador o Administrador) a las personas que ya se registraron.
      </p>

      {ok && <div className="mt-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">✅ {ok}</div>}
      {error && <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">⚠️ {error}</div>}

      <section className="mt-6">
        <form className="flex items-center gap-2">
          <input
            name="q"
            defaultValue={q}
            placeholder="Buscar por nombre, email o usuario"
            className="w-full max-w-md rounded-lg border px-3 py-2 outline-none focus:border-uv3-green"
          />
          <button className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-stone-50">Buscar</button>
          {q && (
            <Link href="/dashboard/usuarios" className="text-sm text-stone-500 hover:underline">
              Limpiar
            </Link>
          )}
        </form>
      </section>

      <section className="mt-6">
        <UsersTable users={users} />
      </section>
    </main>
  );
}
