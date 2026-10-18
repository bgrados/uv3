-- ==========================================================================
-- ARCHIVO: database\feature_servicios_comunidad.sql
-- ==========================================================================

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

-- ==========================================================================
-- ARCHIVO: database\feature_agenda.sql
-- ==========================================================================

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

-- ==========================================================================
-- ARCHIVO: database\seed_servicios_comunidad.sql
-- ==========================================================================

-- ============================================================================
-- UV3 PLATFORM — SEED DIRECTORIO DE LA UNIDAD (idempotente, NO borra datos)
-- Ejecutar en Supabase SQL Editor después de feature_servicios_comunidad.sql.
-- Solo inserta si no existe por nombre.
-- ============================================================================

INSERT INTO public.community_services (name, category, icon, description, address, phone, hours, sort_order, is_active)
SELECT * FROM (VALUES
  ('Iglesia Nuestra Señora de la Unidad', 'religioso', '⛪',
   'Parroquia del barrio. Misas diarias y catequesis para niños y jóvenes.',
   'Frente al parque central', '999000101',
   'Misas: L-S 07:00 y 18:00 h · Dom 08:00, 11:00 y 18:00 h', 1, true),

  ('Club Deportivo Unidad Vecinal 3', 'deporte', '⚽',
   'Escuela de fútbol, básquet y vóley para niños y adultos. Liga vecinal permanente.',
   'Losa deportiva central', '999000102',
   'Entrenamientos: L-V 16:00 a 20:00 h · Sáb 09:00 a 13:00 h', 2, true),

  ('Club de Jubilados UV3', 'social', '👴',
   'Actividades recreativas, talleres de manualidades y almuerzos de confraternidad.',
   'Local comunal, segundo piso', '999000103',
   'Reuniones: Martes y jueves 15:00 a 18:00 h', 3, true),

  ('Puesto de Salud UV3', 'salud', '🏥',
   'Atención de medicina general, enfermería, vacunación y control de niño sano.',
   'Block 8, primer piso', '999000104',
   'Atención: L-S 08:00 a 14:00 h', 4, true),

  ('Comisaría del Sector', 'seguridad', '👮',
   'Policía Nacional del Perú. Denuncias, patrullaje y seguridad ciudadana.',
   'Av. Principal, esquina con Jr. Los Álamos', '999000105',
   'Atención: 24 horas', 5, true),

  ('Mercado de la Unidad', 'abasto', '🛒',
   'Puestos de abarrotes, verduras, carnes y frutas. Recojo de pedidos y delivery vecinal.',
   'Pasaje del Mercado, Block 1', '999000106',
   'Atención: L-D 06:00 a 20:00 h', 6, true)
) AS v(name, category, icon, description, address, phone, hours, sort_order, is_active)
WHERE NOT EXISTS (SELECT 1 FROM public.community_services s WHERE s.name = v.name);

-- ============================================================================
-- FIN
-- ============================================================================

-- ==========================================================================
-- ARCHIVO: database\seed_agenda_comunidad.sql
-- ==========================================================================

-- ============================================================================
-- UV3 PLATFORM — SEED AGENDA DE LA COMUNIDAD (idempotente, NO borra datos)
-- Ejecutar en Supabase SQL Editor después de feature_agenda.sql.
-- Solo inserta si no existe por título. Las fechas se calculan desde hoy.
-- ============================================================================

INSERT INTO public.community_events (title, description, event_date, start_time, end_time, location, category, is_featured, sort_order)
SELECT * FROM (VALUES
  ('Asamblea general ordinaria de propietarios',
   'La Junta General convoca a todos los propietarios y delegados de bloque. Agenda: presupuesto anual, seguridad ciudadana y avance de la digitalización vecinal.',
   CURRENT_DATE + 2, '20:00', '22:00', 'Local comunal', 'asamblea', true, 1),

  ('Misa dominical comunitaria',
   'Celebración eucarística de la comunidad. Actividad abierta a todas las familias de la unidad vecinal.',
   CURRENT_DATE + 3, '11:00', '12:00', 'Iglesia Nuestra Señora de la Unidad', 'religioso', false, 2),

  ('Partido inaugural — Campeonato Apertura 2026',
   'Arranca la nueva temporada de la liga vecinal. Presentación de equipos y banda de música.',
   CURRENT_DATE + 4, '15:00', '18:00', 'Cancha sintética principal', 'deporte', true, 3),

  ('Campaña de vacunación gratuita',
   'Influenza y tétanos para todas las edades. Organizada junto al Puesto de Salud UV3. Llevar DNI.',
   CURRENT_DATE + 5, '09:00', '13:00', 'Losa deportiva del Sector A', 'salud', false, 4),

  ('Taller de reciclaje para niños',
   'Actividad educativa sobre el cuidado del ambiente y separación de residuos. Incluye materiales.',
   CURRENT_DATE + 6, '10:00', '12:00', 'Local comunal', 'social', false, 5),

  ('Feria de emprendimientos vecinales',
   'Comercios y emprendedores de la unidad ofrecen sus productos. Música en vivo y zona gastronómica.',
   CURRENT_DATE + 7, '11:00', '19:00', 'Parque central', 'social', true, 6),

  ('Mantenimiento de áreas verdes (bloques 4 y 5)',
   'Trabajos de poda, siembra y recuperación de jardines. Se solicita no pisar las áreas en recuperación.',
   CURRENT_DATE + 9, '08:00', '14:00', 'Bloques 4 y 5', 'mantenimiento', false, 7),

  ('Reunión de delegados de bloque',
   'Coordinación mensual de delegados: incidencias, reservas de espacios y organización de campeonatos.',
   CURRENT_DATE + 11, '19:00', '20:30', 'Oficina vecinal', 'asamblea', false, 8)
) AS v(title, description, event_date, start_time, end_time, location, category, is_featured, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.community_events e WHERE e.title = v.title);

-- ============================================================================
-- FIN
-- ============================================================================

