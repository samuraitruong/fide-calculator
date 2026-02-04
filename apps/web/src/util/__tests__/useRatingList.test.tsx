import { renderHook, act } from '@testing-library/react';
import { useRatingList } from '../useRatingList';
import { Result } from '../types';

describe('useRatingList', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  it('should initialize with empty results', () => {
    const { result } = renderHook(() => useRatingList());
    expect(result.current.results).toEqual([]);
  });

  it('should load saved results from localStorage', () => {
    const savedResults: Result[] = [{
      date: '2024-03-20',
      playerRating: 1500,
      opponentName: 'Test Opponent',
      opponentRating: 1600,
      result: 'win',
      kFactor: 20,
      ratingChange: 5.6
    }];
    localStorage.setItem('fideResults', JSON.stringify(savedResults));

    const { result } = renderHook(() => useRatingList());
    expect(result.current.results).toEqual(savedResults);
  });

  it('should add a new result', () => {
    const { result } = renderHook(() => useRatingList());
    const newResult: Result = {
      date: '2024-03-20',
      playerRating: 1500,
      opponentName: 'Test Opponent',
      opponentRating: 1600,
      result: 'win',
      kFactor: 20,
      ratingChange: 5.6
    };

    act(() => {
      result.current.addResult(newResult);
    });

    expect(result.current.results).toHaveLength(1);
    expect(result.current.results[0]).toEqual(newResult);
  });

  it('should remove a result', () => {
    const { result } = renderHook(() => useRatingList());
    const testResult: Result = {
      date: '2024-03-20',
      playerRating: 1500,
      opponentName: 'Test Opponent',
      opponentRating: 1600,
      result: 'win',
      kFactor: 20,
      ratingChange: 5.6
    };

    act(() => {
      result.current.addResult(testResult);
      result.current.removeResult(0);
    });

    expect(result.current.results).toHaveLength(0);
  });

  it('should update a result', () => {
    const { result } = renderHook(() => useRatingList());
    const initialResult: Result = {
      date: '2024-03-20',
      playerRating: 1500,
      opponentName: 'Test Opponent',
      opponentRating: 1600,
      result: 'win',
      kFactor: 20,
      ratingChange: 5.6
    };

    act(() => {
      result.current.addResult(initialResult);
      result.current.updateResult(0, { opponentRating: 1700 });
    });

    expect(result.current.results[0].opponentRating).toBe(1700);
    expect(result.current.results[0].date).toBe(initialResult.date);
  });

  it('should set all results', () => {
    const { result } = renderHook(() => useRatingList());
    const newResults: Result[] = [
      {
        date: '2024-03-20',
        playerRating: 1500,
        opponentName: 'Test Opponent 1',
        opponentRating: 1600,
        result: 'win',
        kFactor: 20,
        ratingChange: 5.6
      },
      {
        date: '2024-03-21',
        playerRating: 1505,
        opponentName: 'Test Opponent 2',
        opponentRating: 1700,
        result: 'loss',
        kFactor: 20,
        ratingChange: -4.2
      }
    ];

    act(() => {
      result.current.setAllResults(newResults);
    });

    expect(result.current.results).toEqual(newResults);
  });

  it('should persist results to localStorage', () => {
    const { result } = renderHook(() => useRatingList());
    const testResult: Result = {
      date: '2024-03-20',
      playerRating: 1500,
      opponentName: 'Test Opponent',
      opponentRating: 1600,
      result: 'win',
      kFactor: 20,
      ratingChange: 5.6
    };

    act(() => {
      result.current.addResult(testResult);
    });

    const savedResults = JSON.parse(localStorage.getItem('fideResults') || '[]');
    expect(savedResults).toEqual([testResult]);
  });
}); 