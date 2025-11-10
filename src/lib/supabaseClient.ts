import { createClient } from "@supabase/supabase-js";
import { Database } from '../types/database.types';

const url = import.meta.env.VITE_SUPABASE_URL!;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY!;
const functionsUrl = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL ?? undefined;

export const supabase = createClient<Database>(url, anon, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  global: { fetch },
  functions: {
    url: functionsUrl,
  },
});
