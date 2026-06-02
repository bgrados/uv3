import Image from 'next/image';
import Link from 'next/link';
import { getCurrentUser } from '@/app/auth/actions';

const topStories = [
  {
    section: 'Ciudad',
    title: 'La comunidad abre una nueva etapa con agenda deportiva y vecinal renovada',
    summary:
      'El comité organizador presentó un esquema de actividades con torneos, encuentros barriales y espacios para participación familiar durante todo el mes.',
  },
  {
    section: 'Obra local',
    title: 'Mejoras en accesos y áreas comunes avanzan antes del inicio del campeonato',
    summary:
      'Las zonas de ingreso, iluminación y señalética fueron priorizadas para acompañar el flujo de partidos y reuniones comunitarias.',
  },
  {
    section: 'Opinión',
    title: 'Un periódico digital para ordenar lo que pasa en UV3',
    summary:
      'La plataforma concentra noticias, resultados y avisos en una misma portada para que cualquiera encuentre rápido lo importante.',
  },
];

const sportsBriefs = [
  {
    title: 'Apertura 2026',
    subtitle: 'Partido destacado',
    detail: 'Atlético UV3 vs. Barrio Unido - 18:30',
  },
  {
    title: 'Tabla parcial',
    subtitle: 'Líder de la fecha',
    detail: 'Equipo Norte suma 7 puntos y mantiene el invicto.',
  },
  {
    title: 'Próxima jornada',
    subtitle: 'Sábado por la tarde',
    detail: 'Tres encuentros, una charla técnica y entrega de balones.',
  },
];

const newsRows = [
  'Se activa el calendario de partidos para la primera semana de julio.',
  'Se publican comunicados sobre horarios de uso de canchas y salones.',
  'La galería comunitaria suma imágenes de la última reunión vecinal.',
  'Se incorporan delegados y contactos de cada equipo al registro oficial.',
];

const communityNotes = [
  'Entrega de credenciales para delegados: martes y jueves por la tarde.',
  'Se recomienda confirmar horarios de cancha antes de cada partido.',
  'Las fotografías del archivo comunitario se actualizarán al final de cada fecha.',
];

