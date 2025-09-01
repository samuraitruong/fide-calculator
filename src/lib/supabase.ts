import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/util/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Helper function to convert database row to camelCase
export function convertToCamelCase<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  const converted: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    converted[camelKey] = value;
  }
  return converted;
}

// Helper function to convert camelCase to snake_case for database
export function convertToSnakeCase<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  const converted: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    converted[snakeKey] = value;
  }
  return converted;
}
