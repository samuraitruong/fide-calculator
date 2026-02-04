import { useState, useEffect, useCallback } from 'react';
import { Result, RatingType } from '@/util/types';

const getStorageKey = (type: RatingType) => `fideResults_${type}`;
const OLD_STORAGE_KEY = 'fideResults'; // Old format key

export function useRatingList(type: RatingType = 'standard') {
  const [results, setResults] = useState<Result[]>([]);
  const storageKey = getStorageKey(type);

  // Migration function to handle old data format
  const migrateOldData = useCallback((type: RatingType) => {
    if (type !== 'standard') return null; // Only migrate to standard
    const oldData = localStorage.getItem(OLD_STORAGE_KEY);
    if (!oldData) return null;
    try {
      const parsedData: Result[] = JSON.parse(oldData);
      if (Array.isArray(parsedData) && parsedData.length > 0) {
        // Migrate the data to new format
        const migratedData = parsedData.map(r => r.id ? r : { 
          ...r, 
          id: Date.now().toString() + Math.random().toString().slice(2) 
        });
        if (migratedData.length > 0) {
          localStorage.setItem(storageKey, JSON.stringify(migratedData));
          localStorage.removeItem(OLD_STORAGE_KEY);
          console.log(`Migrated ${migratedData.length} results from old format to standard`);
          return migratedData;
        }
      }
    } catch (error) {
      console.error('Error migrating old data:', error);
    }
    return null;
  }, [storageKey]);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        let loaded: Result[] = JSON.parse(saved);
        // Add id if missing
        loaded = loaded.map(r => r.id ? r : { ...r, id: Date.now().toString() + Math.random().toString().slice(2) });
        setResults(loaded);
      } catch (error) {
        console.error('Error loading results:', error);
        setResults([]);
      }
    } else {
      // Try to migrate old data if no new data exists
      const migratedData = migrateOldData(type);
      if (Array.isArray(migratedData) && migratedData.length > 0) {
        setResults(migratedData);
      }
      // If migration is skipped or fails, do not set state or localStorage
    }
  }, [storageKey, migrateOldData, type]);

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(results));
  }, [results, storageKey]);

  // Listen for importedResults event and update results
  useEffect(() => {
    function handleImportedResults(e: CustomEvent<Result[]>) {
      if (e.detail && Array.isArray(e.detail)) {
        setResults(e.detail);
      }
    }
    // Type assertion for addEventListener
    const listener = handleImportedResults as EventListener;
    window.addEventListener('importedResults', listener);
    return () => window.removeEventListener('importedResults', listener);
  }, []);

  const addResult = useCallback((result: Result) => {
    setResults(prev => {
      if (result.id) {
        // If id exists, update by id
        const idx = prev.findIndex(r => r.id === result.id);
        if (idx !== -1) {
          return prev.map((r, i) => i === idx ? { ...result } : r);
        }
      }
      // Otherwise, add new with id
      return [...prev, { ...result, id: result.id || (Date.now().toString() + Math.random().toString().slice(2)) }];
    });
  }, []);

  const removeResult = useCallback((index: number) => {
    setResults(prev => prev.filter((_, i) => i !== index));
  }, []);

  const updateResult = useCallback((indexOrId: number | string, updated: Partial<Result>) => {
    setResults(prev => prev.map((r, i) => {
      if ((typeof indexOrId === 'number' && i === indexOrId) || (typeof indexOrId === 'string' && r.id === indexOrId)) {
        return { ...r, ...updated };
      }
      return r;
    }));
  }, []);

  const setAllResults = useCallback((newResults: Result[]) => {
    setResults(newResults);
  }, []);

  return { results, addResult, removeResult, updateResult, setAllResults };
}
