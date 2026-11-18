import {createClient, type SupabaseClient} from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** True when the browser build has the Supabase env vars it needs. */
export const isSupabaseConfigured = Boolean(url && anonKey);

/** Singleton browser client; `null` when Supabase is not configured (the app shows a notice instead of crashing). */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, anonKey as string, {
      auth: {persistSession: true, autoRefreshToken: true, detectSessionInUrl: true},
    })
  : null;
