'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import { getCurrentUser } from '@/app/auth/actions';
import { siteSettingsSchema } from './schemas';
import { DEFAULT_SETTINGS } from '@/utils/site';
import type { ActionResponse, SiteSettings } from '@/types';

const NO_SUPABASE = {
  success: false,
  error: 'El sistema no está configurado aún. Contacta al administrador.',
} as const;

/** Configuración del sitio (lectura pública). */
export async function getSiteSettingsAction(): Promise<SiteSettings> {
  const supabase = await createClient();
  if (!supabase) return DEFAULT_SETTINGS;

  const { data } = await supabase.from('site_settings').select('*').eq('id', 1).maybeSingle();
  if (!data) return DEFAULT_SETTINGS;
  return { ...DEFAULT_SETTINGS, ...(data as SiteSettings) };
}

export async function updateSiteSettingsAction(formData: FormData): Promise<ActionResponse> {
  const supabase = await createClient();
  if (!supabase) return NO_SUPABASE;

  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') return { success: false, error: 'Sólo el administrador puede editar la configuración.' };

  const raw = {
    site_name: formData.get('site_name') as string,
    slogan: (formData.get('slogan') as string) || null,
    logo_url: (formData.get('logo_url') as string) || null,
    favicon_url: (formData.get('favicon_url') as string) || null,
    contact_phone: (formData.get('contact_phone') as string) || null,
    whatsapp: (formData.get('whatsapp') as string) || null,
    yape_number: (formData.get('yape_number') as string) || null,
    yape_holder: (formData.get('yape_holder') as string) || null,
    facebook_url: (formData.get('facebook_url') as string) || null,
    night_start: (formData.get('night_start') as string) || '18:00',
    night_end: (formData.get('night_end') as string) || '06:00',
  };

  const parsed = siteSettingsSchema.safeParse(raw);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const { error } = await supabase.from('site_settings').upsert({ id: 1, ...parsed.data });
  if (error) return { success: false, error: error.message };

  revalidatePath('/');
  revalidatePath('/dashboard/configuracion');
  return { success: true };
}
