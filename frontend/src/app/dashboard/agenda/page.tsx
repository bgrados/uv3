import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { ConfirmSubmitButton } from '@/components/ConfirmSubmitButton';
import { SubmitButton } from '@/components/SubmitButton';
import {
  createCommunityEventAction,
  deleteCommunityEventAction,
  getCommunityEventsAction,
  updateCommunityEventAction,
} from '@/app/actions/services';
import { formatEventDate, shortTime } from '@/utils/community';
import type { CommunityEvent } from '@/types';

export const dynamic = 'force-dynamic';

const CATEGORIES: { value: string; label: string }[] = [
  { value: 'asamblea', label: 'Asamblea' },
  { value: 'deporte', label: 'Deportes' },
  { value: 'salud', label: 'Salud' },
  { value: 'social', label: 'Social' },
  { value: 'religioso', label: 'Religioso' },
  { value: 'mantenimiento', label: 'Mantenimiento' },
  { value: 'otro', label: 'Otro' },
];

function EventFields({ event }: { event?: CommunityEvent }) {
  return (
    <div className="grid gap-4">
      <label className="grid gap-2">
        <span className="text-sm font-medium text-gray-700">Título</span>
        <input
          name="title"
          required
          defaultValue={event?.title ?? ''}
          placeholder="Ej. Asamblea general ordinaria"
          className="rounded-lg border px-3 py-2 outline-none focus:border-uv3-green"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-gray-700">Fecha</span>
          <input
            name="event_date"
            type="date"
            required
            defaultValue={event?.event_date ?? ''}
            className="rounded-lg border px-3 py-2 outline-none focus:border-uv3-green"
          />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-gray-700">Hora inicio</span>
          <input
            name="start_time"
            type="time"
            defaultValue={shortTime(event?.start_time)}
            className="rounded-lg border px-3 py-2 outline-none focus:border-uv3-green"
          />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-gray-700">Hora fin</span>
          <input
            name="end_time"
            type="time"
            defaultValue={shortTime(event?.end_time)}
            className="rounded-lg border px-3 py-2 outline-none focus:border-uv3-green"
          />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-gray-700">Categoría</span>
          <select
            name="category"
            defaultValue={event?.category ?? 'otro'}
            className="rounded-lg border px-3 py-2 outline-none focus:border-uv3-green"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-gray-700">Lugar</span>
          <input
            name="location"
            defaultValue={event?.location ?? ''}
            placeholder="Ej. Local comunal"
            className="rounded-lg border px-3 py-2 outline-none focus:border-uv3-green"
          />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-gray-700">Orden</span>
          <input
            name="sort_order"
            type="number"
            min={0}
            defaultValue={event?.sort_order ?? 0}
            className="w-24 rounded-lg border px-3 py-2 outline-none focus:border-uv3-green"
          />
        </label>
      </div>

      <label className="grid gap-2">
        <span className="text-sm font-medium text-gray-700">Descripción</span>
        <textarea
          name="description"
          rows={3}
          defaultValue={event?.description ?? ''}
          placeholder="Detalles del evento, agenda, requisitos…"
          className="rounded-lg border px-3 py-2 outline-none focus:border-uv3-green"
        />
      </label>

      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" name="is_featured" value="true" defaultChecked={event?.is_featured ?? false} /> ⭐ Destacado
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" name="is_active" value="true" defaultChecked={event?.is_active ?? true} /> Publicado
        </label>
      </div>
    </div>
  );
}

export default async function AgendaAdminPage({
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

  const res = await getCommunityEventsAction({ upcomingOnly: false, includeInactive: true });
  const events = res.success ? res.data ?? [] : [];

  async function createForm(formData: FormData) {
    'use server';
    const r = await createCommunityEventAction(formData);
    redirect(`/dashboard/agenda?${r.success ? 'ok=Evento creado' : `error=${encodeURIComponent(r.error ?? 'Error')}`}`);
  }
  async function updateForm(formData: FormData) {
    'use server';
    const id = String(formData.get('id') ?? '');
    const r = await updateCommunityEventAction(id, formData);
    redirect(`/dashboard/agenda?${r.success ? 'ok=Evento actualizado' : `error=${encodeURIComponent(r.error ?? 'Error')}`}`);
  }
  async function deleteForm(formData: FormData) {
    'use server';
    const id = String(formData.get('id') ?? '');
    const r = await deleteCommunityEventAction(id);
    redirect(`/dashboard/agenda?${r.success ? 'ok=Evento eliminado' : `error=${encodeURIComponent(r.error ?? 'Error')}`}`);
  }

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-6 py-10">
      <h1 className="font-heading text-3xl font-bold text-uv3-green-dark">Agenda de la Comunidad</h1>
      <p className="mt-2 text-stone-600">
        Asambleas, campañas de salud, actividades deportivas y ferias. Los eventos aparecen en la sección “Agenda de la
        semana” de la{' '}
        <Link className="font-semibold text-uv3-green hover:underline" href="/">
          portada
        </Link>{' '}
        y en la página pública{' '}
        <Link className="font-semibold text-uv3-green hover:underline" href="/agenda">
          /agenda
        </Link>
        .
      </p>

      {!res.success && (
        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          ⚠️ No se pudo leer la agenda. Verifica que ejecutaste <code>database/feature_agenda.sql</code> en Supabase.
        </div>
      )}
      {ok && <div className="mt-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">✅ {ok}</div>}
      {error && <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">⚠️ {error}</div>}

      <section className="mt-8 rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-uv3-green-dark">Nuevo evento</h2>
        <form action={createForm} className="mt-4">
          <EventFields />
          <div className="mt-5">
            <SubmitButton label="Crear evento" pendingLabel="Creando…" />
          </div>
        </form>
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="text-xl font-semibold text-uv3-green-dark">Eventos ({events.length})</h2>
        {events.length === 0 && (
          <p className="rounded-xl border bg-white p-8 text-center text-stone-500">Aún no hay eventos en la agenda.</p>
        )}
        {events.map((e) => (
          <details key={e.id} className="rounded-xl border bg-white p-4 shadow-sm">
            <summary className="cursor-pointer list-none">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-stone-800">
                    {e.is_featured && <span title="Destacado">⭐ </span>}
                    {e.title}
                  </p>
                  <p className="text-xs text-stone-500">
                    {formatEventDate(e.event_date)}
                    {shortTime(e.start_time) ? ` · ${shortTime(e.start_time)}` : ''}
                    {e.location ? ` · ${e.location}` : ''}
                    {' · '}
                    {e.is_active ? 'publicado' : 'oculto'}
                  </p>
                </div>
                <span className="shrink-0 text-xs font-semibold text-uv3-green">Editar ▾</span>
              </div>
            </summary>

            <form action={updateForm} className="mt-4 border-t pt-4">
              <input type="hidden" name="id" value={e.id} />
              <EventFields event={e} />
              <div className="mt-5">
                <SubmitButton label="Guardar cambios" pendingLabel="Guardando…" />
              </div>
            </form>

            <form action={deleteForm} className="mt-4 border-t pt-4">
              <input type="hidden" name="id" value={e.id} />
              <ConfirmSubmitButton
                label="Eliminar evento"
                pendingLabel="Eliminando..."
                confirmMessage={`¿Eliminar el evento "${e.title}"?`}
              />
            </form>
          </details>
        ))}
      </section>
    </main>
  );
}
