-- UV3 PLATFORM - DATABASE SEEDS
-- Datos de demostración para probar la plataforma. Es idempotente: se puede
-- volver a ejecutar (borra y vuelve a crear los datos demo).
--
-- ¡ATENCIÓN! Este script BORRA los datos de las tablas públicas y las cuentas
-- demo. No ejecutarlo sobre una base con datos reales que quieras conservar.
--
-- Cuentas demo creadas (contraseña: password123)
--   admin@uv3.com         -> admin
--   organizador@uv3.com   -> organizer
--   delegado1@uv3.com     -> delegate
--   delegado2@uv3.com     -> delegate
--   arbitro@uv3.com       -> referee
--   vecino@uv3.com        -> user (sin acceso al panel)
--
-- Nota: las cuentas se insertan directamente en auth.users y también en
-- auth.identities. Las columnas de token se fijan a '' (cadena vacía) a
-- propósito: si quedan NULL, Supabase Auth falla con
-- "Database error querying schema" al iniciar sesión.

-- =========================================================================
-- 0. LIMPIEZA
-- =========================================================================
TRUNCATE TABLE public.sanctions CASCADE;
TRUNCATE TABLE public.goals CASCADE;
TRUNCATE TABLE public.standings CASCADE;
TRUNCATE TABLE public.matches CASCADE;
TRUNCATE TABLE public.schedules CASCADE;
TRUNCATE TABLE public.tournaments CASCADE;
TRUNCATE TABLE public.players CASCADE;
TRUNCATE TABLE public.teams CASCADE;
TRUNCATE TABLE public.venues CASCADE;
TRUNCATE TABLE public.announcements CASCADE;
TRUNCATE TABLE public.galleries CASCADE;

-- Borra las cuentas demo de auth.users (cascade elimina auth.identities y public.users)
DELETE FROM auth.users WHERE id IN (
    'a1111111-1111-4111-8111-111111111111', -- admin@uv3.com
    'b2222222-2222-4222-8222-222222222222', -- organizador@uv3.com
    'c3333333-3333-4333-8333-333333333333', -- delegado1@uv3.com
    'd4444444-4444-4444-8444-444444444444', -- delegado2@uv3.com
    'e5555555-5555-4555-8555-555555555555', -- arbitro@uv3.com
    'f6666666-6666-4666-8666-666666666666'  -- vecino@uv3.com
);

-- =========================================================================
-- 1. USUARIOS DEMO (auth.users + auth.identities + public.users)
-- =========================================================================

INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
)
VALUES
    ('a1111111-1111-4111-8111-111111111111', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin@uv3.com',       crypt('password123', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Admin UV3","username":"admin_uv3"}',                 NOW(), NOW(), '', '', '', ''),
    ('b2222222-2222-4222-8222-222222222222', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'organizador@uv3.com', crypt('password123', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Organizador Ligas","username":"organizador_ligas"}', NOW(), NOW(), '', '', '', ''),
    ('c3333333-3333-4333-8333-333333333333', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'delegado1@uv3.com',   crypt('password123', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Juan Perez - Real UV3","username":"juan_real_uv3"}', NOW(), NOW(), '', '', '', ''),
    ('d4444444-4444-4444-8444-444444444444', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'delegado2@uv3.com',   crypt('password123', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Carlos Gomez - Deportivo Block 5","username":"carlos_block5"}', NOW(), NOW(), '', '', '', ''),
    ('e5555555-5555-4555-8555-555555555555', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'arbitro@uv3.com',     crypt('password123', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Hector Baldassi - Arbitro","username":"hector_referee"}', NOW(), NOW(), '', '', '', ''),
    ('f6666666-6666-4666-8666-666666666666', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'vecino@uv3.com',      crypt('password123', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Luis Sanchez","username":"luis_vecino"}',          NOW(), NOW(), '', '', '', '');

-- Identidades de Auth (imprescindible para poder iniciar sesión)
INSERT INTO auth.identities
    (user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
SELECT
    u.id,
    jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true, 'phone_verified', false),
    'email',
    u.id::text,
    NOW(), NOW(), NOW()
FROM auth.users u
WHERE u.id IN (
    'a1111111-1111-4111-8111-111111111111',
    'b2222222-2222-4222-8222-222222222222',
    'c3333333-3333-4333-8333-333333333333',
    'd4444444-4444-4444-8444-444444444444',
    'e5555555-5555-4555-8555-555555555555',
    'f6666666-6666-4666-8666-666666666666'
);

-- El trigger public.handle_new_user crea las filas de public.users con rol 'user'.
-- Ajustamos los roles a los previstos.
UPDATE public.users SET role = 'admin'     WHERE id = 'a1111111-1111-4111-8111-111111111111';
UPDATE public.users SET role = 'organizer' WHERE id = 'b2222222-2222-4222-8222-222222222222';
UPDATE public.users SET role = 'delegate'  WHERE id IN ('c3333333-3333-4333-8333-333333333333', 'd4444444-4444-4444-8444-444444444444');
UPDATE public.users SET role = 'referee'   WHERE id = 'e5555555-5555-4555-8555-555555555555';

-- =========================================================================
-- 2. CANCHAS (venues)
-- =========================================================================
INSERT INTO public.venues (id, name, location, description)
VALUES
    ('10000000-0000-4000-8000-000000000001', 'Losa Deportiva Sector A', 'Frente al Block 12', 'Losa de concreto pintada, con iluminación nocturna led.'),
    ('10000000-0000-4000-8000-000000000002', 'Cancha Sintetica Principal', 'Costado del Parque Central', 'Cancha de grass sintético de fútbol 7 con tribunas.');

-- =========================================================================
-- 3. EQUIPOS (teams)
-- =========================================================================
INSERT INTO public.teams (id, name, logo_url, delegate_id)
VALUES
    ('20000000-0000-4000-8000-000000000001', 'Real Unidad Vecinal 3', 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=150', 'c3333333-3333-4333-8333-333333333333'),
    ('20000000-0000-4000-8000-000000000002', 'Deportivo Block 5 FC', 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=150', 'd4444444-4444-4444-8444-444444444444');

-- =========================================================================
-- 4. JUGADORES (players)
-- =========================================================================
INSERT INTO public.players (id, team_id, first_name, last_name, dni, birth_date, jersey_number, position, photo_url)
VALUES
    -- Real UV3
    ('30000000-0000-4000-8000-000000000101', '20000000-0000-4000-8000-000000000001', 'Mateo', 'Pérez', '71234567', '1995-04-12', 10, 'delantero', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150'),
    ('30000000-0000-4000-8000-000000000102', '20000000-0000-4000-8000-000000000001', 'Alejandro', 'Guerrero', '72345678', '1993-08-25', 9, 'mediocampista', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'),
    ('30000000-0000-4000-8000-000000000103', '20000000-0000-4000-8000-000000000001', 'Daniel', 'Salas', '73456789', '1998-02-03', 1, 'arquero', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150'),
    -- Deportivo Block 5
    ('30000000-0000-4000-8000-000000000201', '20000000-0000-4000-8000-000000000002', 'Julio', 'Gómez', '74567890', '1996-12-05', 7, 'delantero', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150'),
    ('30000000-0000-4000-8000-000000000202', '20000000-0000-4000-8000-000000000002', 'Renzo', 'Díaz', '75678901', '1994-01-20', 11, 'defensa', 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150'),
    ('30000000-0000-4000-8000-000000000203', '20000000-0000-4000-8000-000000000002', 'Franco', 'Mendoza', '76789012', '1997-07-15', 22, 'defensa', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150');

-- =========================================================================
-- 5. TORNEO (tournaments)
--    La columna sport ya forma parte de schema.sql (default 'futbol').
--    Si tu base es anterior, ejecuta antes migration_sport.sql.
-- =========================================================================
INSERT INTO public.tournaments (id, name, description, status, format, sport, category, banner_url, start_date, end_date)
VALUES
    ('40000000-0000-4000-8000-000000000001', 'Campeonato Apertura UV3 2026', 'Primer campeonato del año de fútbol 7 comunitario de la Unidad Vecinal 3.', 'active', 'liga', 'futbol', 'libre', 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800', '2026-05-10', '2026-08-30');

-- =========================================================================
-- 6. PARTIDOS (matches)
-- =========================================================================
INSERT INTO public.matches (id, tournament_id, home_team_id, away_team_id, venue_id, date_time, referee_id, status, home_score, away_score, round)
VALUES
    -- Partido 1: finalizado
    ('50000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', NOW() - INTERVAL '7 days', 'e5555555-5555-4555-8555-555555555555', 'completed', 3, 2, 1),
    -- Partido 2: programado
    ('50000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000002', NOW() + INTERVAL '2 days', 'e5555555-5555-4555-8555-555555555555', 'scheduled', 0, 0, 2);

-- Nota: insertar el partido finalizado dispara el trigger
-- 'recalculate_tournament_standings', que calcula la tabla de posiciones.

-- =========================================================================
-- 7. GOLES (goals)
-- =========================================================================
INSERT INTO public.goals (match_id, player_id, team_id, minute, type)
VALUES
    -- Partido 1 (Real UV3 3 - 2 Deportivo Block 5)
    ('50000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000101', '20000000-0000-4000-8000-000000000001', 12, 'regular'),
    ('50000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000101', '20000000-0000-4000-8000-000000000001', 45, 'penalty'),
    ('50000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000102', '20000000-0000-4000-8000-000000000001', 52, 'regular'),
    ('50000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000201', '20000000-0000-4000-8000-000000000002', 20, 'regular'),
    ('50000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000202', '20000000-0000-4000-8000-000000000002', 58, 'regular');

-- =========================================================================
-- 8. SANCIONES (sanctions)
-- =========================================================================
INSERT INTO public.sanctions (match_id, player_id, card_type, reason, duration_matches)
VALUES
    ('50000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000203', 'yellow', 'Falta temeraria en mitad de cancha', 0),
    ('50000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000102', 'yellow', 'Reclamo airado al árbitro', 0);

-- =========================================================================
-- 9. COMUNICADOS (announcements)
-- =========================================================================
INSERT INTO public.announcements (title, content, author_id, category, image_url, is_featured)
VALUES
    ('Gran Convocatoria al Campeonato Apertura 2026', 'Se convoca a todos los delegados de los bloques de la UV3 a la reunión informativa este viernes a las 8:00 PM en el local comunal para definir las bases y sorteo del fixture.', 'b2222222-2222-4222-8222-222222222222', 'deportes', 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1200', TRUE),
    ('Mantenimiento Programado de Cancha Principal', 'Vecinos, les informamos que la Cancha Sintetica Principal estará cerrada por mantenimiento de césped e iluminación desde el lunes 1 de junio hasta el miércoles 3 de junio. Agradecemos su comprensión.', 'a1111111-1111-4111-8111-111111111111', 'comunicado', 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=1200', TRUE);

-- =========================================================================
-- 10. GALERÍA (galleries)
-- =========================================================================
INSERT INTO public.galleries (title, description, cover_image_url, images)
VALUES
    ('Inauguración Campeonato 2026', 'Imágenes de la inauguración del torneo y el desfile de inauguración de los equipos vecinales.', 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800', ARRAY[
        'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=600',
        'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=600',
        'https://images.unsplash.com/photo-1540747737956-37872404a82f?w=600'
    ]);
