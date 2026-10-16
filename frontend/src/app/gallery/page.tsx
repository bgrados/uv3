import Image from 'next/image';
import { createClient } from '@/utils/supabase/server';
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
      <h1 className="mb-6 text-3xl font-semibold text-uv3-green-dark">Galería</h1>

      {albums.length === 0 ? (
        <p className="rounded-lg border bg-white p-8 text-center text-gray-500">
          Aún no hay álbumes publicados.
        </p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {albums.map((gallery) => {
            const cover = gallery.cover_image_url ?? gallery.images?.[0] ?? null;
            const extra = (gallery.images ?? []).filter((url) => url !== cover).slice(0, 4);

            return (
              <article
                key={gallery.id}
                className="overflow-hidden rounded-lg border bg-white shadow-sm"
              >
                <div className="relative aspect-[16/9] bg-gray-100">
                  {cover ? (
                    <Image
                      src={cover}
                      alt={gallery.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-4xl text-gray-300">
                      📷
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <h2 className="text-xl font-semibold text-uv3-green-dark">{gallery.title}</h2>
                  <p className="mt-2 text-sm text-gray-700">
                    {gallery.description ?? 'Sin descripción'}
                  </p>

                  {extra.length > 0 && (
                    <div className="mt-4 grid grid-cols-4 gap-2">
                      {extra.map((url, index) => (
                        <div
                          key={`${gallery.id}-${index}`}
                          className="relative aspect-square overflow-hidden rounded bg-gray-100"
                        >
                          <Image
                            src={url}
                            alt={`${gallery.title} — imagen ${index + 2}`}
                            fill
                            sizes="120px"
                            className="object-cover transition-transform duration-300 hover:scale-105"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
