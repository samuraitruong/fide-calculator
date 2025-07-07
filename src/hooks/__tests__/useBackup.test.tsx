import { renderHook, act } from '@testing-library/react';
import { useBackup } from '../useBackup';
import { Result } from '@/util/types';

describe('useBackup', () => {
  const mockResults: Result[] = [
    { 
      id: '1', 
      playerRating: 1500, 
      opponentName: 'Player 1', 
      opponentRating: 1600, 
      kFactor: 10,
      result: 'win',
      ratingChange: 5.6,
      date: '2024-03-20'
    },
    { 
      id: '2', 
      playerRating: 1600, 
      opponentName: 'Player 2', 
      opponentRating: 1700, 
      kFactor: 10,
      result: 'loss',
      ratingChange: -4.8,
      date: '2024-03-20'
    }
  ];

  beforeEach(() => {
    localStorage.clear();
  });

  it('should initialize with empty backups', () => {
    const { result } = renderHook(() => useBackup('standard'));
    expect(result.current.backups).toEqual([]);
  });

  it('should create a backup', () => {
    const { result } = renderHook(() => useBackup('standard'));
    
    act(() => {
      const success = result.current.createBackup(mockResults);
      expect(success).toBe(true);
    });

    expect(result.current.backups).toHaveLength(1);
    expect(result.current.backups[0].data).toEqual(mockResults);
    expect(result.current.backups[0].type).toBe('standard');
  });

  it('should not create backup for empty data', () => {
    const { result } = renderHook(() => useBackup('standard'));
    
    act(() => {
      const success = result.current.createBackup([]);
      expect(success).toBe(false);
    });

    expect(result.current.backups).toHaveLength(0);
  });

  it('should delete a backup', () => {
    const { result } = renderHook(() => useBackup('standard'));
    
    act(() => {
      result.current.createBackup(mockResults);
    });

    const backupId = result.current.backups[0].id;
    
    act(() => {
      result.current.deleteBackup(backupId);
    });

    expect(result.current.backups).toHaveLength(0);
  });

  it('should restore a backup', () => {
    const { result } = renderHook(() => useBackup('standard'));
    
    act(() => {
      result.current.createBackup(mockResults);
    });

    const backupId = result.current.backups[0].id;
    
    act(() => {
      const restored = result.current.restoreBackup(backupId);
      expect(restored).toEqual(mockResults);
    });
  });

  it('should return null for non-existent backup', () => {
    const { result } = renderHook(() => useBackup('standard'));
    
    act(() => {
      const restored = result.current.restoreBackup('non-existent-id');
      expect(restored).toBeNull();
    });
  });

  it('should clear all backups', () => {
    const { result } = renderHook(() => useBackup('standard'));
    
    act(() => {
      result.current.createBackup(mockResults);
      // Create a backup with different data to ensure we have multiple backups
      result.current.createBackup([{ 
        id: '3', 
        playerRating: 1700, 
        opponentName: 'Player 3', 
        opponentRating: 1800, 
        kFactor: 10,
        result: 'draw',
        ratingChange: 0,
        date: '2024-04-21' // Different month to create separate backup
      }]);
    });

    expect(result.current.backups).toHaveLength(2);
    
    act(() => {
      result.current.clearAllBackups();
    });

    expect(result.current.backups).toHaveLength(0);
  });

  it('should load backups from localStorage on mount', () => {
    const mockBackup = {
      id: 'test-id',
      month: 'March 2024',
      data: mockResults,
      createdAt: new Date().toISOString(),
      totalChange: 0.8,
      gameCount: 2,
      type: 'standard' as const
    };
    
    localStorage.setItem('fideBackups_standard', JSON.stringify([mockBackup]));
    
    const { result } = renderHook(() => useBackup('standard'));
    expect(result.current.backups).toEqual([mockBackup]);
  });

  it('should save backups to localStorage on change', () => {
    const { result } = renderHook(() => useBackup('standard'));
    
    act(() => {
      result.current.createBackup(mockResults);
    });

    const saved = localStorage.getItem('fideBackups_standard');
    expect(saved).toBeTruthy();
    
    const parsedBackups = JSON.parse(saved!);
    expect(parsedBackups).toHaveLength(1);
    expect(parsedBackups[0].data).toEqual(mockResults);
    expect(parsedBackups[0].type).toBe('standard');
  });

  it('should use different storage keys for different rating types', () => {
    const { result: standardResult } = renderHook(() => useBackup('standard'));
    const { result: blitzResult } = renderHook(() => useBackup('blitz'));
    
    act(() => {
      standardResult.current.createBackup(mockResults);
      blitzResult.current.createBackup([mockResults[0]]);
    });

    const standardSaved = localStorage.getItem('fideBackups_standard');
    const blitzSaved = localStorage.getItem('fideBackups_blitz');
    
    expect(standardSaved).toBeTruthy();
    expect(blitzSaved).toBeTruthy();
    
    const standardBackups = JSON.parse(standardSaved!);
    const blitzBackups = JSON.parse(blitzSaved!);
    
    expect(standardBackups).toHaveLength(1);
    expect(blitzBackups).toHaveLength(1);
    expect(standardBackups[0].type).toBe('standard');
    expect(blitzBackups[0].type).toBe('blitz');
  });

  it('should update existing backup for same month', () => {
    const { result } = renderHook(() => useBackup('standard'));
    
    act(() => {
      result.current.createBackup(mockResults);
    });

    expect(result.current.backups).toHaveLength(1);
    const firstBackup = result.current.backups[0];
    
    act(() => {
      result.current.createBackup([mockResults[0]]);
    });

    expect(result.current.backups).toHaveLength(1);
    expect(result.current.backups[0].id).not.toBe(firstBackup.id);
    expect(result.current.backups[0].data).toEqual([mockResults[0]]);
  });

  it('should migrate old backup data format to standard', () => {
    const oldBackup = {
      id: 'test-id',
      month: 'March 2024',
      data: mockResults,
      createdAt: new Date().toISOString(),
      totalChange: 0.8,
      gameCount: 2
      // Note: no type field in old format
    };
    
    // Set up old format data
    localStorage.setItem('fideBackups', JSON.stringify([oldBackup]));
    
    const { result } = renderHook(() => useBackup('standard'));
    
    // Should have migrated the data and added type
    expect(result.current.backups).toHaveLength(1);
    expect(result.current.backups[0].type).toBe('standard');
    expect(result.current.backups[0].data).toEqual(mockResults);
    
    // Old data should be removed
    expect(localStorage.getItem('fideBackups')).toBeNull();
    
    // New data should be saved
    expect(localStorage.getItem('fideBackups_standard')).toBeTruthy();
  });

  it.skip('should not migrate old backup data for non-standard types', () => {
    const oldBackup = {
      id: 'test-id',
      month: 'March 2024',
      data: mockResults,
      createdAt: new Date().toISOString(),
      totalChange: 0.8,
      gameCount: 2
    };
    
    // Set up old format data
    localStorage.setItem('fideBackups', JSON.stringify([oldBackup]));
    
    const { result } = renderHook(() => useBackup('blitz'));
    
    // Should not have migrated the data
    expect(result.current.backups).toEqual([]);
    
    // Old data should still exist
    expect(localStorage.getItem('fideBackups')).toBe(JSON.stringify([oldBackup]));
    
    // No new data should be created
    expect(localStorage.getItem('fideBackups_blitz')).toBeNull();
  });

  it('should handle backup migration errors gracefully', () => {
    // Set up invalid old format data
    localStorage.setItem('fideBackups', 'invalid json');
    
    const { result } = renderHook(() => useBackup('standard'));
    
    // Should handle error gracefully
    expect(result.current.backups).toEqual([]);
  });
}); 