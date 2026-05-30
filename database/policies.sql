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
CREATE POLICY "Users are readable by anyone" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update their own data" ON public.users FOR UPDATE 
    USING (auth.uid() = id) 
    WITH CHECK (auth.uid() = id AND role = (SELECT role FROM public.users WHERE id = auth.uid())); -- Prevent self-promoting role
CREATE POLICY "Admins can manage all users" ON public.users FOR ALL 
    USING (public.is_admin(auth.uid()));

-- --- VENUES TABLE POLICIES ---
CREATE POLICY "Venues are readable by anyone" ON public.venues FOR SELECT USING (true);
CREATE POLICY "Organizers/Admins can manage venues" ON public.venues FOR ALL 
    USING (public.is_organizer(auth.uid()));

-- --- TEAMS TABLE POLICIES ---
CREATE POLICY "Teams are readable by anyone" ON public.teams FOR SELECT USING (true);
CREATE POLICY "Organizers/Admins can insert/delete teams" ON public.teams FOR ALL 
    USING (public.is_organizer(auth.uid()));
CREATE POLICY "Delegates can update their own team" ON public.teams FOR UPDATE 
    USING (auth.uid() = delegate_id)
    WITH CHECK (auth.uid() = delegate_id);

-- --- PLAYERS TABLE POLICIES ---
CREATE POLICY "Players are readable by anyone" ON public.players FOR SELECT USING (true);
CREATE POLICY "Organizers/Admins can manage players" ON public.players FOR ALL 
    USING (public.is_organizer(auth.uid()));
CREATE POLICY "Delegates can manage players of their own team" ON public.players FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM public.teams 
            WHERE id = team_id AND delegate_id = auth.uid()
        )
    );

-- --- TOURNAMENTS TABLE POLICIES ---
CREATE POLICY "Tournaments are readable by anyone" ON public.tournaments FOR SELECT USING (true);
CREATE POLICY "Organizers/Admins can manage tournaments" ON public.tournaments FOR ALL 
    USING (public.is_organizer(auth.uid()));

-- --- MATCHES TABLE POLICIES ---
CREATE POLICY "Matches are readable by anyone" ON public.matches FOR SELECT USING (true);
CREATE POLICY "Organizers/Admins can manage matches" ON public.matches FOR ALL 
    USING (public.is_organizer(auth.uid()));
CREATE POLICY "Assigned referees can update scores/status of their matches" ON public.matches FOR UPDATE 
    USING (referee_id = auth.uid())
    WITH CHECK (referee_id = auth.uid());

-- --- STANDINGS TABLE POLICIES ---
CREATE POLICY "Standings are readable by anyone" ON public.standings FOR SELECT USING (true);
-- Standings updates are handled automatically via database triggers which execute with security definer bypass,
-- so application users do not need write access policies unless they are Admins/Organizers performing manual overrides.
CREATE POLICY "Organizers/Admins can manage standings manually" ON public.standings FOR ALL 
    USING (public.is_organizer(auth.uid()));

-- --- GOALS TABLE POLICIES ---
CREATE POLICY "Goals are readable by anyone" ON public.goals FOR SELECT USING (true);
CREATE POLICY "Organizers/Admins can manage goals" ON public.goals FOR ALL 
    USING (public.is_organizer(auth.uid()));
CREATE POLICY "Assigned match referees can manage goals" ON public.goals FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM public.matches 
            WHERE id = match_id AND referee_id = auth.uid()
        )
    );

-- --- SANCTIONS TABLE POLICIES ---
CREATE POLICY "Sanctions are readable by anyone" ON public.sanctions FOR SELECT USING (true);
CREATE POLICY "Organizers/Admins can manage sanctions" ON public.sanctions FOR ALL 
    USING (public.is_organizer(auth.uid()));
CREATE POLICY "Assigned match referees can manage sanctions" ON public.sanctions FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM public.matches 
            WHERE id = match_id AND referee_id = auth.uid()
        )
    );

-- --- SCHEDULES TABLE POLICIES ---
CREATE POLICY "Schedules are readable by anyone" ON public.schedules FOR SELECT USING (true);
CREATE POLICY "Organizers/Admins can manage schedules" ON public.schedules FOR ALL 
    USING (public.is_organizer(auth.uid()));

-- --- ANNOUNCEMENTS TABLE POLICIES ---
CREATE POLICY "Announcements are readable by anyone" ON public.announcements FOR SELECT USING (true);
CREATE POLICY "Organizers/Admins can manage announcements" ON public.announcements FOR ALL 
    USING (public.is_organizer(auth.uid()));

-- --- GALLERIES TABLE POLICIES ---
CREATE POLICY "Galleries are readable by anyone" ON public.galleries FOR SELECT USING (true);
CREATE POLICY "Organizers/Admins can manage galleries" ON public.galleries FOR ALL 
    USING (public.is_organizer(auth.uid()));
