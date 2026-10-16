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
