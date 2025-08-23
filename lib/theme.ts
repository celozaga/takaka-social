import { Platform, StyleSheet } from 'react-native';

/**
 * ============================================================================
 * Color Palette
 * ============================================================================
 *
 * This section defines the base colors used throughout the application.
 * Naming is abstract to allow for easy theming (e.g., light vs. dark).
 *
 */
const palette = {
  // Brand Colors
  brandPrimary: '#F3F5F7',

  // Grayscale
  black: '#101010',
  darkGray: '#1E1E1E',
  midGray: '#616161',
  offWhite: '#F3F5F7',
  
  // System Colors
  error: '#FF453A',
  errorContainer: '#601410',
  onErrorContainer: '#F9DEDC',
  
  // Overlays
  white_10: 'rgba(255, 255, 255, 0.1)',
};

/**
 * ============================================================================
 * Theme Colors
 * ============================================================================
 *
 * Maps the abstract palette colors to semantic theme roles (e.g., 'background').
 * This is the active color set for the application.
 *
 */
const darkThemeColors = {
  primary: palette.brandPrimary,
  onPrimary: palette.black,
  background: palette.black,
  surface: palette.black,
  surfaceContainer: palette.darkGray,
  surfaceContainerHigh: '#2a2a2a', // Slightly lighter than darkGray for pressed states
  surfaceContainerHighest: palette.midGray,
  surfaceContainerHover: palette.white_10,
  onSurface: palette.offWhite,
  onSurfaceVariant: palette.midGray,
  outline: '#3c3c3c', // A subtle outline color
  error: palette.error,
  errorContainer: palette.errorContainer,
  onErrorContainer: palette.onErrorContainer,
  pink: '#ec4899',
};

// Example structure for a future light theme
const lightThemeColors = {
  primary: palette.black,
  onPrimary: palette.offWhite,
  background: palette.offWhite,
  surface: palette.offWhite,
  surfaceContainer: '#E0E0E0', // Example light gray
  surfaceContainerHigh: '#BDBDBD', // Example mid light gray
  surfaceContainerHighest: '#9E9E9E', // Example dark light gray
  surfaceContainerHover: 'rgba(0, 0, 0, 0.1)',
  onSurface: palette.black,
  onSurfaceVariant: palette.midGray,
  outline: '#E0E0E0',
  error: palette.error,
  errorContainer: '#F9DEDC',
  onErrorContainer: '#410E0B',
  pink: '#ec4899',
};

/**
 * ============================================================================
 * Design Tokens
 * ============================================================================
 *
 * Provides consistent spacing, shapes, and typography for the entire app.
 * Using these tokens ensures a uniform and predictable design.
 *
 */
const shape = {
  small: 4,
  medium: 8,
  large: 12,
  extraLarge: 16,
  full: 9999,
};

const spacing = {
  xs: 4,
  s: 8,
  m: 12,
  l: 16,
  xl: 24,
  xxl: 32,
};

const typography = {
  titleLarge: { fontSize: 22, fontWeight: 'bold' as const },
  titleMedium: { fontSize: 18, fontWeight: 'bold' as const },
  titleSmall: { fontSize: 16, fontWeight: '600' as const },
  labelLarge: { fontSize: 14, fontWeight: '600' as const },
  labelMedium: { fontSize: 12, fontWeight: '500' as const },
  labelSmall: { fontSize: 11, fontWeight: '500' as const },
  bodyLarge: { fontSize: 16, lineHeight: 24 },
  bodyMedium: { fontSize: 14, lineHeight: 20 },
  bodySmall: { fontSize: 12, lineHeight: 16 },
};

/**
 * ============================================================================
 * Exported Theme Object
 * ============================================================================
 *
 * This is the single source of truth for all design tokens and shared styles.
 * Components should import this object to access theme values.
 * To switch themes, change `colors` to `lightThemeColors`.
 *
 */
export const theme = {
  colors: darkThemeColors,
  shape,
  spacing,
  typography,

  /**
   * Centralized styles for all settings-related screens to ensure consistency.
   */
  settingsStyles: StyleSheet.create({
    // Page level styles
    container: {
        padding: spacing.l,
        gap: spacing.xl,
    },
    scrollContainer: {
        padding: spacing.l,
    },
    description: {
        color: darkThemeColors.onSurfaceVariant,
        ...typography.bodyMedium,
        marginBottom: spacing.l,
    },

    // Section styles
    section: {
        backgroundColor: darkThemeColors.surfaceContainer,
        borderRadius: shape.large,
        overflow: 'hidden',
    },
    sectionHeader: {
        ...typography.labelLarge,
        fontWeight: 'bold',
        color: darkThemeColors.onSurfaceVariant,
        paddingHorizontal: spacing.s,
        marginBottom: spacing.s,
    },

    // Item styles
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: spacing.l,
        backgroundColor: 'transparent',
    },
    itemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.l,
        flex: 1,
    },
    itemRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.s,
    },
    itemTextContainer: {
        flex: 1,
    },
    icon: {
        width: 24,
        height: 24,
    },
    label: {
        ...typography.bodyLarge,
        fontWeight: '600',
        color: darkThemeColors.onSurface,
    },
    sublabel: {
        ...typography.bodyMedium,
        color: darkThemeColors.onSurfaceVariant,
        marginTop: 2,
    },
    value: {
        color: darkThemeColors.onSurfaceVariant,
        fontSize: 14,
    },
    destructiveLabel: {
        color: darkThemeColors.error,
    },

    // States
    disabled: {
        opacity: 0.5,
    },
    pressed: {
        backgroundColor: darkThemeColors.surfaceContainerHigh,
    },

    // Divider
    divider: {
        height: 1,
        backgroundColor: darkThemeColors.outline,
        marginLeft: 56, // Icon size (24) + item padding (16) + gap (16)
    },
  }),
};

// For convenience, we can still export settingsStyles directly,
// but it's now derived from the main theme object.
export const settingsStyles = theme.settingsStyles;
