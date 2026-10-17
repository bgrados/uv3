-- ============================================================================
-- UV3 PLATFORM — MIGRACIÓN: enlace de video en los comunicados
-- ----------------------------------------------------------------------------
-- Añade la columna `announcements.video_url`, que guarda un enlace EXTERNO de
-- video (YouTube, Facebook, Vimeo o un archivo .mp4 alojado en otro servidor).
-- Así los videos NO ocupan espacio en Supabase Storage.
--
-- Es idempotente y no borra datos. Ejecutar en el SQL Editor de Supabase.
-- ============================================================================

ALTER TABLE public.announcements
  ADD COLUMN IF NOT EXISTS video_url TEXT;

COMMENT ON COLUMN public.announcements.video_url IS
  'Enlace externo de video (YouTube/Facebook/Vimeo/.mp4). No se aloja en Supabase.';
