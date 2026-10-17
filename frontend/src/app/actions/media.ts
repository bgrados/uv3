'use server';

import { createClient } from '@/utils/supabase/server';
import { getCurrentUser } from '@/app/auth/actions';
import type { ActionResponse } from '@/types';

const BUCKETS = ['team-logos', 'player-photos', 'tournament-banners', 'branding', 'business-media', 'gallery-media'] as const;
const ADMIN_ONLY = new Set(['branding', 'business-media', 'gallery-media']);

const NO_SUPABASE = {
  success: false,
  error: 'El sistema no está configurado aún. Contacta al administrador.',
} as const;

/** Sube una imagen a Storage y devuelve su URL pública. */
export async function uploadMediaAction(formData: FormData): Promise<ActionResponse<string>> {
  const supabase = await createClient();
  if (!supabase) return NO_SUPABASE;

  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'No autenticado.' };

  const bucket = String(formData.get('bucket') ?? '');
  if (!(BUCKETS as readonly string[]).includes(bucket)) {
    return { success: false, error: 'Bucket no válido.' };
  }

  if (ADMIN_ONLY.has(bucket)) {
    if (user.role !== 'admin') return { success: false, error: 'Sólo el administrador puede subir aquí.' };
  } else if (!['admin', 'organizer', 'delegate'].includes(user.role)) {
    return { success: false, error: 'No tienes permisos para subir archivos.' };
  }

  const file = formData.get('file') as File | null;
  if (!file || !file.size) return { success: false, error: 'No se proporcionó un archivo.' };
  if (!file.type.startsWith('image/')) return { success: false, error: 'El archivo debe ser una imagen.' };
  if (file.size > 3 * 1024 * 1024) return { success: false, error: 'La imagen supera los 3 MB.' };

  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error } = await supabase.storage.from(bucket).upload(fileName, formData.get('file') as File);
  if (error) return { success: false, error: error.message };

  const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
  return { success: true, data: data.publicUrl };
}
