/**
 * FIDE Calculator — Neo-Brutalist Industrial Design System Tokens
 * Source of truth for colors, spacing, typography, radii, and tactile shadows.
 */

export interface ThemeColors {
  // Canvas & Surfaces
  canvas: string;
  surface: string;
  surfaceElevated: string;
  surfaceMuted: string;
  surfaceSelected: string;

  // Primary Tournament Brand
  primary: string;
  primaryHover: string;
  primaryText: string;

  // Accent / Tournament Clock
  accent: string;
  accentHover: string;
  accentText: string;
  accentMuted: string;

  // Typography
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textLight: string;

  // Status / Results (Win / Loss / Draw)
  win: string;
  winBg: string;
  loss: string;
  lossBg: string;
  draw: string;
  drawBg: string;

  // Legacy mappings for backwards-compatibility
  positive: string;
  positiveText: string;
  positiveBg: string;
  negative: string;
  negativeText: string;
  negativeBg: string;
  neutralText: string;
  neutralBg: string;

  // Decorative Accents
  peach: string;
  peachText: string;

  // Borders & Dividers
  border: string;
  borderSubtle: string;
  borderHeavy: string;
  borderAccent: string;
  borderInput: string;
  borderFocus: string;

  // Shadows / Overlays
  overlay: string;
  shadow: string;
}

export const darkColors: ThemeColors = {
  // Canvas & Surfaces (Obsidian & Tactical Slate)
  canvas: '#0B0F17',
  surface: '#141B26',
  surfaceElevated: '#1B2433',
  surfaceMuted: '#101620',
  surfaceSelected: 'rgba(16, 185, 129, 0.16)',

  // Brand Primary (Tournament Emerald)
  primary: '#10B981',
  primaryHover: '#059669',
  primaryText: '#0B0F17',

  // Accent (Tournament Clock Amber)
  accent: '#F59E0B',
  accentHover: '#D97706',
  accentText: '#0B0F17',
  accentMuted: 'rgba(245, 158, 11, 0.16)',

  // Typography
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  textLight: '#FFFFFF',

  // Status Colors
  win: '#10B981',
  winBg: 'rgba(16, 185, 129, 0.16)',
  loss: '#EF4444',
  lossBg: 'rgba(239, 68, 68, 0.16)',
  draw: '#94A3B8',
  drawBg: 'rgba(148, 163, 184, 0.16)',

  // Legacy & status mappings
  positive: '#10B981',
  positiveText: '#10B981',
  positiveBg: 'rgba(16, 185, 129, 0.16)',
  negative: '#EF4444',
  negativeText: '#EF4444',
  negativeBg: 'rgba(239, 68, 68, 0.16)',
  neutralText: '#94A3B8',
  neutralBg: 'rgba(148, 163, 184, 0.16)',

  // Decorative Accents
  peach: '#FCD34D',
  peachText: '#0B0F17',

  // Borders & Dividers (Heavy mechanical lines)
  border: '#2A3649',
  borderSubtle: '#1E293B',
  borderHeavy: '#384964',
  borderAccent: '#10B981',
  borderInput: '#3B4D66',
  borderFocus: '#10B981',

  // Shadows / Overlays
  overlay: 'rgba(5, 8, 13, 0.78)',
  shadow: '#05080D',
};

export const lightColors: ThemeColors = {
  // Canvas & Surfaces (Warm Industrial Light / Tournament Paper)
  canvas: '#F4F5F0',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  surfaceMuted: '#E2E8F0',
  surfaceSelected: 'rgba(16, 185, 129, 0.12)',

  // Brand Primary (Deep Emerald)
  primary: '#059669',
  primaryHover: '#047857',
  primaryText: '#FFFFFF',

  // Accent (Warm Amber)
  accent: '#D97706',
  accentHover: '#B45309',
  accentText: '#FFFFFF',
  accentMuted: 'rgba(217, 119, 6, 0.12)',

  // Typography
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#64748B',
  textLight: '#FFFFFF',

  // Status Colors
  win: '#059669',
  winBg: '#DCFCE7',
  loss: '#DC2626',
  lossBg: '#FEE2E2',
  draw: '#475569',
  drawBg: '#F1F5F9',

  // Legacy & status mappings
  positive: '#059669',
  positiveText: '#059669',
  positiveBg: '#DCFCE7',
  negative: '#DC2626',
  negativeText: '#DC2626',
  negativeBg: '#FEE2E2',
  neutralText: '#475569',
  neutralBg: '#F1F5F9',

  // Decorative Accents
  peach: '#FCD34D',
  peachText: '#0F172A',

  // Borders & Dividers (Crisp Industrial Graphite)
  border: '#1E293B',
  borderSubtle: '#CBD5E1',
  borderHeavy: '#0F172A',
  borderAccent: '#047857',
  borderInput: '#64748B',
  borderFocus: '#047857',

  // Shadows / Overlays
  overlay: 'rgba(15, 23, 42, 0.55)',
  shadow: '#1E293B',
};

// Default export for backward compatibility — dark mode default
export const colors = darkColors;

export const radii = {
  xs: 4,
  sm: 6,
  md: 10,
  control: 10,
  card: 12,
  sheet: 18,
  xl: 18,
  pill: 999,
} as const;

export const borderWidth = {
  thin: 1,
  default: 1.5,
  medium: 1.5,
  heavy: 2,
  offset: 3,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  screenInset: 16,
} as const;

export const typography = {
  heroNumber: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '800' as const,
    fontVariant: ['tabular-nums'] as ('tabular-nums')[],
  },
  heading: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800' as const,
    letterSpacing: -0.3,
  },
  subheading: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700' as const,
  },
  titleMd: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700' as const,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500' as const,
  },
  bodyBold: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '700' as const,
  },
  label: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  mono: {
    fontVariant: ['tabular-nums'] as ('tabular-nums')[],
  },
  monoBadge: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700' as const,
    fontVariant: ['tabular-nums'] as ('tabular-nums')[],
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600' as const,
  },
} as const;

export const touchTargets = {
  min: 48,
  primaryControl: 50,
} as const;

export interface ThemeShadows {
  card: {
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  };
  tactileOffset: {
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  };
  sheet: {
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  };
  drawer: {
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  };
}

export const darkShadows: ThemeShadows = {
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },
  tactileOffset: {
    shadowColor: '#000000',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.85,
    shadowRadius: 0,
    elevation: 4,
  },
  sheet: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 10,
  },
  drawer: {
    shadowColor: '#000000',
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 12,
  },
};

export const lightShadows: ThemeShadows = {
  card: {
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  tactileOffset: {
    shadowColor: '#1E293B',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.9,
    shadowRadius: 0,
    elevation: 4,
  },
  sheet: {
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 8,
  },
  drawer: {
    shadowColor: '#1E293B',
    shadowOffset: { width: -3, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 8,
  },
};
