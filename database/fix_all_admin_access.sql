-- ============================================================================
-- UV3 PLATFORM — REPARACIÓN COMPLETA DE ACCESO ADMIN (script único)
-- ----------------------------------------------------------------------------
-- QUÉ RESUELVE (todo idempotente, no borra datos)
--   1. Login con error 500 "Database error querying schema": repara las
--      cuentas demo en auth.users / auth.identities (fix_demo_users.sql).
--   2. Panel en blanco / error 400 en Torneos y Partidos: añade la columna
--      `tournaments.sport` que falta (migration_sport.sql).
--   3. Subida de escudos/fotos/banner no disponible: crea los 3 buckets de
--      Storage y sus políticas RLS (storage.sql).
--   4. Tu cuenta personal sin acceso al panel: promueve bgrados@gmail.com a
--      rol `admin` (grant_admin.sql).
--   5. SEGURIDAD: endurece el trigger `handle_new_user` para que el rol
--      SIEMPRE nazca como 'user' y nunca se lea de los metadatos del
--      cliente (evita autoregistro como admin). También evita el 500 al
--      registrar usuarios con username duplicado.
--
-- CÓMO USARLO
--   Supabase > SQL Editor > New query > pegar TODO este archivo > Run.
--   Esperar "Success". Después verificar con database/verify.sql y, desde
--   frontend/, `npm run check:db` y `node scripts/smoke-auth.mjs`.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ----------------------------------------------------------------------------
-- 1. COLUMNA tournaments.sport (faltaba en la BD en vivo)
-- ----------------------------------------------------------------------------
ALTER TABLE public.tournaments
  ADD COLUMN IF NOT EXISTS sport TEXT NOT NULL DEFAULT 'futbol'
  CHECK (sport IN ('futbol', 'futbol_sala', 'basquet'));

COMMENT ON COLUMN public.tournaments.sport IS 'Tipo de deporte: futbol, futbol_sala, basquet';

-- ----------------------------------------------------------------------------
-- 2. BUCKETS DE STORAGE + POLÍTICAS RLS
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

-- ----------------------------------------------------------------------------
-- 3. REPARACIÓN DE CUENTAS DEMO (error 500 al iniciar sesión)
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
-- 4. PROMOVER LA CUENTA PROPIA A ADMIN
--    Si tu cuenta quedó como 'user' (o no tiene fila en public.users), aquí
--    se crea/promueve a 'admin' para que puedas entrar al panel /dashboard.
--    >>> CAMBIA EL CORREO SI EL TUYO ES OTRO <<<
-- ----------------------------------------------------------------------------
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, confirmation_token, email_change,
    email_change_token_new, recovery_token)
SELECT gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated',
       'authenticated', 'bgrados@gmail.com', crypt('password123', gen_salt('bf')),
       NOW(), '{"provider":"email","providers":["email"]}', '{}',
       NOW(), NOW(), '', '', '', ''
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'bgrados@gmail.com');

INSERT INTO auth.identities (user_id, identity_data, provider, provider_id,
    last_sign_in_at, created_at, updated_at)
SELECT u.id,
       jsonb_build_object('sub', u.id::text, 'email', u.email,
                          'email_verified', true, 'phone_verified', false),
       'email', u.id::text, NOW(), NOW(), NOW()
FROM auth.users u
WHERE u.email = 'bgrados@gmail.com'
  AND NOT EXISTS (SELECT 1 FROM auth.identities i
                  WHERE i.user_id = u.id AND i.provider = 'email');

INSERT INTO public.users (id, email, full_name, username, role)
SELECT u.id, u.email, COALESCE(u.raw_user_meta_data->>'full_name', 'bgrados'),
       'bgrados', 'admin'
FROM auth.users u
WHERE u.email = 'bgrados@gmail.com'
ON CONFLICT (id) DO UPDATE SET role = 'admin';

-- ----------------------------------------------------------------------------
-- 5. TRIGGER handle_new_user ENDURECIDO (rol siempre 'user', sin 500 por
--    username duplicado). Ver comentario detallado en database/schema.sql.
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- 6. VERIFICACIÓN (debe mostrar confirmed = true, identities >= 1 y rol)
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
    'vecino@uv3.com',
    'bgrados@gmail.com'
  )
ORDER BY u.email;
