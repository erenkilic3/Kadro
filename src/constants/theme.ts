export const DARK_COLORS = {
  // Backgrounds
  background: '#0B0F17',      // Deep midnight sports carbon
  surface: '#141C2B',         // Elevated card surface
  surfaceLight: '#1E293B',    // Higher elevation / input surface
  surfaceBorder: '#27384E',   // Border highlight
  surfaceHover: '#233247',
  
  // Brand & Turf Accents
  primary: '#10B981',         // Turf green
  primaryLight: '#34D399',    // Vibrant emerald highlight
  primaryDark: '#059669',     // Deep grass green
  accent: '#00F5A0',          // Electric stadium mint
  
  // Text
  text: '#F8FAFC',            // Pure crisp white
  textSecondary: '#94A3B8',   // Muted slate
  textTertiary: '#64748B',    // Subdued caption text
  
  // Player Position Colors
  positionGK: '#F59E0B',      // Amber for Goalkeepers
  positionDEF: '#3B82F6',     // Royal Blue for Defenders
  positionMID: '#10B981',     // Turf Green for Midfielders
  positionFWD: '#EF4444',     // Crimson Red for Forwards
  
  // Status & Utility
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',
  white: '#FFFFFF',
  black: '#000000',
  pitchGreen: '#0B3319',     // Football grass field
  pitchLines: 'rgba(255, 255, 255, 0.45)',
  cardShadow: '#000000',
};

export const LIGHT_COLORS = {
  // Backgrounds
  background: '#F4F6F9',      // Crisp light arena gray-white
  surface: '#FFFFFF',         // Pure white card surface
  surfaceLight: '#EEF2F6',    // Higher elevation / input surface
  surfaceBorder: '#E2E8F0',   // Clean crisp border
  surfaceHover: '#E2E8F0',
  
  // Brand & Turf Accents
  primary: '#059669',         // Deep turf emerald
  primaryLight: '#10B981',    // Vibrant emerald
  primaryDark: '#047857',     // Deep grass green
  accent: '#0D9488',          // Vibrant stadium teal-mint
  
  // Text
  text: '#0F172A',            // Deep athletic navy-black
  textSecondary: '#475569',   // Slate gray
  textTertiary: '#94A3B8',    // Light slate
  
  // Player Position Colors
  positionGK: '#D97706',      // Darker Amber for Goalkeepers
  positionDEF: '#2563EB',     // Blue for Defenders
  positionMID: '#059669',     // Green for Midfielders
  positionFWD: '#DC2626',     // Crimson Red for Forwards
  
  // Status & Utility
  success: '#059669',
  warning: '#D97706',
  danger: '#DC2626',
  info: '#2563EB',
  white: '#FFFFFF',
  black: '#000000',
  pitchGreen: '#0B3319',
  pitchLines: 'rgba(255, 255, 255, 0.45)',
  cardShadow: 'rgba(15, 23, 42, 0.08)',
};

// Default fallback export
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
  GK: DARK_COLORS.positionGK,
  DEF: DARK_COLORS.positionDEF,
  MID: DARK_COLORS.positionMID,
  FWD: DARK_COLORS.positionFWD,
};

