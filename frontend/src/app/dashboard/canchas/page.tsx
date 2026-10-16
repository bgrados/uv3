import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { ImageUploader } from '@/components/ImageUploader';
import { ConfirmSubmitButton } from '@/components/ConfirmSubmitButton';
import { createSpaceAction, deleteSpaceAction, updateSpaceAction } from '@/app/actions/spaces';
import type { Space } from '@/types';

export const dynamic = 'force-dynamic';

const SPORTS: { value: string; label: string }[] = [
  { value: 'futbol', label: 'Fútbol' },
  { value: 'futbol_sala', label: 'Fútbol sala (fúlbito)' },
  { value: 'basquet', label: 'Básquet' },
  { value: 'voley', label: 'Vóley' },
];

function SpaceFields({ space }: { space?: Space }) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-gray-700">Nombre</span>
          <input name="name" required defaultValue={space?.name} className="rounded-lg border px-3 py-2 outline-none focus:border-uv3-green" />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-gray-700">Descripción</span>
          <input name="description" defaultValue={space?.description ?? ''} className="rounded-lg border px-3 py-2 outline-none focus:border-uv3-green" />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-gray-700">Tarifa de día (S/ por hora)</span>
          <input name="day_rate" type="number" step="0.01" min="0" defaultValue={Number(space?.day_rate ?? 0)} className="rounded-lg border px-3 py-2" />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-gray-700">Tarifa de noche (S/ por hora)</span>
          <input name="night_rate" type="number" step="0.01" min="0" defaultValue={Number(space?.night_rate ?? 0)} className="rounded-lg border px-3 py-2" />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-gray-700">Hora inicio noche</span>
          <input name="night_start" type="time" defaultValue={(space?.night_start ?? '18:00').slice(0, 5)} className="rounded-lg border px-3 py-2" />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-gray-700">Hora fin noche</span>
          <input name="night_end" type="time" defaultValue={(space?.night_end ?? '06:00').slice(0, 5)} className="rounded-lg border px-3 py-2" />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-gray-700">Tarifa evento (día)</span>
          <input name="event_day_rate" type="number" step="0.01" min="0" defaultValue={space?.event_day_rate ?? ''} className="rounded-lg border px-3 py-2" />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-gray-700">Tarifa evento (noche)</span>
          <input name="event_night_rate" type="number" step="0.01" min="0" defaultValue={space?.event_night_rate ?? ''} className="rounded-lg border px-3 py-2" />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-gray-700">Orden</span>
          <input name="sort_order" type="number" min="0" defaultValue={space?.sort_order ?? 0} className="rounded-lg border px-3 py-2" />
        </label>
      </div>

      <fieldset className="mt-4">
        <legend className="text-sm font-medium text-gray-700">Deportes admitidos</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {SPORTS.map((s) => (
            <label key={s.value} className="flex items-center gap-2 text-sm text-stone-700">
              <input type="checkbox" name="sports" value={s.value} defaultChecked={(space?.sports ?? []).includes(s.value)} />
              {s.label}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-700">
        <label className="flex items-center gap-2">
          <input type="checkbox" name="allows_events" defaultChecked={space?.allows_events ?? true} /> Admite eventos
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="is_active" value="true" defaultChecked={space?.is_active ?? true} /> Activo
        </label>
      </div>
      <div className="mt-4">
        <ImageUploader name="image_url" bucket="business-media" label="Foto del espacio" initialValue={space?.image_url ?? ''} />
      </div>
    </>
  );
}

export default async function CanchasPage({
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

  const { data } = await supabase.from('spaces').select('*, space_sports(sport)').order('sort_order');
  const spaces = (data ?? []).map((row) => {
    const r = row as Record<string, unknown> & { space_sports?: { sport: string }[] };
    return { ...r, sports: (r.space_sports ?? []).map((s) => s.sport) } as unknown as Space;
  });

  async function createForm(formData: FormData) {
    'use server';
    const res = await createSpaceAction(formData);
    redirect(`/dashboard/canchas?${res.success ? 'ok=Cancha creada' : `error=${encodeURIComponent(res.error ?? 'Error')}`}`);
  }
  async function updateForm(formData: FormData) {
    'use server';
    const id = String(formData.get('id'));
    const res = await updateSpaceAction(id, formData);
    redirect(`/dashboard/canchas?${res.success ? 'ok=Cancha actualizada' : `error=${encodeURIComponent(res.error ?? 'Error')}`}`);
  }
  async function deleteForm(formData: FormData) {
    'use server';
    const id = String(formData.get('id'));
    const res = await deleteSpaceAction(id);
    redirect(`/dashboard/canchas?${res.success ? 'ok=Cancha eliminada' : `error=${encodeURIComponent(res.error ?? 'Error')}`}`);
  }

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-10">
      <h1 className="font-heading text-3xl font-bold text-uv3-green-dark">Canchas y espacios</h1>
      <p className="mt-2 text-stone-600">
        Define tarifas (día/noche), deportes admitidos y la foto de cada espacio. Todo se refleja en la página pública de reservas.
      </p>

      {ok && <div className="mt-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">✅ {ok}</div>}
      {error && <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">⚠️ {error}</div>}

      <section className="mt-8 rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-uv3-green-dark">Nuevo espacio</h2>
        <form action={createForm} className="mt-4">
          <SpaceFields />
          <button className="mt-5 rounded-lg bg-uv3-green px-5 py-2.5 text-sm font-bold text-white">Crear espacio</button>
        </form>
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="text-xl font-semibold text-uv3-green-dark">Espacios ({spaces.length})</h2>
        {spaces.map((s) => (
          <details key={s.id} className="rounded-xl border bg-white p-4 shadow-sm">
            <summary className="cursor-pointer list-none">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-stone-800">{s.name}</p>
                  <p className="text-xs text-stone-500">
                    Día S/ {Number(s.day_rate).toFixed(2)}/h · Noche S/ {Number(s.night_rate).toFixed(2)}/h · {s.is_active ? 'activo' : 'inactivo'}
                  </p>
                </div>
                <span className="text-xs font-semibold text-uv3-green">Editar ▾</span>
              </div>
            </summary>
            <form action={updateForm} className="mt-4 border-t pt-4">
              <input type="hidden" name="id" value={s.id} />
              <SpaceFields space={s} />
              <div className="mt-5 flex gap-3">
                <button className="rounded-lg bg-uv3-green px-5 py-2.5 text-sm font-bold text-white">Guardar cambios</button>
              </div>
            </form>
            <form action={deleteForm} className="mt-4 border-t pt-4">
              <input type="hidden" name="id" value={s.id} />
              <ConfirmSubmitButton
                label="Eliminar espacio"
                pendingLabel="Eliminando..."
                confirmMessage={`¿Eliminar "${s.name}"? No se puede si tiene reservas asociadas.`}
              />
            </form>
          </details>
        ))}
        {spaces.length === 0 && <p className="rounded-xl border bg-white p-8 text-center text-stone-500">Aún no hay espacios.</p>}
      </section>
    </main>
  );
}
