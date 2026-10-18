-- ============================================================================
-- UV3 PLATFORM — REPARACIÓN DE DATOS: FIXTURE DEL CAMPEONATO APERTURA 2026
-- Ejecutar en el SQL Editor de Supabase.
--
-- ¿Por qué existe este archivo?
--   El seed original creó 4 partidos del campeonato (ids 50000000-…), pero se
--   generaron además 12 filas repetidas (mismo cruce y jornada) sin fecha ni
--   cancha. Este script deja un fixture coherente de 3 jornadas:
--     J1 (jugada)   : Real UV3 3-2 Deportivo Block 5 · Atletico PC 1-1 Sport Los Jardines
--     J2 (24 oct)   : Real UV3 vs Atletico PC        · Sport Los Jardines vs Deportivo Block 5
--     J3 (7/8 nov)  : Real UV3 vs Sport Los Jardines · Deportivo Block 5 vs Atletico PC
--
-- Es idempotente: se puede volver a ejecutar sin efectos secundarios. Nunca
-- elimina partidos que tengan goles o sanciones asociados.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Fechas y canchas de los partidos que se conservan
--    (Cancha Sintetica Principal = 10000000-…-0002,
--     Losa Deportiva Sector A   = 10000000-…-0001)
-- ----------------------------------------------------------------------------

-- Jornada 1 (ya jugada)
UPDATE public.matches
   SET date_time = '2026-05-23T20:00:00Z',
       venue_id  = '10000000-0000-4000-8000-000000000002'
 WHERE id = '50000000-0000-4000-8000-000000000001';
-- → Real Unidad Vecinal 3 3-2 Deportivo Block 5 FC (5 goles y 2 sanciones)

UPDATE public.matches
   SET date_time = '2026-05-24T20:00:00Z',
       venue_id  = '10000000-0000-4000-8000-000000000001'
 WHERE id = '50000000-0000-4000-8000-000000000002';
-- → Atletico Parque Central 1-1 Sport Los Jardines

-- Jornada 2 (próxima)
UPDATE public.matches
   SET round     = 2,
       date_time = '2026-10-24T20:00:00Z',
       venue_id  = '10000000-0000-4000-8000-000000000002'
 WHERE id = '50000000-0000-4000-8000-000000000003';
-- → Real Unidad Vecinal 3 vs Atletico Parque Central

UPDATE public.matches
   SET round     = 2,
       date_time = '2026-10-24T22:00:00Z',
       venue_id  = '10000000-0000-4000-8000-000000000001'
 WHERE id = '50000000-0000-4000-8000-000000000004';
-- → Sport Los Jardines vs Deportivo Block 5 FC

-- Jornada 3 (a partir de filas que estaban duplicadas sin jornada correcta)
UPDATE public.matches
   SET round     = 3,
       date_time = '2026-11-07T20:00:00Z',
       venue_id  = '10000000-0000-4000-8000-000000000002'
 WHERE id = '96d3f686-cbfe-4f9d-b663-fa0d3a60271a';
-- → Real Unidad Vecinal 3 vs Sport Los Jardines

UPDATE public.matches
   SET round     = 3,
       date_time = '2026-11-08T16:00:00Z',
       venue_id  = '10000000-0000-4000-8000-000000000001'
 WHERE id = '055adf6d-1b7e-41aa-8044-e47ac1c0b904';
-- → Deportivo Block 5 FC vs Atletico Parque Central

-- ----------------------------------------------------------------------------
-- 2. Eliminación de los 10 partidos duplicados
--    Doble salvaguarda: sólo borra los ids indicados y nunca toca un partido
--    que tenga goles o sanciones.
-- ----------------------------------------------------------------------------
DELETE FROM public.matches m
 WHERE m.id IN (
        '3df60967-ea3f-4efa-9dc0-1533024a0967', -- J1 Atletico PC vs Sport Los Jardines (duplicado)
        '8a365deb-6608-4e33-9ec9-e4a03858b39a', -- J1 Atletico PC vs Sport Los Jardines (duplicado)
        'a4722058-bd04-4d69-a9d3-2e45fbe5d604', -- J1 Real UV3 vs Deportivo Block 5 (duplicado)
        'f7b849c6-e39c-4a41-a1e7-3606495b3302', -- J1 Real UV3 vs Deportivo Block 5 (duplicado)
        'f01946fe-84f2-4d8c-99d5-e6f554868c62', -- J2 Real UV3 vs Sport Los Jardines (duplicado)
        'f5731734-9f23-4195-aa95-4b9fe166b47a', -- J2 Deportivo Block 5 vs Atletico PC (duplicado)
        '233a94b2-5d06-4e5c-a290-fdf70a7983f9', -- J3 Real UV3 vs Atletico PC (fuera de torneo)
        '3a145727-972c-4d25-9103-357004916266', -- J3 Real UV3 vs Atletico PC (fuera de torneo)
        '9e466052-f2e1-4675-88c8-19dfa688b193', -- J3 Sport Los Jardines vs Deportivo Block 5 (fuera de torneo)
        'ea905e5b-4c38-4d52-8d6f-393b0a6972fe'  -- J3 Sport Los Jardines vs Deportivo Block 5 (fuera de torneo)
       )
   AND NOT EXISTS (SELECT 1 FROM public.goals g    WHERE g.match_id = m.id)
   AND NOT EXISTS (SELECT 1 FROM public.sanctions s WHERE s.match_id = m.id);

-- ----------------------------------------------------------------------------
-- 3. Verificación: deben quedar 6 partidos, 3 jornadas, ninguno sin fecha
-- ----------------------------------------------------------------------------
SELECT round, status, date_time,
       (SELECT name FROM public.teams WHERE id = m.home_team_id) AS local,
       (SELECT name FROM public.teams WHERE id = m.away_team_id) AS visita,
       (SELECT name FROM public.venues WHERE id = m.venue_id)     AS cancha
  FROM public.matches m
 ORDER BY round, date_time;
