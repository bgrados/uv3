-- ============================================================================
-- UV3 PLATFORM — VERIFICACIÓN DEL ESQUEMA
-- Pegar en el SQL Editor de Supabase y ejecutar. Devuelve una fila por cada
-- comprobación indicando si el objeto existe (OK) o falta (FALTA).
-- No modifica nada.
-- ============================================================================

WITH checks AS (
  -- Tablas esperadas
  SELECT 'tabla' AS tipo, t.name AS objeto,
         EXISTS (
           SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = t.name
         ) AS ok
  FROM (VALUES
    ('users'), ('venues'), ('teams'), ('players'), ('tournaments'),
    ('matches'), ('standings'), ('goals'), ('sanctions'), ('schedules'),
    ('announcements'), ('galleries'),
    -- feature_reservas.sql
    ('spaces'), ('space_sports'), ('space_blocks'), ('reservations'),
    ('businesses'), ('site_settings')
  ) AS t(name)

  UNION ALL

  -- Triggers de automatización
  SELECT 'trigger', tr.name,
         EXISTS (
           SELECT 1 FROM pg_trigger WHERE tgname = tr.name AND NOT tgisinternal
         )
  FROM (VALUES
    ('on_auth_user_created'),
    ('trigger_recalculate_standings'),
    ('update_matches_timestamp'),
    ('update_standings_timestamp'),
    -- feature_reservas.sql
    ('update_spaces_timestamp'),
    ('update_reservations_timestamp'),
    ('update_businesses_timestamp'),
    ('update_site_settings_timestamp')
  ) AS tr(name)

  UNION ALL

  -- Buckets de Storage
  SELECT 'bucket', b.name,
         EXISTS (SELECT 1 FROM storage.buckets WHERE id = b.name)
  FROM (VALUES
    ('team-logos'), ('player-photos'), ('tournament-banners'),
    -- feature_reservas.sql
    ('branding'), ('business-media'), ('payment-proofs'), ('gallery-media')
  ) AS b(name)

  UNION ALL

  -- Columnas clave que el frontend usa (ej. tournaments.sport)
  SELECT 'columna', 'tournaments.sport',
         EXISTS (
           SELECT 1 FROM information_schema.columns
           WHERE table_schema = 'public' AND table_name = 'tournaments' AND column_name = 'sport'
         )

  UNION ALL

  SELECT 'columna', 'galleries.images',
         EXISTS (
           SELECT 1 FROM information_schema.columns
           WHERE table_schema = 'public' AND table_name = 'galleries' AND column_name = 'images'
         )

  UNION ALL

  SELECT 'columna', 'announcements.video_url',
         EXISTS (
           SELECT 1 FROM information_schema.columns
           WHERE table_schema = 'public' AND table_name = 'announcements' AND column_name = 'video_url'
         )

  UNION ALL

  SELECT 'columna', 'announcements.is_featured',
         EXISTS (
           SELECT 1 FROM information_schema.columns
           WHERE table_schema = 'public' AND table_name = 'announcements' AND column_name = 'is_featured'
         )

  UNION ALL

  SELECT 'columna', 'businesses.is_featured',
         EXISTS (
           SELECT 1 FROM information_schema.columns
           WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'is_featured'
         )
)
SELECT tipo, objeto, CASE WHEN ok THEN 'OK' ELSE 'FALTA' END AS estado
FROM checks
ORDER BY ok, tipo, objeto;
