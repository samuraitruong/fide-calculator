import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { UserProfile } from '@fide-calculator/shared';
import { fetchUserProfiles, createUserProfile, updateUserProfile } from '@fide-calculator/shared';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profiles: UserProfile[];
  activeProfile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  createProfile: (profileData: Partial<UserProfile>) => Promise<{ error: Error | null }>;
  updateProfile: (profileData: Partial<UserProfile>) => Promise<{ error: Error | null }>;
  setActiveProfile: (profileId: string) => Promise<void>;
  refreshSession: () => Promise<{ data?: unknown; error?: Error | null }>;
  requestPasswordReset: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [activeProfile, setActiveProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfiles = useCallback(async (userId: string) => {
    try {
      console.log('AuthContext: Fetching profiles for user:', userId);
      const fetchedProfiles = await fetchUserProfiles(supabase, userId);
      
      if (fetchedProfiles.length > 0) {
        console.log('AuthContext: Profiles found:', fetchedProfiles);
        setProfiles(fetchedProfiles);
        // Set the first profile as active by default
        setActiveProfile(fetchedProfiles[0]);
      } else {
        console.log('AuthContext: No profiles found for user');
        setProfiles([]);
        setActiveProfile(null);
      }
    } catch (error) {
      console.error('AuthContext: Error fetching profiles:', error);
      setProfiles([]);
      setActiveProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    console.log('AuthContext: Initializing auth state...');
    
    // Add a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.warn('AuthContext: Loading timeout reached, forcing loading to false');
      setLoading(false);
    }, 10000); // 10 second timeout
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('AuthContext: Initial session loaded:', session ? 'User logged in' : 'No session');
      clearTimeout(timeoutId);
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfiles(session.user.id);
      } else {
        setProfiles([]);
        setActiveProfile(null);
        setLoading(false);
      }
    }).catch((error) => {
      console.error('AuthContext: Error getting initial session:', error);
      clearTimeout(timeoutId);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
        // Use setTimeout to avoid React rendering issues with Supabase auth state changes
        setTimeout(async () => {
            console.log('AuthContext: Auth state changed:', event, session ? 'User logged in' : 'No session');
            setSession(session);
            setUser(session?.user ?? null);
            console.log('AuthContext: User state set to:', session?.user?.id || 'null');
            if (session?.user) {
                await fetchProfiles(session.user.id);
            } else {
                setProfiles([]);
                setActiveProfile(null);
                setLoading(false);
            }
        }, 0);
    });

    return () => {
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, [fetchProfiles]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  // Request a password reset email (forgot password)
  const requestPasswordReset = async (email: string) => {
    try {
      // For Expo, use a deep link or custom URL scheme
      const redirectTo = 'fidecalculator://reset-password';
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
      return { error: error as unknown as Error | null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  // Update current user's password (change password or after recovery)
  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return { error: error as unknown as Error | null };
  };

  const handleCreateProfile = async (profileData: Partial<UserProfile>) => {
    if (!user) {
      return { error: new Error('No user logged in') };
    }

    const result = await createUserProfile(supabase, user.id, profileData);
    if (!result.error) {
      // Refresh profiles data
      await fetchProfiles(user.id);
    }
    return result;
  };

  const handleUpdateProfile = async (profileData: Partial<UserProfile>) => {
    if (!activeProfile) {
      return { error: new Error('No active profile') };
    }

    const result = await updateUserProfile(supabase, activeProfile.id, profileData);
    if (!result.error && user) {
      // Refresh profiles data
      await fetchProfiles(user.id);
    }
    return result;
  };

  const switchActiveProfile = async (profileId: string) => {
    const profile = profiles.find(p => p.id === profileId);
    if (profile) {
      setActiveProfile(profile);
    }
  };

  const refreshSession = async () => {
    try {
      console.log('AuthContext: Refreshing session...');
      const { data, error } = await supabase.auth.refreshSession();
      if (error) {
        console.error('AuthContext: Error refreshing session:', error);
        return { error };
      }
      console.log('AuthContext: Session refreshed successfully');
      return { data };
    } catch (err) {
      console.error('AuthContext: Exception refreshing session:', err);
      return { error: new Error('Failed to refresh session') };
    }
  };

  const value: AuthContextType = {
    user,
    session,
    profiles,
    activeProfile,
    loading,
    signIn,
    signUp,
    signOut,
    createProfile: handleCreateProfile,
    updateProfile: handleUpdateProfile,
    setActiveProfile: switchActiveProfile,
    refreshSession,
    requestPasswordReset,
    updatePassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
