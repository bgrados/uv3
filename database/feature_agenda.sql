-- ============================================================================
-- UV3 PLATFORM — AGENDA DE LA COMUNIDAD (eventos y actividades)
-- Ejecutar en el SQL Editor de Supabase DESPUÉS de schema.sql y policies.sql.
-- Es idempotente: se puede volver a ejecutar sin efectos secundarios ni
-- pérdida de datos.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. EVENTOS DE LA COMUNIDAD
--    Asambleas, campañas de salud, actividades deportivas, ferias, etc.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.community_events (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title       TEXT NOT NULL,
    description TEXT,
    event_date  DATE NOT NULL,
    start_time  TEXT,
    end_time    TEXT,
    location    TEXT,
    category    TEXT NOT NULL DEFAULT 'otro'
                CHECK (category IN (
                    'asamblea', 'deporte', 'salud', 'social',
                    'religioso', 'mantenimiento', 'otro'
                )),
    image_url   TEXT,
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 2. ÍNDICES
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_community_events_date
    ON public.community_events(event_date);
CREATE INDEX IF NOT EXISTS idx_community_events_active_date
    ON public.community_events(is_active, event_date);

-- ----------------------------------------------------------------------------
-- 3. TRIGGER DE updated_at
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS update_community_events_timestamp ON public.community_events;
CREATE TRIGGER update_community_events_timestamp
    BEFORE UPDATE ON public.community_events
    FOR EACH ROW EXECUTE FUNCTION public.handle_update_timestamp();

-- ----------------------------------------------------------------------------
-- 4. RLS — lectura pública; gestión del administrador.
-- ----------------------------------------------------------------------------
ALTER TABLE public.community_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "community_events lectura publica" ON public.community_events;
CREATE POLICY "community_events lectura publica" ON public.community_events
    FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "community_events admin" ON public.community_events;
CREATE POLICY "community_events admin" ON public.community_events
    FOR ALL TO authenticated
    USING (public.is_admin(auth.uid()))
    WITH CHECK (public.is_admin(auth.uid()));

-- ----------------------------------------------------------------------------
-- 5. VERIFICACIÓN
-- ----------------------------------------------------------------------------
SELECT policyname, cmd, roles
FROM pg_policies
WHERE tablename = 'community_events'
ORDER BY policyname;
-- ============================================================================
