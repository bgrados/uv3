-- ============================================================================
-- UV3 PLATFORM — SEED AGENDA DE LA COMUNIDAD (idempotente, NO borra datos)
-- Ejecutar en Supabase SQL Editor después de feature_agenda.sql.
-- Solo inserta si no existe por título. Las fechas se calculan desde hoy.
-- ============================================================================

INSERT INTO public.community_events (title, description, event_date, start_time, end_time, location, category, is_featured, sort_order)
SELECT * FROM (VALUES
  ('Asamblea general ordinaria de propietarios',
   'La Junta General convoca a todos los propietarios y delegados de bloque. Agenda: presupuesto anual, seguridad ciudadana y avance de la digitalización vecinal.',
   CURRENT_DATE + 2, '20:00', '22:00', 'Local comunal', 'asamblea', true, 1),

  ('Misa dominical comunitaria',
   'Celebración eucarística de la comunidad. Actividad abierta a todas las familias de la unidad vecinal.',
   CURRENT_DATE + 3, '11:00', '12:00', 'Iglesia Nuestra Señora de la Unidad', 'religioso', false, 2),

  ('Partido inaugural — Campeonato Apertura 2026',
   'Arranca la nueva temporada de la liga vecinal. Presentación de equipos y banda de música.',
   CURRENT_DATE + 4, '15:00', '18:00', 'Cancha sintética principal', 'deporte', true, 3),

  ('Campaña de vacunación gratuita',
   'Influenza y tétanos para todas las edades. Organizada junto al Puesto de Salud UV3. Llevar DNI.',
   CURRENT_DATE + 5, '09:00', '13:00', 'Losa deportiva del Sector A', 'salud', false, 4),

  ('Taller de reciclaje para niños',
   'Actividad educativa sobre el cuidado del ambiente y separación de residuos. Incluye materiales.',
   CURRENT_DATE + 6, '10:00', '12:00', 'Local comunal', 'social', false, 5),

  ('Feria de emprendimientos vecinales',
   'Comercios y emprendedores de la unidad ofrecen sus productos. Música en vivo y zona gastronómica.',
   CURRENT_DATE + 7, '11:00', '19:00', 'Parque central', 'social', true, 6),

  ('Mantenimiento de áreas verdes (bloques 4 y 5)',
   'Trabajos de poda, siembra y recuperación de jardines. Se solicita no pisar las áreas en recuperación.',
   CURRENT_DATE + 9, '08:00', '14:00', 'Bloques 4 y 5', 'mantenimiento', false, 7),

  ('Reunión de delegados de bloque',
   'Coordinación mensual de delegados: incidencias, reservas de espacios y organización de campeonatos.',
   CURRENT_DATE + 11, '19:00', '20:30', 'Oficina vecinal', 'asamblea', false, 8)
) AS v(title, description, event_date, start_time, end_time, location, category, is_featured, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.community_events e WHERE e.title = v.title);

-- ============================================================================
-- FIN
-- ============================================================================
