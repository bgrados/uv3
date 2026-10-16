import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { isSupabaseConfigured } from '@/utils/supabase/config';
import type { EmailOtpType } from '@/utils/supabase/types';

/**
 * Callback de autenticación.
 *
 * Supabase redirige aquí tras:
 *   - confirmar el correo de un registro (`type=signup`),
 *   - verificar un enlace de recuperación de contraseña (`type=recovery`),
 *   - confirmar un cambio de correo (`type=email_change`).
 *
 * Según la configuración del proyecto el enlace llega con `code` (flujo PKCE
 * usado por @supabase/ssr) o con `token_hash` + `type` (flujo de plantilla de
 * correo). Se soportan ambos para que el flujo funcione sin tocar las
 * plantillas por defecto.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);

  const code = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type');
  const next = searchParams.get('next');

  // Destino por defecto: la recuperación lleva a fijar la nueva contraseña.
  const defaultNext = type === 'recovery' ? '/reset-password' : '/dashboard';
  const redirectTo = sanitizeNext(next) ?? defaultNext;

  // Errores devueltos directamente por Supabase (enlace inválido o expirado).
  const errorDescription = searchParams.get('error_description') ?? searchParams.get('error');
  if (errorDescription) {
    return NextResponse.redirect(
      `${origin}/login?message=${encodeURIComponent(
        'El enlace no es válido o ya expiró. Solicita uno nuevo.'
      )}`
    );
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(
      `${origin}/login?message=${encodeURIComponent(
        'El sistema aún no está configurado. Contacta al administrador.'
      )}`
    );
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.redirect(
      `${origin}/login?message=${encodeURIComponent('No se pudo iniciar la sesión.')}`
    );
  }

  let success = false;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    success = !error;
  } else if (tokenHash && type) {
    // Flujo de plantilla de correo: { { .TokenHash } } + { { .Type } }.
    const { error } = await supabase.auth.verifyOtp({
      type: type as EmailOtpType,
      token_hash: tokenHash,
    });
    success = !error;
  }

  if (!success) {
    return NextResponse.redirect(
      `${origin}/login?message=${encodeURIComponent(
        'No se pudo verificar el enlace. Solicita uno nuevo o inicia sesión.'
      )}`
    );
  }

  return NextResponse.redirect(`${origin}${redirectTo}`);
}

/** Sólo permite rutas internas para evitar open redirects. */
function sanitizeNext(next: string | null): string | null {
  if (!next) return null;
  if (!next.startsWith('/') || next.startsWith('//')) return null;
  return next;
}
