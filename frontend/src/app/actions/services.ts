'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import { getCurrentUser } from '@/app/auth/actions';
import type { ActionResponse, CommunityEvent, CommunityService } from '@/types';

const NO_SUPABASE = {
  success: false,
  error: 'El sistema no está configurado aún. Contacta al administrador.',
} as const;

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') return null;
  return user;
}

function revalidateCommunity() {
  revalidatePath('/');
  revalidatePath('/dashboard/servicios');
  revalidatePath('/dashboard/agenda');
}

// ---------------------------------------------------------------------------
// Directorio de la unidad (servicios del barrio)
// ---------------------------------------------------------------------------

/** Lista pública de servicios de la unidad (sólo activos para el portal). */
export async function getCommunityServicesAction(includeInactive = false): Promise<ActionResponse<CommunityService[]>> {
  const supabase = await createClient();
  if (!supabase) return NO_SUPABASE;

  let query = supabase.from('community_services').select('*').order('sort_order').order('name');
  if (!includeInactive) query = query.eq('is_active', true);

  const { data, error } = await query;
  if (error) return { success: false, error: error.message };
  return { success: true, data: (data ?? []) as CommunityService[] };
}

function readServiceForm(formData: FormData) {
  return {
    name: String(formData.get('name') ?? '').trim(),
    category: (formData.get('category') as string) || 'otro',
    icon: ((formData.get('icon') as string) || '').trim() || null,
    description: ((formData.get('description') as string) || '').trim() || null,
    address: ((formData.get('address') as string) || '').trim() || null,
    phone: ((formData.get('phone') as string) || '').trim() || null,
    whatsapp: ((formData.get('whatsapp') as string) || '').trim() || null,
    hours: ((formData.get('hours') as string) || '').trim() || null,
    image_url: ((formData.get('image_url') as string) || '').trim() || null,
    sort_order: Number(formData.get('sort_order') ?? 0),
    is_active: formData.get('is_active') !== 'false',
  };
}

export async function createCommunityServiceAction(formData: FormData): Promise<ActionResponse<CommunityService>> {
  const admin = await requireAdmin();
  if (!admin) return { success: false, error: 'No autorizado.' };

  const supabase = await createClient();
  if (!supabase) return NO_SUPABASE;

  const raw = readServiceForm(formData);
  if (raw.name.length < 3) return { success: false, error: 'Escribe el nombre del servicio.' };

  const { data, error } = await supabase.from('community_services').insert(raw).select().single();
  if (error) return { success: false, error: error.message };

  revalidateCommunity();
  return { success: true, data: data as CommunityService };
}

export async function updateCommunityServiceAction(id: string, formData: FormData): Promise<ActionResponse> {
  const admin = await requireAdmin();
  if (!admin) return { success: false, error: 'No autorizado.' };

  const supabase = await createClient();
  if (!supabase) return NO_SUPABASE;

  const raw = readServiceForm(formData);
  if (raw.name.length < 3) return { success: false, error: 'Escribe el nombre del servicio.' };

  const { error } = await supabase.from('community_services').update(raw).eq('id', id);
  if (error) return { success: false, error: error.message };

  revalidateCommunity();
  return { success: true };
}

export async function deleteCommunityServiceAction(id: string): Promise<ActionResponse> {
  const admin = await requireAdmin();
  if (!admin) return { success: false, error: 'No autorizado.' };

  const supabase = await createClient();
  if (!supabase) return NO_SUPABASE;

  const { error } = await supabase.from('community_services').delete().eq('id', id);
  if (error) return { success: false, error: error.message };

  revalidateCommunity();
  return { success: true };
}

// ---------------------------------------------------------------------------
// Agenda de la comunidad (eventos y actividades)
// ---------------------------------------------------------------------------

/** Lista pública de eventos. Por defecto, sólo desde hoy en adelante. */
export async function getCommunityEventsAction(
  options: { upcomingOnly?: boolean; includeInactive?: boolean; limit?: number } = {}
): Promise<ActionResponse<CommunityEvent[]>> {
  const supabase = await createClient();
  if (!supabase) return NO_SUPABASE;

  const { upcomingOnly = true, includeInactive = false, limit } = options;

  let query = supabase
    .from('community_events')
    .select('*')
    .order('event_date', { ascending: true })
    .order('start_time', { ascending: true });

  if (!includeInactive) query = query.eq('is_active', true);
  if (upcomingOnly) {
    // "Hoy" según la hora de Lima (UTC-5), no UTC.
    const limaToday = new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString().slice(0, 10);
    query = query.gte('event_date', limaToday);
  }
  if (limit) query = query.limit(limit);

  const { data, error } = await query;
  if (error) return { success: false, error: error.message };
  return { success: true, data: (data ?? []) as CommunityEvent[] };
}

function readEventForm(formData: FormData) {
  const eventDate = String(formData.get('event_date') ?? '').trim();
  return {
    title: String(formData.get('title') ?? '').trim(),
    description: ((formData.get('description') as string) || '').trim() || null,
    event_date: eventDate,
    start_time: ((formData.get('start_time') as string) || '').trim() || null,
    end_time: ((formData.get('end_time') as string) || '').trim() || null,
    location: ((formData.get('location') as string) || '').trim() || null,
    category: (formData.get('category') as string) || 'otro',
    image_url: ((formData.get('image_url') as string) || '').trim() || null,
    is_featured: formData.get('is_featured') === 'on' || formData.get('is_featured') === 'true',
    is_active: formData.get('is_active') !== 'false',
    sort_order: Number(formData.get('sort_order') ?? 0),
  };
}

export async function createCommunityEventAction(formData: FormData): Promise<ActionResponse<CommunityEvent>> {
  const admin = await requireAdmin();
  if (!admin) return { success: false, error: 'No autorizado.' };

  const supabase = await createClient();
  if (!supabase) return NO_SUPABASE;

  const raw = readEventForm(formData);
  if (raw.title.length < 3) return { success: false, error: 'Escribe el título del evento.' };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw.event_date)) return { success: false, error: 'Selecciona una fecha válida.' };

  const { data, error } = await supabase.from('community_events').insert(raw).select().single();
  if (error) return { success: false, error: error.message };

  revalidateCommunity();
  return { success: true, data: data as CommunityEvent };
}

export async function updateCommunityEventAction(id: string, formData: FormData): Promise<ActionResponse> {
  const admin = await requireAdmin();
  if (!admin) return { success: false, error: 'No autorizado.' };

  const supabase = await createClient();
  if (!supabase) return NO_SUPABASE;

  const raw = readEventForm(formData);
  if (raw.title.length < 3) return { success: false, error: 'Escribe el título del evento.' };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw.event_date)) return { success: false, error: 'Selecciona una fecha válida.' };

  const { error } = await supabase.from('community_events').update(raw).eq('id', id);
  if (error) return { success: false, error: error.message };

  revalidateCommunity();
  return { success: true };
}

export async function deleteCommunityEventAction(id: string): Promise<ActionResponse> {
  const admin = await requireAdmin();
  if (!admin) return { success: false, error: 'No autorizado.' };

  const supabase = await createClient();
  if (!supabase) return NO_SUPABASE;

  const { error } = await supabase.from('community_events').delete().eq('id', id);
  if (error) return { success: false, error: error.message };

  revalidateCommunity();
  return { success: true };
}
