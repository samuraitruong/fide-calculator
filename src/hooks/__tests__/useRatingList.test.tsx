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
    const { result } = renderHook(() => useRatingList());
    expect(result.current.results).toEqual([]);
  });

  it('should add a result', () => {
    const { result } = renderHook(() => useRatingList());
    
    act(() => {
      result.current.addResult(mockResults[0]);
    });

    expect(result.current.results).toEqual([mockResults[0]]);
  });

  it('should remove a result by index', () => {
    const { result } = renderHook(() => useRatingList());
    
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
    const { result } = renderHook(() => useRatingList());
    
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
    const { result } = renderHook(() => useRatingList());
    
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
    const { result } = renderHook(() => useRatingList());
    
    act(() => {
      result.current.setAllResults(mockResults);
    });

    expect(result.current.results).toEqual(mockResults);
  });

  it('should load results from localStorage on mount', () => {
    localStorage.setItem('fideResults', JSON.stringify(mockResults));
    
    const { result } = renderHook(() => useRatingList());
    expect(result.current.results).toEqual(mockResults);
  });

  it('should save results to localStorage on change', () => {
    const { result } = renderHook(() => useRatingList());
    
    act(() => {
      result.current.addResult(mockResults[0]);
    });

    const saved = localStorage.getItem('fideResults');
    expect(saved).toBe(JSON.stringify([mockResults[0]]));
  });

  it('should handle imported results event', () => {
    const { result } = renderHook(() => useRatingList());
    
    act(() => {
      const event = new CustomEvent('importedResults', { detail: mockResults });
      window.dispatchEvent(event);
    });

    expect(result.current.results).toEqual(mockResults);
  });
}); 