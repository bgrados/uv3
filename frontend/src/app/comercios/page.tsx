import Image from 'next/image';
import Link from 'next/link';
import { getBusinessesAction } from '@/app/actions/businesses';
import { BUSINESS_CATEGORY_LABEL } from '@/utils/site';

export const metadata = {
  title: 'Comercios de la Unidad — UV3',
  description: 'Directorio de comercios, farmacias, market y servicios dentro de la Unidad Vecinal 3.',
};

export default async function ComerciosPage() {
  const result = await getBusinessesAction();
  const businesses = result.success ? result.data ?? [] : [];

  return (
    <main className="min-h-screen bg-uv3-bg pb-16">
      <div className="bg-uv3-green-dark text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-uv3-gold">Unidad Vecinal 3</p>
            <h1 className="font-heading text-2xl font-black uppercase tracking-tight">Comercios de la Unidad</h1>
          </div>
          <Link href="/" className="rounded-lg border border-white/30 px-3 py-1.5 text-xs font-semibold hover:bg-white/10">
            ← Portada
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-8">
        {businesses.length === 0 ? (
          <p className="rounded-lg border bg-white p-8 text-center text-stone-500">
            Aún no hay comercios publicados.
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {businesses.map((b) => {
              const wa = (b.whatsapp || b.phone || '').replace(/\D/g, '');
              const waHref = wa.length >= 6 ? `https://wa.me/${wa.startsWith('51') ? wa : `51${wa}`}` : null;
              return (
                <article key={b.id} className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm">
                  <div className="relative h-44 w-full bg-stone-100">
                    {b.image_url ? (
                      <Image src={b.image_url} alt={b.name} fill sizes="(max-width: 768px) 100vw, 360px" className="object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-4xl">🏬</div>
                    )}
                    <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-uv3-green">
                      {BUSINESS_CATEGORY_LABEL[b.category]}
                    </span>
                  </div>
                  <div className="p-4">
                    <h2 className="font-heading text-lg font-bold text-uv3-green-dark">{b.name}</h2>
                    {b.description && <p className="mt-1 text-sm leading-relaxed text-stone-600">{b.description}</p>}
                    <div className="mt-3 space-y-1 text-xs text-stone-500">
                      {b.address && <p>📍 {b.address}</p>}
                      {b.phone && <p>📞 {b.phone}</p>}
                    </div>
                    {waHref && (
                      <a
                        href={waHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-block rounded bg-[#25D366] px-3 py-1.5 text-xs font-bold text-white"
                      >
                        WhatsApp
                      </a>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
