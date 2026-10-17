import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { ImageUploader } from '@/components/ImageUploader';
import { ConfirmSubmitButton } from '@/components/ConfirmSubmitButton';
import { SubmitButton } from '@/components/SubmitButton';
import {
  addGalleryImageAction,
  createGalleryAction,
  deleteGalleryAction,
  getGalleriesAction,
  removeGalleryImageAction,
  updateGalleryAction,
} from '@/app/actions/galleries';

export const dynamic = 'force-dynamic';

export default async function GaleriaAdminPage({
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

  const galleriesRes = await getGalleriesAction();
  const galleries = galleriesRes.success ? galleriesRes.data ?? [] : [];

  async function createForm(formData: FormData) {
    'use server';
    const res = await createGalleryAction(formData);
    redirect(`/dashboard/galeria?${res.success ? 'ok=Creada' : `error=${encodeURIComponent(res.error ?? 'Error')}`}`);
  }

  async function updateForm(formData: FormData) {
    'use server';
    const id = String(formData.get('id') ?? '');
    const res = await updateGalleryAction(id, formData);
    redirect(`/dashboard/galeria?${res.success ? 'ok=Actualizada' : `error=${encodeURIComponent(res.error ?? 'Error')}`}`);
  }

  async function addImageForm(formData: FormData) {
    'use server';
    const res = await addGalleryImageAction(formData);
    redirect(`/dashboard/galeria?${res.success ? 'ok=Foto agregada' : `error=${encodeURIComponent(res.error ?? 'Error')}`}`);
  }

  async function removeImageForm(formData: FormData) {
    'use server';
    const res = await removeGalleryImageAction(formData);
    redirect(`/dashboard/galeria?${res.success ? 'ok=Foto eliminada' : `error=${encodeURIComponent(res.error ?? 'Error')}`}`);
  }

  async function deleteForm(formData: FormData) {
    'use server';
    const id = String(formData.get('id') ?? '');
    const res = await deleteGalleryAction(id);
    redirect(`/dashboard/galeria?${res.success ? 'ok=Eliminada' : `error=${encodeURIComponent(res.error ?? 'Error')}`}`);
  }

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-10">
      <h1 className="font-heading text-3xl font-bold text-uv3-green-dark">Galería y Noticias</h1>
      <p className="mt-2 text-stone-600">
        Crea publicaciones con fotos para la galería pública y agrega nuevas imágenes. Las publicaciones nuevas se
        muestran en <Link className="font-semibold text-uv3-green hover:underline" href="/gallery">/gallery</Link>.
      </p>

      {ok && <div className="mt-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">✅ {ok}</div>}
      {error && <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">⚠️ {error}</div>}

      <section className="mt-8 rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-uv3-green-dark">Nueva publicación</h2>
        <form action={createForm} className="mt-4 grid gap-4">
          <label className="grid gap-2">
            <span className="text-sm font-medium text-gray-700">Título</span>
            <input name="title" required placeholder="Ej. Torneo de verano en la losa" className="rounded-lg border px-3 py-2 outline-none focus:border-uv3-green" />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-medium text-gray-700">Descripción</span>
            <textarea name="description" rows={2} placeholder="Breve descripción de la publicación" className="rounded-lg border px-3 py-2 outline-none focus:border-uv3-green" />
          </label>
          <ImageUploader name="image_url" bucket="gallery-media" label="Foto de la publicación" />
          <div className="mt-2">
            <SubmitButton label="Crear publicación" pendingLabel="Creando…" />
          </div>
        </form>
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="text-xl font-semibold text-uv3-green-dark">Publicaciones ({galleries.length})</h2>
        {galleries.length === 0 && (
          <p className="rounded-xl border bg-white p-8 text-center text-stone-500">Aún no hay publicaciones en la galería.</p>
        )}
        {galleries.map((g) => (
          <details key={g.id} className="rounded-xl border bg-white p-4 shadow-sm">
            <summary className="cursor-pointer list-none">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-stone-800">{g.title}</p>
                  <p className="text-xs text-stone-500">
                    {g.images?.length ?? 0} foto(s) · {g.created_at ? new Date(g.created_at).toLocaleDateString('es-PE') : ''}
                  </p>
                </div>
                <span className="text-xs font-semibold text-uv3-green">Administrar ▾</span>
              </div>
            </summary>

            <form action={updateForm} className="mt-4 grid gap-4 border-t pt-4">
              <input type="hidden" name="id" value={g.id} />
              <label className="grid gap-2">
                <span className="text-sm font-medium text-gray-700">Título</span>
                <input name="title" defaultValue={g.title} className="rounded-lg border px-3 py-2 outline-none focus:border-uv3-green" />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-medium text-gray-700">Descripción</span>
                <textarea name="description" rows={2} defaultValue={g.description ?? ''} className="rounded-lg border px-3 py-2 outline-none focus:border-uv3-green" />
              </label>
              <ImageUploader name="image_url" bucket="gallery-media" label="Foto de la publicación" initialValue={g.cover_image_url ?? ''} />
              <SubmitButton label="Guardar cambios" pendingLabel="Guardando…" className="w-fit rounded-lg bg-uv3-green px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60" />
            </form>

            <form action={addImageForm} className="mt-4 grid gap-3 border-t pt-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Agregar nueva foto</p>
              <input type="hidden" name="id" value={g.id} />
              <ImageUploader name="image_url" bucket="gallery-media" label="Nueva foto" />
              <SubmitButton
                label="Agregar foto"
                pendingLabel="Subiendo…"
                className="w-fit rounded-lg border border-uv3-green px-4 py-2 text-sm font-bold text-uv3-green-dark hover:bg-uv3-green hover:text-white disabled:opacity-60"
              />
            </form>

            {g.images && g.images.length > 0 && (
              <form action={removeImageForm} className="mt-4 border-t pt-4">
                <input type="hidden" name="id" value={g.id} />
                <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                  Fotos del álbum ({g.images.length})
                </p>
                <div className="mt-3 flex flex-wrap gap-3">
                  {g.images.map((url) => (
                    <div key={url} className="relative h-24 w-24 overflow-hidden rounded-lg border bg-uv3-bg">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt={`Foto de ${g.title}`} className="h-24 w-24 object-cover" />
                      <ConfirmSubmitButton
                        label="✕ Quitar"
                        pendingLabel="…"
                        confirmMessage="¿Quitar esta foto del álbum?"
                        name="image_url"
                        value={url}
                        className="absolute inset-x-0 bottom-0 bg-black/60 px-1 py-0.5 text-[10px] font-bold text-white transition-colors hover:bg-red-600"
                      />
                    </div>
                  ))}
                </div>
              </form>
            )}

            <form action={deleteForm} className="mt-4 border-t pt-4">
              <input type="hidden" name="id" value={g.id} />
              <ConfirmSubmitButton
                label="Eliminar publicación"
                pendingLabel="Eliminando..."
                confirmMessage={`¿Eliminar la publicación "${g.title}"?`}
              />
            </form>
          </details>
        ))}
      </section>
    </main>
  );
}
