'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import { getCurrentUser } from '@/app/auth/actions';
import { treasuryEntrySchema, TREASURY_KINDS } from './schemas';
import type { ActionResponse, TreasuryEntry } from '@/types';

const NO_SUPABASE = {
  success: false,
  error: 'El sistema no está configurado aún. Contacta al administrador.',
} as const;

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') return null;
  return user;
}

function readTreasuryEntry(formData: FormData) {
  const amountStr = String(formData.get('amount') ?? '0');
  return {
    entry_date: String(formData.get('entry_date') ?? ''),
    kind: String(formData.get('kind') ?? '') as (typeof TREASURY_KINDS)[number],
    category: String(formData.get('category') ?? '').trim(),
    concept: String(formData.get('concept') ?? '').trim(),
    amount: amountStr === '' ? 0 : Number(amountStr),
    receipt_url: String(formData.get('receipt_url') ?? '').trim() || null,
    responsible_member_id: String(formData.get('responsible_member_id') ?? '').trim() || null,
    is_published: formData.get('is_published') === 'true',
  };
}

/** Movimientos publicados para la página pública. */
export async function getPublishedTreasuryEntriesAction(year?: string): Promise<
  ActionResponse<TreasuryEntry[]>
> {
  const supabase = await createClient();
  if (!supabase) return NO_SUPABASE;

  let query = supabase
    .from('treasury_entries')
    .select('*, responsible:board_members(id, full_name, position, photo_url)')
    .eq('is_published', true)
    .order('entry_date', { ascending: false })
    .order('created_at', { ascending: false });

  const y = (year ?? '').trim();
  if (y && /^\d{4}$/.test(y)) {
    const start = `${y}-01-01`;
    const end = `${y}-12-31`;
    query = query.gte('entry_date', start).lte('entry_date', end);
  }

  const { data, error } = await query;
  if (error) return { success: false, error: error.message };
  return { success: true, data: (data ?? []) as TreasuryEntry[] };
}

/** Todos los movimientos para el panel (incluye no publicados). */
export async function getAllTreasuryEntriesAction(year?: string): Promise<ActionResponse<TreasuryEntry[]>> {
  const supabase = await createClient();
  if (!supabase) return NO_SUPABASE;
  if (!(await requireAdmin())) return { success: false, error: 'No autorizado.' };

  let query = supabase
    .from('treasury_entries')
    .select('*, responsible:board_members(id, full_name, position, photo_url)')
    .order('entry_date', { ascending: false })
    .order('created_at', { ascending: false });

  const y = (year ?? '').trim();
  if (y && /^\d{4}$/.test(y)) {
    query = query.gte('entry_date', `${y}-01-01`).lte('entry_date', `${y}-12-31`);
  }

  const { data, error } = await query;
  if (error) return { success: false, error: error.message };
  return { success: true, data: (data ?? []) as TreasuryEntry[] };
}

export async function createTreasuryEntryAction(formData: FormData): Promise<ActionResponse> {
  const supabase = await createClient();
  if (!supabase) return NO_SUPABASE;
  if (!(await requireAdmin())) return { success: false, error: 'No autorizado.' };

  const parsed = treasuryEntrySchema.safeParse(readTreasuryEntry(formData));
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const data: Record<string, unknown> = { ...parsed.data };
  if (!data.responsible_member_id) data.responsible_member_id = null;
  // created_by puede quedar null

  const { error } = await supabase.from('treasury_entries').insert(data);
  if (error) return { success: false, error: error.message };

  revalidatePath('/transparencia');
  revalidatePath('/dashboard/tesoreria');
  return { success: true };
}

export async function updateTreasuryEntryAction(id: string, formData: FormData): Promise<ActionResponse> {
  const supabase = await createClient();
  if (!supabase) return NO_SUPABASE;
  if (!(await requireAdmin())) return { success: false, error: 'No autorizado.' };

  const parsed = treasuryEntrySchema.safeParse(readTreasuryEntry(formData));
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const data: Record<string, unknown> = { ...parsed.data };
  if (!data.responsible_member_id) data.responsible_member_id = null;

  const { error } = await supabase.from('treasury_entries').update(data).eq('id', id);
  if (error) return { success: false, error: error.message };

  revalidatePath('/transparencia');
  revalidatePath('/dashboard/tesoreria');
  return { success: true };
}

export async function deleteTreasuryEntryAction(id: string): Promise<ActionResponse> {
  const supabase = await createClient();
  if (!supabase) return NO_SUPABASE;
  if (!(await requireAdmin())) return { success: false, error: 'No autorizado.' };

  const { error } = await supabase.from('treasury_entries').delete().eq('id', id);
  if (error) return { success: false, error: error.message };

  revalidatePath('/transparencia');
  revalidatePath('/dashboard/tesoreria');
  return { success: true };
}
