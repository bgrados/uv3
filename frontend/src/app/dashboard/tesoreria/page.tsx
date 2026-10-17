import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { ConfirmSubmitButton } from '@/components/ConfirmSubmitButton';
import { SubmitButton } from '@/components/SubmitButton';
import { ImageUploader } from '@/components/ImageUploader';
import {
  TREASURY_CATEGORIES,
  TREASURY_CATEGORY_LABEL,
  TREASURY_KINDS,
  TREASURY_KIND_LABEL,
} from '@/app/actions/schemas';
import {
  createTreasuryEntryAction,
  deleteTreasuryEntryAction,
  getAllTreasuryEntriesAction,
  updateTreasuryEntryAction,
} from '@/app/actions/treasury';
import { getAllBoardMembersAction } from '@/app/actions/board';
import type { BoardMember, TreasuryEntry } from '@/types';

export const dynamic = 'force-dynamic';

function TreasuryFields({
  entry,
  members,
}: {
  entry?: TreasuryEntry;
  members: BoardMember[];
}) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-4">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-gray-700">Fecha</span>
          <input
            name="entry_date"
            type="date"
            required
            defaultValue={entry?.entry_date ?? new Date().toISOString().slice(0, 10)}
            className="rounded-lg border px-3 py-2 outline-none focus:border-uv3-green"
          />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-gray-700">Tipo</span>
          <select
            name="kind"
            required
            defaultValue={entry?.kind ?? 'egreso'}
            className="rounded-lg border px-3 py-2 outline-none focus:border-uv3-green"
          >
            {TREASURY_KINDS.map((k) => (
              <option key={k} value={k}>
                {TREASURY_KIND_LABEL[k]}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-gray-700">Categoría</span>
          <select
            name="category"
            defaultValue={entry?.category ?? 'otros'}
            className="rounded-lg border px-3 py-2 outline-none focus:border-uv3-green"
          >
            {TREASURY_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {TREASURY_CATEGORY_LABEL[c]}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-gray-700">Monto (S/)</span>
          <input
            name="amount"
            type="number"
            step="0.01"
            min="0"
            required
            defaultValue={entry?.amount ?? 0}
            className="rounded-lg border px-3 py-2 outline-none focus:border-uv3-green"
          />
        </label>
      </div>

      <label className="grid gap-2">
        <span className="text-sm font-medium text-gray-700">Concepto</span>
        <input
          name="concept"
          required
          defaultValue={entry?.concept ?? ''}
          placeholder="Detalle del movimiento"
          className="rounded-lg border px-3 py-2 outline-none focus:border-uv3-green"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-gray-700">Responsable (directivo)</span>
          <select
            name="responsible_member_id"
            defaultValue={entry?.responsible_member_id ?? ''}
            className="rounded-lg border px-3 py-2 outline-none focus:border-uv3-green"
          >
            <option value="">Sin responsable</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.full_name} ({BOARD_POSITION_LABEL[m.position]})
              </option>
            ))}
          </select>
        </label>
        <ImageUploader
          name="receipt_url"
          bucket="gallery-media"
          label="Comprobante (opcional)"
          initialValue={entry?.receipt_url ?? ''}
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input type="checkbox" name="is_published" value="true" defaultChecked={entry?.is_published ?? true} />
        Publicar en la página de Transparencia
      </label>
    </div>
  );
}

import { BOARD_POSITION_LABEL } from '@/app/actions/schemas';

