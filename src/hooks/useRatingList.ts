import { useState, useEffect, useCallback } from 'react';
import { Result } from '@/util/types';

const STORAGE_KEY = 'fideResults';

export function useRatingList() {
  const [results, setResults] = useState<Result[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      let loaded: Result[] = JSON.parse(saved);
      // Add id if missing
      loaded = loaded.map(r => r.id ? r : { ...r, id: Date.now().toString() + Math.random().toString().slice(2) });
      setResults(loaded);
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(results));
  }, [results]);

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
