import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/app/auth/actions';
import { ROLE_LABEL, isStaffRole } from '@/utils/roles';

// El panel siempre depende de la sesión del usuario: nunca debe prerenderizarse.
export const dynamic = 'force-dynamic';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Panel' },
  { href: '/dashboard/tournaments', label: 'Torneos' },
  { href: '/dashboard/matches', label: 'Partidos' },
  { href: '/dashboard/teams', label: 'Equipos' },
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

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b border-uv3-green-dark/20 bg-uv3-green-dark text-white shadow-sm">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-2 px-6 py-3">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-uv3-gold text-sm font-bold text-uv3-green-dark">
              UV3
            </span>
            <span className="text-sm font-semibold uppercase tracking-wider">Panel</span>
          </Link>

          <nav className="order-3 flex w-full gap-1 overflow-x-auto text-sm sm:order-2 sm:w-auto">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="whitespace-nowrap rounded-lg px-3 py-1.5 font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/"
              className="whitespace-nowrap rounded-lg px-3 py-1.5 font-medium text-white/60 transition-colors hover:bg-white/10 hover:text-white"
            >
              Ver portal ↗
            </Link>
          </nav>

          <div className="order-2 ml-auto flex items-center gap-3 sm:order-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold leading-tight">
                {user.full_name || user.username || user.email}
              </p>
              <p className="text-[11px] uppercase tracking-wide text-white/60">
                {ROLE_LABEL[user.role] ?? user.role}
              </p>
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
      </header>

      <div className="flex-1">{children}</div>
    </div>
  );
}
