'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import { getCurrentUser } from '@/app/auth/actions';
import { businessSchema } from './schemas';
import type { ActionResponse, Business } from '@/types';

const NO_SUPABASE = {
  success: false,
  error: 'El sistema no está configurado aún. Contacta al administrador.',
} as const;

/** Lista pública de comercios activos (para la portada y el directorio). */
export async function getBusinessesAction(): Promise<ActionResponse<Business[]>> {
  const supabase = await createClient();
  if (!supabase) return NO_SUPABASE;

  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .eq('is_active', true)
    .order('sort_order')
    .order('name');

  if (error) return { success: false, error: error.message };
  return { success: true, data: (data ?? []) as Business[] };
}

/** Lista completa (incluye ocultos) para el panel. */
export async function getAllBusinessesAction(): Promise<ActionResponse<Business[]>> {
  const supabase = await createClient();
  if (!supabase) return NO_SUPABASE;

  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') return { success: false, error: 'No autorizado.' };

  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .order('sort_order')
    .order('name');

  if (error) return { success: false, error: error.message };
  return { success: true, data: (data ?? []) as Business[] };
}

function readBusinessForm(formData: FormData) {
  return {
    name: String(formData.get('name') ?? '').trim(),
    category: (formData.get('category') as string) || 'otro',
    description: (formData.get('description') as string) || null,
    phone: (formData.get('phone') as string) || null,
    whatsapp: (formData.get('whatsapp') as string) || null,
    address: (formData.get('address') as string) || null,
    logo_url: (formData.get('logo_url') as string) || null,
    image_url: (formData.get('image_url') as string) || null,
    is_active: formData.get('is_active') === 'true',
    is_featured: formData.get('is_featured') === 'true',
    sort_order: Number(formData.get('sort_order') ?? 0),
  };
}

export async function createBusinessAction(formData: FormData): Promise<ActionResponse> {
  const supabase = await createClient();
  if (!supabase) return NO_SUPABASE;

  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') return { success: false, error: 'Sólo el administrador puede gestionar comercios.' };

  const parsed = businessSchema.safeParse(readBusinessForm(formData));
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const { error } = await supabase.from('businesses').insert(parsed.data);
  if (error) return { success: false, error: error.message };

  revalidatePath('/');
  revalidatePath('/dashboard/comercios');
  revalidatePath('/comercios');
  return { success: true };
}

export async function updateBusinessAction(id: string, formData: FormData): Promise<ActionResponse> {
  const supabase = await createClient();
  if (!supabase) return NO_SUPABASE;

  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') return { success: false, error: 'Sólo el administrador puede gestionar comercios.' };

  const parsed = businessSchema.safeParse(readBusinessForm(formData));
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const { error } = await supabase.from('businesses').update(parsed.data).eq('id', id);
  if (error) return { success: false, error: error.message };

  revalidatePath('/');
  revalidatePath('/dashboard/comercios');
  revalidatePath('/comercios');
  return { success: true };
}

export async function deleteBusinessAction(id: string): Promise<ActionResponse> {
  const supabase = await createClient();
  if (!supabase) return NO_SUPABASE;

  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') return { success: false, error: 'Sólo el administrador puede gestionar comercios.' };

  const { error } = await supabase.from('businesses').delete().eq('id', id);
  if (error) return { success: false, error: error.message };

  revalidatePath('/');
  revalidatePath('/dashboard/comercios');
  revalidatePath('/comercios');
  return { success: true };
}
