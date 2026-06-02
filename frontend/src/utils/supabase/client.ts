'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { UV3SupabaseClient } from './types';

export function createClient(): UV3SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL or Anon Key is missing from environment variables.');
  }

  return createBrowserClient(
    supabaseUrl,
    supabaseAnonKey
  ) as unknown as UV3SupabaseClient;
}
