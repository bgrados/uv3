'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import { getCurrentUser } from '@/app/auth/actions';
import { noticeSchema } from './schemas';
import type { ActionResponse, Notice } from '@/types';

const NO_SUPABASE = {
  success: false,
  error: 'El sistema no está configurado aún. Contacta al administrador.',
} as const;

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') return null;
  return user;
}

function revalidateNotices() {
  revalidatePath('/');
  revalidatePath('/dashboard/notices');
}

function readNoticeForm(formData: FormData) {
  return {
    title: String(formData.get('title') ?? '').trim(),
    content: String(formData.get('content') ?? '').trim() || null,
    icon: String(formData.get('icon') ?? '').trim() || null,
    link_url: String(formData.get('link_url') ?? '').trim() || null,
    link_label: String(formData.get('link_label') ?? '').trim() || null,
    is_featured: formData.get('is_featured') === 'true',
    is_active: formData.get('is_active') === 'true',
    sort_order: Number(formData.get('sort_order') ?? 0),
  };
}

/** Lista los avisos activos para la portada (público). */
export async function getNoticesAction(): Promise<ActionResponse<Notice[]>> {
  const supabase = await createClient();
  if (!supabase) return NO_SUPABASE;

  const { data, error } = await supabase
    .from('notices')
    .select('*')
    .eq('is_active', true)
    .order('sort_order')
    .order('created_at');

  if (error) return { success: false, error: error.message };
  return { success: true, data: (data ?? []) as Notice[] };
}

/** Lista completa (incluye ocultos) para el panel. */
export async function getAllNoticesAction(): Promise<ActionResponse<Notice[]>> {
  const supabase = await createClient();
  if (!supabase) return NO_SUPABASE;
  if (!(await requireAdmin())) return { success: false, error: 'No autorizado.' };

  const { data, error } = await supabase
    .from('notices')
    .select('*')
    .order('sort_order')
    .order('created_at');

  if (error) return { success: false, error: error.message };
  return { success: true, data: (data ?? []) as Notice[] };
}

export async function createNoticeAction(formData: FormData): Promise<ActionResponse> {
  const supabase = await createClient();
  if (!supabase) return NO_SUPABASE;
  if (!(await requireAdmin())) return { success: false, error: 'No autorizado.' };

  const parsed = noticeSchema.safeParse(readNoticeForm(formData));
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const { error } = await supabase.from('notices').insert(parsed.data);
  if (error) return { success: false, error: error.message };

  revalidateNotices();
  return { success: true };
}

export async function updateNoticeAction(id: string, formData: FormData): Promise<ActionResponse> {
  const supabase = await createClient();
  if (!supabase) return NO_SUPABASE;
  if (!(await requireAdmin())) return { success: false, error: 'No autorizado.' };

  const parsed = noticeSchema.safeParse(readNoticeForm(formData));
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const { error } = await supabase.from('notices').update(parsed.data).eq('id', id);
  if (error) return { success: false, error: error.message };

  revalidateNotices();
  return { success: true };
}

export async function deleteNoticeAction(id: string): Promise<ActionResponse> {
  const supabase = await createClient();
  if (!supabase) return NO_SUPABASE;
  if (!(await requireAdmin())) return { success: false, error: 'No autorizado.' };

  const { error } = await supabase.from('notices').delete().eq('id', id);
  if (error) return { success: false, error: error.message };

  revalidateNotices();
  return { success: true };
}
