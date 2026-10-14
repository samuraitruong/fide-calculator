import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ThemeProvider, useTheme } from '../../../../mobile/src/contexts/ThemeContext';

const AsyncStorage = jest.requireMock('@react-native-async-storage/async-storage');

jest.mock('../../../../mobile/node_modules/react', () => jest.requireActual('react'));
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
}), { virtual: true });

jest.mock('react-native', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  return {
    Appearance: {
      getColorScheme: jest.fn().mockReturnValue('dark'),
      addChangeListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
    },
    Platform: { OS: 'ios' },
  };
}, { virtual: true });

function TestConsumer() {
  const { themeMode, isDark, colors, setThemeMode, toggleTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme-mode">{themeMode}</span>
      <span data-testid="is-dark">{isDark ? 'true' : 'false'}</span>
      <span data-testid="canvas-color">{colors.canvas}</span>
      <button data-testid="btn-light" onClick={() => setThemeMode('light')}>
        Set Light
      </button>
      <button data-testid="btn-toggle" onClick={() => toggleTheme()}>
        Toggle
      </button>
    </div>
  );
}

describe('ThemeContext (Mobile)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('defaults to dark mode with dark palette', () => {
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme-mode').textContent).toBe('dark');
    expect(screen.getByTestId('is-dark').textContent).toBe('true');
    expect(screen.getByTestId('canvas-color').textContent).toBe('#0B0F17');
  });

  it('updates theme mode and switches colors when setThemeMode is called', async () => {
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    );

    await act(async () => {
      fireEvent.click(screen.getByTestId('btn-light'));
    });

    expect(screen.getByTestId('theme-mode').textContent).toBe('light');
    expect(screen.getByTestId('is-dark').textContent).toBe('false');
    expect(screen.getByTestId('canvas-color').textContent).toBe('#F4F5F0');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('@fide-calc-theme-mode', 'light');
  });

  it('cycles theme through toggleTheme', async () => {
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    );

    // Initial dark -> toggle -> light
    await act(async () => {
      fireEvent.click(screen.getByTestId('btn-toggle'));
    });
    expect(screen.getByTestId('theme-mode').textContent).toBe('light');

    // light -> toggle -> system
    await act(async () => {
      fireEvent.click(screen.getByTestId('btn-toggle'));
    });
    expect(screen.getByTestId('theme-mode').textContent).toBe('system');
  });
});
