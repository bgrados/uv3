'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import { playerSchema } from './schemas';
import type { ActionResponse, Player } from '@/types';

const NO_SUPABASE = { success: false, error: 'El sistema no está configurado aún. Contacta al administrador.' } as const;

export async function getPlayersByTeamAction(
  teamId: string
): Promise<ActionResponse<Player[]>> {
  const supabase = await createClient();
  if (!supabase) return NO_SUPABASE;

  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('team_id', teamId)
    .order('jersey_number');

  if (error) return { success: false, error: error.message };
  return { success: true, data: data as Player[] };
}

export async function getPlayerByIdAction(id: string): Promise<ActionResponse<Player>> {
  const supabase = await createClient();
  if (!supabase) return NO_SUPABASE;

  const { data, error } = await supabase
    .from('players')
    .select('*, team:teams(id, name, logo_url)')
    .eq('id', id)
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, data: data as Player };
}

export async function createPlayerAction(formData: FormData): Promise<ActionResponse> {
  const supabase = await createClient();
  if (!supabase) return NO_SUPABASE;

  const raw = {
    first_name: formData.get('first_name') as string,
    last_name: formData.get('last_name') as string,
    dni: formData.get('dni') as string,
    birth_date: (formData.get('birth_date') as string) || null,
    jersey_number: formData.get('jersey_number') as string,
    position: formData.get('position') as string,
    team_id: formData.get('team_id') as string,
  };

  const parsed = playerSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const photoUrl = formData.get('photo_url') as string | null;
  const insertData: Record<string, unknown> = { ...parsed.data };
  if (photoUrl) insertData.photo_url = photoUrl;

  const { error } = await supabase.from('players').insert(insertData);

  if (error) {
    if (error.code === '23505') return { success: false, error: 'Ya existe un jugador con ese DNI.' };
    return { success: false, error: error.message };
  }

  revalidatePath(`/teams/${parsed.data.team_id}`);
  return { success: true };
}

export async function updatePlayerAction(
  id: string,
  formData: FormData
): Promise<ActionResponse> {
  const supabase = await createClient();
  if (!supabase) return NO_SUPABASE;

  const raw = {
    first_name: formData.get('first_name') as string,
    last_name: formData.get('last_name') as string,
    dni: formData.get('dni') as string,
    birth_date: (formData.get('birth_date') as string) || null,
    jersey_number: formData.get('jersey_number') as string,
    position: formData.get('position') as string,
    team_id: formData.get('team_id') as string,
  };

  const parsed = playerSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const photoUrl = formData.get('photo_url') as string | null;
  const updateData: Record<string, unknown> = { ...parsed.data };
  if (photoUrl) updateData.photo_url = photoUrl;

  const { error } = await supabase.from('players').update(updateData).eq('id', id);

  if (error) return { success: false, error: error.message };

  revalidatePath(`/teams/${parsed.data.team_id}`);
  return { success: true };
}

export async function deletePlayerAction(id: string, teamId: string): Promise<ActionResponse> {
  const supabase = await createClient();
  if (!supabase) return NO_SUPABASE;

  const { error } = await supabase.from('players').delete().eq('id', id);

  if (error) return { success: false, error: error.message };

  revalidatePath(`/teams/${teamId}`);
  return { success: true };
}

export async function uploadPlayerPhotoAction(
  formData: FormData
): Promise<ActionResponse<string>> {
  const supabase = await createClient();
  if (!supabase) return NO_SUPABASE;

  const file = formData.get('file') as File;

  if (!file) return { success: false, error: 'No se proporcionó un archivo.' };

  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

  const { error } = await supabase.storage.from('player-photos').upload(fileName, file);

  if (error) return { success: false, error: error.message };

  const { data: urlData } = supabase.storage.from('player-photos').getPublicUrl(fileName);

  return { success: true, data: urlData.publicUrl };
}
