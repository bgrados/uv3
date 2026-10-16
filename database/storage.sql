-- ============================================================================
-- UV3 PLATFORM — STORAGE (Supabase Storage: buckets + políticas RLS)
-- Ejecutar en el SQL Editor de Supabase DESPUÉS de schema.sql y policies.sql.
-- Es idempotente: se puede volver a ejecutar sin efectos secundarios.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. BUCKETS
--    Públicos para lectura (logos, fotos y banners se muestran en el portal),
--    con límite de tamaño y tipos MIME restringidos a imágenes.
-- ----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('team-logos', 'team-logos', true, 2097152,
   ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']),
  ('player-photos', 'player-photos', true, 2097152,
   ARRAY['image/png', 'image/jpeg', 'image/webp']),
  ('tournament-banners', 'tournament-banners', true, 5242880,
   ARRAY['image/png', 'image/jpeg', 'image/webp'])
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ----------------------------------------------------------------------------
-- 2. POLÍTICAS SOBRE storage.objects
--    - Lectura pública de los 3 buckets usados por el portal.
--    - Escritura (insert/update/delete) sólo para administradores,
--      organizadores y delegados autenticados.
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "UV3 public read of media buckets" ON storage.objects;
CREATE POLICY "UV3 public read of media buckets"
  ON storage.objects FOR SELECT
  USING (bucket_id IN ('team-logos', 'player-photos', 'tournament-banners'));

DROP POLICY IF EXISTS "UV3 staff can upload media" ON storage.objects;
CREATE POLICY "UV3 staff can upload media"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id IN ('team-logos', 'player-photos', 'tournament-banners')
    AND EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.role IN ('admin', 'organizer', 'delegate')
    )
  );

DROP POLICY IF EXISTS "UV3 staff can update media" ON storage.objects;
CREATE POLICY "UV3 staff can update media"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id IN ('team-logos', 'player-photos', 'tournament-banners')
    AND EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.role IN ('admin', 'organizer', 'delegate')
    )
  );

DROP POLICY IF EXISTS "UV3 staff can delete media" ON storage.objects;
CREATE POLICY "UV3 staff can delete media"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id IN ('team-logos', 'player-photos', 'tournament-banners')
    AND EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.role IN ('admin', 'organizer', 'delegate')
    )
  );
