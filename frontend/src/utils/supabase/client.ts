'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { UV3SupabaseClient } from './types';

export function createClient(): UV3SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qhafedyvlwwzjzkwbvsu.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

  return createBrowserClient(
    supabaseUrl,
    supabaseAnonKey
  ) as unknown as UV3SupabaseClient;
}
