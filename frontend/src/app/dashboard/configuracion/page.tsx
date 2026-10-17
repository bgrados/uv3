import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { ImageUploader } from '@/components/ImageUploader';
import { updateSiteSettingsAction } from '@/app/actions/settings';
import { SubmitButton } from '@/components/SubmitButton';

export const dynamic = 'force-dynamic';

export default async function ConfiguracionPage({
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

  const { data } = await supabase.from('site_settings').select('*').eq('id', 1).maybeSingle();
  const s = ((data ?? {}) as Record<string, unknown>);

  async function saveForm(formData: FormData) {
    'use server';
    const res = await updateSiteSettingsAction(formData);
    const { redirect: doRedirect } = await import('next/navigation');
    doRedirect(`/dashboard/configuracion?${res.success ? 'ok=Configuración guardada' : `error=${encodeURIComponent(res.error ?? 'Error')}`}`);
  }

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-10">
      <h1 className="font-heading text-3xl font-bold text-uv3-green-dark">Configuración del sitio</h1>
      <p className="mt-2 text-stone-600">
        Logo, favicon, datos de Yape y contacto. El logo y el favicon se usan en todo el portal y en la pestaña del
        navegador.
      </p>

      {ok && <div className="mt-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">✅ {ok}</div>}
      {error && <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">⚠️ {error}</div>}

      <form action={saveForm} className="mt-8 space-y-6 rounded-xl border bg-white p-6 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-medium text-gray-700">Nombre del sitio</span>
            <input name="site_name" required defaultValue={String(s.site_name ?? 'Unidad Vecinal 3')} className="rounded-lg border px-3 py-2" />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-medium text-gray-700">Lema / slogan</span>
            <input name="slogan" defaultValue={String(s.slogan ?? '')} className="rounded-lg border px-3 py-2" />
          </label>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <ImageUploader
            name="logo_url"
            bucket="branding"
            label="Logo del sitio"
            initialValue={(s.logo_url as string) ?? '/logo.jpg'}
            hint="Se usa en la portada y como respaldo del favicon."
          />
          <ImageUploader
            name="favicon_url"
            bucket="branding"
            label="Favicon (ícono de la pestaña)"
            initialValue={(s.favicon_url as string) ?? ''}
            hint="Cuadrado y simple (512x512). Si no lo pones, se usa el logo."
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-medium text-gray-700">WhatsApp (con código 51)</span>
            <input name="whatsapp" defaultValue={String(s.whatsapp ?? '')} placeholder="51999000000" className="rounded-lg border px-3 py-2" />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-medium text-gray-700">Teléfono de contacto</span>
            <input name="contact_phone" defaultValue={String(s.contact_phone ?? '')} className="rounded-lg border px-3 py-2" />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-medium text-gray-700">Número de Yape</span>
            <input name="yape_number" defaultValue={String(s.yape_number ?? '')} className="rounded-lg border px-3 py-2" />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-medium text-gray-700">Titular de Yape</span>
            <input name="yape_holder" defaultValue={String(s.yape_holder ?? '')} className="rounded-lg border px-3 py-2" />
          </label>
          <label className="grid gap-2 sm:col-span-2">
            <span className="text-sm font-medium text-gray-700">Facebook (URL)</span>
            <input name="facebook_url" defaultValue={String(s.facebook_url ?? '')} className="rounded-lg border px-3 py-2" />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-medium text-gray-700">Inicio de tarifa nocturna</span>
            <input name="night_start" type="time" defaultValue={String(s.night_start ?? '18:00').slice(0, 5)} className="rounded-lg border px-3 py-2" />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-medium text-gray-700">Fin de tarifa nocturna</span>
            <input name="night_end" type="time" defaultValue={String(s.night_end ?? '06:00').slice(0, 5)} className="rounded-lg border px-3 py-2" />
          </label>
        </div>

        <p className="text-xs text-stone-400">
          Estas horas son solo la referencia del portal; cada espacio puede tener su propio horario nocturno.
        </p>

        <SubmitButton label="Guardar configuración" pendingLabel="Guardando…" />
      </form>
    </main>
  );
}
