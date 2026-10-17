'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import { getCurrentUser } from '@/app/auth/actions';
import { gallerySchema } from './schemas';
import type { ActionResponse, Gallery } from '@/types';

const NO_SUPABASE = {
  success: false,
  error: 'El sistema no está configurado aún. Contacta al administrador.',
} as const;

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') return null;
  return user;
}

/** Limpia la URL de una imagen: devuelve null si viene vacía. */
function cleanUrl(value: FormDataEntryValue | null): string | null {
  const url = String(value ?? '').trim();
  return url || null;
}

/** Revalida tanto la galería pública como el panel de administración. */
function revalidateGallery() {
  revalidatePath('/gallery');
  revalidatePath('/dashboard/galeria');
}

/** Lista los álbumes de la galería pública (publicaciones de fotos). */
export async function getGalleriesAction(): Promise<ActionResponse<Gallery[]>> {
  const supabase = await createClient();
  if (!supabase) return NO_SUPABASE;

  const { data, error } = await supabase
    .from('galleries')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return { success: false, error: error.message };
  return { success: true, data: (data ?? []) as Gallery[] };
}

/** Crea una nueva publicación en la galería (álbum) con su foto principal. */
export async function createGalleryAction(formData: FormData): Promise<ActionResponse<Gallery>> {
  const supabase = await createClient();
  if (!supabase) return NO_SUPABASE;
  if (!(await requireAdmin())) return { success: false, error: 'No autorizado.' };

  const parsed = gallerySchema.safeParse({
    title: String(formData.get('title') ?? '').trim(),
    description: String(formData.get('description') ?? '').trim() || null,
    image_url: cleanUrl(formData.get('image_url')),
  });
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const { title, description, image_url } = parsed.data;
  const images = image_url ? [image_url] : [];

  const { data, error } = await supabase
    .from('galleries')
    .insert({
      title,
      description,
      cover_image_url: image_url,
      images,
    })
    .select('id, title, description, cover_image_url, images, created_at, updated_at')
    .single();

  if (error) return { success: false, error: error.message };
  revalidateGallery();
  return { success: true, data: data as unknown as Gallery };
}

/** Actualiza el contenido de una publicación de la galería (título, descripción y foto). */
export async function updateGalleryAction(id: string, formData: FormData): Promise<ActionResponse> {
  const supabase = await createClient();
  if (!supabase) return NO_SUPABASE;
  if (!(await requireAdmin())) return { success: false, error: 'No autorizado.' };

  const parsed = gallerySchema.safeParse({
    title: String(formData.get('title') ?? '').trim(),
    description: String(formData.get('description') ?? '').trim() || null,
    image_url: cleanUrl(formData.get('image_url')),
  });
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const { title, description, image_url } = parsed.data;
  const updates: Record<string, unknown> = { title, description };

  // La foto principal sólo se reemplaza si el usuario cargó una nueva; de lo
  // contrario se conserva el álbum de fotos existente.
  if (image_url) {
    const { data: current } = await supabase.from('galleries').select('images').eq('id', id).single();
    const existing = Array.isArray((current as { images?: string[] } | null)?.images)
      ? (current as { images: string[] }).images.filter(Boolean)
      : [];
    const merged = Array.from(new Set([image_url, ...existing.filter((url) => url !== image_url)]));
    updates.cover_image_url = image_url;
    updates.images = merged;
  }

  const { error } = await supabase.from('galleries').update(updates).eq('id', id);
  if (error) return { success: false, error: error.message };
  revalidateGallery();
  return { success: true };
}

/** Elimina una publicación de la galería. */
export async function deleteGalleryAction(id: string): Promise<ActionResponse> {
  const supabase = await createClient();
  if (!supabase) return NO_SUPABASE;
  if (!(await requireAdmin())) return { success: false, error: 'No autorizado.' };

  const { error } = await supabase.from('galleries').delete().eq('id', id);
  if (error) return { success: false, error: error.message };
  revalidateGallery();
  return { success: true };
}

/** Agrega una nueva foto (URL) a una publicación de la galería existente. */
export async function addGalleryImageAction(formData: FormData): Promise<ActionResponse> {
  const supabase = await createClient();
  if (!supabase) return NO_SUPABASE;
  if (!(await requireAdmin())) return { success: false, error: 'No autorizado.' };

  const id = String(formData.get('id') ?? '');
  const imageUrl = cleanUrl(formData.get('image_url'));
  if (!id || !imageUrl) return { success: false, error: 'Selecciona una publicación y una foto.' };

  const { data: gallery } = await supabase.from('galleries').select('images').eq('id', id).single();
  const current = Array.isArray((gallery as { images?: string[] } | null)?.images)
    ? (gallery as { images: string[] }).images
    : [];
  const merged = Array.from(new Set([...current.filter(Boolean), imageUrl]));

  const { error } = await supabase
    .from('galleries')
    .update({ images: merged, cover_image_url: merged[0] ?? null })
    .eq('id', id);
  if (error) return { success: false, error: error.message };
  revalidateGallery();
  return { success: true };
}

/** Quita una foto concreta de una publicación de la galería. */
export async function removeGalleryImageAction(formData: FormData): Promise<ActionResponse> {
  const supabase = await createClient();
  if (!supabase) return NO_SUPABASE;
  if (!(await requireAdmin())) return { success: false, error: 'No autorizado.' };

  const id = String(formData.get('id') ?? '');
  const imageUrl = cleanUrl(formData.get('image_url'));
  if (!id || !imageUrl) return { success: false, error: 'No se indicó la foto a eliminar.' };

  const { data: gallery } = await supabase
    .from('galleries')
    .select('images, cover_image_url')
    .eq('id', id)
    .single();
  const current = Array.isArray((gallery as { images?: string[] } | null)?.images)
    ? (gallery as { images: string[] }).images
    : [];
  const merged = current.filter((url) => url && url !== imageUrl);
  const cover = (gallery as { cover_image_url?: string | null } | null)?.cover_image_url ?? null;

  const { error } = await supabase
    .from('galleries')
    .update({
      images: merged,
      cover_image_url: cover && merged.includes(cover) ? cover : merged[0] ?? null,
    })
    .eq('id', id);
  if (error) return { success: false, error: error.message };
  revalidateGallery();
  return { success: true };
}
