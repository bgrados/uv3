import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { UV3SupabaseClient } from './types';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from './config';

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export async function createClient(): Promise<UV3SupabaseClient> {
  const cookieStore = await cookies();

  return createServerClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing sessions.
          }
        },
      },
    }
  ) as unknown as UV3SupabaseClient;
}

/** Cliente con service role para tareas administrativas (crear usuarios). Solo usar en server. */
export function createAdminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!serviceKey || serviceKey === 'your-service-key' || serviceKey.length < 40) {
    return null;
  }
  return createSupabaseClient(SUPABASE_URL, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
