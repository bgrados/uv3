-- ============================================================================
-- UV3 PLATFORM - SCRIPT UNICO CONSOLIDADO (bootstrap completo e idempotente)
-- ----------------------------------------------------------------------------
-- Pega TODO este archivo en Supabase > SQL Editor > New query > Run.
--
-- CONTENIDO Y ORDEN:
--   1/10  schema.sql .......... tablas base, indices, funciones y triggers
--   2/10  policies.sql ........ RLS + helpers (is_admin, is_organizer, ...)
--   3/10  storage.sql ......... buckets base de Storage y sus politicas
--   4/10  migration_sport.sql . columna tournaments.sport (si faltara)
--   5/10  feature_reservas.sql  reservas, comercios, config del sitio + buckets
--   6/10  feature_notices.sql . avisos de utilidad de la portada (editables)
--   7/10  fix_demo_users.sql .. repara las cuentas demo de Auth (opcional)
--   8/10  grant_admin.sql ..... promueve TU cuenta a admin (CAMBIA EL CORREO)
--   9/10  verify.sql .......... comprobacion final (todas las filas deben ser OK)
--  10/10  seeds.sql .......... DATOS DE EJEMPLO (ACTIVO - BORRA DATOS, ver abajo)
--
-- IMPORTANTE - SECCION 10 (seeds.sql) ESTA ACTIVA Y ES DESTRUCTIVA:
--   Hace TRUNCATE de varias tablas y borra las cuentas demo, y luego las vuelve
--   a crear con datos de ejemplo (equipos, jugadores, partidos, goles,
--   comunicados, galeria, comercios y avisos). Las cuentas demo quedan con la
--   clave password123.
--   Ejecuta este archivo completo SOLO en una base de PRUEBAS o si quieres
--   reiniciar los datos de ejemplo. Si NO quieres borrar datos:
--     a) comenta o elimina toda la SECCION 10/10 antes de ejecutar, o
--     b) ejecuta solo hasta la SECCION 9/10.
--   Las secciones 1 a 9 son idempotentes y NO borran datos.
-- ============================================================================

-- ============================================================================
-- SECCION 1/10 - schema.sql
-- ============================================================================

-- UV3 PLATFORM - COMPLETE DATABASE SCHEMA
-- Handles sports league management and neighborhood community portal data

-- Enable UUID helpers used by the schema.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================================================================
-- 1. BASE TABLES
-- =========================================================================

-- USERS TABLE (Linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT,
    username TEXT UNIQUE,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'organizer', 'delegate', 'referee', 'user')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- VENUES TABLE (Fields / Courts)
CREATE TABLE IF NOT EXISTS public.venues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    location TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- TEAMS TABLE
CREATE TABLE IF NOT EXISTS public.teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    logo_url TEXT,
    delegate_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- PLAYERS TABLE
CREATE TABLE IF NOT EXISTS public.players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    dni TEXT UNIQUE,
    birth_date DATE,
    jersey_number INTEGER,
    position TEXT CHECK (position IN ('arquero', 'defensa', 'mediocampista', 'delantero')),
    photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- TOURNAMENTS TABLE
CREATE TABLE IF NOT EXISTS public.tournaments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'finished')),
    format TEXT NOT NULL DEFAULT 'liga' CHECK (format IN ('liga', 'grupos', 'eliminacion')),
    sport TEXT NOT NULL DEFAULT 'futbol' CHECK (sport IN ('futbol', 'futbol_sala', 'basquet')),
    category TEXT NOT NULL DEFAULT 'libre',
    banner_url TEXT,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- MATCHES TABLE
CREATE TABLE IF NOT EXISTS public.matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE NOT NULL,
    home_team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
    away_team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
    venue_id UUID REFERENCES public.venues(id) ON DELETE SET NULL,
    date_time TIMESTAMP WITH TIME ZONE,
    referee_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'playing', 'completed', 'cancelled')),
    home_score INTEGER NOT NULL DEFAULT 0,
    away_score INTEGER NOT NULL DEFAULT 0,
    round INTEGER NOT NULL DEFAULT 1, -- Matchday / Jornada
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT check_different_teams CHECK (home_team_id <> away_team_id)
);

