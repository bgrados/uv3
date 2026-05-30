-- UV3 PLATFORM - COMPLETE DATABASE SCHEMA
-- Handles sports league management and neighborhood community portal data

-- Enable uuid-ossp if not already enabled (Supabase has this by default, but good practice)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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
    author_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('general', 'deportes', 'eventos', 'comunicado')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

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
CREATE TRIGGER update_users_timestamp BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.handle_update_timestamp();
CREATE TRIGGER update_venues_timestamp BEFORE UPDATE ON public.venues FOR EACH ROW EXECUTE FUNCTION public.handle_update_timestamp();
CREATE TRIGGER update_teams_timestamp BEFORE UPDATE ON public.teams FOR EACH ROW EXECUTE FUNCTION public.handle_update_timestamp();
CREATE TRIGGER update_players_timestamp BEFORE UPDATE ON public.players FOR EACH ROW EXECUTE FUNCTION public.handle_update_timestamp();
CREATE TRIGGER update_tournaments_timestamp BEFORE UPDATE ON public.tournaments FOR EACH ROW EXECUTE FUNCTION public.handle_update_timestamp();
CREATE TRIGGER update_matches_timestamp BEFORE UPDATE ON public.matches FOR EACH ROW EXECUTE FUNCTION public.handle_update_timestamp();
CREATE TRIGGER update_standings_timestamp BEFORE UPDATE ON public.standings FOR EACH ROW EXECUTE FUNCTION public.handle_update_timestamp();
CREATE TRIGGER update_schedules_timestamp BEFORE UPDATE ON public.schedules FOR EACH ROW EXECUTE FUNCTION public.handle_update_timestamp();
CREATE TRIGGER update_announcements_timestamp BEFORE UPDATE ON public.announcements FOR EACH ROW EXECUTE FUNCTION public.handle_update_timestamp();
CREATE TRIGGER update_galleries_timestamp BEFORE UPDATE ON public.galleries FOR EACH ROW EXECUTE FUNCTION public.handle_update_timestamp();

-- Supabase auth.users to public.users synchronization trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name, username, role)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'full_name', ''),
        COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
        COALESCE(new.raw_user_meta_data->>'role', 'user')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
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
CREATE TRIGGER trigger_recalculate_standings
    AFTER INSERT OR UPDATE OR DELETE ON public.matches
    FOR EACH ROW EXECUTE FUNCTION public.recalculate_tournament_standings();
