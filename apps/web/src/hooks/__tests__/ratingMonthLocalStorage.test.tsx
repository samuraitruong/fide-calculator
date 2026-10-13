import { act, renderHook, waitFor } from '@testing-library/react';
import { useLocalStorage } from '../useLocalStorage';

const game = {
  id: 'historical-game', playerRating: 1500, opponentName: 'Opponent', opponentRating: 1400,
  kFactor: 20, result: 'win' as const, ratingChange: 10, ratingType: 'standard' as const,
  date: '2026-08-15', monthKey: '2026-Aug',
};

beforeEach(() => localStorage.clear());

it('migrates and persists the existing assigned rating month without changing the game date', async () => {
  localStorage.setItem('fide-calculator-results', JSON.stringify([{ ...game, monthKey: '2026-Sep' }]));
  const { result } = renderHook(() => useLocalStorage());
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.results[0]).toMatchObject({ date: '2026-08-15', ratingMonth: '2026-09' });
  expect(JSON.parse(localStorage.getItem('fide-calculator-results')!)[0].ratingMonth).toBe('2026-09');
});

it('moves only the rating month, and partitions totals using it instead of the game date', async () => {
  localStorage.setItem('fide-calculator-results', JSON.stringify([game]));
  const { result } = renderHook(() => useLocalStorage());
  await act(async () => result.current.updateResult(0, { ratingMonth: '2026-10' }));
  expect(result.current.results[0]).toMatchObject({ date: '2026-08-15', ratingMonth: '2026-10' });
  const months = result.current.generateMonthlyData('standard');
  expect(months.map(month => month.monthKey)).toEqual(['2026-10']);
  expect(months[0].totalChange).toBe(10);
  await act(async () => result.current.updateResult(0, { date: '2026-07-01' }));
  expect(result.current.results[0].ratingMonth).toBe('2026-10');
});

it('defaults a new rating month from game date and synchronizes mounted consumers', async () => {
  const first = renderHook(() => useLocalStorage());
  const second = renderHook(() => useLocalStorage());
  await act(async () => first.result.current.addResult({ ...game, monthKey: undefined }));
  expect(first.result.current.results[0].ratingMonth).toBe('2026-08');
  expect(second.result.current.results[0].ratingMonth).toBe('2026-08');
});

it('persists deletion of the last game and does not resurrect it on remount', async () => {
  localStorage.setItem('fide-calculator-results', JSON.stringify([game]));
  const first = renderHook(() => useLocalStorage());
  await act(async () => first.result.current.removeResult('historical-game'));
  expect(JSON.parse(localStorage.getItem('fide-calculator-results')!)).toEqual([]);
  first.unmount();
  const second = renderHook(() => useLocalStorage());
  expect(second.result.current.results).toEqual([]);
});
