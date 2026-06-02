'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import type { ActionResponse } from '@/types';

export async function loginAction(formData: FormData): Promise<ActionResponse> {
  const supabase = await createClient();
  if (!supabase) {
    return { success: false, error: 'El sistema no esta configurado aun. Contacta al administrador.' };
  }

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { success: false, error: 'Email y contrasena son requeridos.' };
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { success: false, error: 'Credenciales incorrectas. Intente nuevamente.' };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'No se pudo validar el acceso.' };
  }

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();

  if (!profile || profile.role !== 'admin') {
    await supabase.auth.signOut();
    return { success: false, error: 'Este acceso es solo para administradores.' };
  }

  revalidatePath('/', 'layout');
  redirect('/dashboard');
}

export async function signupAction(formData: FormData): Promise<ActionResponse> {
  const supabase = await createClient();
  if (!supabase) {
    return { success: false, error: 'El sistema no esta configurado aun. Contacta al administrador.' };
  }

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
  const supabase = await createClient();
  if (supabase) {
    await supabase.auth.signOut();
  }
  revalidatePath('/', 'layout');
  redirect('/login');
}

export async function forgotPasswordAction(formData: FormData): Promise<ActionResponse> {
  const supabase = await createClient();
  if (!supabase) {
    return { success: false, error: 'El sistema no esta configurado aun. Contacta al administrador.' };
  }

  const email = formData.get('email') as string;

  if (!email) {
    return { success: false, error: 'El correo electronico es requerido.' };
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function resetPasswordAction(formData: FormData): Promise<ActionResponse> {
  const supabase = await createClient();
  if (!supabase) {
    return { success: false, error: 'El sistema no esta configurado aun. Contacta al administrador.' };
  }

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

export async function getCurrentUser() {
  const supabase = await createClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  return profile;
}
