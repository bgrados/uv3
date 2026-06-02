import type { SupabaseClient } from '@supabase/supabase-js';

type AuthArgs = {
  email?: string;
  password?: string;
  options?: {
    data?: Record<string, string>;
    redirectTo?: string;
  };
};

export interface UV3SupabaseUser {
  id: string;
  email?: string;
  [key: string]: unknown;
}

export interface UV3SupabaseAuthClient {
  getUser(): Promise<{ data: { user: UV3SupabaseUser | null } }>;
  signInWithPassword(args: { email: string; password: string }): Promise<{ error: { message: string } | null }>;
  signUp(args: AuthArgs): Promise<{ error: { message: string } | null }>;
  signOut(): Promise<{ error: { message: string } | null }>;
  resetPasswordForEmail(email: string, options: { redirectTo: string }): Promise<{ error: { message: string } | null }>;
  updateUser(args: { password: string }): Promise<{ error: { message: string } | null }>;
}

export type UV3SupabaseClient = Omit<SupabaseClient, 'auth'> & {
  auth: UV3SupabaseAuthClient;
};
