import { act, renderHook, waitFor } from '@testing-library/react';
import { useLocalStorage } from '../../../../mobile/src/hooks/useLocalStorage';

jest.mock('../../../../mobile/node_modules/react', () => jest.requireActual('react'));
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(), setItem: jest.fn().mockResolvedValue(undefined),
}), { virtual: true });
const storage = jest.requireMock('@react-native-async-storage/async-storage');
const game = { id: 'A', playerRating: 1500, opponentName: 'A', opponentRating: 1400,
  kFactor: 20, result: 'win' as const, ratingChange: 10, ratingType: 'standard' as const,
  date: '2026-08-15', ratingMonth: '2026-10', monthKey: '2026-10' };

beforeEach(() => {
  jest.clearAllMocks();
  storage.setItem.mockResolvedValue(undefined);
  storage.getItem.mockImplementation(async (key: string) => key === 'fide-calculator-results'
    ? JSON.stringify([game, { ...game, id: 'B', opponentName: 'B' }, { ...game, id: 'C', opponentName: 'C' }]) : null);
});

it('keeps queued deletions attached to their original records as indices shift', async () => {
  const { result } = renderHook(() => useLocalStorage());
  await waitFor(() => expect(result.current.loading).toBe(false));
  await act(async () => {
    await Promise.all([result.current.removeResult(0), result.current.removeResult(1)]);
  });
  expect(result.current.results.map(record => record.id)).toEqual(['C']);
});

it('keeps queued updates attached to their original record after deletion', async () => {
  const { result } = renderHook(() => useLocalStorage());
  await waitFor(() => expect(result.current.loading).toBe(false));
  await act(async () => {
    await Promise.all([result.current.removeResult(0), result.current.updateResult(1, { opponentName: 'Changed B' })]);
  });
  expect(result.current.results.find(record => record.id === 'B')?.opponentName).toBe('Changed B');
  expect(result.current.results.find(record => record.id === 'C')?.opponentName).toBe('C');
});

it('does not overwrite invalid stored games after a failed migration', async () => {
  storage.getItem.mockImplementation(async (key: string) => key === 'fide-calculator-results'
    ? JSON.stringify([{ ...game, ratingMonth: '2026-13' }]) : null);
  const { result } = renderHook(() => useLocalStorage());
  await waitFor(() => expect(result.current.loading).toBe(false));
  await act(async () => {
    await expect(Promise.resolve().then(() => result.current.addResult(game))).rejects.toThrow();
  });
  expect(storage.setItem).not.toHaveBeenCalled();
});
