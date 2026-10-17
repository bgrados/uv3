'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SmartImage } from '@/components/SmartImage';

interface NavItem {
  href: string;
  label: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: 'Comunidad',
    items: [
      { href: '/announcements', label: 'Comunicados' },
      { href: '/gallery', label: 'Galería' },
      { href: '/comercios', label: 'Comercios' },
    ],
  },
  {
    title: 'Deportes',
    items: [
      { href: '/tournaments', label: 'Campeonatos' },
      { href: '/teams', label: 'Equipos' },
    ],
  },
  {
    title: 'Servicios',
    items: [
      { href: '/reservas', label: 'Reservar cancha' },
      { href: '/reservas/consultar', label: 'Mi reserva' },
      { href: '/junta', label: 'Junta Vecinal' },
      { href: '/transparencia', label: 'Transparencia' },
    ],
  },
];

export function SiteHeader({ logoSrc, siteName }: { logoSrc?: string | null; siteName?: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-30 border-b border-uv3-green-dark/15 bg-white shadow-sm">
      {/* Barra superior */}
      <div className="border-b border-stone-100 bg-uv3-green-dark text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-1.5 text-[11px] sm:px-6">
          <span className="capitalize text-white/80">
            📅 {new Date().toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="hidden text-white/70 transition-colors hover:text-white sm:inline">
              Panel
            </Link>
            <Link
              href="https://www.facebook.com/profile.php?id=61564444126122"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[#A8C4F0] transition-colors hover:text-white"
            >
              <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" />
              </svg>
              Facebook
            </Link>
          </div>
        </div>
      </div>

      {/* Masthead */}
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-3">
          {logoSrc ? (
            <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border-2 border-uv3-green-dark p-0.5">
              <SmartImage src={logoSrc} alt="Logo UV3" width={44} height={44} className="h-full w-full rounded-full object-cover" />
            </div>
          ) : (
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-uv3-green-dark text-sm font-bold text-white">
              UV3
            </div>
          )}
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-uv3-green">Unidad Vecinal 3</span>
            <span className="font-heading text-lg font-extrabold uppercase leading-tight text-uv3-green-dark">
              {siteName || 'UV3 Diario'}
            </span>
          </div>
        </Link>

        <Link
          href="/reservas"
          className="ml-auto hidden rounded-lg bg-uv3-green px-4 py-2 text-xs font-bold uppercase tracking-wide text-white shadow-sm transition-colors hover:bg-uv3-green-dark sm:inline"
        >
          Reservar cancha
        </Link>

        {/* Hamburguesa móvil */}
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-label="Abrir menú"
          aria-expanded={open}
          className="ml-auto flex h-10 w-10 flex-col items-center justify-center gap-1.5 rounded-lg border border-stone-200 sm:hidden"
        >
          <span className={`h-0.5 w-5 bg-uv3-green-dark transition-transform ${open ? 'translate-y-1 rotate-45' : ''}`} />
          <span className={`h-0.5 w-5 bg-uv3-green-dark transition-opacity ${open ? 'opacity-0' : ''}`} />
          <span className={`h-0.5 w-5 bg-uv3-green-dark transition-transform ${open ? '-translate-y-1 -rotate-45' : ''}`} />
        </button>
      </div>

      {/* Navegación de escritorio */}
      <nav className="hidden border-t border-stone-100 sm:block">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-1 px-4 sm:px-6">
          <Link
            href="/"
            className={`px-3 py-2.5 text-xs font-bold uppercase tracking-wide transition-colors ${
              pathname === '/' ? 'text-uv3-green' : 'text-stone-600 hover:text-uv3-green'
            }`}
          >
            Portada
          </Link>
          {NAV_GROUPS.map((group) => (
            <div key={group.title} className="group relative">
              <button
                type="button"
                className="px-3 py-2.5 text-xs font-bold uppercase tracking-wide text-stone-600 transition-colors hover:text-uv3-green"
              >
                {group.title}
              </button>
              <div className="invisible absolute left-0 top-full z-40 min-w-[11rem] rounded-b-xl border border-stone-100 bg-white py-1 opacity-0 shadow-lg transition-all group-hover:visible group-hover:opacity-100">
                {group.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`block px-4 py-2 text-sm transition-colors ${
                      isActive(item.href) ? 'font-semibold text-uv3-green' : 'text-stone-600 hover:bg-uv3-bg hover:text-uv3-green'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
          <a
            href="https://www.facebook.com/profile.php?id=61564444126122"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2.5 text-xs font-bold uppercase tracking-wide text-[#1877F2] transition-colors hover:text-uv3-green"
          >
            Facebook
          </a>
        </div>
      </nav>

      {/* Menú móvil desplegable */}
      {open && (
        <nav className="border-t border-stone-100 bg-white sm:hidden">
          <div className="space-y-1 px-4 py-3">
            <Link href="/" className="block rounded-lg px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-uv3-bg">
              Portada
            </Link>
            {NAV_GROUPS.map((group) => (
              <div key={group.title}>
                <p className="px-3 pt-2 text-[10px] font-bold uppercase tracking-wider text-stone-400">{group.title}</p>
                {group.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`block rounded-lg px-3 py-2 text-sm ${
                      isActive(item.href) ? 'font-semibold text-uv3-green' : 'text-stone-700 hover:bg-uv3-bg'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            ))}
            <a
              href="https://www.facebook.com/profile.php?id=61564444126122"
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-lg px-3 py-2 text-sm font-semibold text-[#1877F2] hover:bg-uv3-bg"
            >
              Facebook
            </a>
          </div>
        </nav>
      )}
    </header>
  );
}
