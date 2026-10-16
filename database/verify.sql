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
    ('announcements'), ('galleries')
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
    ('update_standings_timestamp')
  ) AS tr(name)

  UNION ALL

  -- Buckets de Storage
  SELECT 'bucket', b.name,
         EXISTS (SELECT 1 FROM storage.buckets WHERE id = b.name)
  FROM (VALUES
    ('team-logos'), ('player-photos'), ('tournament-banners')
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
)
SELECT tipo, objeto, CASE WHEN ok THEN 'OK' ELSE 'FALTA' END AS estado
FROM checks
ORDER BY ok, tipo, objeto;
