import { Breadcrumbs } from '@/components/Breadcrumbs';
import { createClient } from '@/utils/supabase/server';
import { GalleryAlbum } from '@/components/GalleryAlbum';
import type { Gallery } from '@/types';

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

  const albums = (galleries ?? []) as Gallery[];

  return (
    <section className="mx-auto max-w-7xl px-6 py-12">
      <Breadcrumbs items={[{ label: 'Galería' }]} />
      <h1 className="mb-6 text-3xl font-semibold text-uv3-green-dark">Galería</h1>

      {albums.length === 0 ? (
        <p className="rounded-lg border bg-white p-8 text-center text-gray-500">
          Aún no hay álbumes publicados.
        </p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {albums.map((gallery) => (
            <GalleryAlbum key={gallery.id} gallery={gallery} />
          ))}
        </div>
      )}
    </section>
  );
}
