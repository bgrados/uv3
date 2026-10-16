-- ============================================================================
-- UV3 PLATFORM — RESERVAS DE CANCHAS, COMERCIOS Y CONFIGURACIÓN DEL SITIO
-- ----------------------------------------------------------------------------
-- Script ÚNICO e IDEMPOTENTE. Pégalo completo en el SQL Editor de Supabase.
--
-- Incluye:
--   1. Espacios (canchas/losas) con tarifas día/noche y deportes admitidos.
--   2. Bloqueos de espacios (mantenimiento, eventos de la junta, feriados).
--   3. Reservas públicas con anti-solapamiento garantizado en la BD.
--   4. Comercios de la Unidad (para el carrusel de la portada).
--   5. Configuración del sitio (logo, favicon, Yape, WhatsApp).
--   6. Storage: branding, business-media y comprobantes de pago (Yape).
--   7. RLS y datos de ejemplo editables desde el panel.
--
-- El precio se calcula SIEMPRE en el servidor a partir de las tarifas del
-- espacio; nunca se confía en el precio enviado por el navegador.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- ----------------------------------------------------------------------------
-- Funciones base compartidas (se crean si no existen, para poder ejecutar
-- este script en una base nueva o ya existente sin errores).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.is_admin(p_uid UUID)
RETURNS BOOLEAN AS $$
    SELECT COALESCE(
        (SELECT u.role = 'admin' FROM public.users u WHERE u.id = p_uid),
        FALSE
    );
$$ LANGUAGE sql SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- 0. ZONA HORARIA DE TRABAJO
--    La Unidad Vecinal 3 opera en America/Lima (UTC-5, sin horario de verano).
-- ----------------------------------------------------------------------------
-- (Se usa explícitamente en las funciones; no se cambia el timezone global.)

-- ============================================================================
-- 1. ESPACIOS (canchas y losas físicas)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.spaces (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name             TEXT NOT NULL UNIQUE,
    slug             TEXT UNIQUE,
    description      TEXT,
    image_url        TEXT,
    day_rate         NUMERIC(10,2) NOT NULL DEFAULT 0,   -- S/ por hora de día
    night_rate       NUMERIC(10,2) NOT NULL DEFAULT 0,   -- S/ por hora de noche
    event_day_rate   NUMERIC(10,2),                      -- S/ por hora (evento, día)
    event_night_rate NUMERIC(10,2),                      -- S/ por hora (evento, noche)
    night_start      TIME NOT NULL DEFAULT '18:00',
    night_end        TIME NOT NULL DEFAULT '06:00',
    allows_events    BOOLEAN NOT NULL DEFAULT TRUE,
    is_active        BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order       INTEGER NOT NULL DEFAULT 0,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Deportes que admite cada espacio (una losa puede servir para varios).
CREATE TABLE IF NOT EXISTS public.space_sports (
    space_id UUID NOT NULL REFERENCES public.spaces(id) ON DELETE CASCADE,
    sport    TEXT NOT NULL CHECK (sport IN ('futbol','futbol_sala','basquet','voley','otro')),
    PRIMARY KEY (space_id, sport)
);

-- Bloqueos: mantenimiento, feriados o uso interno de la junta.
CREATE TABLE IF NOT EXISTS public.space_blocks (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    space_id   UUID NOT NULL REFERENCES public.spaces(id) ON DELETE CASCADE,
    start_at   TIMESTAMPTZ NOT NULL,
    end_at     TIMESTAMPTZ NOT NULL,
    reason     TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT space_blocks_range CHECK (end_at > start_at)
);

-- Evita que dos bloqueos del mismo espacio se solapen.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'space_blocks_no_overlap') THEN
        ALTER TABLE public.space_blocks
            ADD CONSTRAINT space_blocks_no_overlap
            EXCLUDE USING gist (
                space_id WITH =,
                tstzrange(start_at, end_at, '[)') WITH &&
            );
    END IF;
END $$;

