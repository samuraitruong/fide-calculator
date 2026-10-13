import { act, renderHook, waitFor } from '@testing-library/react';
import { useSupabaseRatingList } from '../useSupabaseRatingList';

let mockRow: Record<string, unknown>;
let mockDeleted = false;
let mockRows: Array<Record<string, unknown>> | null = null;
let mockReadFailure: Error | null = null;
let mockUpdateGate: Promise<void> | null = null;
let mockFailure: Error | null = null;
const mockWrites: Array<{ operation: string; payload?: Record<string, unknown>; id?: string }> = [];
const mockProfile = { id: 'profile' };

jest.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ activeProfile: mockProfile }) }));
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => {
      let operation = 'read';
      let payload: Record<string, unknown> | undefined;
      let target: string | undefined;
      const query: {
        select: () => typeof query;
        eq: (key: string, value: string) => typeof query;
        order: () => Promise<{ data: Array<Record<string, unknown>> | null; error: Error | null }>;
        update: (updates: Record<string, unknown>) => typeof query;
        insert: (updates: Record<string, unknown>) => typeof query;
        delete: () => typeof query;
        single: () => Promise<{ data: Record<string, unknown> | null; error: Error | null }>;
        then: (resolve: (value: unknown) => void) => Promise<void>;
      } = {
        select: () => query,
        eq: (key: string, value: string) => { if (key === 'id') target = value; return query; },
        order: async () => ({ data: mockReadFailure ? null : mockRows ?? (mockDeleted ? [] : [{ ...mockRow }]), error: mockReadFailure }),
        update: (updates: Record<string, unknown>) => { operation = 'update'; payload = updates; return query; },
        insert: (updates: Record<string, unknown>) => { operation = 'insert'; payload = updates; return query; },
        delete: () => { operation = 'delete'; return query; },
        single: async () => {
          mockWrites.push({ operation, payload, id: target });
          if (operation === 'update' && mockUpdateGate) await mockUpdateGate;
          if (mockFailure) return { data: null, error: mockFailure };
          if (mockRows) {
            const previous = mockRows.find(row => row.id === target)!;
            mockRow = { ...previous, ...payload };
            mockRows = mockRows.map(row => row.id === target ? mockRow : row);
          } else mockRow = { ...mockRow, ...payload };
          return { data: { ...mockRow }, error: null };
        },
        then: (resolve: (value: unknown) => void) => {
          mockWrites.push({ operation, id: target });
          if (!mockFailure) {
            if (mockRows) mockRows = mockRows.filter(row => row.id !== target);
            else mockDeleted = true;
          }
          return Promise.resolve({ error: mockFailure }).then(resolve);
        },
      };
      return query;
    },
  },
}));

beforeEach(() => {
  mockRow = { id: 'game', player_rating: 1500, opponent_name: 'Opponent', opponent_rating: 1400,
    k_factor: 20, result: 'win', rating_change: 10, rating_type: 'standard',
    game_date: '2026-08-15', month_key: '2026-Sep', rating_month: '2026-10' };
  mockDeleted = false;
  mockRows = null;
  mockReadFailure = null;
  mockUpdateGate = null;
  mockFailure = null;
  mockWrites.length = 0;
});

it('uses rating_month from cloud data to partition and calculate the monthly total', async () => {
  const { result } = renderHook(() => useSupabaseRatingList());
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.results[0]).toMatchObject({ date: '2026-08-15', ratingMonth: '2026-10' });
  expect(result.current.monthlyData[0]).toMatchObject({ monthKey: '2026-10', totalChange: 10 });
});

it('moving writes only rating_month to the correct record', async () => {
  const { result } = renderHook(() => useSupabaseRatingList());
  await waitFor(() => expect(result.current.loading).toBe(false));
  await act(async () => result.current.updateResult(0, { ratingMonth: '2026-11' }));
  expect(mockWrites).toEqual([{ operation: 'update', payload: { rating_month: '2026-11' }, id: 'game' }]);
  expect(result.current.results[0].date).toBe('2026-08-15');
});

it('defaults new rating month from game date', async () => {
  const { result } = renderHook(() => useSupabaseRatingList());
  await waitFor(() => expect(result.current.loading).toBe(false));
  await act(async () => result.current.addResult({ playerRating: 1500, opponentName: 'Opponent', opponentRating: 1400,
    kFactor: 20, result: 'win', ratingChange: 10, ratingType: 'standard', date: '2026-09-01' }));
  expect(mockWrites[0].payload).toMatchObject({ game_date: '2026-09-01', rating_month: '2026-09' });
});

it('deletes the correct row and clears monthly data', async () => {
  const { result } = renderHook(() => useSupabaseRatingList());
  await waitFor(() => expect(result.current.loading).toBe(false));
  await act(async () => result.current.removeResult(0));
  expect(mockWrites).toEqual([{ operation: 'delete', id: 'game' }]);
  expect(result.current.monthlyData).toEqual([]);
});

it('surfaces a cloud delete failure without removing the record', async () => {
  const { result } = renderHook(() => useSupabaseRatingList());
  await waitFor(() => expect(result.current.loading).toBe(false));
  mockFailure = new Error('Offline');
  await act(async () => { await expect(result.current.removeResult(0)).rejects.toThrow('Offline'); });
  expect(result.current.results[0].id).toBe('game');
});


it('keeps a pending cloud update attached to its ID when another row is deleted and refresh fails', async () => {
  mockRows = ['A', 'B', 'C'].map(id => ({ ...mockRow, id }));
  let releaseUpdate!: () => void;
  mockUpdateGate = new Promise<void>(resolve => { releaseUpdate = resolve; });
  const { result } = renderHook(() => useSupabaseRatingList());
  await waitFor(() => expect(result.current.loading).toBe(false));
  await act(async () => {
    const pending = result.current.updateResult(1, { ratingMonth: '2026-11' });
    await result.current.removeResult(0);
    mockReadFailure = new Error('Refresh offline');
    releaseUpdate();
    await pending;
  });
  expect(result.current.results.map(record => record.id)).toEqual(['B', 'C']);
  expect(result.current.results[0].ratingMonth).toBe('2026-11');
  expect(result.current.results[1].ratingMonth).toBe('2026-10');
});
