export const DARK_COLORS = {
  // Precision Slate & Turf palette
  background: '#0B0D0F',
  surface: '#111418',
  surfaceLight: '#171B20',
  surfaceBorder: '#232830',
  surfaceHover: '#1E232A',

  // Turf & Matchday Accents
  primary: '#16A34A',
  primaryLight: '#22C55E',
  primaryDark: '#15803D',
  accent: '#16A34A',

  // Text Hierarchy
  text: '#F3F4F6',
  textSecondary: '#9CA3AF',
  textTertiary: '#6B7280',

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
  // Editorial Paper & Crisp Slate palette
  background: '#F6F7F9',
  surface: '#FFFFFF',
  surfaceLight: '#F0F2F5',
  surfaceBorder: '#DFE3EA',
  surfaceHover: '#E6E9F0',

  // Turf & Matchday Accents
  primary: '#15803D',
  primaryLight: '#16A34A',
  primaryDark: '#166534',
  accent: '#15803D',

  // Text Hierarchy
  text: '#111827',
  textSecondary: '#4B5563',
  textTertiary: '#6B7280',

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
  xs: 4,
  sm: 6,
  md: 8,
  lg: 10,
  pill: 999,
};

export const NUMERIC_STYLE = {
  fontVariant: ['tabular-nums'] as ('tabular-nums')[],
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
