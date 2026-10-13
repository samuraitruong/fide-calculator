import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Result, MonthlyData } from '@fide-calculator/shared';
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
let resultWrites: Promise<void> = Promise.resolve();

function publishResults(next: Result[]) {
  cachedResults = next;
  resultSubscribers.forEach(listener => listener(next));
}

function changeResults(update: (previous: Result[]) => Result[]): Promise<void> {
  if (resultLoadError) return Promise.reject(resultLoadError);
  const write = resultWrites.catch(() => {}).then(async () => {
    const next = update(cachedResults ?? []).map(normalizeLocalResult);
    await AsyncStorage.setItem('fide-calculator-results', JSON.stringify(next));
    publishResults(next);
  });
  resultWrites = write;
  return write;
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
    return () => {
      resultSubscribers.delete(setResults);
      if (resultSubscribers.size === 0) cachedResults = null;
    };
  }, []);

  // Load data from AsyncStorage on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const storedProfiles = await AsyncStorage.getItem('fide-calculator-profiles');
        const storedActiveProfileId = await AsyncStorage.getItem('fide-calculator-active-profile-id');
        const storedResults = await AsyncStorage.getItem('fide-calculator-results');
        
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
            await changeResults(previous => previous);
          }
        }
        setResults(cachedResults ?? []);
      } catch (error) {
        resultLoadError = error instanceof Error ? error : new Error('Unable to load stored games');
        console.error('Error loading from AsyncStorage:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Save profiles to AsyncStorage whenever they change
  useEffect(() => {
    const saveProfiles = async () => {
      if (!loading && profiles.length > 0) {
        try {
          await AsyncStorage.setItem('fide-calculator-profiles', JSON.stringify(profiles));
        } catch (error) {
          console.error('Error saving profiles:', error);
        }
      }
    };
    saveProfiles();
  }, [profiles, loading]);

  // Save active profile ID whenever it changes
  useEffect(() => {
    const saveActiveProfile = async () => {
      if (!loading && activeProfile) {
        try {
          await AsyncStorage.setItem('fide-calculator-active-profile-id', activeProfile.id);
        } catch (error) {
          console.error('Error saving active profile:', error);
        }
      }
    };
    saveActiveProfile();
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

  const signOut = useCallback(async () => {
    try {
      await resultWrites.catch(() => {});
      await AsyncStorage.removeItem('fide-calculator-profiles');
      await AsyncStorage.removeItem('fide-calculator-active-profile-id');
      await AsyncStorage.removeItem('fide-calculator-results');
      await AsyncStorage.removeItem('fide-calculator-mode');
      publishProfiles([], null);
      publishResults([]);
    } catch (error) {
      console.error('Error signing out:', error);
    }
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

