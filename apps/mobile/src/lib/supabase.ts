import { createSupabaseClient, type Database } from '@fide-calculator/shared';

// Get environment variables - Expo automatically loads EXPO_PUBLIC_* variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key not configured. Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY');
}

export const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey);

// Re-export types for convenience
export type { Database };
