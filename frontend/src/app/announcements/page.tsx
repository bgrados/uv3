import Image from 'next/image';
import { createClient } from '@/utils/supabase/server';
import type { Announcement } from '@/types';

const CATEGORY_LABEL: Record<string, string> = {
  general: 'General',
  deportes: 'Deportes',
  eventos: 'Eventos',
  comunicado: 'Comunicado',
};

export default async function AnnouncementsPage() {
  const supabase = await createClient();

  if (!supabase) {
    return <p className="px-6 py-12 text-red-600">Faltan las variables de Supabase.</p>;
  }

  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return <p className="px-6 py-12 text-red-600">Error al cargar comunicados.</p>;

  const announcements = (data ?? []) as Announcement[];

  return (
    <section className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="mb-6 text-3xl font-semibold text-uv3-green-dark">Comunicados</h1>

      {announcements.length === 0 ? (
        <p className="rounded-lg border bg-white p-8 text-center text-gray-500">
          Aún no hay comunicados publicados.
        </p>
      ) : (
        <div className="grid gap-6">
          {announcements.map((item) => (
            <article
              key={item.id}
              id={item.id}
              className="scroll-mt-24 overflow-hidden rounded-lg border bg-white shadow-sm"
            >
              {item.image_url && (
                <div className="relative aspect-[16/9] w-full bg-gray-100">
                  <Image
                    src={item.image_url}
                    alt={item.title}
                    fill
                    sizes="(max-width: 896px) 100vw, 896px"
                    className="object-cover"
                  />
                </div>
              )}

              <div className="p-6">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-uv3-green">
                    {CATEGORY_LABEL[item.category] ?? item.category}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(item.created_at).toLocaleDateString('es-PE', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <h2 className="mt-2 text-xl font-semibold text-uv3-green-dark">{item.title}</h2>
                <p className="mt-3 whitespace-pre-line text-sm leading-6 text-gray-700">
                  {item.content}
                </p>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
