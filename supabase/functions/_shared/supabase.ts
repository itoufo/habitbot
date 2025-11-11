// Supabase client utilities for Edge Functions

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

export function createSupabaseClient(
  supabaseUrl: string,
  supabaseKey: string
): SupabaseClient {
  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function getSupabaseClient(): SupabaseClient {
  const supabaseUrl = Deno.env.get('HABIT_SUPABASE_URL');
  const supabaseKey = Deno.env.get('HABIT_SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing HABIT_SUPABASE_URL or HABIT_SUPABASE_SERVICE_ROLE_KEY');
  }

  return createSupabaseClient(supabaseUrl, supabaseKey);
}
