import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { ImageUploader } from '@/components/ImageUploader';
import { ConfirmSubmitButton } from '@/components/ConfirmSubmitButton';
import {
  createBusinessAction,
  deleteBusinessAction,
  updateBusinessAction,
} from '@/app/actions/businesses';
import { BUSINESS_CATEGORIES, BUSINESS_CATEGORY_LABEL } from '@/utils/site';
import type { Business } from '@/types';

export const dynamic = 'force-dynamic';

function BusinessFields({ business }: { business?: Business }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="grid gap-2">
        <span className="text-sm font-medium text-gray-700">Nombre</span>
        <input name="name" required defaultValue={business?.name ?? ''} className="rounded-lg border px-3 py-2" />
      </label>
      <label className="grid gap-2">
        <span className="text-sm font-medium text-gray-700">Rubro</span>
        <select name="category" defaultValue={business?.category ?? 'tienda'} className="rounded-lg border px-3 py-2">
          {BUSINESS_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {BUSINESS_CATEGORY_LABEL[c]}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-2">
        <span className="text-sm font-medium text-gray-700">Teléfono</span>
        <input name="phone" defaultValue={business?.phone ?? ''} className="rounded-lg border px-3 py-2" />
      </label>
      <label className="grid gap-2">
        <span className="text-sm font-medium text-gray-700">WhatsApp</span>
        <input name="whatsapp" defaultValue={business?.whatsapp ?? ''} className="rounded-lg border px-3 py-2" />
      </label>
      <label className="grid gap-2">
        <span className="text-sm font-medium text-gray-700">Dirección</span>
        <input name="address" defaultValue={business?.address ?? ''} className="rounded-lg border px-3 py-2" />
      </label>
      <label className="grid gap-2">
        <span className="text-sm font-medium text-gray-700">Orden</span>
        <input name="sort_order" type="number" min="0" defaultValue={business?.sort_order ?? 0} className="rounded-lg border px-3 py-2" />
      </label>
      <label className="grid gap-2 sm:col-span-2">
        <span className="text-sm font-medium text-gray-700">Descripción</span>
        <textarea name="description" rows={2} defaultValue={business?.description ?? ''} className="rounded-lg border px-3 py-2" />
      </label>
      <div>
        <ImageUploader name="image_url" bucket="business-media" label="Foto del comercio" initialValue={business?.image_url ?? ''} />
      </div>
      <div>
        <ImageUploader name="logo_url" bucket="business-media" label="Logo (opcional)" initialValue={business?.logo_url ?? ''} />
      </div>
      <label className="flex items-center gap-2 text-sm text-gray-700 sm:col-span-2">
        <input type="checkbox" name="is_active" value="true" defaultChecked={business?.is_active ?? true} /> Publicado
      </label>
    </div>
  );
}

export default async function ComerciosAdminPage({
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

  const { data } = await supabase.from('businesses').select('*').order('sort_order').order('name');
  const businesses = (data ?? []) as Business[];

  async function createForm(formData: FormData) {
    'use server';
    const res = await createBusinessAction(formData);
    redirect(`/dashboard/comercios?${res.success ? 'ok=Comercio creado' : `error=${encodeURIComponent(res.error ?? 'Error')}`}`);
  }
  async function updateForm(formData: FormData) {
    'use server';
    const id = String(formData.get('id'));
    const res = await updateBusinessAction(id, formData);
    redirect(`/dashboard/comercios?${res.success ? 'ok=Comercio actualizado' : `error=${encodeURIComponent(res.error ?? 'Error')}`}`);
  }
  async function deleteForm(formData: FormData) {
    'use server';
    const id = String(formData.get('id'));
    const res = await deleteBusinessAction(id);
    redirect(`/dashboard/comercios?${res.success ? 'ok=Comercio eliminado' : `error=${encodeURIComponent(res.error ?? 'Error')}`}`);
  }

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-10">
      <h1 className="font-heading text-3xl font-bold text-uv3-green-dark">Comercios de la Unidad</h1>
      <p className="mt-2 text-stone-600">
        Estos comercios aparecen en el carrusel de la portada y en el directorio público. Puedes crear, editar y ocultar
        cada uno.
      </p>

      {ok && <div className="mt-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">✅ {ok}</div>}
      {error && <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">⚠️ {error}</div>}

      <section className="mt-8 rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-uv3-green-dark">Nuevo comercio</h2>
        <form action={createForm} className="mt-4">
          <BusinessFields />
          <button className="mt-5 rounded-lg bg-uv3-green px-5 py-2.5 text-sm font-bold text-white">Crear comercio</button>
        </form>
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="text-xl font-semibold text-uv3-green-dark">Comercios ({businesses.length})</h2>
        {businesses.map((b) => (
          <details key={b.id} className="rounded-xl border bg-white p-4 shadow-sm">
            <summary className="cursor-pointer list-none">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg border bg-uv3-bg">
                  {b.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={b.image_url} alt={b.name} className="h-12 w-12 object-cover" />
                  ) : (
                    <span className="text-xl">🏬</span>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-stone-800">{b.name}</p>
                  <p className="text-xs text-stone-500">
                    {BUSINESS_CATEGORY_LABEL[b.category]} · {b.is_active ? 'publicado' : 'oculto'}
                  </p>
                </div>
                <span className="text-xs font-semibold text-uv3-green">Editar ▾</span>
              </div>
            </summary>
            <form action={updateForm} className="mt-4 border-t pt-4">
              <input type="hidden" name="id" value={b.id} />
              <BusinessFields business={b} />
              <button className="mt-5 rounded-lg bg-uv3-green px-5 py-2.5 text-sm font-bold text-white">Guardar cambios</button>
            </form>
            <form action={deleteForm} className="mt-4 border-t pt-4">
              <input type="hidden" name="id" value={b.id} />
              <ConfirmSubmitButton
                label="Eliminar comercio"
                pendingLabel="Eliminando..."
                confirmMessage={`¿Eliminar "${b.name}"?`}
              />
            </form>
          </details>
        ))}
        {businesses.length === 0 && (
          <p className="rounded-xl border bg-white p-8 text-center text-stone-500">Aún no hay comercios.</p>
        )}
      </section>
    </main>
  );
}
