import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://uqvumgpyzoefplmkjszq.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxdnVtZ3B5em9lZnBsbWtqc3pxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA1MDI2MDUsImV4cCI6MjEwNjA3ODYwNX0.5qpB3lCsa1_yc34H1ucELszbn2vfGyDiShF8-stx6QY';

// Validate credentials
export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('your-supabase-project-id') &&
  !supabaseAnonKey.includes('your-anon-key-here')
);

// Initialize Supabase Client
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

if (!isSupabaseConfigured) {
  console.warn(
    '⚠️ [AAZHI] Supabase credentials not found or placeholder values used. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in frontend/.env to enable live cloud database integration.'
  );
}
