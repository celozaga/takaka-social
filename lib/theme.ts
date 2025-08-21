import { TextStyle } from 'react-native';

// ============================================================================
// Material 3 Design System for Takaka
// Inspired by: https://m3.material.io/
// ============================================================================

// --- 1. COLOR SYSTEM ---

// Base palette (Can be generated from a single seed color)
const palette = {
  primary: '#A8C7FA',
  secondary: '#C2C6DD',
  tertiary: '#E8B9D4',
  neutral: '#909094',
  neutralVariant: '#8D9099',
  error: '#F2B8B5',
  background: '#111314',
  surface: '#111314',
};

// Material 3 color roles for a dark theme
export const colors = {
  primary: palette.primary,
  onPrimary: '#003258',
  primaryContainer: '#D1E4FF',
  onPrimaryContainer: '#001D35',
  
  secondary: palette.secondary,
  onSecondary: '#2B3141',
  secondaryContainer: '#424759',
  onSecondaryContainer: '#DEE2F9',

  tertiary: palette.tertiary,
  onTertiary: '#48253A',
  tertiaryContainer: '#613B51',
  onTertiaryContainer: '#FFD8EE',

  error: palette.error,
  onError: '#601410',
  errorContainer: '#8C1D18',
  onErrorContainer: '#F9DEDC',

  background: palette.background,
  onBackground: '#E2E2E6',

  surface: palette.surface,
  onSurface: '#E2E2E6',
  surfaceVariant: '#43474E',
  onSurfaceVariant: '#C3C6CF',
  
  surfaceContainer: '#1E2021', // surface-2
  surfaceContainerHigh: '#2b2d2e', // surface-3
  surfaceContainerHighest: '#363739',

  outline: '#8D9099',
  outlineVariant: '#43474E',

  inverseSurface: '#E2E2E6',
  inverseOnSurface: '#2F3033',
  inversePrimary: '#3A6494',

  // Custom
  pink: '#ec4899',
  pinkContainer: 'rgba(236, 72, 153, 0.1)',
};

// --- 2. TYPOGRAPHY SYSTEM ---

const fontConfig = {
  regular: 'Roboto_400Regular',
  medium: 'Roboto_500Medium',
  bold: 'Roboto_700Bold',
};

export const typography = {
  displayLarge: { fontFamily: fontConfig.regular, fontSize: 57, lineHeight: 64 } as TextStyle,
  headlineLarge: { fontFamily: fontConfig.regular, fontSize: 32, lineHeight: 40 } as TextStyle,
  headlineMedium: { fontFamily: fontConfig.regular, fontSize: 28, lineHeight: 36 } as TextStyle,
  titleLarge: { fontFamily: fontConfig.bold, fontSize: 22, lineHeight: 28 } as TextStyle,
  titleMedium: { fontFamily: fontConfig.bold, fontSize: 16, lineHeight: 24, letterSpacing: 0.15 } as TextStyle,
  titleSmall: { fontFamily: fontConfig.medium, fontSize: 14, lineHeight: 20, letterSpacing: 0.1 } as TextStyle,
  labelLarge: { fontFamily: fontConfig.medium, fontSize: 14, lineHeight: 20, letterSpacing: 0.1 } as TextStyle,
  labelMedium: { fontFamily: fontConfig.medium, fontSize: 12, lineHeight: 16, letterSpacing: 0.5 } as TextStyle,
  labelSmall: { fontFamily: fontConfig.medium, fontSize: 11, lineHeight: 16, letterSpacing: 0.5 } as TextStyle,
  bodyLarge: { fontFamily: fontConfig.regular, fontSize: 16, lineHeight: 24, letterSpacing: 0.5 } as TextStyle,
  bodyMedium: { fontFamily: fontConfig.regular, fontSize: 14, lineHeight: 20, letterSpacing: 0.25 } as TextStyle,
  bodySmall: { fontFamily: fontConfig.regular, fontSize: 12, lineHeight: 16, letterSpacing: 0.4 } as TextStyle,
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