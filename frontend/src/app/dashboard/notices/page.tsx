import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { ConfirmSubmitButton } from '@/components/ConfirmSubmitButton';
import { SubmitButton } from '@/components/SubmitButton';
import {
  createNoticeAction,
  deleteNoticeAction,
  getAllNoticesAction,
  updateNoticeAction,
} from '@/app/actions/notices';
import type { Notice } from '@/types';

export const dynamic = 'force-dynamic';

function NoticeFields({ notice }: { notice?: Notice }) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-[auto_1fr_auto]">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-gray-700">Emoji</span>
          <input
            name="icon"
            maxLength={8}
            defaultValue={notice?.icon ?? '📌'}
            className="w-20 rounded-lg border px-3 py-2 text-center text-lg outline-none focus:border-uv3-green"
          />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-gray-700">Título</span>
          <input
            name="title"
            required
            defaultValue={notice?.title ?? ''}
            placeholder="Ej. Horarios de canchas"
            className="rounded-lg border px-3 py-2 outline-none focus:border-uv3-green"
          />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-gray-700">Orden</span>
          <input
            name="sort_order"
            type="number"
            min={0}
            defaultValue={notice?.sort_order ?? 0}
            className="w-24 rounded-lg border px-3 py-2 outline-none focus:border-uv3-green"
          />
        </label>
      </div>

      <label className="grid gap-2">
        <span className="text-sm font-medium text-gray-700">Contenido</span>
        <textarea
          name="content"
          rows={4}
          defaultValue={notice?.content ?? ''}
          placeholder="Escribe el aviso. Puedes usar varias líneas."
          className="rounded-lg border px-3 py-2 outline-none focus:border-uv3-green"
        />
        <span className="text-xs text-stone-400">Los saltos de línea se respetan en la portada.</span>
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-gray-700">Enlace (opcional)</span>
          <input
            name="link_url"
            type="url"
            defaultValue={notice?.link_url ?? ''}
            placeholder="https://…"
            className="rounded-lg border px-3 py-2 outline-none focus:border-uv3-green"
          />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-gray-700">Texto del enlace</span>
          <input
            name="link_label"
            defaultValue={notice?.link_label ?? ''}
            placeholder="Ver más"
            className="rounded-lg border px-3 py-2 outline-none focus:border-uv3-green"
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" name="is_featured" value="true" defaultChecked={notice?.is_featured ?? false} /> ⭐ Mostrar en
          la portada
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" name="is_active" value="true" defaultChecked={notice?.is_active ?? true} /> Publicado
        </label>
      </div>
    </div>
  );
}

export default async function NoticesAdminPage({
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

  const res = await getAllNoticesAction();
  const notices = res.success ? res.data ?? [] : [];

  async function createForm(formData: FormData) {
    'use server';
    const r = await createNoticeAction(formData);
    redirect(`/dashboard/notices?${r.success ? 'ok=Aviso creado' : `error=${encodeURIComponent(r.error ?? 'Error')}`}`);
  }

  async function updateForm(formData: FormData) {
    'use server';
    const id = String(formData.get('id') ?? '');
    const r = await updateNoticeAction(id, formData);
    redirect(`/dashboard/notices?${r.success ? 'ok=Aviso actualizado' : `error=${encodeURIComponent(r.error ?? 'Error')}`}`);
  }

  async function deleteForm(formData: FormData) {
    'use server';
    const id = String(formData.get('id') ?? '');
    const r = await deleteNoticeAction(id);
    redirect(`/dashboard/notices?${r.success ? 'ok=Aviso eliminado' : `error=${encodeURIComponent(r.error ?? 'Error')}`}`);
  }

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-6 py-10">
      <h1 className="font-heading text-3xl font-bold text-uv3-green-dark">Avisos y Utilidad</h1>
      <p className="mt-2 text-stone-600">
        Estos avisos alimentan la sección “Avisos y Utilidad” de la{' '}
        <Link className="font-semibold text-uv3-green hover:underline" href="/">
          portada
        </Link>
        . Marca ⭐ <strong>Mostrar en la portada</strong> para elegir cuáles se ven.
      </p>

      {ok && <div className="mt-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">✅ {ok}</div>}
      {error && <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">⚠️ {error}</div>}

      <section className="mt-8 rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-uv3-green-dark">Nuevo aviso</h2>
        <form action={createForm} className="mt-4">
          <NoticeFields />
          <div className="mt-5">
            <SubmitButton label="Crear aviso" pendingLabel="Creando…" />
          </div>
        </form>
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="text-xl font-semibold text-uv3-green-dark">Avisos ({notices.length})</h2>
        {notices.length === 0 && (
          <p className="rounded-xl border bg-white p-8 text-center text-stone-500">Aún no hay avisos.</p>
        )}
        {notices.map((n) => (
          <details key={n.id} className="rounded-xl border bg-white p-4 shadow-sm">
            <summary className="cursor-pointer list-none">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-stone-800">
                    <span className="mr-1">{n.icon}</span>
                    {n.is_featured && <span title="En portada">⭐ </span>}
                    {n.title}
                  </p>
                  <p className="text-xs text-stone-500">
                    {n.is_active ? 'publicado' : 'oculto'}
                    {n.is_featured ? ' · en portada' : ''}
                  </p>
                </div>
                <span className="shrink-0 text-xs font-semibold text-uv3-green">Editar ▾</span>
              </div>
            </summary>

            <form action={updateForm} className="mt-4 border-t pt-4">
              <input type="hidden" name="id" value={n.id} />
              <NoticeFields notice={n} />
              <div className="mt-5">
                <SubmitButton label="Guardar cambios" pendingLabel="Guardando…" />
              </div>
            </form>

            <form action={deleteForm} className="mt-4 border-t pt-4">
              <input type="hidden" name="id" value={n.id} />
              <ConfirmSubmitButton
                label="Eliminar aviso"
                pendingLabel="Eliminando..."
                confirmMessage={`¿Eliminar el aviso "${n.title}"?`}
              />
            </form>
          </details>
        ))}
      </section>
    </main>
  );
}