-- STANDINGS TABLE (Calculated per tournament-team)
CREATE TABLE IF NOT EXISTS public.standings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE NOT NULL,
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
    played INTEGER NOT NULL DEFAULT 0,
    won INTEGER NOT NULL DEFAULT 0,
    drawn INTEGER NOT NULL DEFAULT 0,
    lost INTEGER NOT NULL DEFAULT 0,
    goals_for INTEGER NOT NULL DEFAULT 0,
    goals_against INTEGER NOT NULL DEFAULT 0,
    goal_difference INTEGER NOT NULL DEFAULT 0,
    points INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE (tournament_id, team_id)
);

-- GOALS TABLE (Scorers)
CREATE TABLE IF NOT EXISTS public.goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE NOT NULL,
    player_id UUID REFERENCES public.players(id) ON DELETE CASCADE NOT NULL,
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL, -- Team scoring the goal
    minute INTEGER CHECK (minute >= 0 AND minute <= 120),
    type TEXT NOT NULL DEFAULT 'regular' CHECK (type IN ('regular', 'penalty', 'own_goal')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- SANCTIONS TABLE (Yellow/Red Cards and Suspensions)
CREATE TABLE IF NOT EXISTS public.sanctions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE NOT NULL,
    player_id UUID REFERENCES public.players(id) ON DELETE CASCADE NOT NULL,
    card_type TEXT NOT NULL CHECK (card_type IN ('yellow', 'red', 'suspension')),
    reason TEXT,
    duration_matches INTEGER DEFAULT 0 CHECK (duration_matches >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- SCHEDULES CONFIGURATION TABLE (Time slots configurations)
CREATE TABLE IF NOT EXISTS public.schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE NOT NULL,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0 = Sunday, 6 = Saturday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    venue_id UUID REFERENCES public.venues(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ANNOUNCEMENTS TABLE (Community News & Notices)
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    video_url TEXT, -- Enlace externo (YouTube/Facebook/Vimeo): no se aloja en Supabase.
    author_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('general', 'deportes', 'eventos', 'comunicado')),
    is_featured BOOLEAN NOT NULL DEFAULT FALSE, -- “Favorito”: se muestra en la portada.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Estas columnas también se agregan a bases ya existentes de forma idempotente.
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT FALSE;

-- GALLERIES TABLE (Community Albums)
CREATE TABLE IF NOT EXISTS public.galleries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    cover_image_url TEXT,
    images TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);


-- =========================================================================
-- 2. INDEXES FOR PERFORMANCE OPTIMIZATION
-- =========================================================================
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

CREATE INDEX IF NOT EXISTS idx_teams_delegate_id ON public.teams(delegate_id);

CREATE INDEX IF NOT EXISTS idx_players_team_id ON public.players(team_id);
CREATE INDEX IF NOT EXISTS idx_players_dni ON public.players(dni);

CREATE INDEX IF NOT EXISTS idx_tournaments_sport ON public.tournaments(sport);
CREATE INDEX IF NOT EXISTS idx_tournaments_status ON public.tournaments(status);

CREATE INDEX IF NOT EXISTS idx_matches_tournament_id ON public.matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_matches_teams ON public.matches(home_team_id, away_team_id);
CREATE INDEX IF NOT EXISTS idx_matches_date_time ON public.matches(date_time);
CREATE INDEX IF NOT EXISTS idx_matches_referee_id ON public.matches(referee_id);
CREATE INDEX IF NOT EXISTS idx_matches_status ON public.matches(status);

CREATE INDEX IF NOT EXISTS idx_standings_tournament_id ON public.standings(tournament_id);
CREATE INDEX IF NOT EXISTS idx_standings_team_id ON public.standings(team_id);
CREATE INDEX IF NOT EXISTS idx_standings_points ON public.standings(points DESC, goal_difference DESC, goals_for DESC);

CREATE INDEX IF NOT EXISTS idx_goals_match_id ON public.goals(match_id);
CREATE INDEX IF NOT EXISTS idx_goals_player_id ON public.goals(player_id);

CREATE INDEX IF NOT EXISTS idx_sanctions_match_id ON public.sanctions(match_id);
CREATE INDEX IF NOT EXISTS idx_sanctions_player_id ON public.sanctions(player_id);

CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON public.announcements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_announcements_category ON public.announcements(category);

-- =========================================================================
-- 3. TRIGGERS & AUTOMATION FUNCTIONS
-- =========================================================================

-- Trigger function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply timestamp triggers
DROP TRIGGER IF EXISTS update_users_timestamp ON public.users;
CREATE TRIGGER update_users_timestamp BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.handle_update_timestamp();
DROP TRIGGER IF EXISTS update_venues_timestamp ON public.venues;
CREATE TRIGGER update_venues_timestamp BEFORE UPDATE ON public.venues FOR EACH ROW EXECUTE FUNCTION public.handle_update_timestamp();
DROP TRIGGER IF EXISTS update_teams_timestamp ON public.teams;
CREATE TRIGGER update_teams_timestamp BEFORE UPDATE ON public.teams FOR EACH ROW EXECUTE FUNCTION public.handle_update_timestamp();
DROP TRIGGER IF EXISTS update_players_timestamp ON public.players;
CREATE TRIGGER update_players_timestamp BEFORE UPDATE ON public.players FOR EACH ROW EXECUTE FUNCTION public.handle_update_timestamp();
DROP TRIGGER IF EXISTS update_tournaments_timestamp ON public.tournaments;
CREATE TRIGGER update_tournaments_timestamp BEFORE UPDATE ON public.tournaments FOR EACH ROW EXECUTE FUNCTION public.handle_update_timestamp();
DROP TRIGGER IF EXISTS update_matches_timestamp ON public.matches;
CREATE TRIGGER update_matches_timestamp BEFORE UPDATE ON public.matches FOR EACH ROW EXECUTE FUNCTION public.handle_update_timestamp();
DROP TRIGGER IF EXISTS update_standings_timestamp ON public.standings;
CREATE TRIGGER update_standings_timestamp BEFORE UPDATE ON public.standings FOR EACH ROW EXECUTE FUNCTION public.handle_update_timestamp();
DROP TRIGGER IF EXISTS update_schedules_timestamp ON public.schedules;
CREATE TRIGGER update_schedules_timestamp BEFORE UPDATE ON public.schedules FOR EACH ROW EXECUTE FUNCTION public.handle_update_timestamp();
DROP TRIGGER IF EXISTS update_announcements_timestamp ON public.announcements;
CREATE TRIGGER update_announcements_timestamp BEFORE UPDATE ON public.announcements FOR EACH ROW EXECUTE FUNCTION public.handle_update_timestamp();
DROP TRIGGER IF EXISTS update_galleries_timestamp ON public.galleries;
CREATE TRIGGER update_galleries_timestamp BEFORE UPDATE ON public.galleries FOR EACH ROW EXECUTE FUNCTION public.handle_update_timestamp();

-- Supabase auth.users to public.users synchronization trigger
-- SEGURIDAD: el rol SIEMPRE es 'user' y nunca se toma de los metadatos del
-- cliente (raw_user_meta_data), que son manipulables en el registro público.
-- Los roles de staff se asignan sólo desde el SQL Editor o desde un módulo de
-- administración con service_role.
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
        -- Username duplicado (p. ej. dos registros con el mismo prefijo de
        -- correo): se usa el correo completo, que es único. Evita que el
        -- registro falle con error 500.
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


-- =========================================================================
-- 4. AUTOMATIC STANDINGS RECALCULATION
-- =========================================================================

CREATE OR REPLACE FUNCTION public.recalculate_tournament_standings()
RETURNS TRIGGER AS $$
DECLARE
    v_tournament_id UUID;
    v_home_id UUID;
    v_away_id UUID;
BEGIN
    -- Determine which tournament and teams to recalculate
    IF TG_OP = 'DELETE' THEN
        v_tournament_id := OLD.tournament_id;
        v_home_id := OLD.home_team_id;
        v_away_id := OLD.away_team_id;
    ELSE
        v_tournament_id := NEW.tournament_id;
        v_home_id := NEW.home_team_id;
        v_away_id := NEW.away_team_id;
    END IF;

    -- Ensure standings rows exist for both teams in the tournament
    INSERT INTO public.standings (tournament_id, team_id)
    VALUES 
        (v_tournament_id, v_home_id),
        (v_tournament_id, v_away_id)
    ON CONFLICT (tournament_id, team_id) DO NOTHING;

    -- Helper function inline logic to update a single team in a tournament
    -- Recalculate Home Team
    UPDATE public.standings
    SET 
        played = (
            SELECT COUNT(*) FROM public.matches 
            WHERE tournament_id = v_tournament_id AND status = 'completed' AND (home_team_id = v_home_id OR away_team_id = v_home_id)
        ),
        won = (
            SELECT COUNT(*) FROM public.matches 
            WHERE tournament_id = v_tournament_id AND status = 'completed' AND (
                (home_team_id = v_home_id AND home_score > away_score) OR 
                (away_team_id = v_home_id AND away_score > home_score)
            )
        ),
        drawn = (
            SELECT COUNT(*) FROM public.matches 
            WHERE tournament_id = v_tournament_id AND status = 'completed' AND 
            (home_team_id = v_home_id OR away_team_id = v_home_id) AND home_score = away_score
        ),
        lost = (
            SELECT COUNT(*) FROM public.matches 
            WHERE tournament_id = v_tournament_id AND status = 'completed' AND (
                (home_team_id = v_home_id AND home_score < away_score) OR 
                (away_team_id = v_home_id AND away_score < home_score)
            )
        ),
        goals_for = COALESCE((
            SELECT SUM(CASE WHEN home_team_id = v_home_id THEN home_score ELSE away_score END)
            FROM public.matches 
            WHERE tournament_id = v_tournament_id AND status = 'completed' AND (home_team_id = v_home_id OR away_team_id = v_home_id)
        ), 0),
        goals_against = COALESCE((
            SELECT SUM(CASE WHEN home_team_id = v_home_id THEN away_score ELSE home_score END)
            FROM public.matches 
            WHERE tournament_id = v_tournament_id AND status = 'completed' AND (home_team_id = v_home_id OR away_team_id = v_home_id)
        ), 0),
        goal_difference = COALESCE((
            SELECT SUM(CASE WHEN home_team_id = v_home_id THEN home_score - away_score ELSE away_score - home_score END)
            FROM public.matches 
            WHERE tournament_id = v_tournament_id AND status = 'completed' AND (home_team_id = v_home_id OR away_team_id = v_home_id)
        ), 0),
        points = (
            -- 3 points for win, 1 for draw
            (SELECT COUNT(*) FROM public.matches 
             WHERE tournament_id = v_tournament_id AND status = 'completed' AND (
                 (home_team_id = v_home_id AND home_score > away_score) OR 
                 (away_team_id = v_home_id AND away_score > home_score)
             )) * 3 +
            (SELECT COUNT(*) FROM public.matches 
             WHERE tournament_id = v_tournament_id AND status = 'completed' AND 
             (home_team_id = v_home_id OR away_team_id = v_home_id) AND home_score = away_score)
        )
    WHERE tournament_id = v_tournament_id AND team_id = v_home_id;

    -- Recalculate Away Team
    UPDATE public.standings
    SET 
        played = (
            SELECT COUNT(*) FROM public.matches 
            WHERE tournament_id = v_tournament_id AND status = 'completed' AND (home_team_id = v_away_id OR away_team_id = v_away_id)
        ),
        won = (
            SELECT COUNT(*) FROM public.matches 
            WHERE tournament_id = v_tournament_id AND status = 'completed' AND (
                (home_team_id = v_away_id AND home_score > away_score) OR 
                (away_team_id = v_away_id AND away_score > home_score)
            )
        ),
        drawn = (
            SELECT COUNT(*) FROM public.matches 
            WHERE tournament_id = v_tournament_id AND status = 'completed' AND 
            (home_team_id = v_away_id OR away_team_id = v_away_id) AND home_score = away_score
        ),
        lost = (
            SELECT COUNT(*) FROM public.matches 
            WHERE tournament_id = v_tournament_id AND status = 'completed' AND (
                (home_team_id = v_away_id AND home_score < away_score) OR 
                (away_team_id = v_away_id AND away_score < home_score)
            )
        ),
        goals_for = COALESCE((
            SELECT SUM(CASE WHEN home_team_id = v_away_id THEN home_score ELSE away_score END)
            FROM public.matches 
            WHERE tournament_id = v_tournament_id AND status = 'completed' AND (home_team_id = v_away_id OR away_team_id = v_away_id)
        ), 0),
        goals_against = COALESCE((
            SELECT SUM(CASE WHEN home_team_id = v_away_id THEN away_score ELSE home_score END)
            FROM public.matches 
            WHERE tournament_id = v_tournament_id AND status = 'completed' AND (home_team_id = v_away_id OR away_team_id = v_away_id)
        ), 0),
        goal_difference = COALESCE((
            SELECT SUM(CASE WHEN home_team_id = v_away_id THEN home_score - away_score ELSE away_score - home_score END)
            FROM public.matches 
            WHERE tournament_id = v_tournament_id AND status = 'completed' AND (home_team_id = v_away_id OR away_team_id = v_away_id)
        ), 0),
        points = (
            (SELECT COUNT(*) FROM public.matches 
             WHERE tournament_id = v_tournament_id AND status = 'completed' AND (
                 (home_team_id = v_away_id AND home_score > away_score) OR 
                 (away_team_id = v_away_id AND away_score > home_score)
             )) * 3 +
            (SELECT COUNT(*) FROM public.matches 
             WHERE tournament_id = v_tournament_id AND status = 'completed' AND 
             (home_team_id = v_away_id OR away_team_id = v_away_id) AND home_score = away_score)
        )
    WHERE tournament_id = v_tournament_id AND team_id = v_away_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger standings recalculation on match updates
DROP TRIGGER IF EXISTS trigger_recalculate_standings ON public.matches;
CREATE TRIGGER trigger_recalculate_standings
    AFTER INSERT OR UPDATE OR DELETE ON public.matches
    FOR EACH ROW EXECUTE FUNCTION public.recalculate_tournament_standings();


-- ============================================================================
-- SECCION 2/10 - policies.sql
-- ============================================================================

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


-- ============================================================================
-- SECCION 3/10 - storage.sql
-- ============================================================================

-- ============================================================================
-- UV3 PLATFORM — STORAGE (Supabase Storage: buckets + políticas RLS)
-- Ejecutar en el SQL Editor de Supabase DESPUÉS de schema.sql y policies.sql.
-- Es idempotente: se puede volver a ejecutar sin efectos secundarios.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. BUCKETS
--    Públicos para lectura (logos, fotos y banners se muestran en el portal),
--    con límite de tamaño y tipos MIME restringidos a imágenes.
-- ----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('team-logos', 'team-logos', true, 2097152,
   ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']),
  ('player-photos', 'player-photos', true, 2097152,
   ARRAY['image/png', 'image/jpeg', 'image/webp']),
  ('tournament-banners', 'tournament-banners', true, 5242880,
   ARRAY['image/png', 'image/jpeg', 'image/webp']),
  ('gallery-media', 'gallery-media', true, 2097152,
   ARRAY['image/png', 'image/jpeg', 'image/webp'])
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ----------------------------------------------------------------------------
-- 2. POLÍTICAS SOBRE storage.objects
--    - Lectura pública de los 3 buckets usados por el portal.
--    - Escritura (insert/update/delete) sólo para administradores,
--      organizadores y delegados autenticados.
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "UV3 public read of media buckets" ON storage.objects;
CREATE POLICY "UV3 public read of media buckets"
  ON storage.objects FOR SELECT
  USING (bucket_id IN ('team-logos', 'player-photos', 'tournament-banners', 'gallery-media'));

DROP POLICY IF EXISTS "UV3 staff can upload media" ON storage.objects;
CREATE POLICY "UV3 staff can upload media"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id IN ('team-logos', 'player-photos', 'tournament-banners', 'gallery-media')
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
    bucket_id IN ('team-logos', 'player-photos', 'tournament-banners', 'gallery-media')
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
    bucket_id IN ('team-logos', 'player-photos', 'tournament-banners', 'gallery-media')
    AND EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.role IN ('admin', 'organizer', 'delegate')
    )
  );


