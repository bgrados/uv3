-- ============================================================================
-- UV3 PLATFORM — SEED DEMO PORTAL (idempotente, NO borra datos)
-- Ejecutar en Supabase SQL Editor. Solo inserta si no existe por título.
-- ============================================================================

-- Comunicados ficticios
INSERT INTO public.announcements (title, content, category, is_featured, image_url)
SELECT * FROM (VALUES
  ('Asamblea general de propietarios: mejoras en iluminación y seguridad', 'La Junta General de Propietarios convoca a todos los delegados de bloques a la asamblea ordinaria del próximo viernes a las 20:00 h en el local comunal. Se tratarán presupuesto anual, mejoras en iluminación de áreas verdes y avances de la digitalización vecinal.', 'general', true, NULL),
  ('Mantenimiento preventivo de la cancha sintética principal', 'Se informa que la cancha sintética estará cerrada por trabajos de nivelación e iluminación del lunes al miércoles de la próxima semana. Agradecemos la comprensión de equipos y vecinos.', 'comunicado', false, NULL),
  ('Gran éxito en la campaña vecinal de salud y vacunación familiar', 'En coordinación con la municipalidad y el centro de salud local se atendió a más de 300 familias en la losa deportiva del Sector A. Gracias a los voluntarios vecinales.', 'eventos', false, NULL),
  ('Requisitos y entrega de credenciales para el Campeonato Apertura 2026', 'La comisión organizadora anuncia la apertura del padrón de registro y entrega de credenciales para delegados acreditados. Trámite en la oficina de deportes los martes de 18:00 a 20:00 h.', 'deportes', true, NULL),
  ('Nuevo horario de atención de la oficina vecinal', 'A partir de esta semana, la oficina de la Junta atenderá de lunes a viernes de 17:00 a 20:00 h. Se reciben reclamos de mantenimiento, seguridad y deportes.', 'general', false, NULL),
  ('Festival cultural y feria de emprendimientos vecinales', 'Este sábado se realizará el festival cultural en el parque central con feria de emprendimientos, música y actividades para niños. Todos los vecinos están invitados.', 'eventos', false, NULL)
) AS v(title, content, category, is_featured, image_url)
WHERE NOT EXISTS (SELECT 1 FROM public.announcements a WHERE a.title = v.title);

-- Avisos de utilidad ficticios
INSERT INTO public.notices (title, content, icon, is_featured, is_active, sort_order)
SELECT * FROM (VALUES
  ('Corte de agua programado', 'El servicio de agua se suspenderá el jueves de 09:00 a 14:00 h por mantenimiento en la red principal. Almacene agua con anticipación.', '💧', true, true, 1),
  ('Recolección de residuos sólidos', 'Los días martes y viernes se realiza la recolección. Saque la basura a partir de las 19:00 h en los puntos establecidos.', '♻️', false, true, 2),
  ('Centro de salud: vacunación gratuita', 'Vacunación contra influenza y tétanos todos los miércoles de 09:00 a 13:00 h en el puesto de salud del Sector B. Llevar DNI.', '🏥', false, true, 3),
  ('Junta vecinal: horario de atención', 'Oficina abierta de lunes a viernes de 17:00 a 20:00 h. Reclamos y sugerencias en el local comunal frente al parque central.', '🏛️', true, true, 4),
  ('Convocatoria a voluntarios', 'Se necesitan voluntarios para el festival cultural del sábado. Inscripciones en la oficina vecinal hasta el viernes.', '🤝', false, true, 5)
) AS v(title, content, icon, is_featured, is_active, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.notices n WHERE n.title = v.title);

-- Comercios ficticios adicionales
INSERT INTO public.businesses (name, category, description, phone, whatsapp, address, is_active, is_featured, sort_order)
SELECT * FROM (VALUES
  ('Bodega El Vecino', 'tienda', 'Abarrotes, bebidas y productos de primera necesidad. Atención todos los días.', '999111222', '999111222', 'Block 3, local 12', true, false, 10),
  ('Farmacia Salud UV3', 'farmacia', 'Medicamentos, insumos médicos y atención farmacéutica.', '999222333', '999222333', 'Block 5, local 8', true, true, 11),
  ('Pollería El Dorado', 'restaurante', 'Pollos a la brasa y platos criollos. Delivery disponible.', '999333444', '999333444', 'Block 7, local 3', true, false, 12),
  ('Ferretería El Constructor', 'tienda', 'Materiales de construcción, herramientas y pinturas.', '999444555', '999444555', 'Block 2, local 15', true, false, 13),
  ('Salón de Belleza Estilo', 'servicio', 'Cortes, tintes y tratamientos capilares.', '999555666', '999555666', 'Block 9, local 6', true, false, 14),
  ('Panadería La Espiga', 'tienda', 'Pan fresco, pasteles y bocaditos todos los días.', '999666777', '999666777', 'Block 4, local 20', true, true, 15)
) AS v(name, category, description, phone, whatsapp, address, is_active, is_featured, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.businesses b WHERE b.name = v.name);

-- ============================================================================
-- FIN
-- ============================================================================