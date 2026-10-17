import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { SmartImage } from '@/components/SmartImage';
import { BOARD_POSITION_LABEL } from '@/app/actions/schemas';
import { getActiveBoardMembersAction } from '@/app/actions/board';

export const dynamic = 'force-dynamic';

export default async function JuntaPublicPage() {
  const [membersRes] = await Promise.all([getActiveBoardMembersAction()]);
  const members = membersRes.success ? membersRes.data ?? [] : [];

  // Ordenar por sort_order y luego por posición deseada
  const orderPos: Record<string, number> = {
    presidente: 1,
    vicepresidente: 2,
    secretario: 3,
    tesorero: 4,
    fiscal: 5,
    vocal_deportes: 6,
    vocal_educacion: 7,
    vocal_ecologia: 8,
    otro: 9,
  };

  const sorted = [...members].sort((a, b) => {
    const oa = orderPos[a.position] ?? 99;
    const ob = orderPos[b.position] ?? 99;
    if (oa !== ob) return oa - ob;
    if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
    return a.full_name.localeCompare(b.full_name);
  });

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-10">
      <Breadcrumbs items={[{ label: 'Junta Vecinal' }]} />

      <header className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-uv3-green-dark">Junta Vecinal</h1>
        <p className="mt-2 max-w-3xl text-stone-600">
          Integrantes de la Junta Vecinal. Conoce quiénes representan a la Unidad Vecinal 3.
        </p>
      </header>

      {sorted.length === 0 ? (
        <div className="rounded-xl border bg-white p-10 text-center text-stone-600 shadow-sm">
          Aún no se ha registrado la directiva. Volveremos pronto con más información.
        </div>
      ) : (
        <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((m) => (
            <article key={m.id} className="flex flex-col items-center rounded-2xl border bg-white p-6 text-center shadow-sm">
              <div className="relative h-28 w-28 overflow-hidden rounded-full border-4 border-uv3-bg bg-stone-100">
                {m.photo_url ? (
                  <SmartImage src={m.photo_url} alt={m.full_name} width={112} height={112} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-3xl">👤</div>
                )}
              </div>
              <h2 className="mt-4 font-semibold text-uv3-green-dark">{m.full_name}</h2>
              <p className="mt-1 text-sm font-medium text-stone-700">{BOARD_POSITION_LABEL[m.position]}</p>
              {m.period && <p className="mt-1 text-xs text-stone-500">Período: {m.period}</p>}
              {m.bio && <p className="mt-3 text-sm text-stone-600">{m.bio}</p>}
              <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-sm text-stone-500">
                {m.email && (
                  <a className="hover:text-uv3-green" href={`mailto:${m.email}`}>
                    ✉️ {m.email}
                  </a>
                )}
                {m.phone && <span>📞 {m.phone}</span>}
              </div>
            </article>
          ))}
        </section>
      )}

      <div className="mt-8">
        <Link href="/transparencia" className="inline-flex items-center gap-2 rounded-lg bg-uv3-green px-4 py-2 font-semibold text-white hover:bg-uv3-green-dark">
          Ver Transparencia (ingresos y egresos)
        </Link>
      </div>
    </main>
  );
}
