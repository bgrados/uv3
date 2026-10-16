-- UV3 PLATFORM - SQL PENDIENTE (pegar TODO en el SQL Editor de Supabase)
-- Contenido: policies.sql (RLS idempotente) + migration_sport.sql + storage.sql + fix_demo_users.sql

-- ===================== policies.sql =====================
-- UV3 PLATFORM - ROW LEVEL SECURITY (RLS) POLICIES
-- Defines security and access policies for Supabase tables

-- =========================================================================
-- 1. ENABLE ROW LEVEL SECURITY
-- =========================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.standings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sanctions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.galleries ENABLE ROW LEVEL SECURITY;

-- =========================================================================
-- 2. HELPER FUNCTIONS FOR ROLE CHECKING
-- =========================================================================
-- Helper functions allow clean policy definitions and bypass recursive lookup warnings

CREATE OR REPLACE FUNCTION public.get_user_role(p_user_id UUID)
RETURNS TEXT AS $$
    SELECT role FROM public.users WHERE id = p_user_id;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin(p_user_id UUID)
RETURNS BOOLEAN AS $$
    SELECT COALESCE((SELECT role FROM public.users WHERE id = p_user_id) = 'admin', false);
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_organizer(p_user_id UUID)
RETURNS BOOLEAN AS $$
    SELECT COALESCE((SELECT role FROM public.users WHERE id = p_user_id) IN ('admin', 'organizer'), false);
$$ LANGUAGE sql SECURITY DEFINER;

-- =========================================================================
-- 3. POLICIES DEFINITIONS
-- =========================================================================

-- --- USERS TABLE POLICIES ---
DROP POLICY IF EXISTS "Users are readable by anyone" ON public.users;
CREATE POLICY "Users are readable by anyone" ON public.users FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can update their own data" ON public.users;
CREATE POLICY "Users can update their own data" ON public.users FOR UPDATE 
    USING (auth.uid() = id) 
    WITH CHECK (auth.uid() = id AND role = (SELECT role FROM public.users WHERE id = auth.uid())); -- Prevent self-promoting role
DROP POLICY IF EXISTS "Admins can manage all users" ON public.users;
CREATE POLICY "Admins can manage all users" ON public.users FOR ALL 
    USING (public.is_admin(auth.uid()));

-- --- VENUES TABLE POLICIES ---
DROP POLICY IF EXISTS "Venues are readable by anyone" ON public.venues;
CREATE POLICY "Venues are readable by anyone" ON public.venues FOR SELECT USING (true);
DROP POLICY IF EXISTS "Organizers/Admins can manage venues" ON public.venues;
CREATE POLICY "Organizers/Admins can manage venues" ON public.venues FOR ALL 
    USING (public.is_organizer(auth.uid()));

-- --- TEAMS TABLE POLICIES ---
DROP POLICY IF EXISTS "Teams are readable by anyone" ON public.teams;
CREATE POLICY "Teams are readable by anyone" ON public.teams FOR SELECT USING (true);
DROP POLICY IF EXISTS "Organizers/Admins can insert/delete teams" ON public.teams;
CREATE POLICY "Organizers/Admins can insert/delete teams" ON public.teams FOR ALL 
    USING (public.is_organizer(auth.uid()));
DROP POLICY IF EXISTS "Delegates can update their own team" ON public.teams;
CREATE POLICY "Delegates can update their own team" ON public.teams FOR UPDATE 
    USING (auth.uid() = delegate_id)
    WITH CHECK (auth.uid() = delegate_id);

-- --- PLAYERS TABLE POLICIES ---
DROP POLICY IF EXISTS "Players are readable by anyone" ON public.players;
CREATE POLICY "Players are readable by anyone" ON public.players FOR SELECT USING (true);
DROP POLICY IF EXISTS "Organizers/Admins can manage players" ON public.players;
CREATE POLICY "Organizers/Admins can manage players" ON public.players FOR ALL 
    USING (public.is_organizer(auth.uid()));
DROP POLICY IF EXISTS "Delegates can manage players of their own team" ON public.players;
CREATE POLICY "Delegates can manage players of their own team" ON public.players FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM public.teams 
            WHERE id = team_id AND delegate_id = auth.uid()
        )
    );

