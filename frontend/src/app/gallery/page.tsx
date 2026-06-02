import { createClient } from '@/utils/supabase/server';

export default async function GalleryPage() {
  const supabase = await createClient();

  if (!supabase) {
    return <p className="px-6 py-12 text-red-600">Faltan las variables de Supabase.</p>;
  }

  const { data: galleries, error } = await supabase
    .from('galleries')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return <p className="px-6 py-12 text-red-600">Error al cargar la galería.</p>;

  return (
    <section className="mx-auto max-w-7xl px-6 py-12">
      <h1 className="mb-6 text-3xl font-semibold text-uv3-green-dark">Galería</h1>
      <div className="grid gap-6 md:grid-cols-2">
        {galleries?.map((gallery: { id: string; title: string; description: string | null }) => (
          <article key={gallery.id} className="overflow-hidden rounded-lg border bg-white shadow-sm">
            <div className="aspect-[16/9] bg-gray-100" />
            <div className="p-5">
              <h2 className="text-xl font-semibold">{gallery.title}</h2>
              <p className="mt-2 text-sm text-gray-700">{gallery.description ?? 'Sin descripción'}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
