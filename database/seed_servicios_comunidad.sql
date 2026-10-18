-- ============================================================================
-- UV3 PLATFORM — SEED DIRECTORIO DE LA UNIDAD (idempotente, NO borra datos)
-- Ejecutar en Supabase SQL Editor después de feature_servicios_comunidad.sql.
-- Solo inserta si no existe por nombre.
-- ============================================================================

INSERT INTO public.community_services (name, category, icon, description, address, phone, hours, sort_order, is_active)
SELECT * FROM (VALUES
  ('Iglesia Nuestra Señora de la Unidad', 'religioso', '⛪',
   'Parroquia del barrio. Misas diarias y catequesis para niños y jóvenes.',
   'Frente al parque central', '999000101',
   'Misas: L-S 07:00 y 18:00 h · Dom 08:00, 11:00 y 18:00 h', 1, true),

  ('Club Deportivo Unidad Vecinal 3', 'deporte', '⚽',
   'Escuela de fútbol, básquet y vóley para niños y adultos. Liga vecinal permanente.',
   'Losa deportiva central', '999000102',
   'Entrenamientos: L-V 16:00 a 20:00 h · Sáb 09:00 a 13:00 h', 2, true),

  ('Club de Jubilados UV3', 'social', '👴',
   'Actividades recreativas, talleres de manualidades y almuerzos de confraternidad.',
   'Local comunal, segundo piso', '999000103',
   'Reuniones: Martes y jueves 15:00 a 18:00 h', 3, true),

  ('Puesto de Salud UV3', 'salud', '🏥',
   'Atención de medicina general, enfermería, vacunación y control de niño sano.',
   'Block 8, primer piso', '999000104',
   'Atención: L-S 08:00 a 14:00 h', 4, true),

  ('Comisaría del Sector', 'seguridad', '👮',
   'Policía Nacional del Perú. Denuncias, patrullaje y seguridad ciudadana.',
   'Av. Principal, esquina con Jr. Los Álamos', '999000105',
   'Atención: 24 horas', 5, true),

  ('Mercado de la Unidad', 'abasto', '🛒',
   'Puestos de abarrotes, verduras, carnes y frutas. Recojo de pedidos y delivery vecinal.',
   'Pasaje del Mercado, Block 1', '999000106',
   'Atención: L-D 06:00 a 20:00 h', 6, true)
) AS v(name, category, icon, description, address, phone, hours, sort_order, is_active)
WHERE NOT EXISTS (SELECT 1 FROM public.community_services s WHERE s.name = v.name);

-- ============================================================================
-- FIN
-- ============================================================================
