import React from 'react';
import { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react';
import EditGameModal from '../../../../mobile/src/components/EditGameModal';
import { useLocalStorage } from '../../../../mobile/src/hooks/useLocalStorage';
// This mock supplies the mobile storage boundary in the web test runner.
const AsyncStorage = jest.requireMock('@react-native-async-storage/async-storage');

jest.mock('../../../../mobile/node_modules/react', () => jest.requireActual('react'));
jest.mock('../../../../../packages/shared/src', () => ({ ...jest.requireActual('../../../../../packages/shared/src/ratingMonth'), calculateRatingChange: () => 10 }));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(), setItem: jest.fn().mockResolvedValue(undefined),
}), { virtual: true });

jest.mock('react-native', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const container = ({ children }: { children?: React.ReactNode }) => React.createElement('div', null, children);
  return {
    Modal: container,
    ScrollView: container,
    KeyboardAvoidingView: container,
    Platform: { OS: 'ios' },
    View: container,
    Text: container,
    Pressable: container,
    TouchableOpacity: ({ onPress, children, disabled }: { onPress?: React.MouseEventHandler<HTMLButtonElement>; children?: React.ReactNode; disabled?: boolean }) =>
      React.createElement('button', { onClick: onPress, disabled }, children),
    TextInput: ({ value, onChangeText }: { value: string; onChangeText: (value: string) => void }) =>
      React.createElement('input', { value, onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChangeText(e.target.value) }),
    StyleSheet: { create: <T,>(styles: T) => styles },
    Alert: { alert: jest.fn() },
  };
}, { virtual: true });
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ bottom: 0 }) }), { virtual: true });
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }), { virtual: true });
jest.mock('@fide-calculator/shared', () => ({ ...jest.requireActual('../../../../../packages/shared/src/ratingMonth'), calculateRatingChange: () => 10 }));

const game = {
  id: 'past-game', playerRating: 1600, opponentName: 'Opponent', opponentRating: 1500,
  kFactor: 20, result: 'win' as const, ratingChange: 10, ratingType: 'standard' as const,
  date: '2026-08-15', monthKey: '2026-Aug',
};

afterEach(() => jest.useRealTimers());

it('moves only the rating month without saving date or opponent edits', async () => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date(2026, 9, 1, 0, 30));
  const onSave = jest.fn().mockResolvedValue(undefined);
  const onClose = jest.fn();
  render(<EditGameModal open game={game} onSave={onSave} onClose={onClose} />);
  fireEvent.change(screen.getByDisplayValue('Opponent'), { target: { value: 'Unsaved edit' } });
  fireEvent.click(screen.getByText('Move to Current Month'));
  expect(onSave).toHaveBeenCalledWith({ ratingMonth: '2026-10' });
  await waitFor(() => expect(onClose).toHaveBeenCalled());
});

it('keeps the editor open when moving fails', async () => {
  const onSave = jest.fn().mockRejectedValue(new Error('Offline'));
  const onClose = jest.fn();
  render(<EditGameModal open game={game} onSave={onSave} onClose={onClose} />);
  fireEvent.click(screen.getByText('Move to Current Month'));
  await waitFor(() => expect(jest.requireMock('react-native').Alert.alert).toHaveBeenCalled());
  expect(onClose).not.toHaveBeenCalled();
});

it('keeps the editor open when saving changes fails', async () => {
  jest.clearAllMocks();
  const onSave = jest.fn().mockRejectedValue(new Error('Offline'));
  const onClose = jest.fn();
  render(<EditGameModal open game={game} onSave={onSave} onClose={onClose} />);
  fireEvent.click(screen.getByText('Save changes'));
  await waitFor(() => expect(jest.requireMock('react-native').Alert.alert).toHaveBeenCalled());
  expect(onClose).not.toHaveBeenCalled();
});


