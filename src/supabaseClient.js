import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** True when both Supabase env vars are set (see .env.example). */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// createClient throws without a URL, so only create it when configured –
// the rest of the app keeps working in guest mode otherwise.
export const supabase = isSupabaseConfigured ? createClient(supabaseUrl, supabaseAnonKey) : null;
