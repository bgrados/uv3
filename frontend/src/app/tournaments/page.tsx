import { createClient } from '@/utils/supabase/server';

export default async function TournamentsPage() {
  const supabase = await createClient();

  if (!supabase) {
    return <p className="px-6 py-12 text-red-600">Faltan las variables de Supabase.</p>;
  }

  const { data: tournaments, error } = await supabase.from('tournaments').select('*');

  if (error) return <p className="px-6 py-12 text-red-600">Error al cargar campeonatos.</p>;

  return (
    <section className="mx-auto max-w-7xl px-6 py-12">
      <h2 className="mb-6 text-3xl font-semibold text-uv3-green-dark">Campeonatos</h2>
      <ul className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {tournaments?.map((t: { id: string; name: string; description: string | null }) => (
          <li key={t.id} className="rounded-lg border bg-white p-4 shadow-sm">
            <h3 className="mb-2 text-lg font-semibold">{t.name}</h3>
            <p className="text-sm text-gray-600">{t.description ?? 'Sin descripción'}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
