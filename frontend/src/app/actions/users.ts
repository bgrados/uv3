'use server';

import { revalidatePath } from 'next/cache';
import { createClient, createAdminClient } from '@/utils/supabase/server';
import { getCurrentUser } from '@/app/auth/actions';
import { ASSIGNABLE_ROLES } from './schemas';
import type { ActionResponse, User, UserRole } from '@/types';

const NO_SUPABASE = {
  success: false,
  error: 'El sistema no está configurado aún. Contacta al administrador.',
} as const;

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') return null;
  return user;
}

/** Lista los usuarios registrados (sólo administradores). */
export async function getAllUsersAction(search?: string): Promise<ActionResponse<User[]>> {
  const supabase = await createClient();
  if (!supabase) return NO_SUPABASE;
  if (!(await requireAdmin())) return { success: false, error: 'No autorizado.' };

  let query = supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });

  const term = (search ?? '').trim();
  if (term) {
    const safe = term.replace(/[%,]/g, ' ');
    query = query.or(`full_name.ilike.%${safe}%,email.ilike.%${safe}%,username.ilike.%${safe}%`);
  }

  const { data, error } = await query;
  if (error) return { success: false, error: error.message };
  return { success: true, data: (data ?? []) as User[] };
}

/**
 * Cambia el rol de un usuario. Sólo administradores, y nunca se permite cambiar
 * el propio rol (para evitar quedarse sin acceso al panel por error).
 */
export async function updateUserRoleAction(userId: string, role: string): Promise<ActionResponse> {
  const supabase = await createClient();
  if (!supabase) return NO_SUPABASE;

  const admin = await requireAdmin();
  if (!admin) return { success: false, error: 'No autorizado.' };

  if (!userId) return { success: false, error: 'Usuario inválido.' };
  if (admin.id === userId) {
    return { success: false, error: 'No puedes cambiar tu propio rol.' };
  }
  if (!ASSIGNABLE_ROLES.includes(role as UserRole)) {
    return { success: false, error: 'Rol no válido.' };
  }

  const { error } = await supabase.from('users').update({ role }).eq('id', userId);
  if (error) return { success: false, error: error.message };

  revalidatePath('/dashboard/usuarios');
  revalidatePath('/dashboard/teams');
  return { success: true };
}

/** Crea un nuevo delegado (cuenta + rol) desde el panel. */
export async function createDelegateAction(formData: FormData): Promise<ActionResponse> {
  const admin = await requireAdmin();
  if (!admin) return { success: false, error: 'No autorizado.' };

  const adminClient = createAdminClient();
  if (!adminClient) return { success: false, error: 'Falta la service role key para crear usuarios.' };

  const fullName = String(formData.get('full_name') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');
  const teamId = String(formData.get('team_id') ?? '').trim();

  if (!fullName || !email || !password) {
    return { success: false, error: 'Nombre, email y contraseña son requeridos.' };
  }
  if (password.length < 6) {
    return { success: false, error: 'La contraseña debe tener al menos 6 caracteres.' };
  }

  const adminAuth = adminClient.auth as unknown as { admin: { createUser: (opts: Record<string, unknown>) => Promise<{ data: { user: { id: string } | null }; error: { message: string } | null }> } };
  const { data: authData, error: authError } = await adminAuth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, username: email.split('@')[0] },
  });
  if (authError || !authData?.user) {
    return { success: false, error: authError?.message ?? 'No se pudo crear la cuenta.' };
  }

  const userId = authData.user.id;
  const { error: profileError } = await adminClient
    .from('users')
    .update({ full_name: fullName, role: 'delegate', username: email.split('@')[0] })
    .eq('id', userId);
  if (profileError) {
    return { success: false, error: profileError.message };
  }

  if (teamId) {
    await adminClient.from('teams').update({ delegate_id: userId }).eq('id', teamId);
  }

  revalidatePath('/dashboard/delegados');
  revalidatePath('/dashboard/teams');
  revalidatePath('/dashboard/usuarios');
  return { success: true };
}

/** Crea un nuevo árbitro (cuenta + rol) desde el panel. */
export async function createRefereeAction(formData: FormData): Promise<ActionResponse> {
  const admin = await requireAdmin();
  if (!admin) return { success: false, error: 'No autorizado.' };

  const adminClient = createAdminClient();
  if (!adminClient) return { success: false, error: 'Falta la service role key para crear usuarios.' };

  const fullName = String(formData.get('full_name') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');

  if (!fullName || !email || !password) {
    return { success: false, error: 'Nombre, email y contraseña son requeridos.' };
  }
  if (password.length < 6) {
    return { success: false, error: 'La contraseña debe tener al menos 6 caracteres.' };
  }

  const adminAuth = adminClient.auth as unknown as { admin: { createUser: (opts: Record<string, unknown>) => Promise<{ data: { user: { id: string } | null }; error: { message: string } | null }> } };
  const { data: authData, error: authError } = await adminAuth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, username: email.split('@')[0] },
  });
  if (authError || !authData?.user) {
    return { success: false, error: authError?.message ?? 'No se pudo crear la cuenta.' };
  }

  const userId = authData.user.id;
  const { error: profileError } = await adminClient
    .from('users')
    .update({ full_name: fullName, role: 'referee', username: email.split('@')[0] })
    .eq('id', userId);
  if (profileError) {
    return { success: false, error: profileError.message };
  }

  revalidatePath('/dashboard/arbitros');
  revalidatePath('/dashboard/usuarios');
  return { success: true };
}
