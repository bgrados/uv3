import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/app/auth/actions';
import { createClient } from '@/utils/supabase/server';

interface Stat {
  label: string;
  value: number;
  icon: string;
  href: string;
}

interface Shortcut {
  href: string;
  title: string;
  description: string;
  icon: string;
  adminOnly?: boolean;
  accent?: 'live';
}

const SHORTCUTS: Shortcut[] = [
  {
    href: '/dashboard/tournaments',
    title: 'Organizar campeonatos',
    description: 'Crea torneos, define formato e inscribe equipos.',
    icon: '🏆',
  },
  {
    href: '/dashboard/matches',
    title: 'Partidos en vivo',
    description: 'Controla marcadores en tiempo real y finaliza encuentros.',
    icon: '⚽',
    accent: 'live',
  },
  {
    href: '/dashboard/teams',
    title: 'Equipos',
    description: 'Administra los equipos registrados en la plataforma.',
    icon: '👥',
  },
  {
    href: '/dashboard/comercios',
    title: 'Comercios',
    description: 'Directorio vecinal y favoritos del carrusel de portada.',
    icon: '🏬',
    adminOnly: true,
  },
  {
    href: '/dashboard/announcements',
    title: 'Comunicados',
    description: 'Noticias con fotos y video para la comunidad.',
    icon: '📰',
    adminOnly: true,
  },
  {
    href: '/dashboard/notices',
    title: 'Avisos y utilidad',
    description: 'Bloques editables del lateral de la portada.',
    icon: '📌',
    adminOnly: true,
  },
  {
    href: '/dashboard/galeria',
    title: 'Galería',
    description: 'Álbumes de fotos del barrio y los eventos.',
    icon: '📷',
    adminOnly: true,
  },
  {
    href: '/dashboard/configuracion',
    title: 'Configuración',
    description: 'Logo, contacto, redes y datos generales del portal.',
    icon: '⚙️',
    adminOnly: true,
  },
];

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user || !['admin', 'organizer', 'referee'].includes(user.role)) {
    redirect('/login?message=Acceso restringido a personal autorizado.');
  }

  let stats: Stat[] = [
    { label: 'Equipos', value: 0, icon: '👥', href: '/dashboard/teams' },
    { label: 'Campeonatos', value: 0, icon: '🏆', href: '/dashboard/tournaments' },
    { label: 'Partidos', value: 0, icon: '⚽', href: '/dashboard/matches' },
  ];

  try {
    const supabase = await createClient();
    if (supabase) {
      const queries = [
        supabase.from('teams').select('*', { count: 'exact', head: true }),
        supabase.from('tournaments').select('*', { count: 'exact', head: true }),
        supabase.from('matches').select('*', { count: 'exact', head: true }),
      ];
      if (user.role === 'admin') {
        queries.push(
          supabase.from('businesses').select('*', { count: 'exact', head: true }),
          supabase.from('notices').select('*', { count: 'exact', head: true })
        );
      }
      const results = await Promise.all(queries);
      stats = [
        { label: 'Equipos', value: results[0].count ?? 0, icon: '👥', href: '/dashboard/teams' },
        { label: 'Campeonatos', value: results[1].count ?? 0, icon: '🏆', href: '/dashboard/tournaments' },
        { label: 'Partidos', value: results[2].count ?? 0, icon: '⚽', href: '/dashboard/matches' },
      ];
      if (user.role === 'admin') {
        stats.push(
          { label: 'Comercios', value: results[3].count ?? 0, icon: '🏬', href: '/dashboard/comercios' },
          { label: 'Avisos', value: results[4].count ?? 0, icon: '📌', href: '/dashboard/notices' }
        );
      }
    }
  } catch (err) {
    console.warn('No se pudo conectar a la base de datos para los conteos:', err);
  }

  const shortcuts = SHORTCUTS.filter((s) => !s.adminOnly || user.role === 'admin');

  return (
    <main className="pb-12">
      <section className="rounded-2xl bg-gradient-to-br from-uv3-green-dark to-uv3-green p-7 text-white shadow-lg">
        <p className="text-xs font-semibold uppercase tracking-wider text-white/70">Panel principal</p>
        <h1 className="mt-2 font-heading text-3xl font-bold">
          ¡Hola, {user.full_name?.split(' ')[0] || user.username || 'vecino'}! 👋
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-white/85">
          Desde aquí gestionas todo el portal de la Unidad Vecinal 3: deportes, contenidos y la información que ven los
          vecinos en la portada.
        </p>
      </section>

      <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-uv3-green hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-stone-500">{stat.label}</span>
              <span aria-hidden className="text-lg">
                {stat.icon}
              </span>
            </div>
            <p className="mt-2 font-heading text-2xl font-bold text-uv3-green-dark">{stat.value}</p>
          </Link>
        ))}
      </section>

      <section className="mt-8">
        <h2 className="mb-3 font-heading text-lg font-bold text-uv3-green-dark">Accesos rápidos</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shortcuts.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className={`group rounded-xl border bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${
                s.accent === 'live' ? 'border-red-100 hover:border-red-300' : 'border-stone-200 hover:border-uv3-green'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <span aria-hidden className="text-2xl">
                  {s.icon}
                </span>
                {s.accent === 'live' && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-red-700">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-600" />
                    Live
                  </span>
                )}
              </div>
              <h3 className="mt-3 font-semibold text-uv3-green-dark group-hover:underline">{s.title}</h3>
              <p className="mt-1 text-sm text-stone-600">{s.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