-- --- TOURNAMENTS TABLE POLICIES ---
DROP POLICY IF EXISTS "Tournaments are readable by anyone" ON public.tournaments;
CREATE POLICY "Tournaments are readable by anyone" ON public.tournaments FOR SELECT USING (true);
DROP POLICY IF EXISTS "Organizers/Admins can manage tournaments" ON public.tournaments;
CREATE POLICY "Organizers/Admins can manage tournaments" ON public.tournaments FOR ALL 
    USING (public.is_organizer(auth.uid()));

-- --- MATCHES TABLE POLICIES ---
DROP POLICY IF EXISTS "Matches are readable by anyone" ON public.matches;
CREATE POLICY "Matches are readable by anyone" ON public.matches FOR SELECT USING (true);
DROP POLICY IF EXISTS "Organizers/Admins can manage matches" ON public.matches;
CREATE POLICY "Organizers/Admins can manage matches" ON public.matches FOR ALL 
    USING (public.is_organizer(auth.uid()));
DROP POLICY IF EXISTS "Assigned referees can update scores/status of their matches" ON public.matches;
CREATE POLICY "Assigned referees can update scores/status of their matches" ON public.matches FOR UPDATE 
    USING (referee_id = auth.uid())
    WITH CHECK (referee_id = auth.uid());

-- --- STANDINGS TABLE POLICIES ---
DROP POLICY IF EXISTS "Standings are readable by anyone" ON public.standings;
CREATE POLICY "Standings are readable by anyone" ON public.standings FOR SELECT USING (true);
-- Standings updates are handled automatically via database triggers which execute with security definer bypass,
-- so application users do not need write access policies unless they are Admins/Organizers performing manual overrides.
DROP POLICY IF EXISTS "Organizers/Admins can manage standings manually" ON public.standings;
CREATE POLICY "Organizers/Admins can manage standings manually" ON public.standings FOR ALL 
    USING (public.is_organizer(auth.uid()));

-- --- GOALS TABLE POLICIES ---
DROP POLICY IF EXISTS "Goals are readable by anyone" ON public.goals;
CREATE POLICY "Goals are readable by anyone" ON public.goals FOR SELECT USING (true);
DROP POLICY IF EXISTS "Organizers/Admins can manage goals" ON public.goals;
CREATE POLICY "Organizers/Admins can manage goals" ON public.goals FOR ALL 
    USING (public.is_organizer(auth.uid()));
DROP POLICY IF EXISTS "Assigned match referees can manage goals" ON public.goals;
CREATE POLICY "Assigned match referees can manage goals" ON public.goals FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM public.matches 
            WHERE id = match_id AND referee_id = auth.uid()
        )
    );

-- --- SANCTIONS TABLE POLICIES ---
DROP POLICY IF EXISTS "Sanctions are readable by anyone" ON public.sanctions;
CREATE POLICY "Sanctions are readable by anyone" ON public.sanctions FOR SELECT USING (true);
DROP POLICY IF EXISTS "Organizers/Admins can manage sanctions" ON public.sanctions;
CREATE POLICY "Organizers/Admins can manage sanctions" ON public.sanctions FOR ALL 
    USING (public.is_organizer(auth.uid()));
DROP POLICY IF EXISTS "Assigned match referees can manage sanctions" ON public.sanctions;
CREATE POLICY "Assigned match referees can manage sanctions" ON public.sanctions FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM public.matches 
            WHERE id = match_id AND referee_id = auth.uid()
        )
    );

-- --- SCHEDULES TABLE POLICIES ---
DROP POLICY IF EXISTS "Schedules are readable by anyone" ON public.schedules;
CREATE POLICY "Schedules are readable by anyone" ON public.schedules FOR SELECT USING (true);
DROP POLICY IF EXISTS "Organizers/Admins can manage schedules" ON public.schedules;
CREATE POLICY "Organizers/Admins can manage schedules" ON public.schedules FOR ALL 
    USING (public.is_organizer(auth.uid()));

-- --- ANNOUNCEMENTS TABLE POLICIES ---
DROP POLICY IF EXISTS "Announcements are readable by anyone" ON public.announcements;
CREATE POLICY "Announcements are readable by anyone" ON public.announcements FOR SELECT USING (true);
DROP POLICY IF EXISTS "Organizers/Admins can manage announcements" ON public.announcements;
CREATE POLICY "Organizers/Admins can manage announcements" ON public.announcements FOR ALL 
    USING (public.is_organizer(auth.uid()));

