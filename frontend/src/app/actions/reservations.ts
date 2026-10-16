'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import { getCurrentUser } from '@/app/auth/actions';
import { reservationSchema } from './schemas';
import { computePrice, limaToUtc } from '@/utils/reservations';
import type { ActionResponse, Reservation, Space } from '@/types';

const NO_SUPABASE = {
  success: false,
  error: 'El sistema no está configurado aún. Contacta al administrador.',
} as const;

/** Lista las reservas (sólo administrador). */
export async function getReservationsAction(): Promise<ActionResponse<Reservation[]>> {
  const supabase = await createClient();
  if (!supabase) return NO_SUPABASE;

  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') return { success: false, error: 'No autorizado.' };

  const { data, error } = await supabase
    .from('reservations')
    .select('*, space:spaces(id, name)')
    .order('start_at', { ascending: false })
    .limit(300);

  if (error) return { success: false, error: error.message };
  return { success: true, data: (data ?? []) as Reservation[] };
}

export async function getSpaceDayAction(
  spaceId: string,
  date: string
): Promise<ActionResponse<{ start_at: string; end_at: string; kind: string }[]>> {
  const supabase = await createClient();
  if (!supabase) return NO_SUPABASE;

  const { data, error } = await supabase.rpc('get_space_day', {
    p_space_id: spaceId,
    p_date: date,
  });

  if (error) return { success: false, error: error.message };
  return { success: true, data: (data ?? []) as { start_at: string; end_at: string; kind: string }[] };
}

export async function lookupReservationAction(
  code: string,
  phone: string
): Promise<ActionResponse<Record<string, unknown>>> {
  const supabase = await createClient();
  if (!supabase) return NO_SUPABASE;

  const { data, error } = await supabase.rpc('get_reservation', {
    p_code: code,
    p_phone: phone,
  });

  if (error) return { success: false, error: error.message };
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return { success: false, error: 'No encontramos una reserva con ese código y teléfono.' };
  return { success: true, data: row as Record<string, unknown> };
}

export async function cancelReservationAction(
  code: string,
  phone: string
): Promise<ActionResponse<string>> {
  const supabase = await createClient();
  if (!supabase) return NO_SUPABASE;

  const { data, error } = await supabase.rpc('cancel_reservation', {
    p_code: code,
    p_phone: phone,
  });

  if (error) return { success: false, error: error.message };
  const result = String(data);
  if (result === 'no_encontrada') {
    return { success: false, error: 'No encontramos una reserva con ese código y teléfono.' };
  }
  if (result === 'cancelada') {
    revalidatePath('/reservas/consultar');
    return { success: true, data: 'Reserva cancelada.' };
  }
  return { success: false, error: `La reserva ya está en estado "${result}".` };
}

/** Crea una reserva pública. El precio se calcula aquí, nunca en el navegador. */
export async function createReservationAction(
  payload: unknown
): Promise<ActionResponse<{ code: string; price: number }>> {
  const supabase = await createClient();
  if (!supabase) return NO_SUPABASE;

  const parsed = reservationSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }
  const input = parsed.data;

  const start = limaToUtc(input.date, input.start_time);
  const end = new Date(start.getTime() + input.duration_minutes * 60000);

  const { data: spaceData, error: spaceError } = await supabase
    .from('spaces')
    .select('*')
    .eq('id', input.space_id)
    .single();

  if (spaceError || !spaceData) return { success: false, error: 'Espacio no encontrado.' };
  const space = spaceData as Space;
  if (!space.is_active) return { success: false, error: 'Este espacio no está disponible para reservas.' };
  if (input.usage_type === 'evento' && !space.allows_events) {
    return { success: false, error: 'Este espacio no admite eventos.' };
  }

  const { price } = computePrice(space, input.usage_type, start, end);

  const user = await getCurrentUser();

  const { data, error } = await supabase
    .from('reservations')
    .insert({
      space_id: input.space_id,
      user_id: user?.id ?? null,
      customer_name: input.customer_name.trim(),
      customer_phone: input.customer_phone.trim(),
      customer_email: input.customer_email || null,
      usage_type: input.usage_type,
      sport: input.usage_type === 'evento' ? null : input.sport,
      event_description: input.event_description || null,
      start_at: start.toISOString(),
      end_at: end.toISOString(),
      status: 'confirmed',
      payment_status: 'submitted',
      payment_method: 'yape',
      payment_proof_url: input.payment_proof_url,
      price,
      notes: input.notes || null,
    })
    .select('code, price')
    .single();

  if (error) {
    if (error.code === '23P01') {
      return { success: false, error: 'Ese horario acaba de ocuparse. Elige otro horario, por favor.' };
    }
    if (error.code === '23514') {
      return { success: false, error: 'Ese horario no está disponible (bloqueado). Elige otro.' };
    }
    return { success: false, error: error.message };
  }

  revalidatePath('/reservas');
  return {
    success: true,
    data: {
      code: (data as { code: string }).code,
      price: Number((data as { price: number }).price),
    },
  };
}

// --- Gestión desde el panel -------------------------------------------------

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') return null;
  return user;
}

export async function updatePaymentStatusAction(
  id: string,
  paymentStatus: 'submitted' | 'verified' | 'rejected'
): Promise<ActionResponse> {
  const supabase = await createClient();
  if (!supabase) return NO_SUPABASE;
  if (!(await requireAdmin())) return { success: false, error: 'No autorizado.' };

  const { error } = await supabase.from('reservations').update({ payment_status: paymentStatus }).eq('id', id);
  if (error) return { success: false, error: error.message };

  revalidatePath('/dashboard/reservas');
  return { success: true };
}

export async function updateReservationStatusAction(
  id: string,
  status: 'confirmed' | 'cancelled' | 'completed' | 'no_show'
): Promise<ActionResponse> {
  const supabase = await createClient();
  if (!supabase) return NO_SUPABASE;
  if (!(await requireAdmin())) return { success: false, error: 'No autorizado.' };

  const { error } = await supabase.from('reservations').update({ status }).eq('id', id);
  if (error) {
    if (error.code === '23P01') return { success: false, error: 'Ese horario se superpone con otra reserva.' };
    if (error.code === '23514') return { success: false, error: 'El espacio está bloqueado en ese horario.' };
    return { success: false, error: error.message };
  }

  revalidatePath('/dashboard/reservas');
  return { success: true };
}

export async function deleteReservationAction(id: string): Promise<ActionResponse> {
  const supabase = await createClient();
  if (!supabase) return NO_SUPABASE;
  if (!(await requireAdmin())) return { success: false, error: 'No autorizado.' };

  const { error } = await supabase.from('reservations').delete().eq('id', id);
  if (error) return { success: false, error: error.message };

  revalidatePath('/dashboard/reservas');
  return { success: true };
}
