'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import { tournamentSchema } from './schemas';
import type { ActionResponse, Tournament, Standing } from '@/types';

const NO_SUPABASE = { success: false, error: 'El sistema no está configurado aún. Contacta al administrador.' } as const;

export async function getTournamentsAction(): Promise<ActionResponse<Tournament[]>> {
  const supabase = await createClient();
  if (!supabase) return NO_SUPABASE;

  const { data, error } = await supabase
    .from('tournaments')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return { success: false, error: error.message };
  return { success: true, data: data as Tournament[] };
}

export async function getTournamentByIdAction(
  id: string
): Promise<ActionResponse<Tournament>> {
  const supabase = await createClient();
  if (!supabase) return NO_SUPABASE;

  const { data, error } = await supabase
    .from('tournaments')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, data: data as Tournament };
}

export async function createTournamentAction(
  formData: FormData
): Promise<ActionResponse<{ id: string }>> {
  const supabase = await createClient();
  if (!supabase) return NO_SUPABASE;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'No autenticado.' };

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'organizer'].includes(profile.role)) {
    return { success: false, error: 'No tienes permisos para crear torneos.' };
  }

  const raw = {
    name: formData.get('name') as string,
    description: (formData.get('description') as string) || null,
    format: formData.get('format') as string,
    category: (formData.get('category') as string) || 'libre',
    start_date: formData.get('start_date') as string,
    end_date: formData.get('end_date') as string,
  };

  const parsed = tournamentSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const bannerUrl = formData.get('banner_url') as string | null;
  const insertData: Record<string, unknown> = { ...parsed.data };
  if (bannerUrl) insertData.banner_url = bannerUrl;

  const { data, error } = await supabase.from('tournaments').insert(insertData).select('id').single();

  if (error) return { success: false, error: error.message };

  revalidatePath('/tournaments');
  return { success: true, data: { id: data.id } };
}

export async function updateTournamentAction(
  id: string,
  formData: FormData
): Promise<ActionResponse> {
  const supabase = await createClient();
  if (!supabase) return NO_SUPABASE;

  const raw = {
    name: formData.get('name') as string,
    description: (formData.get('description') as string) || null,
    format: formData.get('format') as string,
    category: (formData.get('category') as string) || 'libre',
    start_date: formData.get('start_date') as string,
    end_date: formData.get('end_date') as string,
  };

  const parsed = tournamentSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const bannerUrl = formData.get('banner_url') as string | null;
  const updateData: Record<string, unknown> = { ...parsed.data };
  if (bannerUrl) updateData.banner_url = bannerUrl;

  const statusVal = formData.get('status') as string | null;
  if (statusVal) updateData.status = statusVal;

  const { error } = await supabase.from('tournaments').update(updateData).eq('id', id);

  if (error) return { success: false, error: error.message };

  revalidatePath('/tournaments');
  revalidatePath(`/tournaments/${id}`);
  return { success: true };
}

export async function deleteTournamentAction(id: string): Promise<ActionResponse> {
  const supabase = await createClient();
  if (!supabase) return NO_SUPABASE;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'No autenticado.' };

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'organizer'].includes(profile.role)) {
    return { success: false, error: 'No tienes permisos para eliminar torneos.' };
  }

  const { error } = await supabase.from('tournaments').delete().eq('id', id);

  if (error) return { success: false, error: error.message };

  revalidatePath('/tournaments');
  return { success: true };
}

export async function registerTeamInTournamentAction(
  tournamentId: string,
  teamId: string
): Promise<ActionResponse> {
  const supabase = await createClient();
  if (!supabase) return NO_SUPABASE;

  const { data: existing } = await supabase
    .from('standings')
    .select('id')
    .eq('tournament_id', tournamentId)
    .eq('team_id', teamId)
    .single();

  if (existing) return { success: false, error: 'El equipo ya está inscrito en este torneo.' };

  const { error } = await supabase.from('standings').insert({
    tournament_id: tournamentId,
    team_id: teamId,
  });

  if (error) return { success: false, error: error.message };

  revalidatePath(`/tournaments/${tournamentId}`);
  return { success: true };
}

export async function registerTeamInTournamentFormAction(
  formData: FormData
): Promise<ActionResponse> {
  const tournamentId = formData.get('tournament_id') as string;
  const teamId = formData.get('team_id') as string;

  if (!tournamentId || !teamId) {
    return { success: false, error: 'Selecciona un campeonato y un equipo.' };
  }

  return registerTeamInTournamentAction(tournamentId, teamId);
}

export async function getStandingsAction(
  tournamentId: string
): Promise<ActionResponse<Standing[]>> {
  const supabase = await createClient();
  if (!supabase) return NO_SUPABASE;

  const { data, error } = await supabase
    .from('standings')
    .select('*, team:teams(id, name, logo_url)')
    .eq('tournament_id', tournamentId)
    .order('points', { ascending: false })
    .order('goal_difference', { ascending: false })
    .order('goals_for', { ascending: false });

  if (error) return { success: false, error: error.message };
  return { success: true, data: data as Standing[] };
}

export async function uploadTournamentBannerAction(
  formData: FormData
): Promise<ActionResponse<string>> {
  const supabase = await createClient();
  if (!supabase) return NO_SUPABASE;

  const file = formData.get('file') as File;

  if (!file) return { success: false, error: 'No se proporcionó un archivo.' };

  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

  const { error } = await supabase.storage.from('tournament-banners').upload(fileName, file);

  if (error) return { success: false, error: error.message };

  const { data: urlData } = supabase.storage.from('tournament-banners').getPublicUrl(fileName);

  return { success: true, data: urlData.publicUrl };
}
