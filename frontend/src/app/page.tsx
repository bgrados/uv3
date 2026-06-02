import Image from 'next/image';
import Link from 'next/link';
import { getCurrentUser } from '@/app/auth/actions';

const topStories = [
  {
    section: 'Comunidad',
    title: 'La UV3 ordena su agenda con noticias, deportes y avisos en una sola portada',
    summary:
      'La pantalla principal combina información vecinal, fichas deportivas y acceso rápido al contenido clave para que todo sea fácil de leer.',
  },
  {
    section: 'Obras',
    title: 'Mejoras en accesos y espacios comunes acompañan el inicio del campeonato',
    summary:
      'La organización preparó los recorridos, señalización y puntos de encuentro para que la actividad barrial fluya mejor durante la temporada.',
  },
  {
    section: 'Opinión',
    title: 'Un portal que se lee como diario y funciona como plataforma comunitaria',
    summary:
      'La idea es mostrar una portada viva, con bloques breves, fotos reales y una sección deportiva visible sin perder la identidad de UV3.',
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

const communityNotes = [
  'Entrega de credenciales para delegados: martes y jueves por la tarde.',
  'Se recomienda confirmar horarios de cancha antes de cada partido.',
  'Las fotografías del archivo comunitario se actualizarán al final de cada fecha.',
];

const newsRows = [
  'Se activa el calendario de partidos para la primera semana de julio.',
  'Se publican comunicados sobre horarios de uso de canchas y salones.',
  'La galería comunitaria suma imágenes de la última reunión vecinal.',
  'Se incorporan delegados y contactos de cada equipo al registro oficial.',
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
    <main className="min-h-screen bg-uv3-bg text-[#1f1b16]">
      <header className="border-b border-uv3-green-dark/20 bg-uv3-green-dark text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-uv3-gold text-2xl font-bold text-uv3-green-dark shadow-lg">
              UV3
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-uv3-gold">
                Edición comunitaria
              </p>
              <h1 className="font-heading text-3xl font-bold uppercase tracking-tight md:text-5xl">
                UV3 Diario
              </h1>
              <p className="mt-1 text-sm text-white/75">
                {today} · Unidad Vecinal 3 · noticias, deportes y vida barrial
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {user?.role === 'admin' ? (
              <Link
                href="/dashboard"
                className="rounded-full bg-uv3-gold px-4 py-2 text-sm font-semibold text-uv3-green-dark transition-colors hover:bg-white"
              >
                Panel admin
              </Link>
            ) : (
              <Link
                href="/login"
                className="rounded-full border border-white/30 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white hover:text-uv3-green-dark"
              >
                Acceso admin
              </Link>
            )}
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-6">
        <div className="grid gap-6 border-y border-uv3-green-dark/15 bg-white px-4 py-4 text-sm text-[#5e5447] md:grid-cols-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-uv3-green">Titular</p>
            <p className="mt-1 font-semibold">La UV3 mueve su agenda comunitaria y deportiva</p>
          </div>
          <div className="border-l border-uv3-green-dark/10 pl-4">
            <p className="text-xs uppercase tracking-[0.2em] text-uv3-green">Deportes</p>
            <p className="mt-1 font-semibold">Fixture, tabla y resultados en una misma portada</p>
          </div>
          <div className="border-l border-uv3-green-dark/10 pl-4">
            <p className="text-xs uppercase tracking-[0.2em] text-uv3-green">Comunidad</p>
            <p className="mt-1 font-semibold">Avisos, horarios y comunicados para todos los vecinos</p>
          </div>
          <div className="border-l border-uv3-green-dark/10 pl-4">
            <p className="text-xs uppercase tracking-[0.2em] text-uv3-green">Archivo</p>
            <p className="mt-1 font-semibold">Fotos históricas y escenas actuales del barrio</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-8">
        <div className="grid gap-6 lg:grid-cols-[1.5fr_0.9fr]">
          <article className="border border-uv3-green-dark/15 bg-white p-6 shadow-[0_10px_30px_rgba(20,131,59,0.08)]">
            <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="space-y-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-uv3-green">
                  Portada principal
                </p>
                <h2 className="font-heading text-4xl font-bold leading-tight text-uv3-green-dark md:text-6xl">
                  La UV3 se prepara para una temporada con más orden, más deporte y más barrio
                </h2>
                <p className="max-w-2xl text-base leading-7 text-[#514739]">
                  Esta portada ficticia muestra cómo se vería la web si trabajara como un diario local:
                  titulares arriba, el deporte visible y bloques cortos para leer rápido.
                </p>
                <div className="border-y border-uv3-green-dark/15 py-4">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-uv3-green">
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
                    className="rounded-full bg-uv3-green-dark px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-uv3-green"
                  >
                    Ver campeonatos
                  </Link>
                  <Link
                    href="/dashboard/tournaments"
                    className="rounded-full border border-uv3-green-dark px-4 py-2 text-sm font-semibold text-uv3-green-dark transition-colors hover:bg-uv3-green-dark hover:text-white"
                  >
                    Organizar torneos
                  </Link>
                </div>
              </div>

              <div className="space-y-4">
                <div className="overflow-hidden border border-uv3-green-dark/15 bg-uv3-bg">
                  <Image
                    src="/uv3-news-1.jpg"
                    alt="Vista histórica de la Unidad Vecinal 3"
                    width={900}
                    height={700}
                    className="h-[360px] w-full object-cover grayscale"
                    priority
                  />
                </div>
                <div className="grid gap-3 border border-uv3-green-dark/15 bg-uv3-bg p-4 text-sm text-[#514739]">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-uv3-green">
                    Notas rápidas
                  </p>
                  {newsRows.map((row) => (
                    <div key={row} className="border-t border-uv3-green-dark/10 pt-3 first:border-t-0 first:pt-0">
                      {row}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </article>

          <aside className="space-y-6">
            <div className="border border-uv3-green-dark/15 bg-white p-5 shadow-[0_10px_30px_rgba(20,131,59,0.06)]">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-uv3-green">Deportes</p>
              <h3 className="mt-2 font-heading text-2xl font-bold text-uv3-green-dark">
                La fecha viene con clásico y tabla apretada
              </h3>
              <div className="mt-4 space-y-3">
                {sportsBriefs.map((item) => (
                  <div key={item.title} className="border-t border-uv3-green-dark/10 pt-3 first:border-t-0 first:pt-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-uv3-green">
                      {item.subtitle}
                    </p>
                    <p className="mt-1 font-semibold text-[#1f1b16]">{item.title}</p>
                    <p className="mt-1 text-sm text-[#514739]">{item.detail}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="border border-uv3-green-dark/15 bg-uv3-green-dark p-5 text-white shadow-[0_10px_30px_rgba(20,131,59,0.12)]">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-uv3-gold">Boletín</p>
              <h3 className="mt-2 font-heading text-2xl font-bold">Lo más leído esta semana</h3>
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
          <div className="border border-uv3-green-dark/15 bg-white p-6">
            <div className="flex items-end justify-between border-b border-uv3-green-dark/10 pb-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-uv3-green">
                  Noticias de barrio
                </p>
                <h3 className="font-heading text-3xl font-bold text-uv3-green-dark">
                  Cinco apuntes breves para leer de un vistazo
                </h3>
              </div>
              <Link href="/announcements" className="text-sm font-semibold text-uv3-green hover:underline">
                Ver comunicados
              </Link>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {topStories.map((story) => (
                <article key={story.title} className="border-t border-uv3-green-dark/10 pt-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-uv3-green">{story.section}</p>
                  <h4 className="mt-2 text-xl font-semibold text-[#1f1b16]">{story.title}</h4>
                  <p className="mt-2 text-sm leading-6 text-[#514739]">{story.summary}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="border border-uv3-green-dark/15 bg-uv3-bg p-6">
            <div className="flex items-end justify-between border-b border-uv3-green-dark/10 pb-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-uv3-green">Archivo visual</p>
                <h3 className="font-heading text-3xl font-bold text-uv3-green-dark">Fotos de la UV3</h3>
              </div>
              <Link href="/gallery" className="text-sm font-semibold text-uv3-green hover:underline">
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
              <div className="flex h-40 items-end border border-uv3-green-dark/15 bg-uv3-green-dark p-4 text-white">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-uv3-gold">Edición deportiva</p>
                  <p className="mt-2 text-sm leading-6 text-white/85">
                    La portada deja espacio para resultados, tablas y fotos de cada fecha.
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-4 border-t border-uv3-green-dark/10 pt-4 text-sm leading-6 text-[#514739]">
              La idea es que la primera pantalla se lea como un diario: titulares, resumen, deportes
              y avisos. Todo lo ficticio sirve para mostrar la estructura final antes de llenar cada
              sección con información real.
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-uv3-green-dark/15 bg-uv3-green-dark py-8 text-center text-sm text-white/75">
        <p>© 2026 Unidad Vecinal 3 · Plataforma comunitaria y deportiva</p>
      </footer>
    </main>
  );
}
