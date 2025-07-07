import { renderHook, act } from '@testing-library/react';
import { useRatingList } from '../useRatingList';
import { Result } from '@/util/types';

describe('useRatingList', () => {
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
    },
    { 
      id: '3', 
      playerRating: 1700, 
      opponentName: 'Player 3', 
      opponentRating: 1800, 
      kFactor: 10,
      result: 'draw',
      ratingChange: 0,
      date: '2024-03-20'
    },
  ];

  beforeEach(() => {
    localStorage.clear();
  });

  it('should initialize with empty list', () => {
    const { result } = renderHook(() => useRatingList('standard'));
    expect(result.current.results).toEqual([]);
  });

  it('should add a result', () => {
    const { result } = renderHook(() => useRatingList('standard'));
    
    act(() => {
      result.current.addResult(mockResults[0]);
    });

    expect(result.current.results).toEqual([mockResults[0]]);
  });

  it('should remove a result by index', () => {
    const { result } = renderHook(() => useRatingList('standard'));
    
    act(() => {
      result.current.addResult(mockResults[0]);
      result.current.addResult(mockResults[1]);
    });

    act(() => {
      result.current.removeResult(0);
    });

    expect(result.current.results).toEqual([mockResults[1]]);
  });

  it('should update a result by id', () => {
    const { result } = renderHook(() => useRatingList('standard'));
    
    act(() => {
      result.current.addResult(mockResults[0]);
    });

    const updatedResult = { ...mockResults[0], playerRating: 1550 };
    act(() => {
      result.current.updateResult('1', updatedResult);
    });

    expect(result.current.results).toEqual([updatedResult]);
  });

  it('should update a result by index', () => {
    const { result } = renderHook(() => useRatingList('standard'));
    
    act(() => {
      result.current.addResult(mockResults[0]);
    });

    const updatedResult = { ...mockResults[0], playerRating: 1550 };
    act(() => {
      result.current.updateResult(0, updatedResult);
    });

    expect(result.current.results).toEqual([updatedResult]);
  });

  it('should set all results', () => {
    const { result } = renderHook(() => useRatingList('standard'));
    
    act(() => {
      result.current.setAllResults(mockResults);
    });

    expect(result.current.results).toEqual(mockResults);
  });

  it('should load results from localStorage on mount', () => {
    localStorage.setItem('fideResults_standard', JSON.stringify(mockResults));
    
    const { result } = renderHook(() => useRatingList('standard'));
    expect(result.current.results).toEqual(mockResults);
  });

  it('should save results to localStorage on change', () => {
    const { result } = renderHook(() => useRatingList('standard'));
    
    act(() => {
      result.current.addResult(mockResults[0]);
    });

    const saved = localStorage.getItem('fideResults_standard');
    expect(saved).toBe(JSON.stringify([mockResults[0]]));
  });

  it('should handle imported results event', () => {
    const { result } = renderHook(() => useRatingList('standard'));
    
    act(() => {
      const event = new CustomEvent('importedResults', { detail: mockResults });
      window.dispatchEvent(event);
    });

    expect(result.current.results).toEqual(mockResults);
  });

  it('should use different storage keys for different rating types', () => {
    const { result: standardResult } = renderHook(() => useRatingList('standard'));
    const { result: blitzResult } = renderHook(() => useRatingList('blitz'));
    
    act(() => {
      standardResult.current.addResult(mockResults[0]);
      blitzResult.current.addResult(mockResults[1]);
    });

    const standardSaved = localStorage.getItem('fideResults_standard');
    const blitzSaved = localStorage.getItem('fideResults_blitz');
    
    expect(standardSaved).toBe(JSON.stringify([mockResults[0]]));
    expect(blitzSaved).toBe(JSON.stringify([mockResults[1]]));
  });

  it('should migrate old data format to standard', () => {
    // Set up old format data
    localStorage.setItem('fideResults', JSON.stringify(mockResults));
    
    const { result } = renderHook(() => useRatingList('standard'));
    
    // Should have migrated the data
    expect(result.current.results).toEqual(mockResults);
    
    // Old data should be removed
    expect(localStorage.getItem('fideResults')).toBeNull();
    
    // New data should be saved
    expect(localStorage.getItem('fideResults_standard')).toBe(JSON.stringify(mockResults));
  });

  it.skip('should not migrate old data for non-standard types', () => {
    // Set up old format data
    localStorage.setItem('fideResults', JSON.stringify(mockResults));
    
    const { result } = renderHook(() => useRatingList('blitz'));
    
    // Should not have migrated the data
    expect(result.current.results).toEqual([]);
    
    // Old data should still exist
    expect(localStorage.getItem('fideResults')).toBe(JSON.stringify(mockResults));
    
    // No new data should be created
    expect(localStorage.getItem('fideResults_blitz')).toBeNull();
  });

  it('should handle migration with missing ids', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const resultsWithoutIds = mockResults.map(({ id, ...rest }) => rest);
    localStorage.setItem('fideResults', JSON.stringify(resultsWithoutIds));
    
    const { result } = renderHook(() => useRatingList('standard'));
    
    // Should have migrated and added ids
    expect(result.current.results).toHaveLength(3);
    expect(result.current.results[0].id).toBeDefined();
    expect(result.current.results[1].id).toBeDefined();
    expect(result.current.results[2].id).toBeDefined();
  });

  it('should handle migration errors gracefully', () => {
    // Set up invalid old format data
    localStorage.setItem('fideResults', 'invalid json');
    
    const { result } = renderHook(() => useRatingList('standard'));
    
    // Should handle error gracefully
    expect(result.current.results).toEqual([]);
  });
}); 