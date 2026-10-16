'use server';

import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { isSupabaseConfigured } from '@/utils/supabase/config';
import type { ActionResponse, User, UserRole } from '@/types';
import { isStaffRole } from '@/utils/roles';

export async function loginAction(formData: FormData): Promise<ActionResponse> {
  const email = (formData.get('email') as string)?.trim().toLowerCase();
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { success: false, error: 'Email y contraseña son requeridos.' };
  }

  if (!isSupabaseConfigured()) {
    return {
      success: false,
      error:
        'El sistema aún no está configurado: faltan las claves de Supabase. Contacta al administrador.',
    };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data?.user) {
    return { success: false, error: 'Credenciales incorrectas. Verifique el correo y la contraseña.' };
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', data.user.id)
    .single();

  if (!profile || !isStaffRole(profile.role as UserRole)) {
    // La cuenta es válida pero no puede administrar la plataforma.
    await supabase.auth.signOut();
    return {
      success: false,
      error:
        'Tu cuenta no tiene permisos para el panel administrativo (se requiere rol de administrador, organizador o árbitro).',
    };
  }

  revalidatePath('/', 'layout');

  // Sólo se permiten rutas internas del panel para evitar open redirects.
  const rawRedirect = (formData.get('redirectTo') as string | null) ?? '';
  const redirectTo = rawRedirect.startsWith('/dashboard') ? rawRedirect : '/dashboard';

  redirect(redirectTo);
}

export async function signupAction(formData: FormData): Promise<ActionResponse> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'El sistema no esta configurado aun. Contacta al administrador.' };
  }

  const supabase = await createClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const fullName = formData.get('full_name') as string;
  const username = formData.get('username') as string;

  if (!email || !password || !fullName || !username) {
    return { success: false, error: 'Todos los campos son requeridos.' };
  }

  if (password.length < 6) {
    return { success: false, error: 'La contrasena debe tener al menos 6 caracteres.' };
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        username,
      },
    },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/', 'layout');
  redirect('/login?message=Revisa tu correo para confirmar tu cuenta.');
}

export async function signoutAction(): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch {
    // Si Supabase no responde, igual cerramos la sesión local y volvemos al login.
  }
  revalidatePath('/', 'layout');
  redirect('/login');
}

export async function forgotPasswordAction(formData: FormData): Promise<ActionResponse> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'El sistema no esta configurado aun. Contacta al administrador.' };
  }

  const supabase = await createClient();

  const email = formData.get('email') as string;

  if (!email) {
    return { success: false, error: 'El correo electronico es requerido.' };
  }

  const headerList = await headers();
  const forwardedProto = headerList.get('x-forwarded-proto') ?? 'http';
  const host = headerList.get('host') ?? 'localhost:3000';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || `${forwardedProto}://${host}`;

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/reset-password`,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function resetPasswordAction(formData: FormData): Promise<ActionResponse> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'El sistema no esta configurado aun. Contacta al administrador.' };
  }

  const supabase = await createClient();

  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirm_password') as string;

  if (!password || !confirmPassword) {
    return { success: false, error: 'Ambos campos son requeridos.' };
  }

  if (password !== confirmPassword) {
    return { success: false, error: 'Las contrasenas no coinciden.' };
  }

  if (password.length < 6) {
    return { success: false, error: 'La contrasena debe tener al menos 6 caracteres.' };
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/', 'layout');
  redirect('/login?message=Contrasena actualizada exitosamente.');
}

export async function getCurrentUser(): Promise<User | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profile) return profile as User;

    // La cuenta existe en Auth pero aún no tiene perfil en public.users
    // (el trigger `handle_new_user` normalmente lo crea). Se devuelve un perfil
    // mínimo sin privilegios administrativos.
    const metadata = (user.user_metadata ?? {}) as Record<string, string | undefined>;
    const now = new Date().toISOString();

    return {
      id: user.id,
      email: user.email ?? '',
      full_name: metadata.full_name ?? null,
      username: metadata.username ?? null,
      role: 'user',
      created_at: now,
      updated_at: now,
    };
  } catch {
    // Supabase no configurado o error de red: sin sesión válida.
    return null;
  }
}
