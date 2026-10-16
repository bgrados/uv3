-- UV3 PLATFORM — MIGRATION: Add sport column to tournaments
-- Run this in your Supabase SQL Editor

ALTER TABLE public.tournaments
  ADD COLUMN IF NOT EXISTS sport TEXT NOT NULL DEFAULT 'futbol'
    CHECK (sport IN ('futbol', 'futbol_sala', 'basquet'));

-- Update existing tournaments to default 'futbol' (already handled by DEFAULT)
COMMENT ON COLUMN public.tournaments.sport IS 'Tipo de deporte: futbol, futbol_sala, basquet';
