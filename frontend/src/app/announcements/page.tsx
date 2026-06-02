import { createClient } from '@/utils/supabase/server';

export default async function AnnouncementsPage() {
  const supabase = await createClient();

  if (!supabase) {
    return <p className="px-6 py-12 text-red-600">Faltan las variables de Supabase.</p>;
  }

  const { data: announcements, error } = await supabase
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return <p className="px-6 py-12 text-red-600">Error al cargar comunicados.</p>;

  return (
    <section className="mx-auto max-w-7xl px-6 py-12">
      <h1 className="mb-6 text-3xl font-semibold text-uv3-green-dark">Comunicados</h1>
      <div className="grid gap-6">
        {announcements?.map((item: { id: string; category: string; title: string; content: string }) => (
          <article key={item.id} className="rounded-lg border bg-white p-6 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-uv3-green">{item.category}</p>
            <h2 className="mt-2 text-xl font-semibold">{item.title}</h2>
            <p className="mt-3 text-sm leading-6 text-gray-700">{item.content}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
