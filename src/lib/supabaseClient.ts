import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database.types';

function readEnv() {
  const vite = (typeof import.meta !== 'undefined' && import.meta?.env) || {};
  const win = (typeof window !== 'undefined' && (window as any).__ENV__) || {};
  const proc: any = typeof process !== 'undefined' ? process.env : {};

  const url = vite.VITE_SUPABASE_URL || win.VITE_SUPABASE_URL || proc.VITE_SUPABASE_URL;
  const anon = vite.VITE_SUPABASE_ANON_KEY || win.VITE_SUPABASE_ANON_KEY || proc.VITE_SUPABASE_ANON_KEY;

  return { url, anon };
}

const { url, anon } = readEnv();

export const supabase = (url && anon)
  ? createClient<Database>(url, anon, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    })
  : null;
