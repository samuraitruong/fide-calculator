import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ThemeColors,
  ThemeShadows,
  darkColors,
  lightColors,
  darkShadows,
  lightShadows,
  typography,
  radii,
  borderWidth,
  spacing,
  touchTargets,
} from '../theme/tokens';

export type ThemeMode = 'dark' | 'light' | 'system';

export interface ThemeContextValue {
  themeMode: ThemeMode;
  isDark: boolean;
  colors: ThemeColors;
  shadows: ThemeShadows;
  typography: typeof typography;
  radii: typeof radii;
  borderWidth: typeof borderWidth;
  spacing: typeof spacing;
  touchTargets: typeof touchTargets;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  toggleTheme: () => Promise<void>;
}

const THEME_STORAGE_KEY = '@fide-calc-theme-mode';

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const ThemeProvider: React.FC<{
  children: React.ReactNode;
  initialMode?: ThemeMode;
}> = ({ children, initialMode }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(initialMode || 'dark');
  const [systemScheme, setSystemScheme] = useState<ColorSchemeName>(Appearance.getColorScheme());

  // Load persisted theme preference on mount
  useEffect(() => {
    if (initialMode) return;
    let isMounted = true;
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (isMounted && saved && (saved === 'dark' || saved === 'light' || saved === 'system')) {
          setThemeModeState(saved as ThemeMode);
        }
      } catch (e) {
        console.warn('Failed to load theme preference from AsyncStorage:', e);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [initialMode]);

  // Listen to system appearance changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(colorScheme);
    });
    return () => subscription.remove();
  }, []);

  const setThemeMode = useCallback(async (mode: ThemeMode) => {
    setThemeModeState(mode);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (e) {
      console.warn('Failed to persist theme preference:', e);
    }
  }, []);

  const toggleTheme = useCallback(async () => {
    const nextMode: ThemeMode = themeMode === 'dark' ? 'light' : themeMode === 'light' ? 'system' : 'dark';
    await setThemeMode(nextMode);
  }, [themeMode, setThemeMode]);

  const isDark = useMemo(() => {
    if (themeMode === 'system') {
      return systemScheme === 'dark';
    }
    return themeMode === 'dark';
  }, [themeMode, systemScheme]);

  const colors = useMemo(() => (isDark ? darkColors : lightColors), [isDark]);
  const shadows = useMemo(() => (isDark ? darkShadows : lightShadows), [isDark]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      themeMode,
      isDark,
      colors,
      shadows,
      typography,
      radii,
      borderWidth,
      spacing,
      touchTargets,
      setThemeMode,
      toggleTheme,
    }),
    [themeMode, isDark, colors, shadows, setThemeMode, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) {
    // Provide a safe fallback defaulting to dark theme tokens if used outside provider
    return {
      themeMode: 'dark',
      isDark: true,
      colors: darkColors,
      shadows: darkShadows,
      typography,
      radii,
      borderWidth,
      spacing,
      touchTargets,
      setThemeMode: async () => {},
      toggleTheme: async () => {},
    };
  }
  return context;
};
