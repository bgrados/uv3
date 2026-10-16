-- ============================================================================
-- UV3 PLATFORM — REPARACIÓN DE USUARIOS DEMO (Supabase Auth)
-- ----------------------------------------------------------------------------
-- PROBLEMA QUE RESUELVE
--   Las cuentas demo creadas insertando directamente en auth.users (seeds.sql)
--   no pueden iniciar sesión: Supabase Auth responde
--   500 "Database error querying schema".
--   Causa: esas filas quedaron con valores NULL en columnas de token y/o sin
--   su fila correspondiente en auth.identities, cosas que Auth necesita al
--   cargar el usuario.
--
-- QUÉ HACE (idempotente, NO borra datos)
--   1. Normaliza las filas de auth.users de las 6 cuentas demo y les fija la
--      contraseña 'password123'.
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
-- 1. Normalizar auth.users (contraseña + tokens + estado)
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
-- 5. Verificación (debe mostrar confirmed = true, identities = 1 y el rol)
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
