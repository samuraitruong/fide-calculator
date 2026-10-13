import { act, renderHook, waitFor } from '@testing-library/react';
import { useLocalStorage } from '../useLocalStorage';

const profileA = { id: 'A', name: 'Player A', fideId: '1234', isLocal: true,
  standardRating: 1500, rapidRating: 1600, blitzRating: 1700 };
const profileB = { ...profileA, id: 'B', name: 'Player B', fideId: '5678' };

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('fide-calculator-profiles', JSON.stringify([profileA, profileB]));
  localStorage.setItem('fide-calculator-active-profile-id', 'A');
});

it('applies refreshed profile ratings to every mounted consumer and persists them', async () => {
  const menu = renderHook(() => useLocalStorage());
  const home = renderHook(() => useLocalStorage());
  await waitFor(() => expect(home.result.current.loading).toBe(false));
  act(() => menu.result.current.updateProfile({ standardRating: 1800, rapidRating: 1900, blitzRating: 2000 }));
  expect(home.result.current.activeProfile).toMatchObject({ id: 'A', standardRating: 1800, rapidRating: 1900, blitzRating: 2000 });
  expect(home.result.current.profiles[0].standardRating).toBe(1800);
  expect(JSON.parse(localStorage.getItem('fide-calculator-profiles')!)[0].standardRating).toBe(1800);
});

it('keeps profile switching and creation consistent across mounted consumers', async () => {
  const menu = renderHook(() => useLocalStorage());
  const home = renderHook(() => useLocalStorage());
  act(() => menu.result.current.setActiveProfile(profileB));
  expect(home.result.current.activeProfile?.id).toBe('B');
  act(() => menu.result.current.createProfile({ ...profileA, name: 'New Player' }));
  expect(home.result.current.activeProfile?.name).toBe('New Player');
  expect(home.result.current.profiles).toHaveLength(3);
});
