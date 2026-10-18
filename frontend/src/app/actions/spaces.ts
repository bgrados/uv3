'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import { getCurrentUser } from '@/app/auth/actions';
import { spaceSchema } from './schemas';
import { limaToUtc } from '@/utils/reservations';
import type { ActionResponse, Space, SpaceBlock } from '@/types';

const NO_SUPABASE = {
  success: false,
  error: 'El sistema no está configurado aún. Contacta al administrador.',
} as const;

function mapSpace(row: Record<string, unknown>): Space {
  const clone = { ...row };
  const relations = (clone.space_sports as { sport: string }[] | null) ?? [];
  delete clone.space_sports;
  return {
    ...(clone as unknown as Space),
    sports: relations.map((r) => r.sport),
  };
}

/** Lista pública de espacios (canchas y losas). */
export async function getSpacesAction(): Promise<ActionResponse<Space[]>> {
  const supabase = await createClient();
  if (!supabase) return NO_SUPABASE;

  const { data, error } = await supabase
    .from('spaces')
    .select('*, space_sports(sport)')
    .order('sort_order')
    .order('name');

  if (error) return { success: false, error: error.message };
  return { success: true, data: (data ?? []).map((row) => mapSpace(row as Record<string, unknown>)) };
}

export async function getSpaceByIdAction(id: string): Promise<ActionResponse<Space>> {
  const supabase = await createClient();
  if (!supabase) return NO_SUPABASE;

  const { data, error } = await supabase
    .from('spaces')
    .select('*, space_sports(sport)')
    .eq('id', id)
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, data: mapSpace(data as Record<string, unknown>) };
}

function readSpaceForm(formData: FormData) {
  const sports = formData.getAll('sports').map(String).filter(Boolean);
  return {
    name: String(formData.get('name') ?? ''),
    slug: null,
    description: (formData.get('description') as string) || null,
    image_url: (formData.get('image_url') as string) || null,
    day_rate: Number(formData.get('day_rate') ?? 0),
    night_rate: Number(formData.get('night_rate') ?? 0),
    event_day_rate: formData.get('event_day_rate') ? Number(formData.get('event_day_rate')) : null,
    event_night_rate: formData.get('event_night_rate') ? Number(formData.get('event_night_rate')) : null,
    night_start: (formData.get('night_start') as string) || '18:00',
    night_end: (formData.get('night_end') as string) || '06:00',
    allows_events: formData.get('allows_events') === 'on' || formData.get('allows_events') === 'true',
    is_active: formData.get('is_active') !== 'false',
    sort_order: Number(formData.get('sort_order') ?? 0),
    sports,
  };
}

export async function createSpaceAction(formData: FormData): Promise<ActionResponse<Space>> {
  const supabase = await createClient();
  if (!supabase) return NO_SUPABASE;

  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'No autenticado.' };
  if (user.role !== 'admin') return { success: false, error: 'Sólo el administrador puede gestionar canchas.' };

  const raw = readSpaceForm(formData);
  const parsed = spaceSchema.safeParse(raw);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const { sports, ...space } = parsed.data;
  const { data, error } = await supabase.from('spaces').insert(space).select().single();
  if (error) {
    if (error.code === '23505') return { success: false, error: 'Ya existe un espacio con ese nombre.' };
    return { success: false, error: error.message };
  }

  const spaceId = (data as { id: string }).id;
  if (sports.length) {
    const { error: sportsError } = await supabase
      .from('space_sports')
      .insert(sports.map((sport) => ({ space_id: spaceId, sport })));
    if (sportsError) return { success: false, error: sportsError.message };
  }

  revalidatePath('/dashboard/canchas');
  revalidatePath('/reservas');
  return { success: true, data: { ...(data as Space), sports } };
}

export async function updateSpaceAction(id: string, formData: FormData): Promise<ActionResponse> {
  const supabase = await createClient();
  if (!supabase) return NO_SUPABASE;

  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'No autenticado.' };
  if (user.role !== 'admin') return { success: false, error: 'Sólo el administrador puede gestionar canchas.' };

  const raw = readSpaceForm(formData);
  const parsed = spaceSchema.safeParse(raw);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const { sports, ...space } = parsed.data;
  const { error } = await supabase.from('spaces').update(space).eq('id', id);
  if (error) {
    if (error.code === '23505') return { success: false, error: 'Ya existe un espacio con ese nombre.' };
    return { success: false, error: error.message };
  }

  await supabase.from('space_sports').delete().eq('space_id', id);
  if (sports.length) {
    const { error: sportsError } = await supabase
      .from('space_sports')
      .insert(sports.map((sport) => ({ space_id: id, sport })));
    if (sportsError) return { success: false, error: sportsError.message };
  }

  revalidatePath('/dashboard/canchas');
  revalidatePath('/reservas');
  return { success: true };
}

