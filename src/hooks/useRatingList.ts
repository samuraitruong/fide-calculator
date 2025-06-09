import { useState, useEffect, useCallback } from 'react';
import { Result } from '@/util/types';

const STORAGE_KEY = 'fideResults';

export function useRatingList() {
  const [results, setResults] = useState<Result[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setResults(JSON.parse(saved));
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
    setResults(prev => [...prev, result]);
  }, []);

  const removeResult = useCallback((index: number) => {
    setResults(prev => prev.filter((_, i) => i !== index));
  }, []);

  const updateResult = useCallback((index: number, updated: Partial<Result>) => {
    setResults(prev => prev.map((r, i) => i === index ? { ...r, ...updated } : r));
  }, []);

  const setAllResults = useCallback((newResults: Result[]) => {
    setResults(newResults);
  }, []);

  return { results, addResult, removeResult, updateResult, setAllResults };
}
