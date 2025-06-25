import { useState, useEffect, useCallback } from 'react';
import { Result } from '@/util/types';

export interface BackupData {
  id: string;
  month: string; // Format: "May-2025"
  data: Result[];
  createdAt: string;
  totalChange: number;
  gameCount: number;
}

const BACKUP_STORAGE_KEY = 'fideBackups';

export function useBackup() {
  const [backups, setBackups] = useState<BackupData[]>([]);

  // Load backups from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(BACKUP_STORAGE_KEY);
    if (saved) {
      try {
        const loaded: BackupData[] = JSON.parse(saved);
        setBackups(loaded);
      } catch (error) {
        console.error('Error loading backups:', error);
      }
    }
  }, []);

  // Save backups to localStorage on change
  useEffect(() => {
    localStorage.setItem(BACKUP_STORAGE_KEY, JSON.stringify(backups));
  }, [backups]);

  // Get the most popular month from the data
  const getMostPopularMonth = useCallback((results: Result[]): string => {
    const monthCounts: { [key: string]: number } = {};
    
    results.forEach(result => {
      try {
        // Try to parse the date more robustly
        let date: Date;
        
        // Handle different date formats
        if (result.date.includes('/')) {
          // Handle DD/MM/YYYY or MM/DD/YYYY format
          const parts = result.date.split('/');
          if (parts.length === 3) {
            // Assume DD/MM/YYYY for Australian format
            const day = parseInt(parts[0]);
            const month = parseInt(parts[1]) - 1; // Month is 0-indexed
            const year = parseInt(parts[2]);
            date = new Date(year, month, day);
          } else {
            date = new Date(result.date);
          }
        } else {
          date = new Date(result.date);
        }
        
        // Check if date is valid
        if (isNaN(date.getTime())) {
          console.warn('Invalid date format:', result.date);
          return;
        }
        
        const monthKey = date.toLocaleDateString('en-AU', { 
          month: 'long', 
          year: 'numeric' 
        });
        monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1;
      } catch {
        // If date parsing fails, skip this result
        console.warn('Invalid date format:', result.date);
      }
    });

    // Find the month with the most games
    let mostPopularMonth = '';
    let maxCount = 0;
    
    Object.entries(monthCounts).forEach(([month, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostPopularMonth = month;
      }
    });

    return mostPopularMonth || new Date().toLocaleDateString('en-AU', { 
      month: 'long', 
      year: 'numeric' 
    });
  }, []);

  // Create a backup of current data
  const createBackup = useCallback((results: Result[]) => {
    if (results.length === 0) {
      return false; // Don't create backup for empty data
    }

    const month = getMostPopularMonth(results);
    const totalChange = Math.round(100 * results.reduce((acc, curr) => acc + curr.ratingChange, 0)) / 100;
    
    const backup: BackupData = {
      id: Date.now().toString() + Math.random().toString().slice(2),
      month,
      data: [...results],
      createdAt: new Date().toISOString(),
      totalChange,
      gameCount: results.length
    };

    setBackups(prev => {
      // Check if backup for this month already exists
      const existingIndex = prev.findIndex(b => b.month === month);
      if (existingIndex !== -1) {
        // Update existing backup
        return prev.map((b, i) => i === existingIndex ? backup : b);
      } else {
        // Add new backup
        return [...prev, backup];
      }
    });

    return true;
  }, [getMostPopularMonth]);

  // Restore a backup
  const restoreBackup = useCallback((backupId: string): Result[] | null => {
    const backup = backups.find(b => b.id === backupId);
    return backup ? backup.data : null;
  }, [backups]);

  // Delete a backup
  const deleteBackup = useCallback((backupId: string) => {
    setBackups(prev => prev.filter(b => b.id !== backupId));
  }, []);

  // Clear all backups
  const clearAllBackups = useCallback(() => {
    setBackups([]);
  }, []);

  return {
    backups,
    createBackup,
    restoreBackup,
    deleteBackup,
    clearAllBackups
  };
} 