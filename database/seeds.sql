-- UV3 PLATFORM - DATABASE SEEDS
-- Idempotent script for seeding mock data for testing

-- Clear existing data (in reverse order of dependencies)
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

-- Clear mock users from auth.users (cascade will delete from public.users)
DELETE FROM auth.users WHERE id IN (
    'a1111111-1111-1111-1111-111111111111',
    'o2222222-2222-2222-2222-222222222222',
    'd3333333-3333-3333-3333-333333333333',
    'd4444444-4444-4444-4444-444444444444',
    'r5555555-5555-5555-5555-555555555555',
    'u6666666-6666-6666-6666-666666666666'
);

-- =========================================================================
-- 1. SEED MOCK USERS (Auth and Public Sync)
-- =========================================================================

-- Insert into auth.users (passwords are set to encrypted 'password123')
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud, confirmation_token)
VALUES
    ('a1111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'admin@uv3.com', crypt('password123', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Admin UV3","username":"admin_uv3"}', NOW(), NOW(), 'authenticated', 'authenticated', ''),
    ('o2222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', 'organizador@uv3.com', crypt('password123', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Organizador Ligas","username":"organizador_ligas"}', NOW(), NOW(), 'authenticated', 'authenticated', ''),
    ('d3333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000000', 'delegado1@uv3.com', crypt('password123', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Juan Pérez - Real UV3","username":"juan_real_uv3"}', NOW(), NOW(), 'authenticated', 'authenticated', ''),
    ('d4444444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000000', 'delegado2@uv3.com', crypt('password123', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Carlos Gómez - Deportivo Block 5","username":"carlos_block5"}', NOW(), NOW(), 'authenticated', 'authenticated', ''),
    ('r5555555-5555-5555-5555-555555555555', '00000000-0000-0000-0000-000000000000', 'arbitro@uv3.com', crypt('password123', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Héctor Baldassi - Árbitro","username":"hector_referee"}', NOW(), NOW(), 'authenticated', 'authenticated', ''),
    ('u6666666-6666-6666-6666-666666666666', '00000000-0000-0000-0000-000000000000', 'vecino@uv3.com', crypt('password123', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Luis Sánchez","username":"luis_vecino"}', NOW(), NOW(), 'authenticated', 'authenticated', '');

-- Note: The trigger public.handle_new_user automatically creates public.users rows with role='user'.
-- We need to update their roles manually to match the intended ones.
UPDATE public.users SET role = 'admin' WHERE id = 'a1111111-1111-1111-1111-111111111111';
UPDATE public.users SET role = 'organizer' WHERE id = 'o2222222-2222-2222-2222-222222222222';
UPDATE public.users SET role = 'delegate' WHERE id IN ('d3333333-3333-3333-3333-333333333333', 'd4444444-4444-4444-4444-444444444444');
UPDATE public.users SET role = 'referee' WHERE id = 'r5555555-5555-5555-5555-555555555555';

-- =========================================================================
-- 2. SEED VENUES (Canchas)
-- =========================================================================
INSERT INTO public.venues (id, name, location, description)
VALUES
    ('c0000000-0000-0000-0000-000000000001', 'Losa Deportiva Sector A', 'Frente al Block 12', 'Losa de concreto pintada, con iluminación nocturna led.'),
    ('c0000000-0000-0000-0000-000000000002', 'Cancha Sintética Principal', 'Costado del Parque Central', 'Cancha de gras sintético de fútbol 7 con tribunas.');

-- =========================================================================
-- 3. SEED TEAMS (Equipos)
-- =========================================================================
INSERT INTO public.teams (id, name, logo_url, delegate_id)
VALUES
    ('t0000000-0000-0000-0000-000000000001', 'Real Unidad Vecinal 3', 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=150', 'd3333333-3333-3333-3333-333333333333'),
    ('t0000000-0000-0000-0000-000000000002', 'Deportivo Block 5 FC', 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=150', 'd4444444-4444-4444-4444-444444444444');

-- =========================================================================
-- 4. SEED PLAYERS (Jugadores)
-- =========================================================================
INSERT INTO public.players (id, team_id, first_name, last_name, dni, birth_date, jersey_number, position, photo_url)
VALUES
    -- Real UV3 Players
    ('p0000000-0000-0000-0000-000000000101', 't0000000-0000-0000-0000-000000000001', 'Mateo', 'Pérez', '71234567', '1995-04-12', 10, 'delantero', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150'),
    ('p0000000-0000-0000-0000-000000000102', 't0000000-0000-0000-0000-000000000001', 'Alejandro', 'Guerrero', '72345678', '1993-08-25', 9, 'mediocampista', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'),
    ('p0000000-0000-0000-0000-000000000103', 't0000000-0000-0000-0000-000000000001', 'Daniel', 'Salas', '73456789', '1998-02-03', 1, 'arquero', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150'),
    -- Deportivo Block 5 Players
    ('p0000000-0000-0000-0000-000000000201', 't0000000-0000-0000-0000-000000000002', 'Julio', 'Gómez', '74567890', '1996-12-05', 7, 'delantero', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150'),
    ('p0000000-0000-0000-0000-000000000202', 't0000000-0000-0000-0000-000000000002', 'Renzo', 'Díaz', '75678901', '1994-01-20', 11, 'defensa', 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150'),
    ('p0000000-0000-0000-0000-000000000203', 't0000000-0000-0000-0000-000000000002', 'Franco', 'Mendoza', '76789012', '1997-07-15', 22, 'defensa', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150');

-- =========================================================================
-- 5. SEED TOURNAMENT (Campeonatos)
-- =========================================================================
INSERT INTO public.tournaments (id, name, description, status, format, category, banner_url, start_date, end_date)
VALUES
    ('f0000000-0000-0000-0000-000000000001', 'Campeonato Apertura UV3 2026', 'Primer campeonato del año de fútbol 7 comunitario de la Unidad Vecinal 3.', 'active', 'liga', 'libre', 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800', '2026-05-10', '2026-08-30');

-- =========================================================================
-- 6. SEED MATCHES (Partidos)
-- =========================================================================
INSERT INTO public.matches (id, tournament_id, home_team_id, away_team_id, venue_id, date_time, referee_id, status, home_score, away_score, round)
VALUES
    -- Match 1: Completed
    ('m0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', 't0000000-0000-0000-0000-000000000001', 't0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002', NOW() - INTERVAL '7 days', 'r5555555-5555-5555-5555-555555555555', 'completed', 3, 2, 1),
    -- Match 2: Scheduled
    ('m0000000-0000-0000-0000-000000000002', 'f0000000-0000-0000-0000-000000000001', 't0000000-0000-0000-0000-000000000002', 't0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', NOW() + INTERVAL '2 days', 'r5555555-5555-5555-5555-555555555555', 'scheduled', 0, 0, 2);

-- Note: Inserting a completed match above triggers 'recalculate_tournament_standings' automatic standings calculation.
-- This ensures standings are automatically seeded correctly!

-- =========================================================================
-- 7. SEED GOALS (Goles)
-- =========================================================================
INSERT INTO public.goals (match_id, player_id, team_id, minute, type)
VALUES
    -- Goals in Match 1 (Real UV3 3 - 2 Deportivo Block 5)
    -- Real UV3 scored 3
    ('m0000000-0000-0000-0000-000000000001', 'p0000000-0000-0000-0000-000000000101', 't0000000-0000-0000-0000-000000000001', 12, 'regular'),
    ('m0000000-0000-0000-0000-000000000001', 'p0000000-0000-0000-0000-000000000101', 't0000000-0000-0000-0000-000000000001', 45, 'penalty'),
    ('m0000000-0000-0000-0000-000000000001', 'p0000000-0000-0000-0000-000000000102', 't0000000-0000-0000-0000-000000000001', 52, 'regular'),
    -- Block 5 scored 2
    ('m0000000-0000-0000-0000-000000000001', 'p0000000-0000-0000-0000-000000000201', 't0000000-0000-0000-0000-000000000002', 20, 'regular'),
    ('m0000000-0000-0000-0000-000000000001', 'p0000000-0000-0000-0000-000000000202', 't0000000-0000-0000-0000-000000000002', 58, 'regular');

-- =========================================================================
-- 8. SEED SANCTIONS (Sanciones)
-- =========================================================================
INSERT INTO public.sanctions (match_id, player_id, card_type, reason, duration_matches)
VALUES
    ('m0000000-0000-0000-0000-000000000001', 'p0000000-0000-0000-0000-000000000203', 'yellow', 'Falta temeraria en mitad de cancha', 0),
    ('m0000000-0000-0000-0000-000000000001', 'p0000000-0000-0000-0000-000000000102', 'yellow', 'Reclamo airado al árbitro', 0);

-- =========================================================================
-- 9. SEED ANNOUNCEMENTS (Comunicados)
-- =========================================================================
INSERT INTO public.announcements (title, content, author_id, category)
VALUES
    ('Gran Convocatoria al Campeonato Apertura 2026', 'Se convoca a todos los delegados de los bloques de la UV3 a la reunión informativa este viernes a las 8:00 PM en el local comunal para definir las bases y sorteo del fixture.', 'o2222222-2222-2222-2222-222222222222', 'deportes'),
    ('Mantenimiento Programado de Cancha Principal', 'Vecinos, les informamos que la Cancha Sintética Principal estará cerrada por mantenimiento de césped e iluminación desde el lunes 1 de junio hasta el miércoles 3 de junio. Agradecemos su comprensión.', 'a1111111-1111-1111-1111-111111111111', 'comunicado');

-- =========================================================================
-- 10. SEED GALLERIES (Galería)
-- =========================================================================
INSERT INTO public.galleries (title, description, cover_image_url, images)
VALUES
    ('Inauguración Campeonato 2026', 'Imágenes de la inauguración del torneo y el desfile de inauguración de los equipos vecinales.', 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800', ARRAY[
        'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=600',
        'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=600',
        'https://images.unsplash.com/photo-1540747737956-37872404a82f?w=600'
    ]);
