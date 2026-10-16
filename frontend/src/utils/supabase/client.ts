'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { UV3SupabaseClient } from './types';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from './config';

export function createClient(): UV3SupabaseClient {
  return createBrowserClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  ) as unknown as UV3SupabaseClient;
}
