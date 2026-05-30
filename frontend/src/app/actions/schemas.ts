import { z } from 'zod';

// --- Team Schemas ---
export const teamSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres.').max(100),
  delegate_id: z.string().uuid('Delegado inválido.').optional().nullable(),
});

export type TeamFormValues = z.infer<typeof teamSchema>;

// --- Player Schemas ---
export const playerSchema = z.object({
  first_name: z.string().min(2, 'El nombre es requerido.'),
  last_name: z.string().min(2, 'El apellido es requerido.'),
  dni: z
    .string()
    .regex(/^\d{8}$/, 'El DNI debe tener exactamente 8 dígitos numéricos.'),
  birth_date: z.string().optional().nullable(),
  jersey_number: z.coerce
    .number()
    .int()
    .min(1, 'Mínimo 1.')
    .max(99, 'Máximo 99.'),
  position: z.enum(['arquero', 'defensa', 'mediocampista', 'delantero'], {
    message: 'Selecciona una posición válida.',
  }),
  team_id: z.string().uuid('Equipo inválido.'),
});

export type PlayerFormValues = z.infer<typeof playerSchema>;

// --- Tournament Schemas ---
export const tournamentSchema = z
  .object({
    name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres.').max(150),
    description: z.string().optional().nullable(),
    format: z.enum(['liga', 'grupos', 'eliminacion'], {
      message: 'Selecciona un formato válido.',
    }),
    category: z.string().min(1, 'La categoría es requerida.').default('libre'),
    start_date: z.string().min(1, 'La fecha de inicio es requerida.'),
    end_date: z.string().min(1, 'La fecha de fin es requerida.'),
  })
  .refine(
    (data) => {
      if (data.start_date && data.end_date) {
        return new Date(data.end_date) >= new Date(data.start_date);
      }
      return true;
    },
    { message: 'La fecha de fin debe ser posterior a la de inicio.', path: ['end_date'] }
  );

export type TournamentFormValues = z.infer<typeof tournamentSchema>;

// --- Match / Standings Schemas ---
export const updateMatchScoreSchema = z.object({
  match_id: z.string().uuid(),
  home_score: z.coerce.number().int().min(0),
  away_score: z.coerce.number().int().min(0),
  status: z.enum(['scheduled', 'playing', 'completed', 'cancelled']),
});

export type UpdateMatchScoreValues = z.infer<typeof updateMatchScoreSchema>;
