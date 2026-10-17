-- ============================================================================
-- UV3 PLATFORM - APLICAR CAMBIOS DE PORTADA Y AVISOS (BD existente)
-- ----------------------------------------------------------------------------
-- Pega TODO este archivo en Supabase > SQL Editor > New query > Run.
--
-- Reune, en orden, los cambios idempotentes que necesitan las bases de datos
-- que YA existen (NO incluye datos de ejemplo y NO borra nada):
--   1) anuncios: columna video_url (enlaces externos de video)
--   2) portada:  columna is_featured en comercios y comunidados ("favoritos")
--   3) avisos:   tabla notices + seguridad (RLS) + contenido inicial
--
-- Es seguro volver a ejecutarlo. Alternativa: ejecutar por separado
-- migration_announcement_video.sql, migration_featured.sql y feature_notices.sql.
-- ============================================================================
-- ============================================================================
-- 1) Video externo en comunicados
-- ============================================================================

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


-- ============================================================================
-- 2) Favoritos de portada (comercios y comunicados)
-- ============================================================================

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


-- ============================================================================
-- 3) Avisos y utilidad (tabla notices + RLS + contenido)
-- ============================================================================

-- ============================================================================
-- UV3 PLATFORM — AVISOS Y UTILIDAD (sección editable de la portada)
-- ----------------------------------------------------------------------------
-- Crea la tabla `notices` (avisos/comunicados de utilidad). Se pueden tener
-- muchos avisos y marcar cuáles se muestran en la portada con `is_featured`.
--
-- Es idempotente y no borra datos. Puede ejecutarse suelto en el SQL Editor.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.notices (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title       TEXT NOT NULL,
    content     TEXT,
    icon        TEXT DEFAULT '📌',
    link_url    TEXT,
    link_label  TEXT,
    is_featured BOOLEAN NOT NULL DEFAULT FALSE, -- “Favorito”: se muestra en la portada.
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notices_active_order
    ON public.notices(is_active, is_featured, sort_order);

DROP TRIGGER IF EXISTS update_notices_timestamp ON public.notices;
CREATE TRIGGER update_notices_timestamp
    BEFORE UPDATE ON public.notices
    FOR EACH ROW EXECUTE FUNCTION public.handle_update_timestamp();

-- ----------------------------------------------------------------------------
-- Seguridad (RLS): lectura pública de los avisos activos; sólo el admin edita.
-- ----------------------------------------------------------------------------
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notices lectura publica" ON public.notices;
CREATE POLICY "notices lectura publica" ON public.notices FOR SELECT
    USING (is_active OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "notices admin" ON public.notices;
CREATE POLICY "notices admin" ON public.notices FOR ALL TO authenticated
    USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- ----------------------------------------------------------------------------
-- Contenido inicial (sólo si la tabla está vacía). Reemplaza los bloques que
-- antes estaban fijos en la portada. Se editan desde el panel.
-- ----------------------------------------------------------------------------
INSERT INTO public.notices (title, content, icon, is_featured, sort_order)
SELECT * FROM (VALUES
  (
    'Horarios de Canchas y Reserva',
    E'Lunes a Viernes: 4:00 PM a 10:00 PM (prioridad para escuelas vecinales).\nSábados y Domingos: 8:00 AM a 9:00 PM (campeonato y alquiler general).\n\nReservas: coordinar con el delegado de deportes presentando DNI con dirección en la UV3.',
    '🕒', TRUE, 1
  ),
  (
    'Junta de Administración',
    E'Asociación encargada de la infraestructura, seguridad, parques, canchas y salones multiusos.\n\n📍 Local Comunal UV3, cerca de la UNMSM, Cercado de Lima.\n✉️ Contacto oficial mediante la página de Facebook.',
    '🏛️', TRUE, 2
  ),
  (
    'Vecino, cuida tu barrio',
    'La Unidad Vecinal Nº3 es patrimonio urbanístico. Reporta incidencias de mantenimiento y seguridad a la Junta General.',
    '🤝', TRUE, 3
  )
) AS v(title, content, icon, is_featured, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.notices);

-- Comprobación rápida.
SELECT 'notices' AS tabla, count(*) AS filas FROM public.notices;


