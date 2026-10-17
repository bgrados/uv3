import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { getPublishedTreasuryEntriesAction } from '@/app/actions/treasury';
import { TREASURY_CATEGORY_LABEL, TREASURY_KIND_LABEL } from '@/app/actions/schemas';

export const dynamic = 'force-dynamic';

export default async function TransparenciaPage({
  searchParams,
}: {
  searchParams: Promise<{ y?: string }>;
}) {
  const { y } = await searchParams;
  const res = await getPublishedTreasuryEntriesAction(y);
  const entries = res.success ? res.data ?? [] : [];

  let totalIng = 0;
  let totalEgr = 0;
  const byCat = new Map<string, number>();

  for (const e of entries) {
    const amt = Number(e.amount) || 0;
    if (e.kind === 'ingreso') totalIng += amt;
    if (e.kind === 'egreso') totalEgr += amt;
    const catKey = e.category;
    if (e.kind === 'egreso') {
      byCat.set(catKey, (byCat.get(catKey) || 0) + amt);
    }
  }
  const saldo = totalIng - totalEgr;

  const catRows = Array.from(byCat.entries()).sort((a, b) => b[1] - a[1]);

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-10">
      <Breadcrumbs items={[{ label: 'Junta Vecinal', href: '/junta' }, { label: 'Transparencia' }]} />

      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl font-bold text-uv3-green-dark">Transparencia · Ingresos y egresos</h1>
          <p className="mt-2 text-stone-600">Movimientos publicados para que los vecinos conozcan en qué se gasta el dinero.</p>
        </div>
        <form className="flex items-center gap-2">
          <input name="y" defaultValue={y ?? ''} placeholder="Año (ej. 2025)" className="rounded-lg border px-3 py-2 text-sm outline-none focus:border-uv3-green" />
          <button className="rounded-lg border px-3 py-2 text-sm hover:bg-stone-50">Filtrar</button>
          {y && (
            <Link href="/transparencia" className="text-sm text-stone-500 hover:underline">
              Quitar filtro
            </Link>
          )}
        </form>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <p className="text-xs text-stone-500">Total ingresos</p>
          <p className="mt-1 font-heading text-2xl font-bold text-green-700">S/ {totalIng.toFixed(2)}</p>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <p className="text-xs text-stone-500">Total egresos</p>
          <p className="mt-1 font-heading text-2xl font-bold text-red-600">S/ {totalEgr.toFixed(2)}</p>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <p className="text-xs text-stone-500">Saldo (ingresos - egresos)</p>
          <p className={`mt-1 font-heading text-2xl font-bold ${saldo >= 0 ? 'text-uv3-green-dark' : 'text-amber-700'}`}>S/ {saldo.toFixed(2)}</p>
        </div>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <h2 className="mb-3 font-semibold text-uv3-green-dark">Movimientos publicados</h2>
          {entries.length === 0 ? (
            <p className="py-6 text-center text-stone-500">No hay movimientos publicados para este periodo.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-stone-200 text-sm">
                <thead className="bg-stone-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold text-stone-700">Fecha</th>
                    <th className="px-3 py-2 text-left font-semibold text-stone-700">Tipo</th>
                    <th className="px-3 py-2 text-left font-semibold text-stone-700">Categoría</th>
                    <th className="px-3 py-2 text-left font-semibold text-stone-700">Concepto</th>
                    <th className="px-3 py-2 text-right font-semibold text-stone-700">Monto</th>
                    <th className="px-3 py-2 text-left font-semibold text-stone-700">Comprobante</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {entries.map((e) => (
                    <tr key={e.id}>
                      <td className="px-3 py-2 text-stone-600">{e.entry_date}</td>
                      <td className="px-3 py-2">{TREASURY_KIND_LABEL[e.kind]}</td>
                      <td className="px-3 py-2 text-stone-600">{TREASURY_CATEGORY_LABEL[e.category as keyof typeof TREASURY_CATEGORY_LABEL] ?? e.category}</td>
                      <td className="px-3 py-2 text-stone-600">{e.concept}</td>
                      <td className={`px-3 py-2 text-right font-semibold ${e.kind === 'ingreso' ? 'text-green-700' : 'text-red-600'}`}>
                        S/ {Number(e.amount).toFixed(2)}
                      </td>
                      <td className="px-3 py-2">
                        {e.receipt_url ? (
                          <a href={e.receipt_url} target="_blank" rel="noreferrer" className="text-uv3-green hover:underline">
                            Ver
                          </a>
                        ) : (
                          <span className="text-stone-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <h2 className="mb-3 font-semibold text-uv3-green-dark">Resumen por categoría (egresos)</h2>
          {catRows.length === 0 ? (
            <p className="py-6 text-center text-stone-500">Sin egresos para este periodo.</p>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr>
                  <th className="pb-2 text-left font-semibold text-stone-700">Categoría</th>
                  <th className="pb-2 text-right font-semibold text-stone-700">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {catRows.map(([cat, amt]) => (
                  <tr key={cat}>
                    <td className="py-1.5 text-stone-600">{TREASURY_CATEGORY_LABEL[cat as keyof typeof TREASURY_CATEGORY_LABEL] ?? cat}</td>
                    <td className="py-1.5 text-right font-medium text-red-600">S/ {amt.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <div className="mt-6">
        <Link href="/junta" className="text-uv3-green hover:underline">
          ← Volver a la Junta Vecinal
        </Link>
      </div>
    </main>
  );
}
