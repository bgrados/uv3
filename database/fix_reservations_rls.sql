-- ============================================================================
-- UV3 PLATFORM — FIX RLS RESERVATIONS (idempotente, no borra datos)
-- Ejecutar en Supabase SQL Editor si aparece:
--   "new row violates row-level security policy for table reservations"
-- ============================================================================

-- Asegurar RLS habilitado
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas anteriores de inserción pública
DROP POLICY IF EXISTS "reservations alta publica" ON public.reservations;

-- Recrear política de inserción pública con validaciones mínimas
CREATE POLICY "reservations alta publica" ON public.reservations
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    status = 'confirmed'
    AND payment_proof_url IS NOT NULL
    AND length(btrim(customer_name)) >= 3
    AND length(regexp_replace(customer_phone, '\D', '', 'g')) >= 6
    AND (usage_type = 'evento' OR sport IS NOT NULL)
  );

-- Verificar
SELECT policyname, cmd, roles FROM pg_policies WHERE tablename = 'reservations';
-- ============================================================================