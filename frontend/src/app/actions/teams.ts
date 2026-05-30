'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import { teamSchema } from './schemas';
import type { ActionResponse, Team } from '@/types';

export async function getTeamsAction(): Promise<ActionResponse<Team[]>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('teams')
    .select('*, delegate:users!delegate_id(id, full_name, email, username)')
    .order('name');

  if (error) return { success: false, error: error.message };
  return { success: true, data: data as Team[] };
}

export async function getTeamByIdAction(id: string): Promise<ActionResponse<Team>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('teams')
    .select(
      '*, delegate:users!delegate_id(id, full_name, email, username), players(*)'
    )
    .eq('id', id)
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, data: data as Team };
}

export async function createTeamAction(formData: FormData): Promise<ActionResponse> {
  const supabase = await createClient();

  // Check permissions
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'No autenticado.' };

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'organizer'].includes(profile.role)) {
    return { success: false, error: 'No tienes permisos para crear equipos.' };
  }

  const raw = {
    name: formData.get('name') as string,
    delegate_id: (formData.get('delegate_id') as string) || null,
  };

  const parsed = teamSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { error } = await supabase.from('teams').insert(parsed.data);

  if (error) {
    if (error.code === '23505') return { success: false, error: 'Ya existe un equipo con ese nombre.' };
    return { success: false, error: error.message };
  }

  revalidatePath('/teams');
  return { success: true };
}

export async function updateTeamAction(id: string, formData: FormData): Promise<ActionResponse> {
  const supabase = await createClient();

  const raw = {
    name: formData.get('name') as string,
    delegate_id: (formData.get('delegate_id') as string) || null,
  };

  const parsed = teamSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const logoUrl = formData.get('logo_url') as string | null;
  const updateData: Record<string, unknown> = { ...parsed.data };
  if (logoUrl) updateData.logo_url = logoUrl;

  const { error } = await supabase.from('teams').update(updateData).eq('id', id);

  if (error) return { success: false, error: error.message };

  revalidatePath('/teams');
  revalidatePath(`/teams/${id}`);
  return { success: true };
}

export async function deleteTeamAction(id: string): Promise<ActionResponse> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'No autenticado.' };

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'organizer'].includes(profile.role)) {
    return { success: false, error: 'No tienes permisos para eliminar equipos.' };
  }

  const { error } = await supabase.from('teams').delete().eq('id', id);

  if (error) return { success: false, error: error.message };

  revalidatePath('/teams');
  return { success: true };
}

export async function uploadTeamLogoAction(formData: FormData): Promise<ActionResponse<string>> {
  const supabase = await createClient();
  const file = formData.get('file') as File;

  if (!file) return { success: false, error: 'No se proporcionó un archivo.' };

  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

  const { error } = await supabase.storage.from('team-logos').upload(fileName, file);

  if (error) return { success: false, error: error.message };

  const { data: urlData } = supabase.storage.from('team-logos').getPublicUrl(fileName);

  return { success: true, data: urlData.publicUrl };
}
