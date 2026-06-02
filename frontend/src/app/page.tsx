import Link from 'next/link';
import { getCurrentUser } from '@/app/auth/actions';

export default async function HomePage() {
  const user = await getCurrentUser();

  return (
    <main className="min-h-screen bg-uv3-bg">
      <section className="relative overflow-hidden bg-gradient-to-br from-uv3-green-dark via-uv3-green to-uv3-green-dark">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-uv3-gold blur-3xl" />
          <div className="absolute bottom-0 right-0 h-96 w-96 translate-x-1/2 translate-y-1/2 rounded-full bg-uv3-gold blur-3xl" />
        </div>

        <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-uv3-gold text-lg font-bold text-uv3-green-dark">
              UV3
            </div>
            <span className="hidden text-xl font-bold text-white sm:block">Unidad Vecinal 3</span>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <span className="hidden text-sm text-white/80 sm:block">
                  Hola, {user.full_name || user.username}
                </span>
                <Link
                  href="/dashboard"
                  className="rounded-lg bg-uv3-gold px-5 py-2 font-semibold text-uv3-green-dark transition-colors hover:bg-uv3-gold/90"
                >
                  Dashboard
                </Link>
              </>
            ) : (
              <>
                <Link href="/login" className="font-medium text-white transition-colors hover:text-uv3-gold">
                  Iniciar sesión
                </Link>
                <Link
                  href="/register"
                  className="rounded-lg bg-uv3-gold px-5 py-2 font-semibold text-uv3-green-dark transition-colors hover:bg-uv3-gold/90"
                >
                  Registrarse
                </Link>
              </>
            )}
          </div>
        </nav>

        <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center px-6 py-24 text-center md:py-32">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-uv3-gold backdrop-blur-sm">
            <span className="h-2 w-2 animate-pulse rounded-full bg-uv3-gold" />
            Campeonato Apertura 2026 - En curso
          </div>

          <h1 className="mb-6 text-4xl font-bold leading-tight text-white md:text-6xl">
            El corazón digital de <span className="text-uv3-gold">nuestra comunidad</span>
          </h1>

          <p className="mb-10 max-w-2xl text-lg text-white/80 md:text-xl">
            Campeonatos, fixtures automáticos, resultados en vivo, tabla de posiciones,
            noticias y comunicados en un solo lugar.
          </p>

          <div className="flex flex-col gap-4 sm:flex-row">
            <Link
              href="/tournaments"
              className="rounded-xl bg-uv3-gold px-8 py-3 font-bold text-uv3-green-dark shadow-lg transition-all hover:scale-105 hover:bg-uv3-gold/90"
            >
              Ver campeonatos
            </Link>
            <Link
              href="/teams"
              className="rounded-xl border border-white/20 bg-white/10 px-8 py-3 font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20"
            >
              Ver equipos
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b border-gray-100 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-6 py-12 md:grid-cols-4">
          {[
            { label: 'Equipos', value: '4' },
            { label: 'Jugadores', value: '6' },
            { label: 'Partidos', value: '4' },
            { label: 'Comunidad', value: 'UV3' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="font-heading text-3xl font-bold text-uv3-green md:text-4xl">{stat.value}</div>
              <div className="mt-1 text-sm text-muted">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-2 text-xl font-semibold text-uv3-green-dark">Portal comunitario</h2>
            <p className="text-sm text-gray-600">
              Comunicados, eventos y novedades del barrio en un mismo lugar.
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-2 text-xl font-semibold text-uv3-green-dark">Sistema deportivo</h2>
            <p className="text-sm text-gray-600">
              Equipos, jugadores, fixtures y tabla de posiciones listos para usar.
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-2 text-xl font-semibold text-uv3-green-dark">Galería y resultados</h2>
            <p className="text-sm text-gray-600">
              Fotos, partidos y marcadores para seguir el torneo sin perder detalle.
            </p>
          </div>
        </div>
      </section>

      <footer className="bg-uv3-green-dark py-8 text-center text-sm text-white/70">
        <p>© 2026 Unidad Vecinal 3 - Plataforma Comunitaria y Deportiva</p>
      </footer>
    </main>
  );
}
