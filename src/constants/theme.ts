export const DARK_COLORS = {
  // Floodlight Charcoal palette
  background: '#0D1011',
  surface: '#15191B',
  surfaceLight: '#1E2326',
  surfaceBorder: 'rgba(255, 255, 255, 0.08)',
  surfaceHover: '#262C30',

  // Turf & Matchday Accents
  primary: '#16A34A',
  primaryLight: '#22C55E',
  primaryDark: '#15803D',
  accent: '#22C55E',

  // Text Hierarchy
  text: '#F4F4F5',
  textSecondary: '#A1A1AA',
  textTertiary: '#71717A',

  // Player Position Colors
  positionGK: '#D97706',
  positionDEF: '#2563EB',
  positionMID: '#16A34A',
  positionFWD: '#DC2626',

  // Status & Utility
  success: '#22C55E',
  warning: '#EAB308',
  danger: '#EF4444',
  info: '#38BDF8',
  white: '#FFFFFF',
  black: '#000000',
  pitchGreen: '#14452B',
  pitchLines: 'rgba(255, 255, 255, 0.3)',
  cardShadow: 'rgba(0, 0, 0, 0.25)',
};

export const LIGHT_COLORS = {
  // Matchday Paper palette
  background: '#F5F5F3',
  surface: '#FFFFFF',
  surfaceLight: '#EEEEEC',
  surfaceBorder: 'rgba(17, 24, 39, 0.08)',
  surfaceHover: '#E5E5E0',

  // Turf & Matchday Accents
  primary: '#15803D',
  primaryLight: '#16A34A',
  primaryDark: '#166534',
  accent: '#15803D',

  // Text Hierarchy
  text: '#111315',
  textSecondary: '#52525B',
  textTertiary: '#8E8E93',

  // Player Position Colors
  positionGK: '#B45309',
  positionDEF: '#1D4ED8',
  positionMID: '#15803D',
  positionFWD: '#B91C1C',

  // Status & Utility
  success: '#15803D',
  warning: '#CA8A04',
  danger: '#DC2626',
  info: '#0284C7',
  white: '#FFFFFF',
  black: '#000000',
  pitchGreen: '#14452B',
  pitchLines: 'rgba(255, 255, 255, 0.3)',
  cardShadow: 'rgba(17, 24, 39, 0.06)',
};

export const COLORS = DARK_COLORS;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
};

export const FONT_SIZE = {
  xs: 12,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  title: 28,
};

export const POSITION_LABELS: Record<string, string> = {
  GK: 'Kaleci',
  DEF: 'Defans',
  MID: 'Orta Saha',
  FWD: 'Forvet',
};

export const POSITION_COLORS: Record<string, string> = {
  GK: DARK_COLORS.positionGK,
  DEF: DARK_COLORS.positionDEF,
  MID: DARK_COLORS.positionMID,
  FWD: DARK_COLORS.positionFWD,
};
