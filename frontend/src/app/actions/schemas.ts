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

// --- Espacios / canchas -----------------------------------------------------
const SPORTS = ['futbol', 'futbol_sala', 'basquet', 'voley'] as const;

export const spaceSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres.').max(120),
  description: z.string().optional().nullable(),
  image_url: z.string().url('URL inválida.').optional().nullable().or(z.literal('')),
  day_rate: z.coerce.number().min(0, 'No puede ser negativo.').max(100000),
  night_rate: z.coerce.number().min(0, 'No puede ser negativo.').max(100000),
  event_day_rate: z.coerce.number().min(0).max(100000).optional().nullable(),
  event_night_rate: z.coerce.number().min(0).max(100000).optional().nullable(),
  night_start: z.string().min(4, 'Hora inválida.'),
  night_end: z.string().min(1, 'Hora inválida.'),
  allows_events: z.coerce.boolean().default(true),
  is_active: z.boolean().optional().default(true),
  sort_order: z.coerce.number().int().min(0).max(999).default(0),
  sports: z.array(z.enum(SPORTS)).default([]),
});

export type SpaceFormValues = z.infer<typeof spaceSchema>;
export const SPORT_OPTIONS = SPORTS;

// --- Comercios --------------------------------------------------------------
export const businessSchema = z.object({
  name: z.string().min(2, 'El nombre es requerido.').max(120),
  category: z.enum(['tienda', 'farmacia', 'mercado', 'restaurante', 'servicio', 'otro']),
  description: z.string().max(600).optional().nullable(),
  phone: z.string().max(40).optional().nullable(),
  whatsapp: z.string().max(40).optional().nullable(),
  address: z.string().max(200).optional().nullable(),
  logo_url: z.string().optional().nullable(),
  image_url: z.string().optional().nullable(),
  is_active: z.coerce.boolean().default(true),
  is_featured: z.coerce.boolean().default(false),
  sort_order: z.coerce.number().int().min(0).max(999).default(0),
});

export type BusinessFormValues = z.infer<typeof businessSchema>;

// --- Configuración del sitio ------------------------------------------------
export const siteSettingsSchema = z.object({
  site_name: z.string().min(2, 'El nombre es requerido.').max(120),
  slogan: z.string().max(200).optional().nullable(),
  logo_url: z.string().optional().nullable(),
  favicon_url: z.string().optional().nullable(),
  contact_phone: z.string().max(40).optional().nullable(),
  whatsapp: z.string().max(40).optional().nullable(),
  yape_number: z.string().max(40).optional().nullable(),
  yape_holder: z.string().max(120).optional().nullable(),
  facebook_url: z.string().max(300).optional().nullable(),
  night_start: z.string().default('18:00'),
  night_end: z.string().default('06:00'),
});

export type SiteSettingsFormValues = z.infer<typeof siteSettingsSchema>;

// --- Reservas ---------------------------------------------------------------
export const reservationSchema = z
  .object({
    space_id: z.string().uuid('Espacio inválido.'),
    customer_name: z.string().min(3, 'Escribe tu nombre completo.').max(120),
    customer_phone: z
      .string()
      .min(6, 'Ingresa un teléfono válido.')
      .max(40)
      .regex(/[0-9]/, 'Ingresa un teléfono válido.'),
    customer_email: z.string().email('Correo inválido.').optional().or(z.literal('')).nullable(),
    usage_type: z.enum(['deporte', 'evento']),
    sport: z.enum(SPORTS).optional().nullable(),
    event_description: z.string().max(400).optional().nullable(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida.'),
    start_time: z.string().regex(/^\d{2}:\d{2}$/, 'Hora de inicio inválida.'),
    duration_minutes: z.coerce
      .number()
      .int()
      .min(30, 'La reserva mínima es de 30 minutos.')
      .max(24 * 60, 'La reserva no puede superar las 24 horas.'),
    notes: z.string().max(500).optional().nullable(),
    payment_proof_url: z.string().min(1, 'Adjunta tu comprobante de Yape.'),
  })
  .refine((d) => d.usage_type === 'evento' || !!d.sport, {
    message: 'Selecciona el deporte.',
    path: ['sport'],
  });

export type ReservationFormValues = z.infer<typeof reservationSchema>;

// --- Tournament Schemas ---
export const tournamentSchema = z
  .object({
    name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres.').max(150),
    description: z.string().optional().nullable(),
    sport: z.enum(['futbol', 'futbol_sala', 'basquet', 'voley'], {
      message: 'Selecciona un deporte válido.',
    }).default('futbol'),
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

// --- Galería ----------------------------------------------------------------
export const gallerySchema = z.object({
  title: z.string().min(3, 'El título debe tener al menos 3 caracteres.').max(150),
  description: z.string().max(600, 'La descripción es demasiado larga.').optional().nullable(),
  image_url: z.string().optional().nullable(),
});

export type GalleryFormValues = z.infer<typeof gallerySchema>;

// --- Comunicados ------------------------------------------------------------
export const ANNOUNCEMENT_CATEGORIES = ['general', 'deportes', 'eventos', 'comunicado'] as const;

export const announcementSchema = z.object({
  title: z.string().min(3, 'El título debe tener al menos 3 caracteres.').max(200),
  content: z.string().min(10, 'El contenido debe tener al menos 10 caracteres.'),
  category: z.enum(ANNOUNCEMENT_CATEGORIES, { message: 'Selecciona una categoría válida.' }).default('general'),
  image_url: z.string().optional().nullable(),
  video_url: z
    .string()
    .url('El enlace del video no es válido (debe empezar por https://).')
    .optional()
    .or(z.literal(''))
    .nullable(),
  is_featured: z.coerce.boolean().default(false),
});

export type AnnouncementFormValues = z.infer<typeof announcementSchema>;