export async function deleteSpaceAction(id: string): Promise<ActionResponse> {
  const supabase = await createClient();
  if (!supabase) return NO_SUPABASE;

  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'No autenticado.' };
  if (user.role !== 'admin') return { success: false, error: 'Sólo el administrador puede gestionar canchas.' };

  const { error } = await supabase.from('spaces').delete().eq('id', id);
  if (error) return { success: false, error: error.message };

  revalidatePath('/dashboard/canchas');
  revalidatePath('/reservas');
  return { success: true };
}

// ---------------------------------------------------------------------------
// Bloqueos de espacios (mantenimiento, feriados, uso interno de la junta)
// ---------------------------------------------------------------------------

/** Lista los bloqueos vigentes y futuros, con el nombre del espacio. */
export async function getSpaceBlocksAction(): Promise<
  ActionResponse<(SpaceBlock & { space_name: string })[]>
> {
  const supabase = await createClient();
  if (!supabase) return NO_SUPABASE;

  const { data, error } = await supabase
    .from('space_blocks')
    .select('*, spaces(name)')
    .gte('end_at', new Date(Date.now() - 24 * 3600 * 1000).toISOString())
    .order('start_at');

  if (error) return { success: false, error: error.message };

  const rows = (data ?? []).map((row) => {
    const r = row as Record<string, unknown> & { spaces?: { name: string } | null };
    const { spaces, ...rest } = r;
    return { ...(rest as unknown as SpaceBlock), space_name: spaces?.name ?? '—' };
  });

  return { success: true, data: rows };
}

export async function createSpaceBlockAction(formData: FormData): Promise<ActionResponse<SpaceBlock>> {
  const supabase = await createClient();
  if (!supabase) return NO_SUPABASE;

  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'No autenticado.' };
  if (user.role !== 'admin') return { success: false, error: 'Sólo el administrador puede gestionar bloqueos.' };

  const spaceId = String(formData.get('space_id') ?? '');
  const date = String(formData.get('date') ?? '');
  const startTime = String(formData.get('start_time') ?? '');
  const endTime = String(formData.get('end_time') ?? '');
  const reason = (formData.get('reason') as string)?.trim() || null;

  if (!spaceId) return { success: false, error: 'Selecciona un espacio.' };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { success: false, error: 'Selecciona una fecha válida.' };
  if (!/^\d{2}:\d{2}/.test(startTime) || !/^\d{2}:\d{2}/.test(endTime)) {
    return { success: false, error: 'Indica hora de inicio y fin.' };
  }

  const start = limaToUtc(date, startTime);
  let end = limaToUtc(date, endTime);
  // Si la hora de fin es anterior o igual al inicio, se interpreta como el día siguiente.
  if (end.getTime() <= start.getTime()) end = new Date(end.getTime() + 24 * 3600 * 1000);

  const { data, error } = await supabase
    .from('space_blocks')
    .insert({ space_id: spaceId, start_at: start.toISOString(), end_at: end.toISOString(), reason })
    .select()
    .single();

  if (error) {
    if (error.code === '23P01') return { success: false, error: 'Ya existe un bloqueo que se cruza con ese horario.' };
    return { success: false, error: error.message };
  }

  revalidatePath('/dashboard/canchas');
  revalidatePath('/reservas');
  return { success: true, data: data as SpaceBlock };
}

export async function deleteSpaceBlockAction(id: string): Promise<ActionResponse> {
  const supabase = await createClient();
  if (!supabase) return NO_SUPABASE;

  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'No autenticado.' };
  if (user.role !== 'admin') return { success: false, error: 'Sólo el administrador puede gestionar bloqueos.' };

  const { error } = await supabase.from('space_blocks').delete().eq('id', id);
  if (error) return { success: false, error: error.message };

  revalidatePath('/dashboard/canchas');
  revalidatePath('/reservas');
  return { success: true };
}
