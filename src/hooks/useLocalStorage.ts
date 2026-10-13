import { useState, useEffect, useCallback } from 'react';
import type { Result, MonthlyData } from '@/util/types';
import { migrateResultRatingMonth, groupResultsByRatingMonth } from '@fide-calculator/shared';

function normalizeLocalResult(result: Result): Result {
  return migrateResultRatingMonth({
    ...result,
    id: result.id || `local-game-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    ratingType: result.ratingType || 'standard',
  });
}

let cachedResults: Result[] | null = null;
let resultLoadError: Error | null = null;
const resultSubscribers = new Set<(results: Result[]) => void>();

function publishResults(next: Result[]) {
  cachedResults = next;
  resultSubscribers.forEach(listener => listener(next));
}

function changeResults(update: (previous: Result[]) => Result[]) {
  if (resultLoadError) throw resultLoadError;
  const next = update(cachedResults ?? []).map(normalizeLocalResult);
  localStorage.setItem('fide-calculator-results', JSON.stringify(next));
  publishResults(next);
}


export interface LocalProfile {
  id: string;
  name: string;
  fideId?: string;
  title?: string;
  federation?: string;
  birthYear?: number;
  standardRating: number;
  rapidRating: number;
  blitzRating: number;
  isLocal: boolean;
}

type ProfileSnapshot = { profiles: LocalProfile[]; activeProfile: LocalProfile | null };
let cachedProfiles: ProfileSnapshot | null = null;
const profileSubscribers = new Set<(snapshot: ProfileSnapshot) => void>();

function publishProfiles(profiles: LocalProfile[], activeProfile: LocalProfile | null) {
  cachedProfiles = { profiles, activeProfile };
  profileSubscribers.forEach(listener => listener(cachedProfiles!));
}

export function useLocalStorage() {
  const [profiles, setProfiles] = useState<LocalProfile[]>([]);
  const [activeProfile, setActiveProfileState] = useState<LocalProfile | null>(null);
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);

  // Profile edits also update the calculator's official rating immediately.
  useEffect(() => {
    const receive = (snapshot: ProfileSnapshot) => {
      setProfiles(snapshot.profiles);
      setActiveProfileState(snapshot.activeProfile);
    };
    profileSubscribers.add(receive);
    if (cachedProfiles) receive(cachedProfiles);
    return () => {
      profileSubscribers.delete(receive);
      if (profileSubscribers.size === 0) cachedProfiles = null;
    };
  }, []);

  // Every mounted consumer shares game changes (e.g. Home and History).
  useEffect(() => {
    resultSubscribers.add(setResults);
    if (cachedResults !== null) setResults(cachedResults);
    const onStorage = (event: StorageEvent) => {
      if (event.key !== 'fide-calculator-results' && event.key !== null) return;
      try {
        const stored = localStorage.getItem('fide-calculator-results');
        const migrated = stored ? (JSON.parse(stored) as Result[]).map(normalizeLocalResult) : [];
        publishResults(migrated);
      } catch (error) {
        console.error('Error receiving stored games:', error);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => {
      resultSubscribers.delete(setResults);
      if (resultSubscribers.size === 0) cachedResults = null;
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  // Load data from localStorage on mount
  useEffect(() => {
    try {
      const storedProfiles = localStorage.getItem('fide-calculator-profiles');
      const storedActiveProfileId = localStorage.getItem('fide-calculator-active-profile-id');
      const storedResults = localStorage.getItem('fide-calculator-results');
      
      if (cachedProfiles === null) {
        const profilesList: LocalProfile[] = storedProfiles ? JSON.parse(storedProfiles) : [];
        const selected = profilesList.find(profile => profile.id === storedActiveProfileId) ?? profilesList[0] ?? null;
        publishProfiles(profilesList, selected);
      }
      if (cachedResults === null) {
        resultLoadError = null;
        const parsed: Result[] = storedResults ? JSON.parse(storedResults) : [];
        const migrated = parsed.map(normalizeLocalResult);
        publishResults(migrated);
        if (storedResults && JSON.stringify(migrated) !== storedResults) {
          localStorage.setItem('fide-calculator-results', JSON.stringify(cachedResults));
        }
      }
      setResults(cachedResults ?? []);
    } catch (error) {
      resultLoadError = error instanceof Error ? error : new Error('Unable to load stored games');
      console.error('Error loading from localStorage:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Save profiles to localStorage whenever they change
  useEffect(() => {
    if (!loading && profiles.length > 0) {
      localStorage.setItem('fide-calculator-profiles', JSON.stringify(profiles));
    }
  }, [profiles, loading]);

  // Save active profile ID whenever it changes
  useEffect(() => {
    if (!loading && activeProfile) {
      localStorage.setItem('fide-calculator-active-profile-id', activeProfile.id);
    }
  }, [activeProfile, loading]);

  const addResult = useCallback((result: Result) => {
    return changeResults(previous => [...previous, result]);
  }, []);

  const removeResult = useCallback((indexOrId: number | string) => {
    const id = typeof indexOrId === 'string' ? indexOrId : cachedResults?.[indexOrId]?.id;
    if (!id) throw new Error('Game no longer exists');
    return changeResults(previous => previous.filter(result => result.id !== id));
  }, []);

  const updateResult = useCallback((index: number, updates: Partial<Result>) => {
    const id = cachedResults?.[index]?.id;
    if (!id) throw new Error('Game no longer exists');
    return changeResults(previous => previous.map(result =>
      result.id === id ? { ...result, ...updates } : result,
    ));
  }, []);

  const setAllResults = useCallback((newResults: Result[]) => {
    return changeResults(() => newResults);
  }, []);

  const createProfile = useCallback((profileData: Omit<LocalProfile, 'id'>) => {
    const newProfile: LocalProfile = {
      ...profileData,
      id: 'local-profile-' + Date.now() + Math.random().toString().slice(2),
    };
    publishProfiles([...(cachedProfiles?.profiles ?? []), newProfile], newProfile);
    return newProfile;
  }, []);

  const updateProfile = useCallback((updates: Partial<LocalProfile>) => {
    const current = cachedProfiles;
    if (!current?.activeProfile) throw new Error('No active profile');
    const updated = { ...current.activeProfile, ...updates };
    publishProfiles(current.profiles.map(profile => profile.id === current.activeProfile!.id ? updated : profile), updated);
  }, []);

  const deleteProfile = useCallback((profileId: string) => {
    const remaining = (cachedProfiles?.profiles ?? []).filter(profile => profile.id !== profileId);
    const active = remaining.find(profile => profile.id === cachedProfiles?.activeProfile?.id) ?? remaining[0] ?? null;
    publishProfiles(remaining, active);
  }, []);

  const setActiveProfile = useCallback((profile: LocalProfile | null) => {
    const profilesList = cachedProfiles?.profiles ?? [];
    const active = profile ? profilesList.find(item => item.id === profile.id) ?? profile : null;
    publishProfiles(profilesList, active);
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem('fide-calculator-profiles');
    localStorage.removeItem('fide-calculator-active-profile-id');
    localStorage.removeItem('fide-calculator-results');
    localStorage.removeItem('fide-calculator-mode');
    publishProfiles([], null);
    publishResults([]);
    window.location.reload();
  }, []);

  const generateMonthlyData = useCallback((type: 'standard' | 'blitz' | 'rapid'): MonthlyData[] =>
    groupResultsByRatingMonth(results, type), [results]);

  return {
    profiles,
    activeProfile,
    results,
    loading,
    addResult,
    removeResult,
    updateResult,
    setAllResults,
    createProfile,
    updateProfile,
    deleteProfile,
    setActiveProfile,
    signOut,
    generateMonthlyData,
  };
}
