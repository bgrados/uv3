'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export interface DashboardNavItem {
  href: string;
  label: string;
  icon: string;
}

export interface DashboardNavGroup {
  title: string;
  items: DashboardNavItem[];
}

function isActive(pathname: string, href: string) {
  if (href === '/dashboard') return pathname === '/dashboard';
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Navegación vertical agrupada del panel (escritorio). */
export function DashboardNav({ groups }: { groups: DashboardNavGroup[] }) {
  const pathname = usePathname();

  return (
    <nav className="space-y-5">
      {groups.map((group) => (
        <div key={group.title}>
          <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-white/40">{group.title}</p>
          <div className="flex flex-col gap-0.5">
            {group.items.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    active
                      ? 'bg-uv3-gold text-uv3-green-dark shadow-sm'
                      : 'text-white/75 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span aria-hidden className="text-base leading-none">
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

/** Navegación horizontal deslizable para móvil. */
export function DashboardNavMobile({ groups }: { groups: DashboardNavGroup[] }) {
  const pathname = usePathname();
  const items = groups.flatMap((g) => g.items);

  return (
    <nav className="flex gap-1.5 overflow-x-auto pb-1">
      {items.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              active ? 'bg-uv3-gold text-uv3-green-dark' : 'bg-white/10 text-white/80 hover:bg-white/20'
            }`}
          >
            <span aria-hidden>{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
