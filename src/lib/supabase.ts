import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { mockSupabase, mockUnits, mockSettings } from './mockData';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Demo mode - use mock data if Supabase is not configured
const isDemoMode = !supabaseUrl || !supabaseAnonKey || supabaseUrl === 'https://demo.supabase.co';

if (isDemoMode) {
  console.log('⚠️ Demo Mode Active - Using local mock data');
}

export const supabase: SupabaseClient = isDemoMode
  ? (mockSupabase as unknown as SupabaseClient)
  : createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });

export const demoUnits = mockUnits;
export const demoSettings = mockSettings;
export const isUsingDemoData = isDemoMode;
