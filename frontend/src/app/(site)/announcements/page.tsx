import { SmartImage } from '@/components/SmartImage';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { MagazineAside } from '@/components/MagazineAside';
import { createClient } from '@/utils/supabase/server';
import { getBusinessesAction } from '@/app/actions/businesses';
import { getGalleriesAction } from '@/app/actions/galleries';
import { getVideoEmbed } from '@/utils/site';
import type { Announcement } from '@/types';

const CATEGORY_LABEL: Record<string, string> = {
  general: 'General',
  deportes: 'Deportes',
  eventos: 'Eventos',
  comunicado: 'Comunicado',
};

const CATEGORY_COLOR: Record<string, string> = {
  general: 'bg-stone-100 text-stone-700',
  deportes: 'bg-uv3-green/10 text-uv3-green-dark',
  eventos: 'bg-uv3-gold/20 text-uv3-green-dark',
  comunicado: 'bg-red-50 text-red-700',
};

function VideoBlock({ url }: { url: string }) {
  const embed = getVideoEmbed(url);
  if (!embed) return null;

  if (embed.kind === 'iframe') {
    return (
      <div className="relative aspect-video w-full bg-black">
        <iframe
          src={embed.src}
          title="Video del comunicado"
          className="absolute inset-0 h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
        />
      </div>
    );
  }

  if (embed.kind === 'file') {
    return (
      <video controls preload="metadata" className="w-full bg-black">
        <source src={embed.src} />
        Tu navegador no puede reproducir este video.
      </video>
    );
  }

  return (
    <div className="border-b border-gray-100 px-6 py-3">
      <a
        href={embed.src}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm font-semibold text-uv3-green hover:underline"
      >
        ▶ Ver video
      </a>
    </div>
  );
}

export default async function AnnouncementsPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>;
}) {
  const params = await searchParams;
  const cat = params.cat ?? '';

  const supabase = await createClient();

  if (!supabase) {
    return <p className="px-6 py-12 text-red-600">Faltan las variables de Supabase.</p>;
  }

  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return <p className="px-6 py-12 text-red-600">Error al cargar comunicados.</p>;

  const all = (data ?? []) as Announcement[];
  const filtered = cat ? all.filter((a) => a.category === cat) : all;

  const [bizRes, galRes] = await Promise.all([getBusinessesAction(), getGalleriesAction()]);
  const businesses = bizRes.success ? bizRes.data ?? [] : [];
  const galleries = galRes.success ? galRes.data ?? [] : [];

  const featured = filtered.find((a) => a.is_featured) ?? filtered[0];
  const rest = filtered.filter((a) => a.id !== featured?.id);

  return (
    <section className="mx-auto max-w-7xl px-6 py-10">
      <Breadcrumbs items={[{ label: 'Comunicados' }]} />
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-heading text-3xl font-bold text-uv3-green-dark">Comunicados</h1>
        <div className="flex flex-wrap gap-2">
          <a
            href="/announcements"
            className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
              !cat ? 'bg-uv3-green text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            Todos
          </a>
          {Object.entries(CATEGORY_LABEL).map(([key, label]) => (
            <a
              key={key}
              href={`/announcements?cat=${key}`}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                cat === key ? 'bg-uv3-green text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {label}
            </a>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-lg border bg-white p-8 text-center text-gray-500">
          Aún no hay comunicados publicados en esta categoría.
        </p>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          {/* Contenido principal */}
          <div className="min-w-0 space-y-8">
            {/* Noticia principal */}
            {featured && (
              <article
                id={featured.id}
                className="scroll-mt-24 overflow-hidden rounded-2xl border bg-white shadow-md"
              >
                {featured.image_url && (
                  <div className="relative aspect-[16/9] w-full bg-gray-100">
                    <SmartImage
                      src={featured.image_url}
                      alt={featured.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 60vw"
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="p-6">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        CATEGORY_COLOR[featured.category] ?? 'bg-stone-100 text-stone-700'
                      }`}
                    >
                      {CATEGORY_LABEL[featured.category] ?? featured.category}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(featured.created_at).toLocaleDateString('es-PE', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  <h2 className="mt-3 text-2xl font-bold text-uv3-green-dark">{featured.title}</h2>
                  <p className="mt-3 whitespace-pre-line text-sm leading-6 text-gray-700">
                    {featured.content}
                  </p>
                </div>
                {featured.video_url && <VideoBlock url={featured.video_url} />}
              </article>
            )}

            {/* Grid de secundarias */}
            {rest.length > 0 && (
              <div className="grid gap-5 sm:grid-cols-2">
                {rest.map((item) => (
                  <article
                    key={item.id}
                    id={item.id}
                    className="scroll-mt-24 overflow-hidden rounded-xl border bg-white shadow-sm transition-shadow hover:shadow-md"
                  >
                    {item.image_url && (
                      <div className="relative aspect-[16/9] w-full bg-gray-100">
                        <SmartImage
                          src={item.image_url}
                          alt={item.title}
                          fill
                          sizes="(max-width: 768px) 100vw, 30vw"
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="p-4">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            CATEGORY_COLOR[item.category] ?? 'bg-stone-100 text-stone-700'
                          }`}
                        >
                          {CATEGORY_LABEL[item.category] ?? item.category}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(item.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })}
                        </span>
                      </div>
                      <h3 className="mt-2 text-base font-semibold text-uv3-green-dark">{item.title}</h3>
                      <p className="mt-2 line-clamp-3 text-sm text-gray-600">{item.content}</p>
                    </div>
                    {item.video_url && <VideoBlock url={item.video_url} />}
                  </article>
                ))}
              </div>
            )}
          </div>

          {/* Barra lateral */}
          <MagazineAside announcements={filtered} businesses={businesses} galleries={galleries} />
        </div>
      )}
    </section>
  );
}
