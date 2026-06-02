import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { UV3SupabaseClient } from './types';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('your-project') || supabaseAnonKey.includes('your-anon-key')) {
    console.warn('Supabase URL or Anon Key is missing or using placeholder values. Skipping session update.');
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
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

  const protectedPaths = ['/dashboard', '/teams', '/tournaments', '/admin'];
  const authPaths = ['/login', '/register', '/forgot-password'];
  const pathname = request.nextUrl.pathname;

  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));
  const isAuthPage = authPaths.some((p) => pathname.startsWith(p));

  let userRole: string | null = null;
  if (user) {
    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
    userRole = profile?.role ?? null;
  }

  const isAdmin = userRole === 'admin';

  if (isProtected && (!user || (pathname.startsWith('/dashboard') && !isAdmin))) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('message', 'Solo el administrador puede entrar al panel.');
    url.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthPage && user) {
    const url = request.nextUrl.clone();
    url.pathname = isAdmin ? '/dashboard' : '/';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