-- ============================================================================
-- SECCION 4/10 - migration_sport.sql
-- ============================================================================

-- UV3 PLATFORM — MIGRATION: Add sport column to tournaments
-- Run this in your Supabase SQL Editor

ALTER TABLE public.tournaments
  ADD COLUMN IF NOT EXISTS sport TEXT NOT NULL DEFAULT 'futbol'
    CHECK (sport IN ('futbol', 'futbol_sala', 'basquet'));

-- Update existing tournaments to default 'futbol' (already handled by DEFAULT)
COMMENT ON COLUMN public.tournaments.sport IS 'Tipo de deporte: futbol, futbol_sala, basquet';


-- ============================================================================
-- SECCION 5/10 - feature_reservas.sql
-- ============================================================================

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

-- NOTA: el parametro se llama p_user_id (igual que en policies.sql) para que
-- CREATE OR REPLACE no falle con "cannot change name of input parameter".
CREATE OR REPLACE FUNCTION public.is_admin(p_user_id UUID)
RETURNS BOOLEAN AS $$
    SELECT COALESCE(
        (SELECT u.role = 'admin' FROM public.users u WHERE u.id = p_user_id),
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
    is_featured BOOLEAN NOT NULL DEFAULT FALSE, -- “Favorito”: se muestra en el carrusel de la portada.
    sort_order  INTEGER NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Columna añadida a bases ya existentes (idempotente).
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT FALSE;

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
   ARRAY['image/png','image/jpeg','image/webp']),
  ('gallery-media', 'gallery-media', true, 2097152,
   ARRAY['image/png', 'image/jpeg', 'image/webp'])
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Lectura pública de branding y business-media.
DROP POLICY IF EXISTS "UV3 public read branding" ON storage.objects;
CREATE POLICY "UV3 public read branding"
  ON storage.objects FOR SELECT
  USING (bucket_id IN ('branding','business-media','gallery-media'));

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
    bucket_id IN ('branding','business-media','payment-proofs','team-logos','player-photos','tournament-banners','gallery-media')
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
    bucket_id IN ('branding','business-media','payment-proofs','gallery-media')
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
INSERT INTO public.businesses (name, category, description, phone, address, image_url, sort_order, is_featured)
SELECT * FROM (VALUES
  ('Bodega Doña Rosa','tienda','Abarrotes, bebidas y artículos de primera necesidad.', '999 111 222','Pabellón A - Tienda 1','https://picsum.photos/seed/uv3-tienda/800/600',1,TRUE),
  ('Farmacia San Martín','farmacia','Medicamentos, cuidado personal y atención al vecino.', '999 222 333','Pabellón A - Tienda 2','https://picsum.photos/seed/uv3-farmacia/800/600',2,TRUE),
  ('Puesto de Mercado Central','mercado','Frutas, verduras y productos frescos de la feria.', '999 333 444','Plaza central','https://picsum.photos/seed/uv3-mercado/800/600',3,TRUE),
  ('Pollería El Vecino','restaurante','Pollo a la brasa y platos de menú del día.', '999 444 555','Pabellón B - Local 4','https://picsum.photos/seed/uv3-polleria/800/600',4,TRUE),
  ('Panadería Los Aromas','restaurante','Pan fresco, pasteles y desayunos.', '999 555 666','Pabellón B - Local 5','https://picsum.photos/seed/uv3-panaderia/800/600',5,FALSE),
  ('Peluquería Estilo','servicio','Corte, peinados y arreglo personal.', '999 666 777','Pabellón C - Local 1','https://picsum.photos/seed/uv3-peluqueria/800/600',6,FALSE),
  ('Bazar y Librería Escolar','tienda','Útiles escolares, útiles y regalos.', '999 777 888','Pabellón C - Local 2','https://picsum.photos/seed/uv3-bazar/800/600',7,FALSE),
  ('Taller Ferretero UV3','servicio','Ferretería, pintura y herramientas.', '999 888 999','Ingreso principal','https://picsum.photos/seed/uv3-ferreteria/800/600',8,FALSE)
) AS v(name,category,description,phone,address,image_url,sort_order,is_featured)
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


