-- ============================================================================
-- UV3 PLATFORM — DIRECTORIO DE LA UNIDAD (servicios del barrio)
-- Ejecutar en el SQL Editor de Supabase DESPUÉS de schema.sql y policies.sql.
-- Es idempotente: se puede volver a ejecutar sin efectos secundarios ni
-- pérdida de datos.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. SERVICIOS DE LA UNIDAD
--    Iglesia, club deportivo, club de jubilados, posta de salud, comisaría,
--    mercado y similares. Distintos de "businesses" (comercios).
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.community_services (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL,
    category    TEXT NOT NULL DEFAULT 'otro'
                CHECK (category IN (
                    'salud', 'seguridad', 'religioso', 'social',
                    'deporte', 'abasto', 'educacion', 'municipal', 'otro'
                )),
    icon        TEXT,
    description TEXT,
    address     TEXT,
    phone       TEXT,
    whatsapp    TEXT,
    hours       TEXT,
    image_url   TEXT,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 2. ÍNDICES
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_community_services_active_order
    ON public.community_services(is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_community_services_category
    ON public.community_services(category);

-- ----------------------------------------------------------------------------
-- 3. TRIGGER DE updated_at
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS update_community_services_timestamp ON public.community_services;
CREATE TRIGGER update_community_services_timestamp
    BEFORE UPDATE ON public.community_services
    FOR EACH ROW EXECUTE FUNCTION public.handle_update_timestamp();

-- ----------------------------------------------------------------------------
-- 4. RLS — lectura pública; gestión del administrador.
-- ----------------------------------------------------------------------------
ALTER TABLE public.community_services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "community_services lectura publica" ON public.community_services;
CREATE POLICY "community_services lectura publica" ON public.community_services
    FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "community_services admin" ON public.community_services;
CREATE POLICY "community_services admin" ON public.community_services
    FOR ALL TO authenticated
    USING (public.is_admin(auth.uid()))
    WITH CHECK (public.is_admin(auth.uid()));

-- ----------------------------------------------------------------------------
-- 5. VERIFICACIÓN
-- ----------------------------------------------------------------------------
SELECT policyname, cmd, roles
FROM pg_policies
WHERE tablename = 'community_services'
ORDER BY policyname;
-- ============================================================================
