/**
 * ============================================================================
 * Universal Design Tokens
 * ============================================================================
 *
 * This is the single source of truth for all design tokens in the app.
 * These tokens work across all platforms (web, iOS, Android) and provide
 * a consistent design language for the entire application.
 *
 * Usage:
 * - Import tokens directly: import { colors, spacing } from '@/src/design/tokens'
 * - Use with theme provider: const theme = useTheme()
 *
 */

import { Platform } from 'react-native';

// ============================================================================
// Base Palette
// ============================================================================

export const palette = {
  // Brand Colors
  brandPrimary: '#ffffff',
  brandSecondary: '#ec4899',
  
  // Grayscale
  black: '#101010',
  darkGray: '#1E1E1E',
  midGray: '#616161',
  lightGray: '#9E9E9E',
  offWhite: '#F3F5F7',
  white: '#ffffff',
  
  // System Colors
  error: '#FF453A',
  errorLight: '#F9DEDC',
  errorDark: '#601410',
  warning: '#FF9500',
  warningLight: '#FFF4E5',
  warningDark: '#7D4A00',
  success: '#30D158',
  successLight: '#E8F7EA',
  successDark: '#1A7C26',
  info: '#007AFF',
  infoLight: '#E5F0FF',
  infoDark: '#003D7F',
  
  // Overlays
  blackOverlay: 'rgba(0, 0, 0, 0.5)',
  whiteOverlay: 'rgba(255, 255, 255, 0.1)',
  
  // Social Media Colors
  bluesky: '#00D4AA',
  twitter: '#1DA1F2',
  instagram: '#E4405F',
} as const;

// ============================================================================
// Semantic Color Tokens
// ============================================================================

export const lightColors = {
  // Primary
  primary: palette.black,
  onPrimary: palette.white,
  primaryContainer: palette.lightGray,
  onPrimaryContainer: palette.black,
  
  // Secondary
  secondary: palette.brandSecondary,
  onSecondary: palette.white,
  secondaryContainer: '#FCE7F3',
  onSecondaryContainer: '#701A40',
  
  // Background & Surface
  background: palette.offWhite,
  onBackground: palette.black,
  surface: palette.white,
  onSurface: palette.black,
  surfaceVariant: '#F5F5F5',
  onSurfaceVariant: palette.midGray,
  surfaceContainer: '#EEEEEE',
  surfaceContainerLow: '#F5F5F5',
  surfaceContainerHigh: '#E0E0E0',
  surfaceContainerHighest: '#BDBDBD',
  
  // Interactive States
  hover: 'rgba(0, 0, 0, 0.08)',
  pressed: 'rgba(0, 0, 0, 0.12)',
  focused: 'rgba(0, 0, 0, 0.12)',
  selected: 'rgba(0, 0, 0, 0.08)',
  disabled: 'rgba(0, 0, 0, 0.12)',
  surfaceContainerHover: 'rgba(0, 0, 0, 0.08)',
  
  // Borders & Outlines
  outline: '#E0E0E0',
  outlineVariant: '#F0F0F0',
  
  // System Colors
  error: palette.error,
  onError: palette.white,
  errorContainer: palette.errorLight,
  onErrorContainer: '#410E0B',
  warning: palette.warning,
  onWarning: palette.white,
  warningContainer: palette.warningLight,
  onWarningContainer: '#3D2500',
  success: palette.success,
  onSuccess: palette.white,
  successContainer: palette.successLight,
  onSuccessContainer: '#0D3912',
  info: palette.info,
  onInfo: palette.white,
  infoContainer: palette.infoLight,
  onInfoContainer: '#001E40',
  
  // Social
  bluesky: palette.bluesky,
  
  // Legacy colors for backward compatibility
  pink: palette.brandSecondary,
} as const;

