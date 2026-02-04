import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Result, MonthlyData } from '@fide-calculator/shared';

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

export function useLocalStorage() {
  const [profiles, setProfiles] = useState<LocalProfile[]>([]);
  const [activeProfile, setActiveProfile] = useState<LocalProfile | null>(null);
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);

  // Load data from AsyncStorage on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const storedProfiles = await AsyncStorage.getItem('fide-calculator-profiles');
        const storedActiveProfileId = await AsyncStorage.getItem('fide-calculator-active-profile-id');
        const storedResults = await AsyncStorage.getItem('fide-calculator-results');
        
        if (storedProfiles) {
          const profilesList = JSON.parse(storedProfiles);
          setProfiles(profilesList);
          
          // Set active profile
          if (storedActiveProfileId && profilesList.length > 0) {
            const active = profilesList.find((p: LocalProfile) => p.id === storedActiveProfileId);
            if (active) {
              setActiveProfile(active);
            } else {
              setActiveProfile(profilesList[0]); // Fallback to first profile
            }
          } else if (profilesList.length > 0) {
            setActiveProfile(profilesList[0]); // Default to first profile
          }
        }
        
        if (storedResults) {
          const parsedResults = JSON.parse(storedResults);
          // Ensure all results have required fields
          const validatedResults = parsedResults.map((result: { date: string; playerRating: number; opponentName: string; opponentRating: number; kFactor: number; result: string; ratingChange: number; ratingType?: string; monthKey?: string }) => ({
            ...result,
            ratingType: result.ratingType || 'standard', // Default to standard if missing
            monthKey: result.monthKey || (result.date ? `${new Date(result.date).getFullYear()}-${new Date(result.date).toLocaleDateString('en-US', { month: 'short' })}` : undefined)
          }));
          setResults(validatedResults);
        }
      } catch (error) {
        console.error('Error loading from AsyncStorage:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Save results to AsyncStorage whenever they change
  useEffect(() => {
    const saveResults = async () => {
      if (results.length > 0) {
        try {
          await AsyncStorage.setItem('fide-calculator-results', JSON.stringify(results));
        } catch (error) {
          console.error('Error saving results:', error);
        }
      }
    };
    saveResults();
  }, [results]);

  // Save profiles to AsyncStorage whenever they change
  useEffect(() => {
    const saveProfiles = async () => {
      if (profiles.length > 0) {
        try {
          await AsyncStorage.setItem('fide-calculator-profiles', JSON.stringify(profiles));
        } catch (error) {
          console.error('Error saving profiles:', error);
        }
      }
    };
    saveProfiles();
  }, [profiles]);

  // Save active profile ID whenever it changes
  useEffect(() => {
    const saveActiveProfile = async () => {
      if (activeProfile) {
        try {
          await AsyncStorage.setItem('fide-calculator-active-profile-id', activeProfile.id);
        } catch (error) {
          console.error('Error saving active profile:', error);
        }
      }
    };
    saveActiveProfile();
  }, [activeProfile]);

  const addResult = useCallback((result: Result) => {
    setResults(prev => [...prev, result]);
  }, []);

  const removeResult = useCallback((indexOrId: number | string) => {
    if (typeof indexOrId === 'string') {
      // Remove by ID
      setResults(prev => prev.filter(result => result.id !== indexOrId));
    } else {
      // Remove by index (for backward compatibility)
      setResults(prev => prev.filter((_, i) => i !== indexOrId));
    }
  }, []);

  const updateResult = useCallback((index: number, updates: Partial<Result>) => {
    setResults(prev => prev.map((result, i) => 
      i === index ? { ...result, ...updates } : result
    ));
  }, []);

  const setAllResults = useCallback((newResults: Result[]) => {
    setResults(newResults);
  }, []);

  const createProfile = useCallback((profileData: Omit<LocalProfile, 'id'>) => {
    const newProfile: LocalProfile = {
      ...profileData,
      id: 'local-profile-' + Date.now() + Math.random().toString().slice(2),
    };
    setProfiles(prev => [...prev, newProfile]);
    setActiveProfile(newProfile);
    return newProfile;
  }, []);

  const updateProfile = useCallback((updates: Partial<LocalProfile>) => {
    if (activeProfile) {
      const updatedProfile = { ...activeProfile, ...updates };
      setActiveProfile(updatedProfile);
      setProfiles(prev => prev.map(p => p.id === activeProfile.id ? updatedProfile : p));
    }
  }, [activeProfile]);

  const deleteProfile = useCallback((profileId: string) => {
    setProfiles(prev => prev.filter(p => p.id !== profileId));
    if (activeProfile?.id === profileId) {
      const remainingProfiles = profiles.filter(p => p.id !== profileId);
      setActiveProfile(remainingProfiles.length > 0 ? remainingProfiles[0] : null);
    }
  }, [activeProfile, profiles]);

  const signOut = useCallback(async () => {
    try {
      await AsyncStorage.removeItem('fide-calculator-profiles');
      await AsyncStorage.removeItem('fide-calculator-active-profile-id');
      await AsyncStorage.removeItem('fide-calculator-results');
      await AsyncStorage.removeItem('fide-calculator-mode');
      setProfiles([]);
      setActiveProfile(null);
      setResults([]);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }, []);

  // Generate monthly data from results
  const generateMonthlyData = useCallback((type: 'standard' | 'blitz' | 'rapid'): MonthlyData[] => {
    const typeResults = results.filter(r => r.ratingType === type);
    
    // Group by month
    const monthlyGroups: Record<string, Result[]> = {};
    typeResults.forEach(result => {
      // Parse the date string properly
      let date: Date;
      if (result.date.includes('/')) {
        // Handle MM/DD/YYYY format from toLocaleDateString()
        const [month, day, year] = result.date.split('/');
        date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      } else if (result.date.includes('-')) {
        // Handle YYYY-MM-DD format
        date = new Date(result.date);
      } else {
        // Handle other date formats
        date = new Date(result.date);
      }
      
      const monthKey = `${date.getFullYear()}-${date.toLocaleDateString('en-US', { month: 'short' })}`;
      
      if (!monthlyGroups[monthKey]) {
        monthlyGroups[monthKey] = [];
      }
      monthlyGroups[monthKey].push(result);
    });

    // Convert to MonthlyData format
    const monthlyData: MonthlyData[] = Object.entries(monthlyGroups).map(([monthKey, monthResults]) => {
      const totalChange = Math.round(100 * monthResults.reduce((acc, curr) => acc + curr.ratingChange, 0)) / 100;
      const currentDate = new Date();
      const [year, month] = monthKey.split('-');
      // Create a proper date object for the month
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthIndex = monthNames.indexOf(month);
      const monthDate = new Date(parseInt(year), monthIndex, 1);
      
      const isCurrentMonth = monthDate.getMonth() === currentDate.getMonth() && 
                           monthDate.getFullYear() === currentDate.getFullYear();
      
      // Convert month abbreviation to full name for better display
      const monthFullNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      const monthFullName = monthFullNames[monthIndex];
      
      return {
        monthKey,
        month: `${monthFullName} ${year}`,
        results: monthResults,
        totalChange,
        gameCount: monthResults.length,
        isCurrentMonth,
        isReadOnly: !isCurrentMonth,
      };
    });

    // Sort by month (newest first)
    return monthlyData.sort((a, b) => {
      const [yearA, monthA] = a.monthKey.split('-');
      const [yearB, monthB] = b.monthKey.split('-');
      const dateA = new Date(`${monthA} 1, ${yearA}`);
      const dateB = new Date(`${monthB} 1, ${yearB}`);
      return dateB.getTime() - dateA.getTime();
    });
  }, [results]);

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

