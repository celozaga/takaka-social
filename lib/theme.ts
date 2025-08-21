import { TextStyle } from 'react-native';

// ============================================================================
// Material 3 Design System for Takaka
// Inspired by: https://m3.material.io/
// ============================================================================

// --- 1. COLOR SYSTEM ---

// Base palette (Can be generated from a single seed color)
const palette = {
  primary: '#1D9BF0',
  secondary: '#8B98A5',
  tertiary: '#E8B9D4',
  neutral: '#909094',
  neutralVariant: '#8D9099',
  error: '#F2B8B5',
  background: '#15202B', // Dark blue-grey, like the old UI
  surface: '#15202B',
};

// Material 3 color roles for a dark theme
export const colors = {
  primary: palette.primary,
  onPrimary: '#FFFFFF',
  primaryContainer: '#004A7F',
  onPrimaryContainer: '#D3E5FF',
  
  secondary: palette.secondary,
  onSecondary: '#FFFFFF',
  secondaryContainer: '#4A4A4A',
  onSecondaryContainer: '#E0E0E0',

  tertiary: palette.tertiary,
  onTertiary: '#48253A',
  tertiaryContainer: '#613B51',
  onTertiaryContainer: '#FFD8EE',

  error: palette.error,
  onError: '#601410',
  errorContainer: '#8C1D18',
  onErrorContainer: '#F9DEDC',

  background: palette.background,
  onBackground: '#E7E9EA',

  surface: palette.surface,
  onSurface: '#E7E9EA', // Main text color
  surfaceVariant: '#43474E',
  onSurfaceVariant: '#8B98A5', // Lighter grey for secondary text
  
  surfaceContainer: '#15202B', // For cards to match background, border defines them
  surfaceContainerHigh: '#192734', // A slightly lighter container color for interactions
  surfaceContainerHighest: '#203449',

  outline: '#38444D', // Borders
  outlineVariant: '#38444D',

  inverseSurface: '#E2E2E6',
  inverseOnSurface: '#2F3033',
  inversePrimary: '#00639B',

  // Custom
  pink: '#ec4899',
  pinkContainer: 'rgba(236, 72, 153, 0.1)',
};

// --- 2. TYPOGRAPHY SYSTEM ---

const FONT_FAMILY = 'Roboto';

export const typography = {
  displayLarge: { fontFamily: FONT_FAMILY, fontWeight: '400', fontSize: 57, lineHeight: 64 } as TextStyle,
  headlineLarge: { fontFamily: FONT_FAMILY, fontWeight: '400', fontSize: 32, lineHeight: 40 } as TextStyle,
  headlineMedium: { fontFamily: FONT_FAMILY, fontWeight: '400', fontSize: 28, lineHeight: 36 } as TextStyle,
  titleLarge: { fontFamily: FONT_FAMILY, fontWeight: '700', fontSize: 22, lineHeight: 28 } as TextStyle,
  titleMedium: { fontFamily: FONT_FAMILY, fontWeight: '700', fontSize: 16, lineHeight: 24, letterSpacing: 0.15 } as TextStyle,
  titleSmall: { fontFamily: FONT_FAMILY, fontWeight: '500', fontSize: 14, lineHeight: 20, letterSpacing: 0.1 } as TextStyle,
  labelLarge: { fontFamily: FONT_FAMILY, fontWeight: '500', fontSize: 14, lineHeight: 20, letterSpacing: 0.1 } as TextStyle,
  labelMedium: { fontFamily: FONT_FAMILY, fontWeight: '500', fontSize: 12, lineHeight: 16, letterSpacing: 0.5 } as TextStyle,
  labelSmall: { fontFamily: FONT_FAMILY, fontWeight: '500', fontSize: 11, lineHeight: 16, letterSpacing: 0.5 } as TextStyle,
  bodyLarge: { fontFamily: FONT_FAMILY, fontWeight: '400', fontSize: 16, lineHeight: 24, letterSpacing: 0.5 } as TextStyle,
  bodyMedium: { fontFamily: FONT_FAMILY, fontWeight: '400', fontSize: 14, lineHeight: 22, letterSpacing: 0.25 } as TextStyle,
  bodySmall: { fontFamily: FONT_FAMILY, fontWeight: '400', fontSize: 12, lineHeight: 16, letterSpacing: 0.4 } as TextStyle,
};

// --- 3. SHAPE SYSTEM ---

export const shape = {
  none: 0,
  extraSmall: 4,
  small: 8,
  medium: 12,
  large: 16,
  extraLarge: 28,
  full: 999,
};

// --- 4. SPACING SYSTEM ---

export const spacing = {
  xxs: 2,
  xs: 4,
  s: 8,
  m: 12,
  l: 16,
  xl: 24,
  xxl: 32,
};

const theme = {
  colors,
  typography,
  shape,
  spacing,
};

export default theme;