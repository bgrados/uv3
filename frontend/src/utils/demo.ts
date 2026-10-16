/**
 * Identificadores usados por los datos de demostración del panel cuando la base
 * de datos está vacía o no configurada. Son UUID válidos para que las Server
 * Actions (que validan con Zod) no rechacen las operaciones por formato.
 */
export const DEMO_TOURNAMENT_ID = '11111111-1111-4111-8111-111111111111';
export const DEMO_VENUE_ID = '44444444-4444-4444-8444-444444444444';

export const DEMO_MATCH_IDS = [
  '22222222-2222-4222-8222-222222222221',
  '22222222-2222-4222-8222-222222222222',
] as const;