export default async function TesoreriaAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string; y?: string }>;
}) {
  const { ok, error, y } = await searchParams;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect('/login');
  const { data: profile } = await supabase.from('users').select('role').eq('id', auth.user.id).maybeSingle();
  if (profile?.role !== 'admin') {
    return <main className="px-6 py-12 text-amber-700">Este módulo es exclusivo del administrador.</main>;
  }

  const [entriesRes, membersRes] = await Promise.all([
    getAllTreasuryEntriesAction(y),
    getAllBoardMembersAction(),
  ]);
  const entries = entriesRes.success ? entriesRes.data ?? [] : [];
  const members = membersRes.success ? membersRes.data ?? [] : [];

  let totalIng = 0;
  let totalEgr = 0;
  for (const e of entries) {
    if (e.kind === 'ingreso') totalIng += Number(e.amount) || 0;
    if (e.kind === 'egreso') totalEgr += Number(e.amount) || 0;
  }
  const saldo = totalIng - totalEgr;

  async function createForm(formData: FormData) {
    'use server';
    const r = await createTreasuryEntryAction(formData);
    redirect(`/dashboard/tesoreria?${r.success ? 'ok=Movimiento registrado' : `error=${encodeURIComponent(r.error ?? 'Error')}`}${y ? `&y=${y}` : ''}`);
  }

  async function updateForm(formData: FormData) {
    'use server';
    const id = String(formData.get('id') ?? '');
    const r = await updateTreasuryEntryAction(id, formData);
    redirect(`/dashboard/tesoreria?${r.success ? 'ok=Movimiento actualizado' : `error=${encodeURIComponent(r.error ?? 'Error')}`}${y ? `&y=${y}` : ''}`);
  }

  async function deleteForm(formData: FormData) {
    'use server';
    const id = String(formData.get('id') ?? '');
    const r = await deleteTreasuryEntryAction(id);
    redirect(`/dashboard/tesoreria?${r.success ? 'ok=Movimiento eliminado' : `error=${encodeURIComponent(r.error ?? 'Error')}`}${y ? `&y=${y}` : ''}`);
  }

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-10">
      <h1 className="font-heading text-3xl font-bold text-uv3-green-dark">Tesorería / Transparencia</h1>
      <p className="mt-2 text-stone-600">
        Registra ingresos y egresos. Solo lo publicado aparece en{' '}
        <Link href="/transparencia" className="text-uv3-green hover:underline">
          /transparencia
        </Link>.
      </p>

      {ok && <div className="mt-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">✅ {ok}</div>}
      {error && <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">⚠️ {error}</div>}

      <section className="mt-6 grid gap-3 sm:grid-cols-4">
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <p className="text-xs text-stone-500">Total ingresos</p>
          <p className="mt-1 font-heading text-2xl font-bold text-green-700">S/ {totalIng.toFixed(2)}</p>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <p className="text-xs text-stone-500">Total egresos</p>
          <p className="mt-1 font-heading text-2xl font-bold text-red-600">S/ {totalEgr.toFixed(2)}</p>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm sm:col-span-2">
          <p className="text-xs text-stone-500">Saldo (ingresos - egresos)</p>
          <p className={`mt-1 font-heading text-2xl font-bold ${saldo >= 0 ? 'text-uv3-green-dark' : 'text-amber-700'}`}>S/ {saldo.toFixed(2)}</p>
        </div>
      </section>

      <section className="mt-6">
        <form className="flex items-center gap-2">
          <input name="y" defaultValue={y ?? ''} placeholder="Año (ej. 2025)" className="rounded-lg border px-3 py-2 text-sm outline-none focus:border-uv3-green" />
          <button className="rounded-lg border px-3 py-2 text-sm hover:bg-stone-50">Filtrar</button>
          {y && (
            <Link href="/dashboard/tesoreria" className="text-sm text-stone-500 hover:underline">
              Quitar filtro
            </Link>
          )}
        </form>
      </section>

      <section className="mt-6 rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-uv3-green-dark">Nuevo movimiento</h2>
        <form action={createForm} className="mt-4">
          <TreasuryFields members={members} />
          <div className="mt-5">
            <SubmitButton label="Registrar movimiento" pendingLabel="Registrando…" />
          </div>
        </form>
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="text-xl font-semibold text-uv3-green-dark">Movimientos ({entries.length})</h2>
        {entries.length === 0 && (
          <p className="rounded-xl border bg-white p-8 text-center text-stone-500">No hay movimientos para este periodo.</p>
        )}
        {entries.map((e) => (
          <details key={e.id} className="rounded-xl border bg-white p-4 shadow-sm">
            <summary className="cursor-pointer list-none">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-stone-800">
                    {e.entry_date} · {TREASURY_KIND_LABEL[e.kind]} · S/ {Number(e.amount).toFixed(2)}
                  </p>
                  <p className="truncate text-xs text-stone-500">
                    {e.concept} · {TREASURY_CATEGORY_LABEL[e.category as keyof typeof TREASURY_CATEGORY_LABEL] ?? e.category}{' '}
                    {e.responsible?.full_name ? ` · resp.: ${e.responsible.full_name}` : ''}{' '}
                    {e.is_published ? ' · publicado' : ' · borrador'}
                  </p>
                </div>
                <span className="shrink-0 text-xs font-semibold text-uv3-green">Editar ▾</span>
              </div>
            </summary>
            <form action={updateForm} className="mt-4 border-t pt-4">
              <input type="hidden" name="id" value={e.id} />
              <TreasuryFields entry={e} members={members} />
              <div className="mt-5">
                <SubmitButton label="Guardar cambios" pendingLabel="Guardando…" />
              </div>
            </form>
            <form action={deleteForm} className="mt-4 border-t pt-4">
              <input type="hidden" name="id" value={e.id} />
              <ConfirmSubmitButton
                label="Eliminar movimiento"
                pendingLabel="Eliminando..."
                confirmMessage="¿Eliminar este movimiento de tesorería?"
              />
            </form>
          </details>
        ))}
      </section>
    </main>
  );
}
