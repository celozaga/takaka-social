// ============================================================================
// UI Core Module - Barrel Export
// ============================================================================
// 
// This module provides all UI-related functionality including:
// - Material 3 theme system
// - Reusable UI components
// - Layout components
// - Design tokens
//

// ============================================================================
// COMPONENTS
// ============================================================================

// Base Components
export {
  Button,
  Card,
  Avatar,
  Typography,
  UIComponents,
} from './components';

export type {
  BaseComponentProps,
  ButtonProps,
  CardProps,
  AvatarProps,
  TypographyProps,
} from './components';

// Re-export shared components
export { default as SharedComponents } from './index';

// ============================================================================
// THEME SYSTEM
// ============================================================================

// Theme utilities and constants
export const themeUtils = {
  // Get theme colors based on mode
  getThemeColors: (mode: 'light' | 'dark') => {
    const lightColors = {
      primary: '#6750A4',
      onPrimary: '#FFFFFF',
      primaryContainer: '#EADDFF',
      onPrimaryContainer: '#21005D',
      secondary: '#625B71',
      onSecondary: '#FFFFFF',
      secondaryContainer: '#E8DEF8',
      onSecondaryContainer: '#1D192B',
      tertiary: '#7D5260',
      onTertiary: '#FFFFFF',
      tertiaryContainer: '#FFD8E4',
      onTertiaryContainer: '#31111D',
      error: '#BA1A1A',
      onError: '#FFFFFF',
      errorContainer: '#FFDAD6',
      onErrorContainer: '#410002',
      background: '#FFFBFE',
      onBackground: '#1C1B1F',
      surface: '#FFFBFE',
      onSurface: '#1C1B1F',
      surfaceVariant: '#E7E0EC',
      onSurfaceVariant: '#49454F',
      outline: '#79747E',
      outlineVariant: '#CAC4D0',
      shadow: '#000000',
      scrim: '#000000',
      inverseSurface: '#313033',
      inverseOnSurface: '#F4EFF4',
      inversePrimary: '#D0BCFF',
    };

    const darkColors = {
      primary: '#D0BCFF',
      onPrimary: '#381E72',
      primaryContainer: '#4F378B',
      onPrimaryContainer: '#EADDFF',
      secondary: '#CCC2DC',
      onSecondary: '#332D41',
      secondaryContainer: '#4A4458',
      onSecondaryContainer: '#E8DEF8',
      tertiary: '#EFB8C8',
      onTertiary: '#492532',
      tertiaryContainer: '#633B48',
      onTertiaryContainer: '#FFD8E4',
      error: '#FFB4AB',
      onError: '#690005',
      errorContainer: '#93000A',
      onErrorContainer: '#FFDAD6',
      background: '#1C1B1F',
      onBackground: '#E6E1E5',
      surface: '#1C1B1F',
      onSurface: '#E6E1E5',
      surfaceVariant: '#49454F',
      onSurfaceVariant: '#CAC4D0',
      outline: '#938F99',
      outlineVariant: '#49454F',
      shadow: '#000000',
      scrim: '#000000',
      inverseSurface: '#E6E1E5',
      inverseOnSurface: '#313033',
      inversePrimary: '#6750A4',
    };

    return mode === 'light' ? lightColors : darkColors;
  },

  // Get shape tokens
  getShapeTokens: () => ({
    corner: {
      none: 0,
      extraSmall: 4,
      small: 8,
      medium: 12,
      large: 16,
      extraLarge: 28,
      full: 9999,
    },
  }),

  // Get typography tokens
  getTypographyTokens: () => ({
    display: {
      large: { fontSize: 57, lineHeight: 64, fontWeight: '400' },
      medium: { fontSize: 45, lineHeight: 52, fontWeight: '400' },
      small: { fontSize: 36, lineHeight: 44, fontWeight: '400' },
    },
    headline: {
      large: { fontSize: 32, lineHeight: 40, fontWeight: '400' },
      medium: { fontSize: 28, lineHeight: 36, fontWeight: '400' },
      small: { fontSize: 24, lineHeight: 32, fontWeight: '400' },
    },
    title: {
      large: { fontSize: 22, lineHeight: 28, fontWeight: '400' },
      medium: { fontSize: 16, lineHeight: 24, fontWeight: '500' },
      small: { fontSize: 14, lineHeight: 20, fontWeight: '500' },
    },
    body: {
      large: { fontSize: 16, lineHeight: 24, fontWeight: '400' },
      medium: { fontSize: 14, lineHeight: 20, fontWeight: '400' },
      small: { fontSize: 12, lineHeight: 16, fontWeight: '400' },
    },
    label: {
      large: { fontSize: 14, lineHeight: 20, fontWeight: '500' },
      medium: { fontSize: 12, lineHeight: 16, fontWeight: '500' },
      small: { fontSize: 11, lineHeight: 16, fontWeight: '500' },
    },
  }),

  // Create theme object
  createTheme: (mode: 'light' | 'dark') => ({
    colors: themeUtils.getThemeColors(mode),
    shape: themeUtils.getShapeTokens(),
    typography: themeUtils.getTypographyTokens(),
    mode,
  }),
};

// ============================================================================
// UTILITIES
// ============================================================================

// UI utilities
export const uiUtils = {
  // Responsive breakpoints
  breakpoints: {
    mobile: 0,
    tablet: 768,
    desktop: 1024,
    wide: 1440,
  },

  // Common spacing values
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },

  // Z-index values
  zIndex: {
    base: 0,
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modal: 1040,
    popover: 1050,
    tooltip: 1060,
    toast: 1070,
  },

  // Animation durations
  animation: {
    fast: 150,
    normal: 300,
    slow: 500,
  },

  // Helper functions
  getResponsiveValue: (value: any, breakpoint: string) => {
    if (typeof value === 'object' && value[breakpoint]) {
      return value[breakpoint];
    }
    return value;
  },

  // Platform detection
  isWeb: () => typeof window !== 'undefined',
  isMobile: () => typeof window !== 'undefined' && window.innerWidth < 768,
  isTablet: () => typeof window !== 'undefined' && window.innerWidth >= 768 && window.innerWidth < 1024,
  isDesktop: () => typeof window !== 'undefined' && window.innerWidth >= 1024,
};

// ============================================================================
// TYPES
// ============================================================================

export interface Theme {
  colors: Record<string, string>;
  shape: {
    corner: Record<string, number>;
  };
  typography: Record<string, Record<string, any>>;
  mode: 'light' | 'dark';
}

export interface ComponentStyleProps {
  theme: Theme;
  variant?: string;
  size?: string;
  disabled?: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const UI_CONSTANTS = {
  DEFAULT_THEME_MODE: 'light' as const,
  ANIMATION_DURATION: 300,
  BORDER_RADIUS: 8,
  SHADOW_ELEVATION: 2,
};

// Default theme instances
export const lightTheme = themeUtils.createTheme('light');
export const darkTheme = themeUtils.createTheme('dark');

// Export theme utilities
export { themeUtils as theme };

// Legacy components (existing)
export { default as VideoPlayer } from './VideoPlayer';
export { default as PhotoCarousel } from './PhotoCarousel';
export { default as MediaActionsModal } from './MediaActionsModal';
export { default as RepostModal } from './RepostModal';
export { default as Feed } from './Feed';
export { default as ErrorState } from './ErrorState';
export { default as RichTextRenderer } from './RichTextRenderer';
export { default as Label } from './Label';
export { default as ContentWarning } from './ContentWarning';

// Accessibility Components
export { default as AccessibleText } from './AccessibleText';