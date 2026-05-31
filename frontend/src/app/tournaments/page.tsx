import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default async function TournamentsPage() {
  const { data: tournaments, error } = await supabase
    .from('tournaments')
    .select('*');

  return (
    <section className="py-12 px-6 max-w-7xl mx-auto">
      <h2 className="text-3xl font-semibold mb-6 text-uv3-green-dark">Campeonatos</h2>
      {error ? (
        <p className="text-red-600">Error al cargar campeonatos.</p>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tournaments?.map((t) => (
            <li key={t.id} className="p-4 border rounded-md shadow-sm">
              <h3 className="font-semibold text-lg mb-2">{t.name}</h3>
              <p>{t.description ?? 'Sin descripción'}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
