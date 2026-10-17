-- ============================================================================
-- UV3 PLATFORM — MIGRACIÓN: “favoritos” para la portada
-- ----------------------------------------------------------------------------
-- Añade la columna `is_featured` a los comercios y a los comunicados. Cuando
-- está en TRUE, el registro se muestra destacado en la portada:
--   • businesses.is_featured    -> carrusel "Comercios y Servicios" de la portada
--   • announcements.is_featured -> noticia destacada / avisos de la portada
--
-- Es idempotente y no borra datos. Ejecutar en el SQL Editor de Supabase.
-- Si no marcas ningún favorito, la portada sigue mostrando todo como hasta ahora.
-- ============================================================================

ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.announcements
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN public.businesses.is_featured IS
  'Comercio destacado en el carrusel de la portada.';
COMMENT ON COLUMN public.announcements.is_featured IS
  'Comunicado destacado en la portada.';
