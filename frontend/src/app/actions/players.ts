'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import { getCurrentUser } from '@/app/auth/actions';
import { playerSchema } from './schemas';
import type { ActionResponse, Player } from '@/types';

/** Roles que pueden administrar jugadores (RLS lo restringe además al delegado dueño). */
const MANAGER_ROLES = ['admin', 'organizer', 'delegate'];

const NO_SUPABASE = { success: false, error: 'El sistema no está configurado aún. Contacta al administrador.' } as const;

export async function getPlayersByTeamAction(
  teamId: string
): Promise<ActionResponse<Player[]>> {
  const supabase = await createClient();
  if (!supabase) return NO_SUPABASE;

  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'No autenticado.' };
  if (!['admin', 'organizer', 'delegate'].includes(user.role)) {
    return { success: false, error: 'No tienes permisos para consultar jugadores.' };
  }

  if (user.role === 'delegate') {
    const { data: team } = await supabase
      .from('teams')
      .select('delegate_id')
      .eq('id', teamId)
      .maybeSingle();
    if (!team || team.delegate_id !== user.id) {
      return { success: false, error: 'No tienes permisos para consultar este equipo.' };
    }
  }

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

  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'No autenticado.' };
  if (!['admin', 'organizer', 'delegate'].includes(user.role)) {
    return { success: false, error: 'No tienes permisos para consultar jugadores.' };
  }

  const { data, error } = await supabase
    .from('players')
    .select('*, team:teams(id, name, logo_url, delegate_id)')
    .eq('id', id)
    .single();

  if (error) return { success: false, error: error.message };
  if (user.role === 'delegate' && (data as { team?: { delegate_id?: string } }).team?.delegate_id !== user.id) {
    return { success: false, error: 'No tienes permisos para consultar este jugador.' };
  }
  return { success: true, data: data as Player };
}

export async function createPlayerAction(formData: FormData): Promise<ActionResponse> {
  const supabase = await createClient();
  if (!supabase) return NO_SUPABASE;

  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'No autenticado.' };
  if (!MANAGER_ROLES.includes(user.role)) {
    return { success: false, error: 'No tienes permisos para registrar jugadores.' };
  }

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

  if (user.role === 'delegate') {
    const { data: team } = await supabase
      .from('teams')
      .select('delegate_id')
      .eq('id', parsed.data.team_id)
      .maybeSingle();
    if (!team || team.delegate_id !== user.id) {
      return { success: false, error: 'No tienes permisos para registrar jugadores en este equipo.' };
    }
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

  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'No autenticado.' };
  if (!MANAGER_ROLES.includes(user.role)) {
    return { success: false, error: 'No tienes permisos para editar jugadores.' };
  }

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

  let originalTeamId: string | null = null;

  if (user.role === 'delegate') {
    const { data: existing } = await supabase
      .from('players')
      .select('team_id')
      .eq('id', id)
      .maybeSingle();
    const { data: newTeam } = await supabase
      .from('teams')
      .select('delegate_id')
      .eq('id', parsed.data.team_id)
      .maybeSingle();
    if (!existing || !newTeam || newTeam.delegate_id !== user.id) {
      return { success: false, error: 'No tienes permisos para editar jugadores de este equipo.' };
    }
    const { data: existingTeam } = await supabase
      .from('teams')
      .select('delegate_id')
      .eq('id', existing.team_id)
      .maybeSingle();
    if (!existingTeam || existingTeam.delegate_id !== user.id) {
      return { success: false, error: 'No tienes permisos para editar jugadores de este equipo.' };
    }
    originalTeamId = existing.team_id;
  }

  const photoUrl = formData.get('photo_url') as string | null;
  const updateData: Record<string, unknown> = { ...parsed.data };
  if (photoUrl) updateData.photo_url = photoUrl;

  let updateQuery = supabase.from('players').update(updateData).eq('id', id);
  if (user.role === 'delegate' && originalTeamId) {
    updateQuery = updateQuery.eq('team_id', originalTeamId);
  }
  const { data: updatedRows, error } = await updateQuery.select('id');

  if (error) return { success: false, error: error.message };
  if (!updatedRows || updatedRows.length === 0) {
    return { success: false, error: 'No tienes permisos para editar jugadores de este equipo.' };
  }

  revalidatePath(`/teams/${parsed.data.team_id}`);
  return { success: true };
}

export async function deletePlayerAction(id: string, teamId: string): Promise<ActionResponse> {
  const supabase = await createClient();
  if (!supabase) return NO_SUPABASE;

  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'No autenticado.' };
  if (!MANAGER_ROLES.includes(user.role)) {
    return { success: false, error: 'No tienes permisos para eliminar jugadores.' };
  }

  if (user.role === 'delegate') {
    const { data: player } = await supabase
      .from('players')
      .select('team_id')
      .eq('id', id)
      .maybeSingle();
    if (!player) {
      return { success: false, error: 'Jugador no encontrado.' };
    }
    const { data: team } = await supabase
      .from('teams')
      .select('delegate_id')
      .eq('id', player.team_id)
      .maybeSingle();
    if (!team || team.delegate_id !== user.id) {
      return { success: false, error: 'No tienes permisos para eliminar jugadores de este equipo.' };
    }
  }

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

  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'No autenticado.' };
  if (!MANAGER_ROLES.includes(user.role)) {
    return { success: false, error: 'No tienes permisos para subir fotos.' };
  }

  const file = formData.get('file') as File;

  if (!file) return { success: false, error: 'No se proporcionó un archivo.' };

  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

  const { error } = await supabase.storage.from('player-photos').upload(fileName, file);

  if (error) return { success: false, error: error.message };

  const { data: urlData } = supabase.storage.from('player-photos').getPublicUrl(fileName);

  return { success: true, data: urlData.publicUrl };
}
