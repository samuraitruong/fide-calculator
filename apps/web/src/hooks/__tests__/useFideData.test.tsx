import { renderHook, act } from '@testing-library/react';
import { useFideData, parseFideTable } from '../useFideData';

// Mock the parseFideTable function
jest.mock('../useFideData', () => {
  const originalModule = jest.requireActual('../useFideData');
  return {
    ...originalModule,
    parseFideTable: jest.fn()
  };
});

describe('useFideData', () => {
  const mockFidePlayer = {
    fideId: '12345678',
    name: 'John Doe',
    title: 'GM',
    trainerTitle: '',
    federation: 'AUS',
    standard: '2500',
    rapid: '2400',
    blitz: '2300',
    birthYear: '1990'
  };

  beforeEach(() => {
    global.fetch = jest.fn();
    // Reset parseFideTable mock
    (parseFideTable as jest.Mock).mockReset();
  });

  const waitForStateUpdate = async () => {
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
  };

  it('should initialize with empty data', async () => {
    (parseFideTable as jest.Mock).mockReturnValue([]);
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve('<table id="table_results"><tbody></tbody></table>')
    });
    
    const { result } = renderHook(() => useFideData(''));
    
    await waitForStateUpdate();
    
    expect(result.current.fideData).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it.skip('should search for players', async () => {
    (parseFideTable as jest.Mock).mockReturnValue([mockFidePlayer]);
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve('<table id="table_results"><tbody></tbody></table>')
    });

    const { result } = renderHook(() => useFideData('John'));

    await waitForStateUpdate();

    expect(result.current.fideData).toEqual([mockFidePlayer]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle search errors', async () => {
    const error = new Error('Network error');
    (global.fetch as jest.Mock).mockRejectedValueOnce(error);

    const { result } = renderHook(() => useFideData('John'));

    await waitForStateUpdate();

    expect(result.current.fideData).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('Network error');
  });

  it('should handle empty search results', async () => {
    (parseFideTable as jest.Mock).mockReturnValue([]);
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve('<table id="table_results"><tbody></tbody></table>')
    });

    const { result } = renderHook(() => useFideData(''));

    await waitForStateUpdate();

    expect(result.current.fideData).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it.skip('should sort AUS players to top', async () => {
    const mockPlayers = [
      { ...mockFidePlayer, federation: 'USA' },
      { ...mockFidePlayer, fideId: '87654321', name: 'Jane Smith', federation: 'AUS' }
    ];
    (parseFideTable as jest.Mock).mockReturnValue(mockPlayers);
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve('<table id="table_results"><tbody></tbody></table>')
    });

    const { result } = renderHook(() => useFideData(''));

    await waitForStateUpdate();

    expect(result.current.fideData[0].federation).toBe('AUS');
    expect(result.current.fideData[1].federation).toBe('USA');
  });

  it('should handle malformed HTML response', async () => {
    (parseFideTable as jest.Mock).mockReturnValue([]);
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve('invalid html')
    });

    const { result } = renderHook(() => useFideData(''));

    await waitForStateUpdate();

    expect(result.current.fideData).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });
}); 