'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import { getCurrentUser } from '@/app/auth/actions';
import { announcementSchema } from './schemas';
import type { ActionResponse, Announcement } from '@/types';

const NO_SUPABASE = {
  success: false,
  error: 'El sistema no está configurado aún. Contacta al administrador.',
} as const;

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') return null;
  return user;
}

function revalidateAnnouncements() {
  revalidatePath('/announcements');
  revalidatePath('/dashboard/announcements');
}

/** Lista los comunicados publicados (ordenados del más reciente al más antiguo). */
export async function getAnnouncementsAction(): Promise<ActionResponse<Announcement[]>> {
  const supabase = await createClient();
  if (!supabase) return NO_SUPABASE;

  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return { success: false, error: error.message };
  return { success: true, data: (data ?? []) as Announcement[] };
}

/** Crea un comunicado para la comunidad. */
export async function createAnnouncementAction(formData: FormData): Promise<ActionResponse<Announcement>> {
  const supabase = await createClient();
  if (!supabase) return NO_SUPABASE;

  const user = await requireAdmin();
  if (!user) return { success: false, error: 'No autorizado.' };

  const parsed = announcementSchema.safeParse({
    title: String(formData.get('title') ?? '').trim(),
    content: String(formData.get('content') ?? '').trim(),
    category: (formData.get('category') as string) || 'general',
    image_url: String(formData.get('image_url') ?? '').trim() || null,
    video_url: String(formData.get('video_url') ?? '').trim() || null,
    is_featured: formData.get('is_featured') === 'true',
  });
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const { data, error } = await supabase
    .from('announcements')
    .insert({ ...parsed.data, author_id: user.id })
    .select('*')
    .single();

  if (error) return { success: false, error: error.message };
  revalidateAnnouncements();
  return { success: true, data: data as unknown as Announcement };
}

/** Actualiza un comunicado existente. */
export async function updateAnnouncementAction(id: string, formData: FormData): Promise<ActionResponse> {
  const supabase = await createClient();
  if (!supabase) return NO_SUPABASE;
  if (!(await requireAdmin())) return { success: false, error: 'No autorizado.' };

  const parsed = announcementSchema.safeParse({
    title: String(formData.get('title') ?? '').trim(),
    content: String(formData.get('content') ?? '').trim(),
    category: (formData.get('category') as string) || 'general',
    image_url: String(formData.get('image_url') ?? '').trim() || null,
    video_url: String(formData.get('video_url') ?? '').trim() || null,
    is_featured: formData.get('is_featured') === 'true',
  });
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const { error } = await supabase.from('announcements').update(parsed.data).eq('id', id);
  if (error) return { success: false, error: error.message };
  revalidateAnnouncements();
  return { success: true };
}

/** Elimina un comunicado. */
export async function deleteAnnouncementAction(id: string): Promise<ActionResponse> {
  const supabase = await createClient();
  if (!supabase) return NO_SUPABASE;
  if (!(await requireAdmin())) return { success: false, error: 'No autorizado.' };

  const { error } = await supabase.from('announcements').delete().eq('id', id);
  if (error) return { success: false, error: error.message };
  revalidateAnnouncements();
  return { success: true };
}