-- ============================================================================
-- SECCION 6/10 - feature_notices.sql
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


-- ============================================================================
-- SECCION 7/10 - fix_demo_users.sql
-- ============================================================================

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


-- ============================================================================
-- SECCION 8/10 - grant_admin.sql
-- ============================================================================

-- ============================================================================
-- UV3 PLATFORM — OTORGAR ROL ADMIN A UNA CUENTA EXISTENTE
-- ----------------------------------------------------------------------------
-- El panel /dashboard sólo admite los roles `admin`, `organizer` y `referee`.
-- Las cuentas creadas desde el registro público quedan con rol `user` (vecino)
-- y, por diseño de seguridad, NO pueden entrar al panel: el login las cierra.
--
-- Si te registraste con tu propio correo y no puedes entrar, tu fila en
-- public.users tiene rol 'user'. Ejecuta este script en el SQL Editor de
-- Supabase cambiando el correo por el tuyo.
--
-- Es idempotente y no borra datos.
-- ============================================================================

-- >>> CAMBIA ESTE CORREO POR EL DE TU CUENTA <<<
UPDATE public.users
SET role = 'admin'
WHERE email = 'bgrados@gmail.com';

-- Verificación (debe mostrar role = 'admin')
SELECT id, email, full_name, role
FROM public.users
WHERE email = 'bgrados@gmail.com';


