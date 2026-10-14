import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '../../../../mobile/src/contexts/ThemeContext';
import { TacticalCard } from '../../../../mobile/src/components/ui/TacticalCard';
import { TacticalButton } from '../../../../mobile/src/components/ui/TacticalButton';
import { WinDrawLossSelector } from '../../../../mobile/src/components/ui/WinDrawLossSelector';
import { ThemeToggle } from '../../../../mobile/src/components/ui/ThemeToggle';

jest.mock('../../../../mobile/node_modules/react', () => jest.requireActual('react'));
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
}), { virtual: true });

function flattenStyle(style: unknown): Record<string, unknown> {
  if (!style) return {};
  if (Array.isArray(style)) {
    return style.reduce((acc, item) => ({ ...acc, ...flattenStyle(item) }), {});
  }
  if (typeof style === 'object') {
    return style as Record<string, unknown>;
  }
  return {};
}

jest.mock('react-native', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const container = ({ children, style, testID, accessibilityLabel, hitSlop, activeOpacity, accessibilityRole, accessibilityState, ...props }: {
    children?: React.ReactNode;
    style?: unknown;
    testID?: string;
    accessibilityLabel?: string;
    hitSlop?: unknown;
    activeOpacity?: unknown;
    accessibilityRole?: string;
    accessibilityState?: unknown;
    [key: string]: unknown;
  }) => React.createElement('div', { ...props, style: flattenStyle(style), 'data-testid': testID, 'aria-label': accessibilityLabel }, children);

  return {
    Appearance: {
      getColorScheme: jest.fn().mockReturnValue('dark'),
      addChangeListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
    },
    Platform: { OS: 'ios' },
    View: container,
    Text: ({ children, style, testID, accessibilityLabel, ...props }: { children?: React.ReactNode; style?: unknown; testID?: string; accessibilityLabel?: string; [key: string]: unknown }) =>
      React.createElement('span', { ...props, style: flattenStyle(style), 'data-testid': testID, 'aria-label': accessibilityLabel }, children),
    TouchableOpacity: ({ onPress, children, style, testID, accessibilityLabel, hitSlop, activeOpacity, accessibilityRole, accessibilityState, ...props }: {
      onPress?: () => void;
      children?: React.ReactNode;
      style?: unknown;
      testID?: string;
      accessibilityLabel?: string;
      hitSlop?: unknown;
      activeOpacity?: unknown;
      accessibilityRole?: string;
      accessibilityState?: unknown;
      [key: string]: unknown;
    }) => React.createElement('button', { onClick: onPress, ...props, style: flattenStyle(style), 'data-testid': testID, 'aria-label': accessibilityLabel }, children),
    Pressable: ({ onPress, children, style, testID, accessibilityLabel, hitSlop, activeOpacity, accessibilityRole, accessibilityState, ...props }: {
      onPress?: () => void;
      children?: React.ReactNode | ((state: { pressed: boolean }) => React.ReactNode);
      style?: unknown;
      testID?: string;
      accessibilityLabel?: string;
      hitSlop?: unknown;
      activeOpacity?: unknown;
      accessibilityRole?: string;
      accessibilityState?: unknown;
      [key: string]: unknown;
    }) => {
      const computedStyle = typeof style === 'function' ? (style as (state: { pressed: boolean }) => unknown)({ pressed: false }) : style;
      return React.createElement(
        'button',
        { onClick: onPress, ...props, style: flattenStyle(computedStyle), 'data-testid': testID, 'aria-label': accessibilityLabel },
        typeof children === 'function' ? children({ pressed: false }) : children
      );
    },
    StyleSheet: { create: <T,>(styles: T) => styles },
    ActivityIndicator: () => React.createElement('span', { 'data-testid': 'spinner' }),
  };
}, { virtual: true });

jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
  MaterialCommunityIcons: () => null,
}), { virtual: true });

describe('Tactical UI Primitives', () => {
  it('renders TacticalCard with content and tag', () => {
    render(
      <ThemeProvider>
        <TacticalCard tag="ROUND 01">
          <span data-testid="card-content">Card Body</span>
        </TacticalCard>
      </ThemeProvider>
    );

    expect(screen.getByText('ROUND 01')).toBeInTheDocument();
    expect(screen.getByTestId('card-content')).toBeInTheDocument();
  });

  it('renders TacticalButton and handles press', () => {
    const handlePress = jest.fn();
    render(
      <ThemeProvider>
        <TacticalButton title="Add Game" onPress={handlePress} testID="btn-add" />
      </ThemeProvider>
    );

    const btn = screen.getByTestId('btn-add');
    expect(btn.textContent).toMatch(/Add Game/i);
    fireEvent.click(btn);
    expect(handlePress).toHaveBeenCalledTimes(1);
  });

  it('handles result selection in WinDrawLossSelector', () => {
    const handleChange = jest.fn();
    render(
      <ThemeProvider>
        <WinDrawLossSelector value={null} onChange={handleChange} />
      </ThemeProvider>
    );

    const winBtn = screen.getByLabelText(/WIN 1.0/i);
    fireEvent.click(winBtn);
    expect(handleChange).toHaveBeenCalledWith(1, 'win');

    const drawBtn = screen.getByLabelText(/DRAW ½/i);
    fireEvent.click(drawBtn);
    expect(handleChange).toHaveBeenCalledWith(0.5, 'draw');

    const lossBtn = screen.getByLabelText(/LOSS 0.0/i);
    fireEvent.click(lossBtn);
    expect(handleChange).toHaveBeenCalledWith(0, 'loss');
  });

  it('cycles theme through compact ThemeToggle', () => {
    render(
      <ThemeProvider>
        <ThemeToggle compact={true} />
      </ThemeProvider>
    );

    const toggleBtn = screen.getByTestId('theme-toggle-compact');
    fireEvent.click(toggleBtn);
  });
});
