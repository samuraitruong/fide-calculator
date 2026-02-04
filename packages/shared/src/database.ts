import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database, UserProfile } from './types';
import { convertToCamelCaseRecursive } from './utils';

export function createSupabaseClient(
  supabaseUrl: string,
  supabaseAnonKey: string
): SupabaseClient<Database> {
  return createClient<Database>(supabaseUrl, supabaseAnonKey);
}

// Helper functions for profile operations
export async function fetchUserProfiles(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<UserProfile[]> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching profiles:', error);
    return [];
  }

  if (!data || data.length === 0) {
    return [];
  }

  return data.map(profile => convertToCamelCaseRecursive(profile) as UserProfile);
}

export async function createUserProfile(
  supabase: SupabaseClient<Database>,
  userId: string,
  profileData: Partial<UserProfile>
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase.from('user_profiles').insert({
      user_id: userId,
      name: profileData.name || '',
      fide_id: profileData.fideId || null,
      title: profileData.title || null,
      federation: profileData.federation || null,
      birth_year: profileData.birthYear || null,
      standard_rating: profileData.standardRating || 1200,
      rapid_rating: profileData.rapidRating || 1200,
      blitz_rating: profileData.blitzRating || 1200,
    });

    if (error) {
      console.error('Error creating profile:', error);
      return { error: error as Error };
    }

    return { error: null };
  } catch (error) {
    console.error('Exception creating profile:', error);
    return { error: error as Error };
  }
}

export async function updateUserProfile(
  supabase: SupabaseClient<Database>,
  profileId: string,
  profileData: Partial<UserProfile>
): Promise<{ error: Error | null }> {
  try {
    const updateData: Record<string, unknown> = {};
    
    if (profileData.name !== undefined) updateData.name = profileData.name;
    if (profileData.fideId !== undefined) updateData.fide_id = profileData.fideId;
    if (profileData.title !== undefined) updateData.title = profileData.title;
    if (profileData.federation !== undefined) updateData.federation = profileData.federation;
    if (profileData.birthYear !== undefined) updateData.birth_year = profileData.birthYear;
    if (profileData.standardRating !== undefined) updateData.standard_rating = profileData.standardRating;
    if (profileData.rapidRating !== undefined) updateData.rapid_rating = profileData.rapidRating;
    if (profileData.blitzRating !== undefined) updateData.blitz_rating = profileData.blitzRating;

    const { error } = await supabase
      .from('user_profiles')
      .update(updateData)
      .eq('id', profileId);

    if (error) {
      console.error('Error updating profile:', error);
      return { error: error as Error };
    }

    return { error: null };
  } catch (error) {
    console.error('Exception updating profile:', error);
    return { error: error as Error };
  }
}

