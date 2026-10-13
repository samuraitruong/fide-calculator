import { getResultRatingMonth, getRatingMonthDisplayName, migrateResultRatingMonth } from '@fide-calculator/shared';
import { useState, useEffect, useCallback } from 'react';
import { Result, RatingType } from '@/util/types';

export interface BackupData {
  id: string;
  month: string; // Format: "May-2025"
  data: Result[];
  createdAt: string;
  totalChange: number;
  gameCount: number;
  type: RatingType; // Add type to backup data
}

const getBackupStorageKey = (type: RatingType) => `fideBackups_${type}`;
const OLD_BACKUP_STORAGE_KEY = 'fideBackups'; // Old format key

export function useBackup(type: RatingType = 'standard') {
  const [backups, setBackups] = useState<BackupData[]>([]);
  const [loadedStorageKey, setLoadedStorageKey] = useState<string | null>(null);
  const storageKey = getBackupStorageKey(type);

  // Migration function to handle old backup data format
  const migrateOldBackupData = useCallback((type: RatingType) => {
    if (type !== 'standard') return null; // Only migrate to standard
    const oldData = localStorage.getItem(OLD_BACKUP_STORAGE_KEY);
    if (!oldData) return null;
    try {
      const parsedData: BackupData[] = JSON.parse(oldData);
      if (Array.isArray(parsedData) && parsedData.length > 0) {
        // Migrate the data to new format
        const migratedData = parsedData.map(backup => ({
          ...backup,
          data: backup.data.map(migrateResultRatingMonth),
          type: 'standard' as RatingType // Add type to old backups
        }));
        if (migratedData.length > 0) {
          localStorage.setItem(storageKey, JSON.stringify(migratedData));
          localStorage.removeItem(OLD_BACKUP_STORAGE_KEY);
          console.log(`Migrated ${migratedData.length} backups from old format to standard`);
          return migratedData;
        }
      }
    } catch (error) {
      console.error('Error migrating old backup data:', error);
    }
    return null;
  }, [storageKey]);

  // Load backups from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const loaded: BackupData[] = JSON.parse(saved);
        const migrated = loaded.map(backup => ({ ...backup, data: backup.data.map(migrateResultRatingMonth) }));
        setBackups(migrated);
        setLoadedStorageKey(storageKey);
        localStorage.setItem(storageKey, JSON.stringify(migrated));
      } catch (error) {
        console.error('Error loading backups:', error);
        setBackups([]);
      }
    } else {
      // Try to migrate old backup data if no new data exists
      const migratedData = migrateOldBackupData(type);
      if (Array.isArray(migratedData) && migratedData.length > 0) {
        setBackups(migratedData);
        setLoadedStorageKey(storageKey);
      }
      if ((!Array.isArray(migratedData) || migratedData.length === 0) && (!localStorage.getItem(OLD_BACKUP_STORAGE_KEY) || type !== 'standard')) {
        setBackups([]);
        setLoadedStorageKey(storageKey);
      }
      // If migration fails, preserve the stored backup data
    }
  }, [storageKey, migrateOldBackupData, type]);

  // Save backups to localStorage on change
  useEffect(() => {
    if (loadedStorageKey === storageKey) localStorage.setItem(storageKey, JSON.stringify(backups));
  }, [backups, storageKey, loadedStorageKey]);

  // Get the most popular month from the data
  const getMostPopularMonth = useCallback((results: Result[]): string => {
    const monthCounts: { [key: string]: number } = {};
    
    results.forEach(result => {
      const month = getRatingMonthDisplayName(getResultRatingMonth(result));
      monthCounts[month] = (monthCounts[month] || 0) + 1;
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
      data: results.map(migrateResultRatingMonth),
      createdAt: new Date().toISOString(),
      totalChange,
      gameCount: results.length,
      type // Add type to backup
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
  }, [getMostPopularMonth, type]);

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