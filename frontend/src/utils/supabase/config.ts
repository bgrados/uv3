/**
 * Utilidades de configuración de Supabase.
 *
 * El proyecto usa claves reales provistas por variables de entorno. Si no están
 * (o siguen siendo los placeholders de `.env.example`), las rutas y acciones que
 * dependen de la base de datos deben fallar de forma controlada en vez de
 * intentar autenticarse con credenciales inválidas.
 */

export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || 'https://placeholder-uv3.supabase.co';
export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || 'placeholder-anon-key';

export function isSupabaseConfigured(): boolean {
  const url = SUPABASE_URL;
  const key = SUPABASE_ANON_KEY;

  if (!url || !key) return false;
  if (url.includes('your-project')) return false;
  if (key.includes('your-anon-key') || key.includes('placeholder')) return false;

  // Las claves reales (JWT clásico o publishable) son bastante más largas.
  return key.length >= 40;
}