export default async function HomePage() {
  const user = await getCurrentUser();
  const today = new Intl.DateTimeFormat('es-PE', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  return (
    <main className="min-h-screen bg-[#f6f1e6] text-[#1f1b16]">
      <section className="border-b border-[#d9cdb9] bg-[#efe6d6]">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7a5c2f]">
              Edición comunitaria
            </p>
            <h1 className="font-serif text-3xl font-bold uppercase tracking-tight text-[#1f1b16] md:text-5xl">
              UV3 Diario
            </h1>
            <p className="mt-1 text-sm text-[#6b5c4a]">
              {today} · Unidad Vecinal 3 · noticias, deportes y vida barrial
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {user ? (
              <Link
                href="/dashboard"
                className="rounded-full border border-[#7a5c2f] px-4 py-2 text-sm font-semibold text-[#7a5c2f] transition-colors hover:bg-[#7a5c2f] hover:text-white"
              >
                Entrar al panel
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-full border border-[#7a5c2f] px-4 py-2 text-sm font-semibold text-[#7a5c2f] transition-colors hover:bg-[#7a5c2f] hover:text-white"
                >
                  Iniciar sesión
                </Link>
                <Link
                  href="/register"
                  className="rounded-full bg-[#7a5c2f] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#5f4522]"
                >
                  Registrarse
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-6">
        <div className="grid gap-6 border-y border-[#d9cdb9] bg-white px-4 py-4 text-sm text-[#5e5447] md:grid-cols-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#8a6f47]">Titular</p>
            <p className="mt-1 font-semibold">La UV3 mueve su agenda comunitaria y deportiva</p>
          </div>
          <div className="border-l border-[#e5dccd] pl-4">
            <p className="text-xs uppercase tracking-[0.2em] text-[#8a6f47]">Deportes</p>
            <p className="mt-1 font-semibold">Fixture, tabla y resultados en una misma portada</p>
          </div>
          <div className="border-l border-[#e5dccd] pl-4">
            <p className="text-xs uppercase tracking-[0.2em] text-[#8a6f47]">Comunidad</p>
            <p className="mt-1 font-semibold">Avisos, horarios y comunicados para todos los vecinos</p>
          </div>
          <div className="border-l border-[#e5dccd] pl-4">
            <p className="text-xs uppercase tracking-[0.2em] text-[#8a6f47]">Archivo</p>
            <p className="mt-1 font-semibold">Fotos históricas y escenas actuales del barrio</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-8">
        <div className="grid gap-6 lg:grid-cols-[1.5fr_0.9fr]">
          <article className="border border-[#d9cdb9] bg-white p-6 shadow-[0_10px_30px_rgba(68,51,28,0.06)]">
            <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="space-y-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8a6f47]">
                  Portada principal
                </p>
                <h2 className="font-serif text-4xl font-bold leading-tight text-[#17140f] md:text-6xl">
                  La UV3 se prepara para una temporada con más orden, más deporte y más barrio
                </h2>
                <p className="max-w-2xl text-base leading-7 text-[#514739]">
                  Esta edición ficticia muestra cómo se vería la portada si la plataforma trabajara
                  como un diario local: noticias importantes arriba, el deporte en primer plano y
                  bloques cortos para que se pueda leer rápido.
                </p>
                <div className="border-y border-[#e5dccd] py-4">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#8a6f47]">
                    Resumen del día
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[#514739]">
                    El campeonato Apertura avanza con fixture, equipos cargados y una agenda pensada
                    para ordenar las actividades de la comunidad.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/tournaments"
                    className="rounded-full bg-[#1f1b16] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#3a3128]"
                  >
                    Ver campeonatos
                  </Link>
                  <Link
                    href="/dashboard/tournaments"
                    className="rounded-full border border-[#1f1b16] px-4 py-2 text-sm font-semibold text-[#1f1b16] transition-colors hover:bg-[#1f1b16] hover:text-white"
                  >
                    Organizar torneos
                  </Link>
                </div>
              </div>

              <div className="space-y-4">
                <div className="overflow-hidden border border-[#d9cdb9] bg-[#f8f4ec]">
                  <Image
                    src="/uv3-news-1.jpg"
                    alt="Vista histórica de la Unidad Vecinal 3"
                    width={900}
                    height={700}
                    className="h-[360px] w-full object-cover grayscale"
                    priority
                  />
                </div>
                <div className="grid gap-3 border border-[#e5dccd] bg-[#fbf8f1] p-4 text-sm text-[#514739]">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8a6f47]">
                    Notas rápidas
                  </p>
                  {newsRows.map((row) => (
                    <div key={row} className="border-t border-[#e5dccd] pt-3 first:border-t-0 first:pt-0">
                      {row}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </article>

          <aside className="space-y-6">
            <div className="border border-[#d9cdb9] bg-white p-5 shadow-[0_10px_30px_rgba(68,51,28,0.05)]">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8a6f47]">
                Deportes
              </p>
              <h3 className="mt-2 font-serif text-2xl font-bold text-[#17140f]">
                La fecha viene con clásico y tabla apretada
              </h3>
              <div className="mt-4 space-y-3">
                {sportsBriefs.map((item) => (
                  <div key={item.title} className="border-t border-[#e5dccd] pt-3 first:border-t-0 first:pt-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a6f47]">
                      {item.subtitle}
                    </p>
                    <p className="mt-1 font-semibold text-[#1f1b16]">{item.title}</p>
                    <p className="mt-1 text-sm text-[#514739]">{item.detail}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="border border-[#d9cdb9] bg-[#1f1b16] p-5 text-white shadow-[0_10px_30px_rgba(68,51,28,0.12)]">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#d7b46a]">
                Boletín
              </p>
              <h3 className="mt-2 font-serif text-2xl font-bold">Lo más leído esta semana</h3>
              <div className="mt-4 space-y-3 text-sm text-white/85">
                {communityNotes.map((note) => (
                  <div key={note} className="border-t border-white/15 pt-3 first:border-t-0 first:pt-0">
                    {note}
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-8">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="border border-[#d9cdb9] bg-white p-6">
            <div className="flex items-end justify-between border-b border-[#e5dccd] pb-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8a6f47]">
                  Noticias de barrio
                </p>
                <h3 className="font-serif text-3xl font-bold text-[#17140f]">Cinco apuntes breves para leer de un vistazo</h3>
              </div>
              <Link href="/announcements" className="text-sm font-semibold text-[#7a5c2f] hover:underline">
                Ver comunicados
              </Link>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {topStories.map((story) => (
                <article key={story.title} className="border-t border-[#e5dccd] pt-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8a6f47]">{story.section}</p>
                  <h4 className="mt-2 text-xl font-semibold text-[#1f1b16]">{story.title}</h4>
                  <p className="mt-2 text-sm leading-6 text-[#514739]">{story.summary}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="border border-[#d9cdb9] bg-[#fbf8f1] p-6">
            <div className="flex items-end justify-between border-b border-[#e5dccd] pb-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8a6f47]">Archivo visual</p>
                <h3 className="font-serif text-3xl font-bold text-[#17140f]">Fotos de la UV3</h3>
              </div>
              <Link href="/gallery" className="text-sm font-semibold text-[#7a5c2f] hover:underline">
                Abrir galería
              </Link>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Image
                src="/uv3-news-2.jpg"
                alt="Archivo visual de la Unidad Vecinal 3"
                width={700}
                height={500}
                className="h-40 w-full object-cover grayscale"
              />
              <div className="flex h-40 items-end border border-[#d9cdb9] bg-[#1f1b16] p-4 text-white">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-[#d7b46a]">Edición deportiva</p>
                  <p className="mt-2 text-sm leading-6 text-white/85">
                    La portada deja espacio para resultados, tablas y fotos de cada fecha.
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-4 border-t border-[#e5dccd] pt-4 text-sm leading-6 text-[#514739]">
              La idea es que la primera pantalla se lea como un diario: titulares, resumen, deportes
              y avisos. Todo lo ficticio sirve para mostrar la estructura final antes de llenar cada
              sección con información real.
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#d9cdb9] bg-[#efe6d6] py-8 text-center text-sm text-[#6b5c4a]">
        <p>© 2026 Unidad Vecinal 3 · Plataforma comunitaria y deportiva</p>
      </footer>
    </main>
  );
}