-- --- GALLERIES TABLE POLICIES ---
DROP POLICY IF EXISTS "Galleries are readable by anyone" ON public.galleries;
CREATE POLICY "Galleries are readable by anyone" ON public.galleries FOR SELECT USING (true);
DROP POLICY IF EXISTS "Organizers/Admins can manage galleries" ON public.galleries;
CREATE POLICY "Organizers/Admins can manage galleries" ON public.galleries FOR ALL 
    USING (public.is_organizer(auth.uid()));


-- ===================== migration_sport.sql =====================
-- UV3 PLATFORM â€” MIGRATION: Add sport column to tournaments
-- Run this in your Supabase SQL Editor

ALTER TABLE public.tournaments
  ADD COLUMN IF NOT EXISTS sport TEXT NOT NULL DEFAULT 'futbol'
    CHECK (sport IN ('futbol', 'futbol_sala', 'basquet'));

-- Update existing tournaments to default 'futbol' (already handled by DEFAULT)
COMMENT ON COLUMN public.tournaments.sport IS 'Tipo de deporte: futbol, futbol_sala, basquet';


-- ===================== storage.sql =====================
-- ============================================================================
-- UV3 PLATFORM â€” STORAGE (Supabase Storage: buckets + polÃ­ticas RLS)
-- Ejecutar en el SQL Editor de Supabase DESPUÃ‰S de schema.sql y policies.sql.
-- Es idempotente: se puede volver a ejecutar sin efectos secundarios.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. BUCKETS
--    PÃºblicos para lectura (logos, fotos y banners se muestran en el portal),
--    con lÃ­mite de tamaÃ±o y tipos MIME restringidos a imÃ¡genes.
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
-- 2. POLÃTICAS SOBRE storage.objects
--    - Lectura pÃºblica de los 3 buckets usados por el portal.
--    - Escritura (insert/update/delete) sÃ³lo para administradores,
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


-- ===================== fix_demo_users.sql =====================
-- ============================================================================
-- UV3 PLATFORM â€” REPARACIÃ“N DE USUARIOS DEMO (Supabase Auth)
-- ----------------------------------------------------------------------------
-- PROBLEMA QUE RESUELVE
--   Las cuentas demo creadas insertando directamente en auth.users (seeds.sql)
--   no pueden iniciar sesiÃ³n: Supabase Auth responde
--   500 "Database error querying schema".
--   Causa: esas filas quedaron con valores NULL en columnas de token y/o sin
--   su fila correspondiente en auth.identities, cosas que Auth necesita al
--   cargar el usuario.
--
-- QUÃ‰ HACE (idempotente, NO borra datos)
--   1. Normaliza las filas de auth.users de las 6 cuentas demo y les fija la
--      contraseÃ±a 'password123'.
--   2. Repara / crea las identidades en auth.identities.
--   3. Se asegura de que existan las filas en public.users con el rol correcto.
--
-- Ejecutar en el SQL Editor de Supabase. Seguro de re-ejecutar.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Lista de correos demo (se repite en cada paso; mantener sincronizada).
-- admin@uv3.com, organizador@uv3.com, delegado1@uv3.com,
-- delegado2@uv3.com, arbitro@uv3.com, vecino@uv3.com

-- ----------------------------------------------------------------------------
-- 1. Normalizar auth.users (contraseÃ±a + tokens + estado)
-- ----------------------------------------------------------------------------
UPDATE auth.users SET
  encrypted_password          = crypt('password123', gen_salt('bf')),
  email_confirmed_at          = COALESCE(email_confirmed_at, now()),
  confirmation_token          = COALESCE(confirmation_token, ''),
  recovery_token              = COALESCE(recovery_token, ''),
  email_change                = COALESCE(email_change, ''),
  email_change_token_new      = COALESCE(email_change_token_new, ''),
  email_change_token_current  = COALESCE(email_change_token_current, ''),
  phone_change                = COALESCE(phone_change, ''),
  phone_change_token          = COALESCE(phone_change_token, ''),
  reauthentication_token      = COALESCE(reauthentication_token, ''),
  email_change_confirm_status = COALESCE(email_change_confirm_status, 0),
  banned_until                = NULL,
  deleted_at                  = NULL,
  aud                         = 'authenticated',
  role                        = 'authenticated',
  updated_at                  = now()
WHERE email IN (
  'admin@uv3.com',
  'organizador@uv3.com',
  'delegado1@uv3.com',
  'delegado2@uv3.com',
  'arbitro@uv3.com',
  'vecino@uv3.com'
);