export const darkColors = {
  // Primary
  primary: palette.brandPrimary,
  onPrimary: palette.black,
  primaryContainer: '#2A2A2A',
  onPrimaryContainer: palette.offWhite,
  
  // Secondary
  secondary: palette.brandSecondary,
  onSecondary: palette.white,
  secondaryContainer: '#701A40',
  onSecondaryContainer: '#FCE7F3',
  
  // Background & Surface
  background: palette.black,
  onBackground: palette.offWhite,
  surface: palette.black,
  onSurface: palette.offWhite,
  surfaceVariant: '#1A1A1A',
  onSurfaceVariant: palette.midGray,
  surfaceContainer: palette.darkGray,
  surfaceContainerLow: '#171717',
  surfaceContainerHigh: '#2a2a2a',
  surfaceContainerHighest: palette.midGray,
  
  // Interactive States
  hover: palette.whiteOverlay,
  pressed: 'rgba(255, 255, 255, 0.16)',
  focused: 'rgba(255, 255, 255, 0.16)',
  selected: 'rgba(255, 255, 255, 0.08)',
  disabled: 'rgba(255, 255, 255, 0.12)',
  surfaceContainerHover: palette.whiteOverlay,
  
  // Borders & Outlines
  outline: '#3C3C3C',
  outlineVariant: '#2A2A2A',
  
  // System Colors
  error: palette.error,
  onError: palette.white,
  errorContainer: palette.errorDark,
  onErrorContainer: palette.errorLight,
  warning: palette.warning,
  onWarning: palette.black,
  warningContainer: palette.warningDark,
  onWarningContainer: palette.warningLight,
  success: palette.success,
  onSuccess: palette.black,
  successContainer: '#1A7C26',
  onSuccessContainer: palette.successLight,
  info: palette.info,
  onInfo: palette.white,
  infoContainer: '#003D7F',
  onInfoContainer: palette.infoLight,
  
  // Social
  bluesky: palette.bluesky,
  
  // Legacy colors for backward compatibility
  pink: palette.brandSecondary,
} as const;

// ============================================================================
// Spacing Tokens
// ============================================================================

export const spacing = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 64,
} as const;

// ============================================================================
// Typography Tokens
// ============================================================================

export const typography = {
  // Display
  displayLarge: {
    fontSize: 57,
    lineHeight: 64,
    fontWeight: '400' as const,
  },
  displayMedium: {
    fontSize: 45,
    lineHeight: 52,
    fontWeight: '400' as const,
  },
  displaySmall: {
    fontSize: 36,
    lineHeight: 44,
    fontWeight: '400' as const,
  },
  
  // Headline
  headlineLarge: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '600' as const,
  },
  headlineMedium: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '600' as const,
  },
  headlineSmall: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '600' as const,
  },
  
  // Title
  titleLarge: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: 'bold' as const,
  },
  titleMedium: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: 'bold' as const,
  },
  titleSmall: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600' as const,
  },
  
  // Label
  labelLarge: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600' as const,
  },
  labelMedium: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '500' as const,
  },
  labelSmall: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '500' as const,
  },
  
  // Body
  bodyLarge: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400' as const,
  },
  bodyMedium: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400' as const,
  },
  bodySmall: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400' as const,
  },
  
  // Caption
  caption: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '400' as const,
  },
} as const;

// ============================================================================
// Border Radius Tokens
// ============================================================================

export const radius = {
  none: 0,
  xs: 2,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
  full: 9999,
} as const;

// ============================================================================
// Shadow/Elevation Tokens
// ============================================================================

export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2.5,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.37,
    shadowRadius: 7.49,
    elevation: 12,
  },
} as const;

// ============================================================================
// Size Tokens
// ============================================================================

export const sizes = {
  // Icons
  iconXs: 12,
  iconSm: 16,
  iconMd: 20,
  iconLg: 24,
  iconXl: 32,
  iconXxl: 40,
  
  // Avatars
  avatarXs: 24,
  avatarSm: 32,
  avatarMd: 40,
  avatarLg: 48,
  avatarXl: 64,
  avatarXxl: 80,
  
  // Button heights
  buttonSm: 32,
  buttonMd: 40,
  buttonLg: 48,
  buttonXl: 56,
  
  // Input heights
  inputSm: 32,
  inputMd: 40,
  inputLg: 48,
} as const;

// ============================================================================
// Breakpoints (for responsive design)
// ============================================================================

export const breakpoints = {
  xs: 480,
  sm: 768,
  md: 1024,
  lg: 1280,
  xl: 1536,
} as const;

// ============================================================================
// Animation Tokens
// ============================================================================

export const animations = {
  // Duration
  duration: {
    fast: 150,
    normal: 200,
    slow: 300,
    slower: 500,
  },
  
  // Easing
  easing: {
    linear: 'linear',
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
  },
} as const;

// ============================================================================
// Theme Variants
// ============================================================================

export const lightTheme = {
  colors: lightColors,
  spacing,
  typography,
  radius,
  shadows,
  sizes,
  breakpoints,
  animations,
} as const;

export const darkTheme = {
  colors: darkColors,
  spacing,
  typography,
  radius,
  shadows,
  sizes,
  breakpoints,
  animations,
} as const;

// ============================================================================
// Types
// ============================================================================

export type ThemeColors = typeof lightColors;
export type Theme = typeof lightTheme | typeof darkTheme;
export type ColorScheme = 'light' | 'dark';

// ============================================================================
// Utility Functions
// ============================================================================

export const getTheme = (colorScheme: ColorScheme): Theme => {
  return colorScheme === 'dark' ? darkTheme : lightTheme;
};

// Default export for backward compatibility
export default {
  light: lightTheme,
  dark: darkTheme,
};
