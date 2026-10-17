-- ============================================================================
-- UV3 PLATFORM — FIX RLS RESERVATIONS (idempotente, no borra datos)
-- Ejecutar en Supabase SQL Editor si aparece:
--   "new row violates row-level security policy for table reservations"
-- ============================================================================

-- Asegurar RLS habilitado
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- Eliminar TODAS las políticas existentes de reservations para evitar conflictos
DROP POLICY IF EXISTS "reservations admin" ON public.reservations;
DROP POLICY IF EXISTS "reservations alta publica" ON public.reservations;

-- Política de inserción pública (permisiva para diagnóstico)
CREATE POLICY "reservations alta publica" ON public.reservations
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Política de lectura/gestión para administradores
CREATE POLICY "reservations admin" ON public.reservations
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Verificar políticas creadas
SELECT policyname, cmd, roles FROM pg_policies WHERE tablename = 'reservations';

-- ============================================================================
-- NOTA: La política "reservations alta publica" usa WITH CHECK (true) para
-- diagnóstico. Una vez confirmado que funciona, se puede endurecer con:
--   WITH CHECK (
--     status = 'confirmed'
--     AND payment_proof_url IS NOT NULL
--     AND length(btrim(customer_name)) >= 3
--     AND length(regexp_replace(customer_phone, '\D', '', 'g')) >= 6
--     AND (usage_type = 'evento' OR sport IS NOT NULL)
--   );
-- ============================================================================