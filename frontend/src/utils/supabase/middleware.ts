import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { UV3SupabaseClient } from './types';
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from './config';

const STAFF_ROLES = ['admin', 'organizer', 'referee'];
const DASHBOARD_PREFIX = '/dashboard';
const AUTH_PATHS = ['/login', '/register', '/forgot-password', '/reset-password'];

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  if (!isSupabaseConfigured()) {
    // Sin claves reales de Supabase no hay sesión posible: solo se bloquea el
    // panel administrativo, el resto del portal público sigue navegable.
    if (request.nextUrl.pathname.startsWith(DASHBOARD_PREFIX)) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('message', 'El sistema aún no está configurado. Contacta al administrador.');
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  }) as unknown as UV3SupabaseClient;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // La autorización se decide con la sesión real de Supabase + el rol guardado
  // en public.users. Nunca con cookies editables por el cliente.
  let role: string | null = null;
  if (user) {
    try {
      const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
      role = profile?.role ?? null;
    } catch {
      role = null;
    }
  }

  const isAuthorized = !!user && !!role && STAFF_ROLES.includes(role);

  const pathname = request.nextUrl.pathname;
  const isDashboard = pathname.startsWith(DASHBOARD_PREFIX);
  const isAuthPage = AUTH_PATHS.some((p) => pathname.startsWith(p));

  if (isDashboard && !isAuthorized) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('message', 'Acceso exclusivo para administradores, organizadores y árbitros.');
    url.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthPage && isAuthorized) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    url.searchParams.delete('message');
    url.searchParams.delete('redirectTo');
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
