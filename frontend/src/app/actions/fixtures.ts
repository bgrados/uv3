'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import { updateMatchScoreSchema } from './schemas';
import {
  generateLeagueFixture,
  generateKnockoutFixture,
  generateGroupFixture,
} from '@/utils/fixtures';
import type { ActionResponse, Match } from '@/types';

const NO_SUPABASE = { success: false, error: 'El sistema no está configurado aún. Contacta al administrador.' } as const;

export async function generateTournamentFixtureAction(
  tournamentId: string
): Promise<ActionResponse> {
  const supabase = await createClient();
  if (!supabase) return NO_SUPABASE;

  // Permission check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'No autenticado.' };

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'organizer'].includes(profile.role)) {
    return { success: false, error: 'No tienes permisos para generar fixtures.' };
  }

  // Get tournament
  const { data: tournament, error: tError } = await supabase
    .from('tournaments')
    .select('*')
    .eq('id', tournamentId)
    .single();

  if (tError || !tournament) {
    return { success: false, error: 'Torneo no encontrado.' };
  }

  // Get registered teams
  const { data: standings, error: sError } = await supabase
    .from('standings')
    .select('team_id')
    .eq('tournament_id', tournamentId);

  if (sError) return { success: false, error: sError.message };

  const teamIds = (standings || []).map((s) => s.team_id);

  if (teamIds.length < 2) {
    return { success: false, error: 'Se necesitan al menos 2 equipos inscritos.' };
  }

  // Get schedule slots
  const { data: schedules } = await supabase
    .from('schedules')
    .select('day_of_week, start_time, venue_id')
    .eq('tournament_id', tournamentId);

  const slots = (schedules || []).map((s) => ({
    dayOfWeek: s.day_of_week,
    startTime: s.start_time,
    venueId: s.venue_id,
  }));

  // Delete existing fixtures if tournament is still in draft
  if (tournament.status === 'draft') {
    await supabase.from('matches').delete().eq('tournament_id', tournamentId);
  }

  // Generate fixture based on format
  const startDate = tournament.start_date
    ? new Date(tournament.start_date)
    : new Date();

  let matches;
  switch (tournament.format) {
    case 'liga':
      matches = generateLeagueFixture(teamIds, tournamentId, startDate, slots);
      break;
    case 'eliminacion':
      matches = generateKnockoutFixture(teamIds, tournamentId, startDate, slots);
      break;
    case 'grupos':
      const groupsCount = Math.max(2, Math.floor(teamIds.length / 4));
      matches = generateGroupFixture(teamIds, tournamentId, groupsCount, startDate, slots);
      break;
    default:
      return { success: false, error: 'Formato de torneo no soportado.' };
  }

  if (matches.length === 0) {
    return { success: false, error: 'No se generaron partidos.' };
  }

  // Insert all generated matches
  const { error: insertError } = await supabase.from('matches').insert(matches);

  if (insertError) return { success: false, error: insertError.message };

  revalidatePath(`/tournaments/${tournamentId}`);
  return { success: true };
}

export async function getMatchesByTournamentAction(
  tournamentId: string
): Promise<ActionResponse<Match[]>> {
  const supabase = await createClient();
  if (!supabase) return NO_SUPABASE;

  const { data, error } = await supabase
    .from('matches')
    .select(
      `*,
       home_team:teams!home_team_id(id, name, logo_url),
       away_team:teams!away_team_id(id, name, logo_url),
       venue:venues(id, name),
       referee:users!referee_id(id, full_name)`
    )
    .eq('tournament_id', tournamentId)
    .order('round')
    .order('date_time');

  if (error) return { success: false, error: error.message };
  return { success: true, data: data as Match[] };
}

export async function updateMatchScoreAction(
  formData: FormData
): Promise<ActionResponse> {
  const supabase = await createClient();
  if (!supabase) return NO_SUPABASE;

  const raw = {
    match_id: formData.get('match_id') as string,
    home_score: formData.get('home_score') as string,
    away_score: formData.get('away_score') as string,
    status: formData.get('status') as string,
  };

  const parsed = updateMatchScoreSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { match_id, ...updateData } = parsed.data;

  const { error } = await supabase
    .from('matches')
    .update(updateData)
    .eq('id', match_id);

  if (error) return { success: false, error: error.message };

  // Get tournament_id for revalidation
  const { data: match } = await supabase
    .from('matches')
    .select('tournament_id')
    .eq('id', match_id)
    .single();

  if (match) {
    revalidatePath(`/tournaments/${match.tournament_id}`);
  }

  return { success: true };
}