-- ============================================================================
-- 2. RESERVAS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.reservations (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code               TEXT NOT NULL UNIQUE
                       DEFAULT ('UV3-' || upper(substr(md5(random()::text), 1, 6))),
    space_id           UUID NOT NULL REFERENCES public.spaces(id) ON DELETE RESTRICT,
    user_id            UUID REFERENCES public.users(id) ON DELETE SET NULL,
    customer_name      TEXT NOT NULL,
    customer_phone     TEXT NOT NULL,
    customer_email     TEXT,
    usage_type         TEXT NOT NULL DEFAULT 'deporte' CHECK (usage_type IN ('deporte','evento')),
    sport              TEXT CHECK (sport IN ('futbol','futbol_sala','basquet','voley','otro')),
    event_description  TEXT,
    start_at           TIMESTAMPTZ NOT NULL,
    end_at             TIMESTAMPTZ NOT NULL,
    status             TEXT NOT NULL DEFAULT 'confirmed'
                       CHECK (status IN ('confirmed','cancelled','completed','no_show')),
    price              NUMERIC(10,2) NOT NULL DEFAULT 0,   -- snapshot del cálculo
    notes              TEXT,
    payment_status     TEXT NOT NULL DEFAULT 'submitted'
                       CHECK (payment_status IN ('submitted','verified','rejected')),
    payment_method     TEXT NOT NULL DEFAULT 'yape',
    payment_proof_url  TEXT,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT reservations_range CHECK (end_at > start_at)
);

-- ANTI-SOLAPAMIENTO: dos reservas confirmadas del mismo espacio no pueden
-- cruzarse. Es la garantía real de que "si hay espacio, se confirma solo".
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reservations_no_overlap') THEN
        ALTER TABLE public.reservations
            ADD CONSTRAINT reservations_no_overlap
            EXCLUDE USING gist (
                space_id WITH =,
                tstzrange(start_at, end_at, '[)') WITH &&
            ) WHERE (status = 'confirmed');
    END IF;
END $$;

-- Índices de consulta.
CREATE INDEX IF NOT EXISTS idx_reservations_space_start ON public.reservations(space_id, start_at);
CREATE INDEX IF NOT EXISTS idx_reservations_status        ON public.reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_code          ON public.reservations(code);
CREATE INDEX IF NOT EXISTS idx_reservations_phone         ON public.reservations(customer_phone);
CREATE INDEX IF NOT EXISTS idx_space_sports_space         ON public.space_sports(space_id);
CREATE INDEX IF NOT EXISTS idx_space_blocks_space         ON public.space_blocks(space_id, start_at);

-- Trigger de updated_at reutilizando la función existente del schema.
DROP TRIGGER IF EXISTS update_spaces_timestamp ON public.spaces;
CREATE TRIGGER update_spaces_timestamp BEFORE UPDATE ON public.spaces
    FOR EACH ROW EXECUTE FUNCTION public.handle_update_timestamp();

DROP TRIGGER IF EXISTS update_space_blocks_timestamp ON public.space_blocks;
CREATE TRIGGER update_space_blocks_timestamp BEFORE UPDATE ON public.space_blocks
    FOR EACH ROW EXECUTE FUNCTION public.handle_update_timestamp();

DROP TRIGGER IF EXISTS update_reservations_timestamp ON public.reservations;
CREATE TRIGGER update_reservations_timestamp BEFORE UPDATE ON public.reservations
    FOR EACH ROW EXECUTE FUNCTION public.handle_update_timestamp();

-- ---------------------------------------------------------------------------
-- 2.1 Función helper: ¿el espacio está bloqueado en ese rango?
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_space_block()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'confirmed' AND EXISTS (
        SELECT 1 FROM public.space_blocks b
        WHERE b.space_id = NEW.space_id
          AND tstzrange(b.start_at, b.end_at, '[)') && tstzrange(NEW.start_at, NEW.end_at, '[)')
    ) THEN
        RAISE EXCEPTION 'El espacio está bloqueado en ese horario'
            USING ERRCODE = '23514';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS reservations_check_block ON public.reservations;
CREATE TRIGGER reservations_check_block
    BEFORE INSERT OR UPDATE ON public.reservations
    FOR EACH ROW EXECUTE FUNCTION public.check_space_block();

-- ---------------------------------------------------------------------------
-- 2.2 Ocupación del día para el formulario público (sin exponer datos
--      personales). Se puede llamar con la clave anónima.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_space_day(p_space_id UUID, p_date DATE)
RETURNS TABLE (start_at TIMESTAMPTZ, end_at TIMESTAMPTZ, kind TEXT)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
    WITH bounds AS (
        SELECT (p_date::timestamp AT TIME ZONE 'America/Lima')                       AS day_start,
               ((p_date + 1)::timestamp AT TIME ZONE 'America/Lima')                 AS day_end
    )
    SELECT r.start_at, r.end_at, 'reserva'::text
    FROM public.reservations r, bounds b
    WHERE r.space_id = p_space_id
      AND r.status IN ('confirmed', 'completed')
      AND r.end_at   > b.day_start
      AND r.start_at < b.day_end
    UNION ALL
    SELECT bl.start_at, bl.end_at, COALESCE(bl.reason, 'Bloqueado')::text
    FROM public.space_blocks bl, bounds b
    WHERE bl.space_id = p_space_id
      AND bl.end_at   > b.day_start
      AND bl.start_at < b.day_end
    ORDER BY 1;
