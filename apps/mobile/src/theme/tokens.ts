/**
 * Friendly Chess Club Design System Tokens
 * Source of truth for colors, spacing, typography, radii, and shadows.
 */

export const colors = {
  // Canvas & Surfaces
  canvas: '#F7F8F2',
  surface: '#FFFFFF',
  surfaceSelected: '#DDF1E6', // Mint selected surface
  surfaceMuted: '#EFF3EF',

  // Brand Primary
  primary: '#146B52', // Deep teal
  primaryHover: '#0F5440',
  primaryText: '#FFFFFF',

  // Typography
  textPrimary: '#1D302A', // Dark pine text
  textSecondary: '#52645B', // Secondary text
  textMuted: '#7E9187',
  textLight: '#FFFFFF',

  // Status Colors (Positive / Negative / Neutral)
  positiveText: '#176447',
  positiveBg: '#E1F3E8',
  negativeText: '#AE3535',
  negativeBg: '#FCEAEA',
  neutralText: '#52645B',
  neutralBg: '#EEF2EE',

  // Decorative Accents
  peach: '#F4C3A8', // Restrained peach decoration
  peachText: '#1D302A',

  // Borders & Dividers
  border: '#D4DDD6',
  borderInput: '#7A8E81',
  borderFocus: '#146B52',

  // Shadows / Overlays
  overlay: 'rgba(29, 48, 42, 0.45)',
  shadow: '#1D302A',
} as const;

export const radii = {
  sm: 8,
  md: 10,
  control: 14, // 14-unit inputs and buttons
  card: 20,    // 20-unit cards
  sheet: 24,   // 24-unit sheets and drawers
  pill: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20, // 20-unit screen insets
  xxl: 24,
  xxxl: 32,
  screenInset: 20,
} as const;

export const typography = {
  heroNumber: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '700' as const,
    color: colors.textPrimary,
  },
  heading: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '700' as const,
    color: colors.textPrimary,
  },
  subheading: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700' as const,
    color: colors.textPrimary,
  },
  body: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '400' as const,
    color: colors.textPrimary,
  },
  bodyBold: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600' as const,
    color: colors.textPrimary,
  },
  label: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500' as const,
    color: colors.textSecondary,
  },
} as const;

export const touchTargets = {
  min: 48,      // Minimum 48-unit touch target
  primaryControl: 52, // 52-unit primary controls
} as const;

export const shadows = {
  card: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  sheet: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 10,
  },
  drawer: {
    shadowColor: colors.shadow,
    shadowOffset: { width: -3, height: 0 },
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 8,
  },
} as const;
