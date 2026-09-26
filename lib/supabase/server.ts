import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function getServerSupabase(): SupabaseClient | null {
  if (supabaseUrl && supabaseServiceKey && supabaseUrl.startsWith('http')) {
    try {
      return createClient(supabaseUrl, supabaseServiceKey, {
        auth: { persistSession: false }
      });
    } catch (err) {
      console.warn('Server Supabase initialization warning:', err);
      return null;
    }
  }
  return null;
}
