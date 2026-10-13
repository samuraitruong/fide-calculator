import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import FideCalculator from '../../../../mobile/src/components/FideCalculator';
jest.mock('../../../../mobile/node_modules/react', () => jest.requireActual('react'));
jest.mock('@react-navigation/native', () => ({ useNavigation: () => ({ navigate: jest.fn() }) }), { virtual: true });
jest.mock('../../../../mobile/src/components/FideSearchInput', () => () => null);
jest.mock('../../../../mobile/src/components/WinDrawLossBar', () => () => null, { virtual: true });
jest.mock('../../../../mobile/src/components/EditGameModal', () => () => null, { virtual: true });
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
jest.mock('../../../../../packages/shared/src', () => ({ ...jest.requireActual('../../../../../packages/shared/src/ratingMonth'), calculateRatingChange: () => 10 }));
jest.mock('@fide-calculator/shared', () => ({ ...jest.requireActual('../../../../../packages/shared/src/ratingMonth'), calculateRatingChange: () => 10 }));

const base = { mode: 'local' as const, ratingType: 'standard' as const, onChangeRatingType: jest.fn(), profile: null, results: [] };
afterEach(() => jest.useRealTimers());

it('defaults new games to game date month and preserves a manually assigned month on date changes', async () => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date(2026, 9, 1));
  const addResult = jest.fn().mockResolvedValue(undefined);
  render(<FideCalculator {...base} addResult={addResult} />);
  fireEvent.change(screen.getByDisplayValue('2026-10-01'), { target: { value: '2026-09-30' } });
  expect(screen.getByDisplayValue('2026-09')).toBeInTheDocument();
  fireEvent.change(screen.getByDisplayValue('2026-09'), { target: { value: '2026-11' } });
  fireEvent.change(screen.getByDisplayValue('2026-09-30'), { target: { value: '2026-12-31' } });
  await act(async () => fireEvent.click(screen.getByText('Track Game')));
  expect(addResult).toHaveBeenCalledWith(expect.objectContaining({ date: '2026-12-31', ratingMonth: '2026-11' }));
});

it('uses rating month for live games even when their game dates belong to another month', () => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date(2026, 9, 1));
  const results = [
    { id: 'included', date: '2026-08-15', ratingMonth: '2026-10', monthKey: '2026-Aug', playerRating: 1500, opponentName: 'Included', opponentRating: 1400, result: 'win' as const, ratingChange: 10, ratingType: 'standard' as const, kFactor: 20 },
    { id: 'excluded', date: '2026-10-01', ratingMonth: '2026-09', monthKey: '2026-Oct', playerRating: 1500, opponentName: 'Excluded', opponentRating: 1400, result: 'win' as const, ratingChange: 15, ratingType: 'standard' as const, kFactor: 20 },
  ];
  render(<FideCalculator {...base} results={results} addResult={jest.fn()} />);
  expect(screen.getByText('Included (1400)')).toBeInTheDocument();
  expect(screen.queryByText('Excluded (1400)')).not.toBeInTheDocument();
  expect(screen.getByText('1510')).toBeInTheDocument();
});

it('rejects invalid month and surfaces failed creation without clearing form fields', async () => {
  jest.clearAllMocks();
  const addResult = jest.fn().mockRejectedValue(new Error('Offline'));
  render(<FideCalculator {...base} addResult={addResult} />);
  const month = screen.getAllByRole('textbox').find((input) => /^\d{4}-\d{2}$/.test((input as HTMLInputElement).value))!;
  fireEvent.change(month, { target: { value: '2026-13' } });
  expect(screen.getByRole('button', { name: 'Track Game' })).toBeDisabled();
  fireEvent.change(month, { target: { value: '2026-11' } });
  await act(async () => fireEvent.click(screen.getByText('Track Game')));
  expect(jest.requireMock('react-native').Alert.alert).toHaveBeenCalledWith('Unable to track game', 'Offline');
  expect(screen.getByDisplayValue('2026-11')).toBeInTheDocument();
});

it('targets the same game by ID when the list changes before deletion is confirmed', async () => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date(2026, 9, 1));
  jest.clearAllMocks();
  const first = { id: 'first', date: '2026-08-15', ratingMonth: '2026-10', playerRating: 1500, opponentName: 'First', opponentRating: 1400, result: 'win' as const, ratingChange: 10, ratingType: 'standard' as const, kFactor: 20 };
  const second = { ...first, id: 'second', opponentName: 'Second' };
  const removeResult = jest.fn().mockResolvedValue(undefined);
  const props = { ...base, results: [first, second], addResult: jest.fn(), removeResult };
  const view = render(<FideCalculator {...props} />);
  // Current list renders newest first; its first icon-only button deletes Second.
  fireEvent.click(screen.getAllByRole('button', { name: '' })[0]);
  const buttons = jest.requireMock('react-native').Alert.alert.mock.calls[0][2];
  view.rerender(<FideCalculator {...props} results={[second, first]} />);
  await act(async () => buttons.find((b: { text: string }) => b.text === 'Delete').onPress());
  expect(removeResult).toHaveBeenCalledWith(0);
});

it.each(['invalid-date', '2026-02-30'])('rejects new game date %s even after an explicit rating month is selected', (date) => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date(2026, 9, 1));
  const addResult = jest.fn();
  render(<FideCalculator {...base} addResult={addResult} />);
  fireEvent.change(screen.getByDisplayValue('2026-10'), { target: { value: '2026-11' } });
  fireEvent.change(screen.getByDisplayValue('2026-10-01'), { target: { value: date } });
  expect(screen.getByRole('button', { name: 'Track Game' })).toBeDisabled();
  fireEvent.click(screen.getByText('Track Game'));
  expect(addResult).not.toHaveBeenCalled();
});