-- ============================================================================
-- SECCION 9/10 - verify.sql
-- ============================================================================

-- ============================================================================
-- UV3 PLATFORM — VERIFICACIÓN DEL ESQUEMA
-- Pegar en el SQL Editor de Supabase y ejecutar. Devuelve una fila por cada
-- comprobación indicando si el objeto existe (OK) o falta (FALTA).
-- No modifica nada.
-- ============================================================================

WITH checks AS (
  -- Tablas esperadas
  SELECT 'tabla' AS tipo, t.name AS objeto,
         EXISTS (
           SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = t.name
         ) AS ok
  FROM (VALUES
    ('users'), ('venues'), ('teams'), ('players'), ('tournaments'),
    ('matches'), ('standings'), ('goals'), ('sanctions'), ('schedules'),
    ('announcements'), ('galleries'),
    -- feature_reservas.sql
    ('spaces'), ('space_sports'), ('space_blocks'), ('reservations'),
    ('businesses'), ('site_settings'),
    -- feature_notices.sql
    ('notices')
  ) AS t(name)

  UNION ALL

  -- Triggers de automatización
  SELECT 'trigger', tr.name,
         EXISTS (
           SELECT 1 FROM pg_trigger WHERE tgname = tr.name AND NOT tgisinternal
         )
  FROM (VALUES
    ('on_auth_user_created'),
    ('trigger_recalculate_standings'),
    ('update_matches_timestamp'),
    ('update_standings_timestamp'),
    -- feature_reservas.sql
    ('update_spaces_timestamp'),
    ('update_reservations_timestamp'),
    ('update_businesses_timestamp'),
    ('update_site_settings_timestamp')
  ) AS tr(name)

  UNION ALL

  -- Buckets de Storage
  SELECT 'bucket', b.name,
         EXISTS (SELECT 1 FROM storage.buckets WHERE id = b.name)
  FROM (VALUES
    ('team-logos'), ('player-photos'), ('tournament-banners'),
    -- feature_reservas.sql
    ('branding'), ('business-media'), ('payment-proofs'), ('gallery-media')
  ) AS b(name)

  UNION ALL

  -- Columnas clave que el frontend usa (ej. tournaments.sport)
  SELECT 'columna', 'tournaments.sport',
         EXISTS (
           SELECT 1 FROM information_schema.columns
           WHERE table_schema = 'public' AND table_name = 'tournaments' AND column_name = 'sport'
         )

  UNION ALL

  SELECT 'columna', 'galleries.images',
         EXISTS (
           SELECT 1 FROM information_schema.columns
           WHERE table_schema = 'public' AND table_name = 'galleries' AND column_name = 'images'
         )

  UNION ALL

  SELECT 'columna', 'announcements.video_url',
         EXISTS (
           SELECT 1 FROM information_schema.columns
           WHERE table_schema = 'public' AND table_name = 'announcements' AND column_name = 'video_url'
         )

  UNION ALL

  SELECT 'columna', 'announcements.is_featured',
         EXISTS (
           SELECT 1 FROM information_schema.columns
           WHERE table_schema = 'public' AND table_name = 'announcements' AND column_name = 'is_featured'
         )

  UNION ALL

  SELECT 'columna', 'businesses.is_featured',
         EXISTS (
           SELECT 1 FROM information_schema.columns
           WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'is_featured'
         )
)
SELECT tipo, objeto, CASE WHEN ok THEN 'OK' ELSE 'FALTA' END AS estado
FROM checks
ORDER BY ok, tipo, objeto;


-- ============================================================================
-- SECCION 10/10 - seeds.sql (DATOS DE EJEMPLO - ACTIVO / DESTRUCTIVO)
-- Hace TRUNCATE de varias tablas y borra las cuentas demo. Ver encabezado.
-- ============================================================================


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

