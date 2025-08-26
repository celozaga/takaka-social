import { Platform, StyleSheet } from 'react-native';
import { darkTheme, lightTheme, darkColors, lightColors, spacing as newSpacing, typography as newTypography, radius } from '@/src/design/tokens';

/**
 * ============================================================================
 * App Design Tokens (Legacy Bridge)
 * ============================================================================
 *
 * This file now bridges to the new universal design tokens in src/design/tokens.ts
 * while maintaining backward compatibility for existing components.
 *
 * DEPRECATED: Use ThemeProvider and useTheme() hook for new components.
 * Import directly from '@/src/design/tokens' for new implementations.
 *
 * For new components, use:
 * - import { useTheme } from '@/components/shared/ThemeProvider'
 * - const theme = useTheme()
 *
 */

// Re-export new tokens for compatibility
export { darkTheme, lightTheme } from '@/src/design/tokens';

/**
 * ============================================================================
 * Legacy Color Palette (DEPRECATED)
 * ============================================================================
 */
const palette = {
  // Brand Colors
  brandPrimary: '#ffffff',

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
 * Legacy Theme Colors (DEPRECATED - Use darkColors/lightColors from tokens)
 * ============================================================================
 */
const darkThemeColors = darkColors;
const lightThemeColors = lightColors;

/**
 * ============================================================================
 * Legacy Design Tokens (DEPRECATED)
 * ============================================================================
 */
const shape = {
  small: radius.sm,
  medium: radius.md,
  large: radius.lg,
  extraLarge: radius.xl,
  full: radius.full,
};

const spacing = {
  xs: newSpacing.xs,
  s: newSpacing.sm,
  m: newSpacing.md,
  l: newSpacing.lg,
  xl: newSpacing.xl,
  xxl: newSpacing['2xl'],
};

const typography = {
  titleLarge: newTypography.titleLarge,
  titleMedium: newTypography.titleMedium,
  titleSmall: newTypography.titleSmall,
  labelLarge: newTypography.labelLarge,
  labelMedium: newTypography.labelMedium,
  labelSmall: newTypography.labelSmall,
  bodyLarge: newTypography.bodyLarge,
  bodyMedium: newTypography.bodyMedium,
  bodySmall: newTypography.bodySmall,
};

/**
 * ============================================================================
 * Legacy Exported Theme Object (DEPRECATED)
 * ============================================================================
 *
 * This maintains backward compatibility for existing components.
 * New components should use ThemeProvider and useTheme() hook.
 *
 */
export const theme = {
  colors: darkThemeColors,
  shape,
  spacing,
  typography,

  /**
   * Centralized styles for all settings-related screens to ensure consistency.
   * NOTE: These styles now use the bridged tokens from the new design system.
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

// For backward compatibility, export palette and individual objects
export { palette, darkThemeColors, lightThemeColors, shape, spacing, typography };
