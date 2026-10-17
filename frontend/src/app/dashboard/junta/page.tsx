import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { ConfirmSubmitButton } from '@/components/ConfirmSubmitButton';
import { SubmitButton } from '@/components/SubmitButton';
import { ImageUploader } from '@/components/ImageUploader';
import {
  BOARD_POSITION_LABEL,
  BOARD_POSITIONS,
} from '@/app/actions/schemas';
import {
  createBoardMemberAction,
  deleteBoardMemberAction,
  getAllBoardMembersAction,
  updateBoardMemberAction,
} from '@/app/actions/board';
import type { BoardMember } from '@/types';

export const dynamic = 'force-dynamic';

function BoardFields({ member }: { member?: BoardMember }) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="grid gap-2 sm:col-span-1">
          <span className="text-sm font-medium text-gray-700">Cargo</span>
          <select
            name="position"
            required
            defaultValue={member?.position ?? 'presidente'}
            className="rounded-lg border px-3 py-2 outline-none focus:border-uv3-green"
          >
            {BOARD_POSITIONS.map((p) => (
              <option key={p} value={p}>
                {BOARD_POSITION_LABEL[p]}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 sm:col-span-2">
          <span className="text-sm font-medium text-gray-700">Nombre completo</span>
          <input
            name="full_name"
            required
            defaultValue={member?.full_name ?? ''}
            placeholder="Nombre y apellidos"
            className="rounded-lg border px-3 py-2 outline-none focus:border-uv3-green"
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <ImageUploader
          name="photo_url"
          bucket="gallery-media"
          label="Foto (opcional)"
          initialValue={member?.photo_url ?? ''}
        />
        <div className="grid gap-4">
          <label className="grid gap-2">
            <span className="text-sm font-medium text-gray-700">Período</span>
            <input
              name="period"
              defaultValue={member?.period ?? ''}
              placeholder="2024-2026"
              className="rounded-lg border px-3 py-2 outline-none focus:border-uv3-green"
            />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-medium text-gray-700">Orden</span>
            <input
              name="sort_order"
              type="number"
              min={0}
              defaultValue={member?.sort_order ?? 0}
              className="rounded-lg border px-3 py-2 outline-none focus:border-uv3-green"
            />
          </label>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-gray-700">Email</span>
          <input
            name="email"
            type="email"
            defaultValue={member?.email ?? ''}
            className="rounded-lg border px-3 py-2 outline-none focus:border-uv3-green"
          />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-gray-700">Teléfono</span>
          <input
            name="phone"
            defaultValue={member?.phone ?? ''}
            className="rounded-lg border px-3 py-2 outline-none focus:border-uv3-green"
          />
        </label>
      </div>

      <label className="grid gap-2">
        <span className="text-sm font-medium text-gray-700">Biografía (opcional)</span>
        <textarea
          name="bio"
          rows={3}
          defaultValue={member?.bio ?? ''}
          className="rounded-lg border px-3 py-2 outline-none focus:border-uv3-green"
        />
      </label>

      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input type="checkbox" name="is_active" value="true" defaultChecked={member?.is_active ?? true} />
        Directivo activo
      </label>
    </div>
  );
}

export default async function JuntaAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { ok, error } = await searchParams;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect('/login');
  const { data: profile } = await supabase.from('users').select('role').eq('id', auth.user.id).maybeSingle();
  if (profile?.role !== 'admin') {
    return <main className="px-6 py-12 text-amber-700">Este módulo es exclusivo del administrador.</main>;
  }

  const res = await getAllBoardMembersAction();
  const members = res.success ? res.data ?? [] : [];

  async function createForm(formData: FormData) {
    'use server';
    const r = await createBoardMemberAction(formData);
    redirect(`/dashboard/junta?${r.success ? 'ok=Directivo agregado' : `error=${encodeURIComponent(r.error ?? 'Error')}`}`);
  }

  async function updateForm(formData: FormData) {
    'use server';
    const id = String(formData.get('id') ?? '');
    const r = await updateBoardMemberAction(id, formData);
    redirect(`/dashboard/junta?${r.success ? 'ok=Directivo actualizado' : `error=${encodeURIComponent(r.error ?? 'Error')}`}`);
  }

  async function deleteForm(formData: FormData) {
    'use server';
    const id = String(formData.get('id') ?? '');
    const r = await deleteBoardMemberAction(id);
    redirect(`/dashboard/junta?${r.success ? 'ok=Directivo eliminado' : `error=${encodeURIComponent(r.error ?? 'Error')}`}`);
  }

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-10">
      <h1 className="font-heading text-3xl font-bold text-uv3-green-dark">Junta Vecinal · Directiva</h1>
      <p className="mt-2 text-stone-600">
        Gestiona los integrantes de la Junta Vecinal. Esta información aparece en <Link href="/junta" className="text-uv3-green hover:underline">/junta</Link>.
      </p>

      {ok && <div className="mt-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">✅ {ok}</div>}
      {error && <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">⚠️ {error}</div>}

      <section className="mt-8 rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-uv3-green-dark">Nuevo directivo</h2>
        <form action={createForm} className="mt-4">
          <BoardFields />
          <div className="mt-5">
            <SubmitButton label="Agregar directivo" pendingLabel="Agregando…" />
          </div>
        </form>
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="text-xl font-semibold text-uv3-green-dark">Directiva ({members.length})</h2>
        {members.length === 0 && (
          <p className="rounded-xl border bg-white p-8 text-center text-stone-500">Aún no hay directivos registrados.</p>
        )}
        {members.map((m) => (
          <details key={m.id} className="rounded-xl border bg-white p-4 shadow-sm">
            <summary className="cursor-pointer list-none">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-stone-800">
                    {m.full_name}
                  </p>
                  <p className="text-xs text-stone-500">
                    {BOARD_POSITION_LABEL[m.position]} {m.period ? ` · ${m.period}` : ''}{' '}
                    {m.is_active ? ' · activo' : ' · inactivo'}
                  </p>
                </div>
                <span className="shrink-0 text-xs font-semibold text-uv3-green">Editar ▾</span>
              </div>
            </summary>
            <form action={updateForm} className="mt-4 border-t pt-4">
              <input type="hidden" name="id" value={m.id} />
              <BoardFields member={m} />
              <div className="mt-5">
                <SubmitButton label="Guardar cambios" pendingLabel="Guardando…" />
              </div>
            </form>
            <form action={deleteForm} className="mt-4 border-t pt-4">
              <input type="hidden" name="id" value={m.id} />
              <ConfirmSubmitButton
                label="Eliminar directivo"
                pendingLabel="Eliminando..."
                confirmMessage={`¿Eliminar a "${m.full_name}" de la directiva?`}
              />
            </form>
          </details>
        ))}
      </section>
    </main>
  );
}