-- ----------------------------------------------------------------------------
-- 2. Reparar identidades existentes (p. ej. provider_id NULL)
-- ----------------------------------------------------------------------------
UPDATE auth.identities i
SET provider_id   = COALESCE(i.provider_id, i.user_id::text),
    provider      = COALESCE(NULLIF(i.provider, ''), 'email'),
    identity_data = jsonb_build_object(
                      'sub',            i.user_id::text,
                      'email',          u.email,
                      'email_verified', true,
                      'phone_verified', false
                    ),
    updated_at    = now()
FROM auth.users u
WHERE i.user_id = u.id
  AND u.email IN (
    'admin@uv3.com',
    'organizador@uv3.com',
    'delegado1@uv3.com',
    'delegado2@uv3.com',
    'arbitro@uv3.com',
    'vecino@uv3.com'
  );

-- ----------------------------------------------------------------------------
-- 3. Crear identidades que falten
-- ----------------------------------------------------------------------------
INSERT INTO auth.identities
  (user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
SELECT
  u.id,
  jsonb_build_object(
    'sub',            u.id::text,
    'email',          u.email,
    'email_verified', true,
    'phone_verified', false
  ),
  'email',
  u.id::text,
  now(), now(), now()
FROM auth.users u
WHERE u.email IN (
    'admin@uv3.com',
    'organizador@uv3.com',
    'delegado1@uv3.com',
    'delegado2@uv3.com',
    'arbitro@uv3.com',
    'vecino@uv3.com'
  )
  AND NOT EXISTS (
    SELECT 1 FROM auth.identities i
    WHERE i.user_id = u.id AND i.provider = 'email'
  );

-- ----------------------------------------------------------------------------
-- 4. Asegurar perfiles en public.users y sus roles
-- ----------------------------------------------------------------------------
INSERT INTO public.users (id, email, full_name, username, role)
SELECT
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', ''),
  COALESCE(u.raw_user_meta_data->>'username', split_part(u.email, '@', 1)),
  'user'
FROM auth.users u
WHERE u.email IN (
    'admin@uv3.com',
    'organizador@uv3.com',
    'delegado1@uv3.com',
    'delegado2@uv3.com',
    'arbitro@uv3.com',
    'vecino@uv3.com'
  )
ON CONFLICT (id) DO NOTHING;

UPDATE public.users SET role = 'admin'     WHERE email = 'admin@uv3.com';
UPDATE public.users SET role = 'organizer' WHERE email = 'organizador@uv3.com';
UPDATE public.users SET role = 'delegate'  WHERE email IN ('delegado1@uv3.com', 'delegado2@uv3.com');
UPDATE public.users SET role = 'referee'   WHERE email = 'arbitro@uv3.com';
UPDATE public.users SET role = 'user'      WHERE email = 'vecino@uv3.com';

-- ----------------------------------------------------------------------------
-- 5. VerificaciÃ³n (debe mostrar confirmed = true, identities = 1 y el rol)
-- ----------------------------------------------------------------------------
SELECT
  u.email,
  (u.email_confirmed_at IS NOT NULL)                              AS confirmed,
  (SELECT count(*) FROM auth.identities i WHERE i.user_id = u.id) AS identities,
  p.role
FROM auth.users u
LEFT JOIN public.users p ON p.id = u.id
WHERE u.email IN (
    'admin@uv3.com',
    'organizador@uv3.com',
    'delegado1@uv3.com',
    'delegado2@uv3.com',
    'arbitro@uv3.com',
    'vecino@uv3.com'
  )
ORDER BY u.email;


-- ===================== trigger endurecido (schema.sql) =====================
-- El rol del perfil NUNCA se lee de los metadatos del cliente (evita que
-- alguien se autoregistre como admin) y los usernames duplicados ya no
-- rompen el registro. Requiere haber ejecutado schema.sql al menos una vez.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    BEGIN
        INSERT INTO public.users (id, email, full_name, username, role)
        VALUES (
            new.id,
            new.email,
            COALESCE(new.raw_user_meta_data->>'full_name', ''),
            COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
            'user'
        );
    EXCEPTION WHEN unique_violation THEN
        INSERT INTO public.users (id, email, full_name, username, role)
        VALUES (new.id, new.email, '', new.email, 'user')
        ON CONFLICT (id) DO NOTHING;
    END;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Si tu cuenta personal quedó con rol 'user', ejecuta además grant_admin.sql
-- (o directamente database/fix_all_admin_access.sql, que hace todo junto).

