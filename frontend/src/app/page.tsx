import Link from 'next/link';
import { getCurrentUser } from '@/app/auth/actions';

export default async function HomePage() {
  const user = await getCurrentUser();

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-uv3-green-dark via-uv3-green to-uv3-green-dark">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-uv3-gold rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-uv3-gold rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
        </div>

        {/* Navbar */}
        <nav className="relative z-10 flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-uv3-gold rounded-lg flex items-center justify-center font-heading font-bold text-uv3-green-dark text-lg">
              UV3
            </div>
            <span className="text-white font-heading font-bold text-xl hidden sm:block">
              Unidad Vecinal 3
            </span>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <span className="text-white/80 text-sm hidden sm:block">
                  Hola, {user.full_name || user.username}
                </span>
                <Link
                  href="/dashboard"
                  className="px-5 py-2 bg-uv3-gold text-uv3-green-dark font-semibold rounded-lg hover:bg-uv3-gold/90 transition-colors"
                >
                  Dashboard
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-white hover:text-uv3-gold transition-colors font-medium"
                >
                  Iniciar Sesión
                </Link>
                <Link
                  href="/register"
                  className="px-5 py-2 bg-uv3-gold text-uv3-green-dark font-semibold rounded-lg hover:bg-uv3-gold/90 transition-colors"
                >
                  Registrarse
                </Link>
              </>
            )}
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 flex flex-col items-center text-center px-6 py-24 md:py-32 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-uv3-gold text-sm font-medium mb-6">
            <span className="w-2 h-2 bg-uv3-gold rounded-full animate-pulse" />
            Campeonato Apertura 2026 — En curso
          </div>

          <h1 className="font-heading text-4xl md:text-6xl font-bold text-white leading-tight mb-6">
            El corazón digital de{' '}
            <span className="text-uv3-gold">nuestra comunidad</span>
          </h1>

          <p className="text-white/80 text-lg md:text-xl max-w-2xl mb-10">
            Campeonatos, fixtures automáticos, resultados en vivo, tabla de posiciones,
            noticias y más. Todo en un solo lugar.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/tournaments"
              className="px-8 py-3 bg-uv3-gold text-uv3-green-dark font-bold rounded-xl hover:bg-uv3-gold/90 transition-all hover:scale-105 shadow-lg"
            >
              Ver Campeonatos
            </Link>
            <Link
              href="/teams"
              className="px-8 py-3 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-xl border border-white/20 hover:bg-white/20 transition-all"
            >
              Ver Equipos
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { label: 'Equipos', value: '12+' },
            { label: 'Jugadores', value: '150+' },
            { label: 'Partidos', value: '50+' },
            { label: 'Comunidad', value: 'UV3' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="font-heading text-3xl md:text-4xl font-bold text-uv3-green">
                {stat.value}
              </div>
              <div className="text-muted text-sm mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-uv3-green-dark text-white/70 text-center py-8 text-sm">
        <p>© 2026 Unidad Vecinal 3 — Plataforma Comunitaria y Deportiva</p>
      </footer>
    </main>
  );
}
