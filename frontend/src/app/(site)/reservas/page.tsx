import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { getSpacesAction } from '@/app/actions/spaces';
import { getSiteSettingsAction } from '@/app/actions/settings';
import { ReservasClient } from './ReservasClient';

export const metadata = {
  title: 'Reservar cancha — Unidad Vecinal 3',
  description:
    'Reserva la cancha de fútbol, la losa de fúlbito/básquet/vóley o alquila el espacio para tu evento. Disponibilidad en tiempo real.',
};

export default async function ReservasPage() {
  const [spacesResult, settings] = await Promise.all([getSpacesAction(), getSiteSettingsAction()]);
  const spaces = (spacesResult.success ? spacesResult.data : []) ?? [];

  return (
    <main className="min-h-screen bg-uv3-bg pb-16">
      <Breadcrumbs items={[{ label: 'Reservar cancha' }]} />
      <div className="bg-uv3-green-dark text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-uv3-gold">
              Unidad Vecinal 3
            </p>
            <h1 className="font-heading text-2xl font-black uppercase tracking-tight">
              Reserva de canchas y locales
            </h1>
          </div>
          <div className="flex gap-3 text-xs font-semibold">
            <Link href="/" className="rounded-lg border border-white/30 px-3 py-1.5 hover:bg-white/10">
              ← Portada
            </Link>
            <Link href="/reservas/consultar" className="rounded-lg bg-uv3-gold px-3 py-1.5 text-uv3-green-dark hover:bg-white">
              Consultar mi reserva
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-8">
        {spaces.length === 0 ? (
          <p className="rounded-lg border bg-white p-8 text-center text-stone-500">
            Todavía no hay espacios configurados. Vuelve a intentarlo más tarde.
          </p>
        ) : (
          <ReservasClient spaces={spaces} settings={settings} />
        )}
      </div>
    </main>
  );
}
