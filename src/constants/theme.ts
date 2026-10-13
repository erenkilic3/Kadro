export const COLORS = {
  // Backgrounds
  background: '#0B131E',      // Deep midnight sports navy
  surface: '#15202E',         // Elevated card surface
  surfaceLight: '#1E2C3D',    // Higher elevation / input surface
  surfaceBorder: '#27384E',   // Border highlight
  
  // Brand & Turf Accents
  primary: '#10B981',         // Turf green
  primaryLight: '#34D399',    // Vibrant emerald highlight
  primaryDark: '#059669',     // Deep grass green
  accent: '#06D6A0',          // Electric mint
  
  // Text
  text: '#F8FAFC',            // Pure crisp white
  textSecondary: '#94A3B8',   // Muted slate
  textTertiary: '#64748B',    // Subdued caption text
  
  // Player Position Colors
  positionGK: '#F59E0B',      // Yellow / Amber for Goalkeepers
  positionDEF: '#3B82F6',     // Royal Blue for Defenders
  positionMID: '#10B981',     // Green for Midfielders
  positionFWD: '#EF4444',     // Crimson Red for Forwards
  
  // Status & Utility
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',
  white: '#FFFFFF',
  black: '#000000',
  pitchGreen: '#0D4828',     // Football grass field
  pitchLines: 'rgba(255, 255, 255, 0.35)',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const FONT_SIZE = {
  xs: 11,
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
  GK: COLORS.positionGK,
  DEF: COLORS.positionDEF,
  MID: COLORS.positionMID,
  FWD: COLORS.positionFWD,
};
