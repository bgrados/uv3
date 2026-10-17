import Link from 'next/link';

export function SiteFooter({ siteName, facebookUrl }: { siteName?: string; facebookUrl?: string }) {
  return (
    <footer className="mt-12 border-t-2 border-uv3-green-dark/15 bg-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-10 sm:grid-cols-3">
        <div>
          <p className="font-heading text-lg font-extrabold uppercase text-uv3-green-dark">{siteName || 'UV3 Diario'}</p>
          <p className="mt-2 text-sm text-stone-600">
            Plataforma digital de la Unidad Vecinal 3: deportes, comercios, comunicados y servicios para la comunidad.
          </p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-stone-400">Secciones</p>
          <div className="mt-3 grid grid-cols-2 gap-1 text-sm">
            <Link href="/announcements" className="text-stone-600 hover:text-uv3-green">Comunicados</Link>
            <Link href="/gallery" className="text-stone-600 hover:text-uv3-green">Galería</Link>
            <Link href="/comercios" className="text-stone-600 hover:text-uv3-green">Comercios</Link>
            <Link href="/tournaments" className="text-stone-600 hover:text-uv3-green">Campeonatos</Link>
            <Link href="/teams" className="text-stone-600 hover:text-uv3-green">Equipos</Link>
            <Link href="/reservas" className="text-stone-600 hover:text-uv3-green">Reservar cancha</Link>
          </div>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-stone-400">La Institución</p>
          <div className="mt-3 grid grid-cols-1 gap-1 text-sm">
            <Link href="/junta" className="text-stone-600 hover:text-uv3-green">Junta Vecinal</Link>
            <Link href="/transparencia" className="text-stone-600 hover:text-uv3-green">Transparencia</Link>
            {facebookUrl && (
              <a href={facebookUrl} target="_blank" rel="noopener noreferrer" className="text-[#1877F2] hover:text-uv3-green">
                Comunidad en Facebook
              </a>
            )}
          </div>
        </div>
      </div>
      <div className="border-t border-stone-100 py-4 text-center text-xs text-stone-400">
        © {new Date().getFullYear()} {siteName || 'Unidad Vecinal 3'} · Hecho con 💚 para el barrio
      </div>
    </footer>
  );
}
