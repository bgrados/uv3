'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import { getCurrentUser } from '@/app/auth/actions';
import { boardMemberSchema, type BOARD_POSITIONS } from './schemas';
import type { ActionResponse, BoardMember } from '@/types';

const NO_SUPABASE = {
  success: false,
  error: 'El sistema no está configurado aún. Contacta al administrador.',
} as const;

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') return null;
  return user;
}

function readBoardMember(formData: FormData) {
  return {
    position: String(formData.get('position') ?? '') as (typeof BOARD_POSITIONS)[number],
    full_name: String(formData.get('full_name') ?? '').trim(),
    photo_url: String(formData.get('photo_url') ?? '').trim() || null,
    bio: String(formData.get('bio') ?? '').trim() || null,
    email: String(formData.get('email') ?? '').trim() || null,
    phone: String(formData.get('phone') ?? '').trim() || null,
    period: String(formData.get('period') ?? '').trim() || null,
    is_active: formData.get('is_active') === 'true',
    sort_order: Number(formData.get('sort_order') ?? 0),
  };
}

/** Directiva vigente para la página pública. */
export async function getActiveBoardMembersAction(): Promise<ActionResponse<BoardMember[]>> {
  const supabase = await createClient();
  if (!supabase) return NO_SUPABASE;

  const { data, error } = await supabase
    .from('board_members')
    .select('*')
    .eq('is_active', true)
    .order('sort_order')
    .order('position');

  if (error) return { success: false, error: error.message };
  return { success: true, data: (data ?? []) as BoardMember[] };
}

/** Directiva completa para el panel (incluye inactivos). */
export async function getAllBoardMembersAction(): Promise<ActionResponse<BoardMember[]>> {
  const supabase = await createClient();
  if (!supabase) return NO_SUPABASE;
  if (!(await requireAdmin())) return { success: false, error: 'No autorizado.' };

  const { data, error } = await supabase
    .from('board_members')
    .select('*')
    .order('sort_order')
    .order('position');

  if (error) return { success: false, error: error.message };
  return { success: true, data: (data ?? []) as BoardMember[] };
}

export async function createBoardMemberAction(formData: FormData): Promise<ActionResponse> {
  const supabase = await createClient();
  if (!supabase) return NO_SUPABASE;
  if (!(await requireAdmin())) return { success: false, error: 'No autorizado.' };

  const parsed = boardMemberSchema.safeParse(readBoardMember(formData));
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const { error } = await supabase.from('board_members').insert(parsed.data);
  if (error) return { success: false, error: error.message };

  revalidatePath('/junta');
  revalidatePath('/transparencia');
  revalidatePath('/dashboard/junta');
  return { success: true };
}

export async function updateBoardMemberAction(id: string, formData: FormData): Promise<ActionResponse> {
  const supabase = await createClient();
  if (!supabase) return NO_SUPABASE;
  if (!(await requireAdmin())) return { success: false, error: 'No autorizado.' };

  const parsed = boardMemberSchema.safeParse(readBoardMember(formData));
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const { error } = await supabase.from('board_members').update(parsed.data).eq('id', id);
  if (error) return { success: false, error: error.message };

  revalidatePath('/junta');
  revalidatePath('/transparencia');
  revalidatePath('/dashboard/junta');
  return { success: true };
}

export async function deleteBoardMemberAction(id: string): Promise<ActionResponse> {
  const supabase = await createClient();
  if (!supabase) return NO_SUPABASE;
  if (!(await requireAdmin())) return { success: false, error: 'No autorizado.' };

  const { error } = await supabase.from('board_members').delete().eq('id', id);
  if (error) return { success: false, error: error.message };

  revalidatePath('/junta');
  revalidatePath('/transparencia');
  revalidatePath('/dashboard/junta');
  return { success: true };
}
