import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { ImageUploader } from '@/components/ImageUploader';
import { ConfirmSubmitButton } from '@/components/ConfirmSubmitButton';
import {
  createAnnouncementAction,
  deleteAnnouncementAction,
  getAnnouncementsAction,
  updateAnnouncementAction,
} from '@/app/actions/announcements';
import { ANNOUNCEMENT_CATEGORIES } from '@/app/actions/schemas';
import type { Announcement } from '@/types';

export const dynamic = 'force-dynamic';

const CATEGORY_LABEL: Record<string, string> = {
  general: 'General',
  deportes: 'Deportes',
  eventos: 'Eventos',
  comunicado: 'Comunicado',
};

function AnnouncementFields({ announcement }: { announcement?: Announcement }) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-gray-700">Título</span>
          <input
            name="title"
            required
            defaultValue={announcement?.title ?? ''}
            placeholder="Ej. Reunión de delegados"
            className="rounded-lg border px-3 py-2 outline-none focus:border-uv3-green"
          />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-gray-700">Categoría</span>
          <select
            name="category"
            defaultValue={announcement?.category ?? 'general'}
            className="rounded-lg border px-3 py-2 outline-none focus:border-uv3-green"
          >
            {ANNOUNCEMENT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABEL[c]}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="grid gap-2">
        <span className="text-sm font-medium text-gray-700">Contenido</span>
        <textarea
          name="content"
          rows={4}
          required
          defaultValue={announcement?.content ?? ''}
          placeholder="Escribe el aviso para los vecinos…"
          className="rounded-lg border px-3 py-2 outline-none focus:border-uv3-green"
        />
      </label>
      <ImageUploader
        name="image_url"
        bucket="gallery-media"
        label="Imagen (opcional)"
        initialValue={announcement?.image_url ?? ''}
      />
    </div>
  );
}

export default async function AnnouncementsAdminPage({
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

  const res = await getAnnouncementsAction();
  const announcements = res.success ? res.data ?? [] : [];

  async function createForm(formData: FormData) {
    'use server';
    const r = await createAnnouncementAction(formData);
    redirect(`/dashboard/announcements?${r.success ? 'ok=Comunicado publicado' : `error=${encodeURIComponent(r.error ?? 'Error')}`}`);
  }

  async function updateForm(formData: FormData) {
    'use server';
    const id = String(formData.get('id') ?? '');
    const r = await updateAnnouncementAction(id, formData);
    redirect(`/dashboard/announcements?${r.success ? 'ok=Comunicado actualizado' : `error=${encodeURIComponent(r.error ?? 'Error')}`}`);
  }

  async function deleteForm(formData: FormData) {
    'use server';
    const id = String(formData.get('id') ?? '');
    const r = await deleteAnnouncementAction(id);
    redirect(`/dashboard/announcements?${r.success ? 'ok=Comunicado eliminado' : `error=${encodeURIComponent(r.error ?? 'Error')}`}`);
  }

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-6 py-10">
      <h1 className="font-heading text-3xl font-bold text-uv3-green-dark">Comunicados</h1>
      <p className="mt-2 text-stone-600">
        Publica avisos para la comunidad. Se muestran en{' '}
        <Link className="font-semibold text-uv3-green hover:underline" href="/announcements">
          /announcements
        </Link>
        .
      </p>

      {ok && <div className="mt-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">✅ {ok}</div>}
      {error && <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">⚠️ {error}</div>}

      <section className="mt-8 rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-uv3-green-dark">Nuevo comunicado</h2>
        <form action={createForm} className="mt-4">
          <AnnouncementFields />
          <button type="submit" className="mt-5 rounded-lg bg-uv3-green px-5 py-2.5 text-sm font-bold text-white">
            Publicar comunicado
          </button>
        </form>
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="text-xl font-semibold text-uv3-green-dark">Publicados ({announcements.length})</h2>
        {announcements.length === 0 && (
          <p className="rounded-xl border bg-white p-8 text-center text-stone-500">Aún no hay comunicados.</p>
        )}
        {announcements.map((a) => (
          <details key={a.id} className="rounded-xl border bg-white p-4 shadow-sm">
            <summary className="cursor-pointer list-none">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-stone-800">{a.title}</p>
                  <p className="text-xs text-stone-500">
                    {CATEGORY_LABEL[a.category] ?? a.category} ·{' '}
                    {a.created_at ? new Date(a.created_at).toLocaleDateString('es-PE') : ''}
                  </p>
                </div>
                <span className="text-xs font-semibold text-uv3-green">Editar ▾</span>
              </div>
            </summary>

            <form action={updateForm} className="mt-4 border-t pt-4">
              <input type="hidden" name="id" value={a.id} />
              <AnnouncementFields announcement={a} />
              <button type="submit" className="mt-5 rounded-lg bg-uv3-green px-5 py-2.5 text-sm font-bold text-white">
                Guardar cambios
              </button>
            </form>

            <form action={deleteForm} className="mt-4 border-t pt-4">
              <input type="hidden" name="id" value={a.id} />
              <ConfirmSubmitButton
                label="Eliminar comunicado"
                pendingLabel="Eliminando..."
                confirmMessage={`¿Eliminar el comunicado "${a.title}"?`}
              />
            </form>
          </details>
        ))}
      </section>
    </main>
  );
}
