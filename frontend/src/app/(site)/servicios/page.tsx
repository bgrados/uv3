import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { getCommunityServicesAction } from '@/app/actions/services';
import { SERVICE_CATEGORY_LABEL } from '@/utils/community';

export const metadata = {
  title: 'Directorio de la Unidad — UV3',
  description: 'Iglesia, club deportivo, club de jubilados, posta de salud, comisaría, mercado y otros servicios de la Unidad Vecinal 3.',
};

export const dynamic = 'force-dynamic';

export default async function ServiciosPage() {
  const result = await getCommunityServicesAction();
  const services = result.success ? result.data ?? [] : [];

  return (
    <main className="min-h-screen pb-16">
      <Breadcrumbs items={[{ label: 'Directorio' }]} />
      <div className="bg-uv3-green-dark text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-uv3-gold">Unidad Vecinal 3</p>
            <h1 className="font-heading text-2xl font-black uppercase tracking-tight">Directorio de la Unidad</h1>
          </div>
          <Link href="/" className="rounded-lg border border-white/30 px-3 py-1.5 text-xs font-semibold hover:bg-white/10">
            ← Portada
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-8">
        {services.length === 0 ? (
          <p className="rounded-lg border bg-white p-8 text-center text-stone-500">
            Aún no hay servicios publicados en el directorio.
          </p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => {
              const wa = (s.whatsapp || s.phone || '').replace(/\D/g, '');
              const waHref = wa.length >= 6 ? `https://wa.me/${wa.startsWith('51') ? wa : `51${wa}`}` : null;
              return (
                <article key={s.id} className="flex flex-col rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-uv3-gold">
                    {SERVICE_CATEGORY_LABEL[s.category] ?? 'Servicio'}
                  </span>
                  <h2 className="mt-1 font-heading text-lg font-bold text-uv3-green-dark">
                    {s.icon ? `${s.icon} ` : ''}
                    {s.name}
                  </h2>
                  {s.description && <p className="mt-2 text-sm leading-relaxed text-stone-600">{s.description}</p>}
                  <div className="mt-3 space-y-1 text-xs text-stone-500">
                    {s.address && <p>📍 {s.address}</p>}
                    {s.hours && <p>🕒 {s.hours}</p>}
                    {s.phone && <p>📞 {s.phone}</p>}
                  </div>
                  {waHref && (
                    <a
                      href={waHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-block self-start rounded bg-[#25D366] px-3 py-1.5 text-xs font-bold text-white"
                    >
                      WhatsApp
                    </a>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
