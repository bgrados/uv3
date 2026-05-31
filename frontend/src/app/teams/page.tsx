import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default async function TeamsPage() {
  const { data: teams, error } = await supabase
    .from('teams')
    .select('*');

  return (
    <section className="py-12 px-6 max-w-7xl mx-auto">
      <h2 className="text-3xl font-semibold mb-6 text-uv3-green-dark">Equipos</h2>
      {error ? (
        <p className="text-red-600">Error al cargar equipos.</p>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {teams?.map((team) => (
            <li key={team.id} className="p-4 border rounded-md shadow-sm">
              <h3 className="font-semibold text-lg mb-2">{team.name}</h3>
              <p>{team.city ?? 'Ciudad desconocida'}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
