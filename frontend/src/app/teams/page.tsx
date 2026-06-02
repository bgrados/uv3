import { createClient } from '@/utils/supabase/server';

export default async function TeamsPage() {
  const supabase = await createClient();

  if (!supabase) {
    return <p className="px-6 py-12 text-red-600">Faltan las variables de Supabase.</p>;
  }

  const { data: teams, error } = await supabase.from('teams').select('*');

  if (error) return <p className="px-6 py-12 text-red-600">Error al cargar equipos.</p>;

  return (
    <section className="mx-auto max-w-7xl px-6 py-12">
      <h2 className="mb-6 text-3xl font-semibold text-uv3-green-dark">Equipos</h2>
      <ul className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {teams?.map((team: { id: string; name: string; logo_url: string | null }) => (
          <li key={team.id} className="rounded-lg border bg-white p-4 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-uv3-green/10 text-uv3-green">
                {team.logo_url ? '✓' : 'UV'}
              </div>
              <div>
                <h3 className="mb-1 text-lg font-semibold">{team.name}</h3>
                <p className="text-sm text-gray-600">
                  {team.logo_url ? 'Con escudo cargado' : 'Sin escudo cargado'}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
