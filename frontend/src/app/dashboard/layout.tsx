import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/app/auth/actions';
import { ROLE_LABEL, isStaffRole } from '@/utils/roles';
import { DashboardNav, DashboardNavMobile, type DashboardNavGroup } from '@/components/DashboardNav';

// El panel siempre depende de la sesión del usuario: nunca debe prerenderizarse.
export const dynamic = 'force-dynamic';

type NavItem = { href: string; label: string; icon: string; adminOnly?: boolean };
type NavGroup = { title: string; items: NavItem[] };

const NAV_GROUPS: NavGroup[] = [
  {
    title: 'Principal',
    items: [{ href: '/dashboard', label: 'Inicio', icon: '🏠' }],
  },
  {
    title: 'Deportes',
    items: [
      { href: '/dashboard/tournaments', label: 'Torneos', icon: '🏆' },
      { href: '/dashboard/matches', label: 'Partidos', icon: '⚽' },
      { href: '/dashboard/teams', label: 'Equipos', icon: '👥' },
      { href: '/dashboard/delegados', label: 'Delegados', icon: '📋' },
      { href: '/dashboard/arbitros', label: 'Árbitros', icon: '🚩' },
    ],
  },
  {
    title: 'Comunidad',
    items: [
      { href: '/dashboard/comercios', label: 'Comercios', icon: '🏬', adminOnly: true },
      { href: '/dashboard/galeria', label: 'Galería', icon: '📷', adminOnly: true },
      { href: '/dashboard/announcements', label: 'Comunicados', icon: '📰', adminOnly: true },
      { href: '/dashboard/notices', label: 'Avisos y utilidad', icon: '📌', adminOnly: true },
    ],
  },
  {
    title: 'Instalaciones',
    items: [
      { href: '/dashboard/reservas', label: 'Reservas', icon: '📅', adminOnly: true },
      { href: '/dashboard/canchas', label: 'Canchas', icon: '🥅', adminOnly: true },
    ],
  },
  {
    title: 'Junta Vecinal',
    items: [
      { href: '/dashboard/junta', label: 'Directiva', icon: '🏛️', adminOnly: true },
      { href: '/dashboard/tesoreria', label: 'Tesorería', icon: '💰', adminOnly: true },
    ],
  },
  {
    title: 'Sistema',
    items: [
      { href: '/dashboard/usuarios', label: 'Usuarios y roles', icon: '👤', adminOnly: true },
      { href: '/dashboard/configuracion', label: 'Configuración', icon: '⚙️', adminOnly: true },
    ],
  },
];

async function signOutFormAction() {
  'use server';
  const { signoutAction } = await import('@/app/auth/actions');
  await signoutAction();
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user || !isStaffRole(user.role)) {
    redirect('/login?message=Acceso restringido a personal autorizado.');
  }

  // Filtra los accesos según el rol del usuario conectado.
  let groups: DashboardNavGroup[] = NAV_GROUPS.map((g) => ({
    title: g.title,
    items: g.items
      .filter((item) => !item.adminOnly || user.role === 'admin')
      .map(({ href, label, icon }) => ({ href, label, icon })),
  })).filter((g) => g.items.length > 0);

  if (user.role === 'delegate') {
    groups = [
      { title: 'Principal', items: [{ href: '/dashboard', label: 'Inicio', icon: '🏠' }] },
      { title: 'Mi equipo', items: [{ href: '/dashboard/teams', label: 'Mi equipo', icon: '👥' }] },
    ];
  }

  return (
    <div className="flex min-h-screen flex-col bg-stone-100">
      <header className="sticky top-0 z-20 border-b border-uv3-green-dark/20 bg-uv3-green-dark text-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-uv3-gold text-sm font-bold text-uv3-green-dark">
              UV3
            </span>
            <span className="hidden text-sm font-semibold uppercase tracking-wider sm:inline">Panel</span>
          </Link>

          <Link
            href="/"
            className="ml-auto hidden rounded-lg border border-white/25 px-3 py-1.5 text-xs font-semibold text-white/90 transition-colors hover:bg-white/10 lg:inline"
          >
            Ver portal ↗
          </Link>

          <div className="ml-auto flex items-center gap-3 lg:ml-0">
            <div className="text-right">
              <p className="text-sm font-semibold leading-tight">{user.full_name || user.username || user.email}</p>
              <p className="text-[11px] uppercase tracking-wide text-white/60">{ROLE_LABEL[user.role] ?? user.role}</p>
            </div>
            <form action={signOutFormAction}>
              <button
                type="submit"
                className="rounded-lg border border-white/30 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-white/10"
              >
                Salir
              </button>
            </form>
          </div>
        </div>

        {/* Navegación móvil */}
        <div className="border-t border-white/10 px-4 py-2 lg:hidden">
          <DashboardNavMobile groups={groups} />
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-8 px-4 py-6 sm:px-6">
        {/* Barra lateral (escritorio) */}
        <aside className="hidden w-56 shrink-0 lg:block">
          <div className="sticky top-20 rounded-2xl bg-uv3-green-dark p-4 shadow-md">
            <DashboardNav groups={groups} />
          </div>
        </aside>

        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
