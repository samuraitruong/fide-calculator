import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import EditProfileModal from '../../../../mobile/src/components/EditProfileModal';
import { refreshFidePlayer } from '@fide-calculator/shared';
jest.mock('../../../../mobile/node_modules/react', () => jest.requireActual('react'));
jest.mock('../../../../../packages/shared/src', () => ({ refreshFidePlayer: jest.fn() }));
jest.mock('../../../../mobile/src/components/FideSearchInput', () => function MockFideSearchInput({ value, onChange }: { value: string; onChange: (value: string) => void }) { return <input aria-label="Name" value={value} onChange={e => onChange(e.target.value)} />; });
jest.mock('react-native', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const container = ({ children }: { children?: React.ReactNode }) => React.createElement('div', null, children);
  return { Modal: container, View: container, Text: container, ScrollView: container, KeyboardAvoidingView: container, Platform: { OS: 'ios' }, StyleSheet: { create: <T,>(s: T) => s }, ActivityIndicator: () => <span>Loading</span>,
    TouchableOpacity: ({ children, onPress, disabled }: { children?: React.ReactNode; onPress?: React.MouseEventHandler<HTMLButtonElement>; disabled?: boolean }) => React.createElement('button', { onClick: onPress, disabled }, children),
    TextInput: ({ value, onChangeText, editable }: { value: string; onChangeText?: (value: string) => void; editable?: boolean }) => React.createElement('input', { value, disabled: editable === false, onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChangeText?.(e.target.value) }) };
}, { virtual: true });
const profile = { name: 'Doe, Jane', fideId: '42', title: 'CM', federation: 'USA', birthYear: 1990, standardRating: 1800, rapidRating: 1801, blitzRating: 1802 };
const player = { name: 'Doe, Jane', fideId: '42', title: 'FM', federation: 'AUS', birthYear: '1990', standard: '2100', rapid: '2200', blitz: '-' };
const props = { profile, open: true, isLocal: true, onClose: jest.fn(), onSuccess: jest.fn(), onSave: jest.fn() };
beforeEach(() => jest.clearAllMocks());
it('fills ratings and metadata without saving, blocks duplicate refresh and save until finished', async () => {
  let resolve!: (value: typeof player) => void;
  (refreshFidePlayer as jest.Mock).mockReturnValue(new Promise<typeof player>(r => { resolve = r; }));
  render(<EditProfileModal {...props} />);
  fireEvent.click(screen.getByText('Refresh FIDE data'));
  expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  expect(screen.getByDisplayValue('1800')).toBeDisabled();
  await act(async () => resolve(player));
  expect(screen.getByDisplayValue('2100')).toBeInTheDocument();
  expect(screen.getByDisplayValue('1802')).toBeInTheDocument();
  expect(props.onSave).not.toHaveBeenCalled();
  await act(async () => fireEvent.click(screen.getByText('Save')));
  expect(props.onSave).toHaveBeenCalledWith(expect.objectContaining({ title: 'FM', federation: 'AUS', standardRating: 2100, blitzRating: 1802 }));
});
it('keeps draft on failure and ignores results after switching profile', async () => {
  (refreshFidePlayer as jest.Mock).mockRejectedValueOnce(new Error('Offline'));
  const view = render(<EditProfileModal {...props} />);
  fireEvent.change(screen.getByDisplayValue('1800'), { target: { value: '1950' } });
  await act(async () => fireEvent.click(screen.getByText('Refresh FIDE data')));
  expect(screen.getByDisplayValue('1950')).toBeInTheDocument();
  expect(screen.getByText('Offline')).toBeInTheDocument();
  let resolve!: (value: typeof player) => void;
  (refreshFidePlayer as jest.Mock).mockReturnValue(new Promise<typeof player>(r => { resolve = r; }));
  fireEvent.click(screen.getByText('Refresh FIDE data'));
  view.rerender(<EditProfileModal {...props} open={false} />);
  view.rerender(<EditProfileModal {...props} profile={{ ...profile, name: 'Other', fideId: '88', standardRating: 1700 }} />);
  await act(async () => resolve(player));
  expect(screen.getByDisplayValue('Other')).toBeInTheDocument();
  expect(screen.getByDisplayValue('1700')).toBeInTheDocument();
});
