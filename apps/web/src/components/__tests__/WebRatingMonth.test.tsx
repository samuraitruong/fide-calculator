import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FideCalculator from '../FideCalculator';
import type { Result } from '@/util/types';
import { getRatingMonthFromDate, groupResultsByRatingMonth } from '@fide-calculator/shared';
const now = getRatingMonthFromDate(new Date());
const base = { playerRating: 1800, opponentRating: 1700, kFactor: 20, result: 'win' as const, ratingChange: 5, ratingType: 'standard' as const };
const old: Result = { ...base, id: 'old', opponentName: 'Old', date: '2025-12-31', ratingMonth: '2026-01' };
const current: Result = { ...base, id: 'current', opponentName: 'Current', date: '2025-12-31', ratingMonth: now };
const mockResults = [old, current];
let mockCapturedDelete: (() => Promise<void>) | undefined;
const mockUpdate = jest.fn(); const mockRemove = jest.fn(); const mockAdd = jest.fn();
jest.mock('@/hooks/useSupabaseRatingList', () => ({ useSupabaseRatingList: () => ({results: mockResults, monthlyData: [], addResult: mockAdd, updateResult: mockUpdate, removeResult: ((snapshot: Result[]) => (index: number) => mockRemove(index, snapshot[index]))([...mockResults]), setAllResults: jest.fn()}) }));
jest.mock('@/hooks/useLocalStorage', () => ({ useLocalStorage: () => ({results: mockResults, generateMonthlyData: () => groupResultsByRatingMonth(mockResults, 'standard'), addResult: mockAdd, updateResult: mockUpdate, removeResult: mockRemove, setAllResults: jest.fn()}) }));
jest.mock('@/contexts/AuthContext', () => ({useAuth: () => ({ activeProfile: null })}));
jest.mock('@/hooks/useFideData', () => ({useFideData: () => ({ fideData: [], search: jest.fn() })}));
jest.mock('../MonthlyView', () => () => null);
jest.mock('../MonthlyRatingList', () => ({__esModule: true, default: (props: { onMoveToCurrentMonth: (result: Result) => void; onSelect: (result: Result) => void; onRemove: (result: Result) => Promise<void> }) => <div><button onClick={() => props.onMoveToCurrentMonth(old)}>Move old</button><button onClick={() => props.onSelect(current)}>Edit current</button><button onClick={() => props.onRemove(current)}>Delete current</button><button onClick={() => props.onRemove({...mockResults[2], monthKey: now})}>Delete legacy</button><button onClick={() => props.onSelect(mockResults[2])}>Edit legacy</button><button onClick={() => { mockCapturedDelete = () => props.onRemove(current); }}>Prepare delete</button><button onClick={() => mockCapturedDelete?.()}>Confirm captured delete</button></div>}));
beforeEach(() => { mockResults.splice(0, mockResults.length, old, current); mockCapturedDelete = undefined; jest.clearAllMocks(); localStorage.setItem('fide-calculator-mode', 'local'); Element.prototype.scrollIntoView = jest.fn(); mockUpdate.mockResolvedValue(undefined); mockAdd.mockResolvedValue(undefined); mockRemove.mockResolvedValue(undefined); });
it('moves prior record with only a rating month patch', async () => {
 render(<FideCalculator type="standard" />); fireEvent.click(screen.getByText('Move old'));
 await waitFor(() => expect(mockUpdate).toHaveBeenCalledWith(0, {ratingMonth: now}));
 expect(old.date).toBe('2025-12-31');
});
it('deletes the selected global record by ID despite month-local index zero', async () => {
 render(<FideCalculator type="standard" />); fireEvent.click(screen.getByText('Delete current'));
 await waitFor(() => expect(mockRemove).toHaveBeenCalledWith('current'));
});
it('date editing preserves assigned rating month', async () => {
 render(<FideCalculator type="standard" />); fireEvent.click(screen.getByText('Edit current'));
 fireEvent.change(screen.getByLabelText('Game date'), {target: {value: '2024-01-01'}});
 fireEvent.click(screen.getByText('Save Result'));
 await waitFor(() => expect(mockUpdate).toHaveBeenCalledWith(1, expect.objectContaining({date: '2024-01-01', ratingMonth: now})));
});
it('new records default assigned month from game date', async () => {
 render(<FideCalculator type="standard" />); fireEvent.change(screen.getByLabelText('Game date'), {target: {value: '2024-01-01'}});
 fireEvent.click(screen.getByText('Save Result'));
 await waitFor(() => expect(mockAdd).toHaveBeenCalledWith(expect.objectContaining({date: '2024-01-01', ratingMonth: '2024-01'})));
});
it('save failure retains editor values and surfaces message', async () => {
 mockUpdate.mockRejectedValue(new Error('Save failed'));
 render(<FideCalculator type="standard" />); fireEvent.click(screen.getByText('Edit current'));
 fireEvent.change(screen.getByLabelText('Rating month'), {target: {value: '2027-01'}});
 fireEvent.click(screen.getByText('Save Result'));
 await waitFor(() => expect(screen.getByText('Save failed')).toBeInTheDocument());
 expect(screen.getByLabelText('Rating month')).toHaveValue('2027-01');
});

it('resolves an ID-less migrated record using its unchanged game fields', async () => {
 mockResults.push({...current, id: undefined, opponentName: 'Legacy'});
 render(<FideCalculator type="standard" />); fireEvent.click(screen.getByText('Delete legacy'));
 await waitFor(() => expect(mockRemove).toHaveBeenCalledWith(2));
});

it('captured confirmation does not delete a record moved out of the current month', async () => {
 const {rerender} = render(<FideCalculator type="standard" />);
 fireEvent.click(screen.getByText('Prepare delete'));
 mockResults.splice(0, mockResults.length, {...current, ratingMonth: '2020-01'}, old);
 rerender(<FideCalculator type="standard" />);
 fireEvent.click(screen.getByText('Confirm captured delete'));
 await Promise.resolve();
 expect(mockRemove).not.toHaveBeenCalled();
});
it('captured cloud confirmation resolves the latest global index after reorder', async () => {
 localStorage.setItem('fide-calculator-mode', 'cloud');
 const {rerender} = render(<FideCalculator type="standard" />);
 fireEvent.click(screen.getByText('Prepare delete'));
 mockResults.splice(0, mockResults.length, current, old);
 rerender(<FideCalculator type="standard" />);
 fireEvent.click(screen.getByText('Confirm captured delete'));
 await waitFor(() => expect(mockRemove).toHaveBeenCalledWith(0, current));
});
it('programmatic invalid game date is rejected before persistence', async () => {
 mockResults.push({...current, id: 'invalid-date', date: 'invalid'});
 render(<FideCalculator type="standard" />);
 fireEvent.click(screen.getByText('Edit legacy'));
 fireEvent.click(screen.getByText('Save Result'));
 await waitFor(() => expect(screen.getByText('Invalid game date')).toBeInTheDocument());
 expect(mockUpdate).not.toHaveBeenCalled();
});