it('regroups a local game into the target month after moving on the first day', async () => {
  (AsyncStorage.getItem as jest.Mock).mockImplementation(async (key: string) =>
    key === 'fide-calculator-results' ? JSON.stringify([game]) : null,
  );
  const { result } = renderHook(() => useLocalStorage());
  await waitFor(() => expect(result.current.loading).toBe(false));
  await act(async () => result.current.updateResult(0, { ratingMonth: '2026-10' }));
  const months = result.current.generateMonthlyData('standard');
  expect(months.map(month => month.monthKey)).toEqual(['2026-10']);
  expect(months[0].results[0].id).toBe('past-game');
  expect(months[0].results[0].date).toBe('2026-08-15');
});


it('preserves assigned rating month when editing the game date', async () => {
  const onSave = jest.fn().mockResolvedValue(undefined);
  render(<EditGameModal open game={{ ...game, ratingMonth: '2026-09' }} onSave={onSave} onClose={jest.fn()} />);
  fireEvent.change(screen.getByDisplayValue('2026-08-15'), { target: { value: '2026-12-31' } });
  await act(async () => fireEvent.click(screen.getByText('Save changes')));
  expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ date: '2026-12-31', ratingMonth: '2026-09' }));
});

it('rejects a malformed rating month', () => {
  const onSave = jest.fn();
  render(<EditGameModal open game={game} onSave={onSave} onClose={jest.fn()} />);
  fireEvent.change(screen.getByDisplayValue('2026-08'), { target: { value: '2026-13' } });
  expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled();
  fireEvent.click(screen.getByText('Save changes'));
  expect(onSave).not.toHaveBeenCalled();
});

it('offers deletion by rating month and keeps the editor open on failure', async () => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date(2026, 9, 1));
  jest.clearAllMocks();
  const onDelete = jest.fn().mockRejectedValue(new Error('Offline'));
  const onClose = jest.fn();
  render(<EditGameModal open game={{ ...game, ratingMonth: '2026-10' }} onSave={jest.fn()} onClose={onClose} onDelete={onDelete} />);
  fireEvent.click(screen.getByText('Delete game'));
  expect(onDelete).not.toHaveBeenCalled();
  const buttons = jest.requireMock('react-native').Alert.alert.mock.calls[0][2];
  await act(async () => buttons.find((b: { text: string }) => b.text === 'Delete').onPress());
  expect(onDelete).toHaveBeenCalledTimes(1);
  expect(onClose).not.toHaveBeenCalled();
  expect(jest.requireMock('react-native').Alert.alert).toHaveBeenLastCalledWith('Unable to delete game', 'Offline');
});

it('does not offer deletion for a previous rating month even with a current game date', () => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date(2026, 9, 1));
  render(<EditGameModal open game={{ ...game, date: '2026-10-01', ratingMonth: '2026-09' }} onSave={jest.fn()} onClose={jest.fn()} onDelete={jest.fn()} />);
  expect(screen.queryByText('Delete game')).not.toBeInTheDocument();
});


it('closes after confirmed deletion succeeds', async () => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date(2026, 9, 1));
  jest.clearAllMocks();
  const onDelete = jest.fn().mockResolvedValue(undefined);
  const onClose = jest.fn();
  render(<EditGameModal open game={{ ...game, ratingMonth: '2026-10' }} onSave={jest.fn()} onClose={onClose} onDelete={onDelete} />);
  fireEvent.click(screen.getByText('Delete game'));
  const buttons = jest.requireMock('react-native').Alert.alert.mock.calls[0][2];
  await act(async () => buttons.find((b: { text: string }) => b.text === 'Delete').onPress());
  expect(onDelete).toHaveBeenCalledTimes(1);
  expect(onClose).toHaveBeenCalledTimes(1);
});

it.each(['invalid-date', '2026-02-30'])('rejects invalid game date %s with a valid assigned rating month', (date) => {
  const onSave = jest.fn();
  render(<EditGameModal open game={{ ...game, ratingMonth: '2026-10' }} onSave={onSave} onClose={jest.fn()} />);
  fireEvent.change(screen.getByDisplayValue('2026-08-15'), { target: { value: date } });
  expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled();
  fireEvent.click(screen.getByText('Save changes'));
  expect(onSave).not.toHaveBeenCalled();
});
