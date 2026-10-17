'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import { getCurrentUser } from '@/app/auth/actions';
import type { ActionResponse, User, UserRole } from '@/types';

const NO_SUPABASE = {
  success: false,
  error: 'El sistema no está configurado aún. Contacta al administrador.',
} as const;

/** Roles asignables desde el panel (todos los definidos en el CHECK de users). */
export const ASSIGNABLE_ROLES: UserRole[] = ['user', 'delegate', 'referee', 'organizer', 'admin'];

export const ROLE_OPTION_LABEL: Record<UserRole, string> = {
  user: 'Vecino',
  delegate: 'Delegado',
  referee: 'Árbitro',
  organizer: 'Organizador',
  admin: 'Administrador',
};

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
