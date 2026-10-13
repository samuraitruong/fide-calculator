import { act, renderHook, waitFor } from '@testing-library/react';
import { useLocalStorage } from '../../../../mobile/src/hooks/useLocalStorage';

jest.mock('../../../../mobile/node_modules/react', () => jest.requireActual('react'));
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(), setItem: jest.fn().mockResolvedValue(undefined),
}), { virtual: true });
const storage = jest.requireMock('@react-native-async-storage/async-storage');
const profile = { id: 'A', name: 'Player', fideId: '1234', isLocal: true,
  standardRating: 1500, rapidRating: 1600, blitzRating: 1700 };

it('updates mobile calculator consumers when refreshed local profile ratings are saved', async () => {
  storage.getItem.mockImplementation(async (key: string) => {
    if (key === 'fide-calculator-profiles') return JSON.stringify([profile]);
    if (key === 'fide-calculator-active-profile-id') return 'A';
    return null;
  });
  const menu = renderHook(() => useLocalStorage());
  const home = renderHook(() => useLocalStorage());
  await waitFor(() => expect(home.result.current.loading).toBe(false));
  await waitFor(() => expect(menu.result.current.loading).toBe(false));
  act(() => menu.result.current.updateProfile({ standardRating: 1800, rapidRating: 1900, blitzRating: 2000 }));
  expect(home.result.current.activeProfile).toMatchObject({ id: 'A', standardRating: 1800, rapidRating: 1900, blitzRating: 2000 });
  await waitFor(() => expect(storage.setItem).toHaveBeenCalledWith('fide-calculator-profiles',
    JSON.stringify([{ ...profile, standardRating: 1800, rapidRating: 1900, blitzRating: 2000 }])));
});
