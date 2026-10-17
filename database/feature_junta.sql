-- ============================================================================
-- UV3 PLATFORM — JUNTA VECINAL Y TRANSPARENCIA (ingresos y egresos)
-- Ejecutar en el SQL Editor de Supabase DESPUÉS de schema.sql y policies.sql.
-- Es idempotente: se puede volver a ejecutar sin efectos secundarios ni
-- pérdida de datos (usa CREATE TABLE/INDEX IF NOT EXISTS y DROP POLICY/TRIGGER
-- IF EXISTS antes de recrearlos).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. JUNTA VECINAL (directiva)
--    Los cargos son fijos y se validan con un CHECK.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.board_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    position TEXT NOT NULL CHECK (position IN (
        'presidente', 'vicepresidente', 'fiscal', 'secretario', 'tesorero',
        'vocal_educacion', 'vocal_ecologia', 'vocal_deportes', 'otro'
    )),
    full_name TEXT NOT NULL,
    photo_url TEXT,
    bio TEXT,
    email TEXT,
    phone TEXT,
    period TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

-- ----------------------------------------------------------------------------
-- 2. TESORERÍA (movimientos de ingresos y egresos)
--    `responsible_member_id` permite saber qué directivo reporta el movimiento.
--    `is_published` controla qué se muestra en la página pública.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.treasury_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    kind TEXT NOT NULL CHECK (kind IN ('ingreso', 'egreso')),
    category TEXT NOT NULL DEFAULT 'otros',
    concept TEXT NOT NULL,
    amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
    receipt_url TEXT,
    responsible_member_id UUID REFERENCES public.board_members(id) ON DELETE SET NULL,
    is_published BOOLEAN NOT NULL DEFAULT true,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

-- ----------------------------------------------------------------------------
-- 3. ÍNDICES
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_board_members_position ON public.board_members(position);
CREATE INDEX IF NOT EXISTS idx_board_members_active ON public.board_members(is_active);
CREATE INDEX IF NOT EXISTS idx_treasury_entries_date ON public.treasury_entries(entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_treasury_entries_kind ON public.treasury_entries(kind);
CREATE INDEX IF NOT EXISTS idx_treasury_entries_published ON public.treasury_entries(is_published);

-- ----------------------------------------------------------------------------
-- 4. TRIGGERS DE updated_at
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS update_board_members_timestamp ON public.board_members;
CREATE TRIGGER update_board_members_timestamp BEFORE UPDATE ON public.board_members
    FOR EACH ROW EXECUTE FUNCTION public.handle_update_timestamp();
DROP TRIGGER IF EXISTS update_treasury_entries_timestamp ON public.treasury_entries;
CREATE TRIGGER update_treasury_entries_timestamp BEFORE UPDATE ON public.treasury_entries
    FOR EACH ROW EXECUTE FUNCTION public.handle_update_timestamp();

-- ----------------------------------------------------------------------------
-- 5. RLS
--    - board_members: lectura pública; gestión del administrador.
--    - treasury_entries: se publican sólo los movimientos marcados; el
--      administrador ve y gestiona todo.
-- ----------------------------------------------------------------------------
ALTER TABLE public.board_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treasury_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Board members are readable by anyone" ON public.board_members;
CREATE POLICY "Board members are readable by anyone" ON public.board_members
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage board members" ON public.board_members;
CREATE POLICY "Admins can manage board members" ON public.board_members
    FOR ALL USING (public.is_admin(auth.uid()))
    WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Published treasury entries are readable" ON public.treasury_entries;
CREATE POLICY "Published treasury entries are readable" ON public.treasury_entries
    FOR SELECT USING (is_published = true OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage treasury entries" ON public.treasury_entries;
CREATE POLICY "Admins can manage treasury entries" ON public.treasury_entries
    FOR ALL USING (public.is_admin(auth.uid()))
    WITH CHECK (public.is_admin(auth.uid()));

-- ----------------------------------------------------------------------------
-- 6. NOTAS
--    La directiva (board_members) se carga desde el panel, en
--    /dashboard/junta. No se siembran cargos vacíos para no publicar datos
--    falsos en la página de transparencia.
-- ============================================================================