$$;

REVOKE ALL ON FUNCTION public.get_space_day(UUID, DATE) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_space_day(UUID, DATE) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2.3 Consultar / cancelar una reserva con el código + teléfono.
--     Así funciona sin registro de usuario.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_reservation(p_code TEXT, p_phone TEXT)
RETURNS TABLE (
    code TEXT, customer_name TEXT, phone TEXT, space_name TEXT,
    start_at TIMESTAMPTZ, end_at TIMESTAMPTZ, usage_type TEXT,
    sport TEXT, status TEXT, price NUMERIC, payment_status TEXT,
    payment_proof_url TEXT
)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
    SELECT r.code, r.customer_name, r.customer_phone, s.name,
           r.start_at, r.end_at, r.usage_type, r.sport, r.status, r.price,
           r.payment_status, r.payment_proof_url
    FROM public.reservations r
    JOIN public.spaces s ON s.id = r.space_id
    WHERE upper(r.code) = upper(p_code)
      AND regexp_replace(r.customer_phone, '\D', '', 'g') =
          regexp_replace(p_phone, '\D', '', 'g')
    LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_reservation(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_reservation(TEXT, TEXT) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.cancel_reservation(p_code TEXT, p_phone TEXT)
RETURNS TEXT
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_status TEXT;
BEGIN
    SELECT r.status INTO v_status
    FROM public.reservations r
    WHERE upper(r.code) = upper(p_code)
      AND regexp_replace(r.customer_phone, '\D', '', 'g') =
          regexp_replace(p_phone, '\D', '', 'g')
    LIMIT 1;

    IF v_status IS NULL THEN
        RETURN 'no_encontrada';
    END IF;
    IF v_status <> 'confirmed' THEN
        RETURN v_status;
    END IF;

    UPDATE public.reservations r
       SET status = 'cancelled'
     WHERE upper(r.code) = upper(p_code)
       AND regexp_replace(r.customer_phone, '\D', '', 'g') =
           regexp_replace(p_phone, '\D', '', 'g');

    RETURN 'cancelada';
END;
$$;

REVOKE ALL ON FUNCTION public.cancel_reservation(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cancel_reservation(TEXT, TEXT) TO anon, authenticated;

-- ============================================================================
-- 3. COMERCIOS DE LA UNIDAD (carrusel de la portada)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.businesses (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL,
    category    TEXT NOT NULL DEFAULT 'otro'
                CHECK (category IN ('tienda','farmacia','mercado','restaurante','servicio','otro')),
    description TEXT,
    phone       TEXT,
    whatsapp    TEXT,
    address     TEXT,
    logo_url    TEXT,
    image_url   TEXT,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_businesses_active_order ON public.businesses(is_active, sort_order);

DROP TRIGGER IF EXISTS update_businesses_timestamp ON public.businesses;
CREATE TRIGGER update_businesses_timestamp
    BEFORE UPDATE ON public.businesses
    FOR EACH ROW EXECUTE FUNCTION public.handle_update_timestamp();

-- ============================================================================
-- 4. CONFIGURACIÓN DEL SITIO (logo, favicon, Yape, WhatsApp)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.site_settings (
    id            INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    site_name     TEXT NOT NULL DEFAULT 'Unidad Vecinal 3',
    slogan        TEXT,
    logo_url      TEXT,
    favicon_url   TEXT,
    contact_phone TEXT,
    whatsapp      TEXT,
    yape_number   TEXT,
    yape_holder   TEXT,
    facebook_url  TEXT,
    night_start   TIME NOT NULL DEFAULT '18:00',
    night_end     TIME NOT NULL DEFAULT '06:00',
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS update_site_settings_timestamp ON public.site_settings;
CREATE TRIGGER update_site_settings_timestamp
    BEFORE UPDATE ON public.site_settings
    FOR EACH ROW EXECUTE FUNCTION public.handle_update_timestamp();

-- ============================================================================
-- 5. RLS
-- ============================================================================
ALTER TABLE public.spaces        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.space_sports  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.space_blocks  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses    ENABLE ROW LEVEL SECURITY;

-- --- espacios: lectura pública, gestión sólo admin -------------------------
DROP POLICY IF EXISTS "spaces lectura publica" ON public.spaces;
CREATE POLICY "spaces lectura publica" ON public.spaces FOR SELECT USING (TRUE);
DROP POLICY IF EXISTS "spaces admin" ON public.spaces;
CREATE POLICY "spaces admin" ON public.spaces FOR ALL TO authenticated
    USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "space_sports lectura publica" ON public.space_sports;
CREATE POLICY "space_sports lectura publica" ON public.space_sports FOR SELECT USING (TRUE);
DROP POLICY IF EXISTS "space_sports admin" ON public.space_sports;
CREATE POLICY "space_sports admin" ON public.space_sports FOR ALL TO authenticated
    USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "space_blocks lectura publica" ON public.space_blocks;
CREATE POLICY "space_blocks lectura publica" ON public.space_blocks FOR SELECT USING (TRUE);
DROP POLICY IF EXISTS "space_blocks admin" ON public.space_blocks;
CREATE POLICY "space_blocks admin" ON public.space_blocks FOR ALL TO authenticated
    USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- --- reservas --------------------------------------------------------------
-- Lectura: la ocupación se obtiene vía get_space_day(); los datos completos
-- sólo los ve el panel de administración.
DROP POLICY IF EXISTS "reservations admin" ON public.reservations;
CREATE POLICY "reservations admin" ON public.reservations FOR ALL TO authenticated
    USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- Inserción pública (portal sin registro) con validaciones estrictas.
DROP POLICY IF EXISTS "reservations alta publica" ON public.reservations;
CREATE POLICY "reservations alta publica" ON public.reservations FOR INSERT TO anon, authenticated
WITH CHECK (
    status = 'confirmed'
    AND payment_proof_url IS NOT NULL
    AND length(btrim(customer_name)) >= 3
    AND length(regexp_replace(customer_phone, '\D', '', 'g')) >= 6
    AND (usage_type = 'evento' OR sport IS NOT NULL)
);

-- --- comercios -------------------------------------------------------------
DROP POLICY IF EXISTS "businesses lectura publica" ON public.businesses;
CREATE POLICY "businesses lectura publica" ON public.businesses FOR SELECT
    USING (is_active OR public.is_admin(auth.uid()));
DROP POLICY IF EXISTS "businesses admin" ON public.businesses;
CREATE POLICY "businesses admin" ON public.businesses FOR ALL TO authenticated
    USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- --- configuración del sitio ----------------------------------------------
DROP POLICY IF EXISTS "site_settings lectura publica" ON public.site_settings;
CREATE POLICY "site_settings lectura publica" ON public.site_settings FOR SELECT USING (TRUE);
DROP POLICY IF EXISTS "site_settings admin" ON public.site_settings;
CREATE POLICY "site_settings admin" ON public.site_settings FOR ALL TO authenticated
    USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- ============================================================================
-- 6. STORAGE (Supabase Storage: buckets y políticas)
-- ============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('branding', 'branding', true, 2097152,
   ARRAY['image/png','image/jpeg','image/webp','image/svg+xml','image/x-icon','image/vnd.microsoft.icon']),
  ('business-media', 'business-media', true, 3145728,
   ARRAY['image/png','image/jpeg','image/webp']),
  ('payment-proofs', 'payment-proofs', false, 3145728,
   ARRAY['image/png','image/jpeg','image/webp'])
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Lectura pública de branding y business-media.
DROP POLICY IF EXISTS "UV3 public read branding" ON storage.objects;
CREATE POLICY "UV3 public read branding"
  ON storage.objects FOR SELECT
  USING (bucket_id IN ('branding','business-media'));

-- Subida de comprobantes por el público (portal sin registro).
DROP POLICY IF EXISTS "UV3 public upload payment proofs" ON storage.objects;
CREATE POLICY "UV3 public upload payment proofs"
  ON storage.objects FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'payment-proofs');

-- Personal (admin) puede subir/actualizar/borrar branding y business-media,
-- y ver/borrar los comprobantes de pago.
DROP POLICY IF EXISTS "UV3 admin write media new" ON storage.objects;
CREATE POLICY "UV3 admin write media new"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id IN ('branding','business-media','payment-proofs','team-logos','player-photos','tournament-banners')
    AND EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

DROP POLICY IF EXISTS "UV3 admin select proofs" ON storage.objects;
CREATE POLICY "UV3 admin select proofs"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'payment-proofs'
    AND EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

DROP POLICY IF EXISTS "UV3 admin delete media new" ON storage.objects;
CREATE POLICY "UV3 admin delete media new"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id IN ('branding','business-media','payment-proofs')
    AND EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

-- ============================================================================
-- 7. DATOS DE EJEMPLO (100 % editables desde el panel)
-- ============================================================================
INSERT INTO public.spaces (name, slug, description, day_rate, night_rate, event_day_rate, event_night_rate, sort_order)
VALUES
  ('Cancha de Fútbol', 'cancha-futbol', 'Cancha de grass sintético para fútbol 7/11.', 60, 80, 80, 100, 1),
  ('Losa de Fúlbito', 'losa-fulbito', 'Losa multiuso: fúlbito, básquet o vóley según lo que se monte.', 40, 55, 60, 75, 2),
  ('Losa de Básquet', 'losa-basquet', 'Losa con aros de básquet; también admite vóley y eventos.', 35, 50, 55, 70, 3)
ON CONFLICT (name) DO NOTHING;

-- Deportes por espacio.
INSERT INTO public.space_sports (space_id, sport)
SELECT s.id, x.sport
FROM public.spaces s
JOIN (VALUES
  ('Cancha de Fútbol','futbol'),
  ('Losa de Fúlbito','futbol_sala'),
  ('Losa de Fúlbito','basquet'),
  ('Losa de Fúlbito','voley'),
  ('Losa de Básquet','basquet'),
  ('Losa de Básquet','voley'),
  ('Losa de Básquet','futbol_sala')
) AS x(sp_name, sport) ON x.sp_name = s.name
ON CONFLICT DO NOTHING;

-- Comercios (imágenes temporales; se reemplazan desde el panel).
INSERT INTO public.businesses (name, category, description, phone, address, image_url, sort_order)
SELECT * FROM (VALUES
  ('Bodega Doña Rosa','tienda','Abarrotes, bebidas y artículos de primera necesidad.', '999 111 222','Pabellón A - Tienda 1','https://picsum.photos/seed/uv3-tienda/800/600',1),
  ('Farmacia San Martín','farmacia','Medicamentos, cuidado personal y atención al vecino.', '999 222 333','Pabellón A - Tienda 2','https://picsum.photos/seed/uv3-farmacia/800/600',2),
  ('Puesto de Mercado Central','mercado','Frutas, verduras y productos frescos de la feria.', '999 333 444','Plaza central','https://picsum.photos/seed/uv3-mercado/800/600',3),
  ('Pollería El Vecino','restaurante','Pollo a la brasa y platos de menú del día.', '999 444 555','Pabellón B - Local 4','https://picsum.photos/seed/uv3-polleria/800/600',4),
  ('Panadería Los Aromas','restaurante','Pan fresco, pasteles y desayunos.', '999 555 666','Pabellón B - Local 5','https://picsum.photos/seed/uv3-panaderia/800/600',5),
  ('Peluquería Estilo','servicio','Corte, peinados y arreglo personal.', '999 666 777','Pabellón C - Local 1','https://picsum.photos/seed/uv3-peluqueria/800/600',6),
  ('Bazar y Librería Escolar','tienda','Útiles escolares, útiles y regalos.', '999 777 888','Pabellón C - Local 2','https://picsum.photos/seed/uv3-bazar/800/600',7),
  ('Taller Ferretero UV3','servicio','Ferretería, pintura y herramientas.', '999 888 999','Ingreso principal','https://picsum.photos/seed/uv3-ferreteria/800/600',8)
) AS v(name,category,description,phone,address,image_url,sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.businesses);

-- Configuración inicial del sitio (una sola fila).
INSERT INTO public.site_settings (
    id, site_name, slogan, contact_phone, whatsapp, yape_number, yape_holder
) VALUES (
    1, 'Unidad Vecinal 3', 'El corazón digital de la comunidad',
    '999 000 000', '51999000000', '999 000 000', 'Junta Directiva UV3'
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 8. VERIFICACIÓN
-- ============================================================================
SELECT 'spaces' AS tabla, count(*) AS filas FROM public.spaces
UNION ALL SELECT 'space_sports', count(*) FROM public.space_sports
UNION ALL SELECT 'space_blocks', count(*) FROM public.space_blocks
UNION ALL SELECT 'reservations', count(*) FROM public.reservations
UNION ALL SELECT 'businesses', count(*) FROM public.businesses
UNION ALL SELECT 'site_settings', count(*) FROM public.site_settings
UNION ALL SELECT 'bucket branding', count(*) FROM storage.buckets WHERE id = 'branding'
UNION ALL SELECT 'bucket business-media', count(*) FROM storage.buckets WHERE id = 'business-media'
UNION ALL SELECT 'bucket payment-proofs', count(*) FROM storage.buckets WHERE id = 'payment-proofs';
