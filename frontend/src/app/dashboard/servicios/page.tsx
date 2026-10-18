import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { ConfirmSubmitButton } from '@/components/ConfirmSubmitButton';
import { SubmitButton } from '@/components/SubmitButton';
import { ImageUploader } from '@/components/ImageUploader';
import {
  createCommunityServiceAction,
  deleteCommunityServiceAction,
  getCommunityServicesAction,
  updateCommunityServiceAction,
} from '@/app/actions/services';
import type { CommunityService } from '@/types';

export const dynamic = 'force-dynamic';

const CATEGORIES: { value: string; label: string }[] = [
  { value: 'salud', label: 'Salud' },
  { value: 'seguridad', label: 'Seguridad' },
  { value: 'religioso', label: 'Religioso' },
  { value: 'social', label: 'Social' },
  { value: 'deporte', label: 'Deportes' },
  { value: 'abasto', label: 'Abastos / Mercado' },
  { value: 'educacion', label: 'Educación' },
  { value: 'municipal', label: 'Municipal' },
  { value: 'otro', label: 'Otro' },
];

function ServiceFields({ service }: { service?: CommunityService }) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-[auto_1fr_1fr_auto]">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-gray-700">Emoji</span>
          <input
            name="icon"
            maxLength={8}
            defaultValue={service?.icon ?? '🏛️'}
            className="w-20 rounded-lg border px-3 py-2 text-center text-lg outline-none focus:border-uv3-green"
          />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-gray-700">Nombre</span>
          <input
            name="name"
            required
            defaultValue={service?.name ?? ''}
            placeholder="Ej. Puesto de Salud UV3"
            className="rounded-lg border px-3 py-2 outline-none focus:border-uv3-green"
          />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-gray-700">Categoría</span>
          <select
            name="category"
            defaultValue={service?.category ?? 'otro'}
            className="rounded-lg border px-3 py-2 outline-none focus:border-uv3-green"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-gray-700">Orden</span>
          <input
            name="sort_order"
            type="number"
            min={0}
            defaultValue={service?.sort_order ?? 0}
            className="w-24 rounded-lg border px-3 py-2 outline-none focus:border-uv3-green"
          />
        </label>
      </div>

      <label className="grid gap-2">
        <span className="text-sm font-medium text-gray-700">Descripción</span>
        <textarea
          name="description"
          rows={3}
          defaultValue={service?.description ?? ''}
          placeholder="¿Qué servicios brinda a los vecinos?"
          className="rounded-lg border px-3 py-2 outline-none focus:border-uv3-green"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-gray-700">Dirección</span>
          <input
            name="address"
            defaultValue={service?.address ?? ''}
            placeholder="Ej. Block 8, primer piso"
            className="rounded-lg border px-3 py-2 outline-none focus:border-uv3-green"
          />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-gray-700">Horario</span>
          <input
            name="hours"
            defaultValue={service?.hours ?? ''}
            placeholder="Ej. L-S 08:00 a 14:00 h"
            className="rounded-lg border px-3 py-2 outline-none focus:border-uv3-green"
          />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-gray-700">Teléfono</span>
          <input
            name="phone"
            defaultValue={service?.phone ?? ''}
            placeholder="999 000 000"
            className="rounded-lg border px-3 py-2 outline-none focus:border-uv3-green"
          />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-gray-700">WhatsApp</span>
          <input
            name="whatsapp"
            defaultValue={service?.whatsapp ?? ''}
            placeholder="999 000 000"
            className="rounded-lg border px-3 py-2 outline-none focus:border-uv3-green"
          />
        </label>
      </div>

      <ImageUploader name="image_url" bucket="business-media" label="Foto (opcional)" initialValue={service?.image_url ?? ''} />

      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" name="is_active" value="true" defaultChecked={service?.is_active ?? true} /> Publicado en el
          portal
        </label>
      </div>
    </div>
  );
}

export default async function ServiciosAdminPage({
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

  const res = await getCommunityServicesAction(true);
  const services = res.success ? res.data ?? [] : [];

  async function createForm(formData: FormData) {
    'use server';
    const r = await createCommunityServiceAction(formData);
    redirect(`/dashboard/servicios?${r.success ? 'ok=Servicio creado' : `error=${encodeURIComponent(r.error ?? 'Error')}`}`);
  }
  async function updateForm(formData: FormData) {
    'use server';
    const id = String(formData.get('id') ?? '');
    const r = await updateCommunityServiceAction(id, formData);
    redirect(`/dashboard/servicios?${r.success ? 'ok=Servicio actualizado' : `error=${encodeURIComponent(r.error ?? 'Error')}`}`);
  }
  async function deleteForm(formData: FormData) {
    'use server';
    const id = String(formData.get('id') ?? '');
    const r = await deleteCommunityServiceAction(id);
    redirect(`/dashboard/servicios?${r.success ? 'ok=Servicio eliminado' : `error=${encodeURIComponent(r.error ?? 'Error')}`}`);
  }

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-6 py-10">
      <h1 className="font-heading text-3xl font-bold text-uv3-green-dark">Directorio de la Unidad</h1>
      <p className="mt-2 text-stone-600">
        Iglesia, club deportivo, club de jubilados, posta de salud, comisaría, mercado y otros servicios del barrio. Se
        muestran en la{' '}
        <Link className="font-semibold text-uv3-green hover:underline" href="/">
          portada
        </Link>{' '}
        y en la página pública{' '}
        <Link className="font-semibold text-uv3-green hover:underline" href="/servicios">
          /servicios
        </Link>
        .
      </p>

      {!res.success && (
        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          ⚠️ No se pudo leer el directorio. Verifica que ejecutaste <code>database/feature_servicios_comunidad.sql</code> en
          Supabase.
        </div>
      )}
      {ok && <div className="mt-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">✅ {ok}</div>}
      {error && <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">⚠️ {error}</div>}

      <section className="mt-8 rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-uv3-green-dark">Nuevo servicio</h2>
        <form action={createForm} className="mt-4">
          <ServiceFields />
          <div className="mt-5">
            <SubmitButton label="Crear servicio" pendingLabel="Creando…" />
          </div>
        </form>
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="text-xl font-semibold text-uv3-green-dark">Servicios ({services.length})</h2>
        {services.length === 0 && (
          <p className="rounded-xl border bg-white p-8 text-center text-stone-500">Aún no hay servicios registrados.</p>
        )}
        {services.map((s) => (
          <details key={s.id} className="rounded-xl border bg-white p-4 shadow-sm">
            <summary className="cursor-pointer list-none">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-stone-800">
                    <span className="mr-1">{s.icon}</span>
                    {s.name}
                  </p>
                  <p className="text-xs text-stone-500">
                    {s.category} · {s.is_active ? 'publicado' : 'oculto'}
                    {s.address ? ` · ${s.address}` : ''}
                  </p>
                </div>
                <span className="shrink-0 text-xs font-semibold text-uv3-green">Editar ▾</span>
              </div>
            </summary>

            <form action={updateForm} className="mt-4 border-t pt-4">
              <input type="hidden" name="id" value={s.id} />
              <ServiceFields service={s} />
              <div className="mt-5">
                <SubmitButton label="Guardar cambios" pendingLabel="Guardando…" />
              </div>
            </form>

            <form action={deleteForm} className="mt-4 border-t pt-4">
              <input type="hidden" name="id" value={s.id} />
              <ConfirmSubmitButton
                label="Eliminar servicio"
                pendingLabel="Eliminando..."
                confirmMessage={`¿Eliminar "${s.name}" del directorio?`}
              />
            </form>
          </details>
        ))}
      </section>
    </main>
  );
}
