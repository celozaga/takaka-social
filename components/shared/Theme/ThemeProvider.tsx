/**
 * ============================================================================
 * Theme Provider & Hook
 * ============================================================================
 *
 * Universal theme provider that works across all platforms.
 * Provides access to design tokens and theme switching functionality.
 *
 * Usage:
 * 1. Wrap your app: <ThemeProvider><App /></ThemeProvider>
 * 2. Use in components: const theme = useTheme()
 * 3. Access tokens: theme.colors.primary, theme.spacing.md, etc.
 *
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Appearance, ColorSchemeName, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightTheme, darkTheme, getTheme, ColorScheme, Theme } from '@/src/design/tokens';
// Remove accessibility import as it creates circular dependency

// ============================================================================
// Types
// ============================================================================

interface ThemeContextType {
  theme: Theme & { 
    settingsStyles: any;
    spacing: Theme['spacing'] & {
      s: number;
      m: number;
      l: number;
      xl: number;
      xxl: number;
    };
  };
  colorScheme: ColorScheme;
  isDark: boolean;
  setColorScheme: (scheme: ColorScheme | 'system') => void;
  toggleTheme: () => void;
  // Accessibility-aware theme properties
  accessibleTypography: typeof lightTheme.typography;
  textScale: number;
  fontWeight: 'normal' | 'bold';
}

// ============================================================================
// Context
// ============================================================================

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// ============================================================================
// Constants
// ============================================================================

const THEME_STORAGE_KEY = '@takaka/theme-preference';

// ============================================================================
// Provider Component
// ============================================================================

interface ThemeProviderProps {
  children: ReactNode;
  defaultColorScheme?: ColorScheme;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultColorScheme = 'dark', // Default to dark theme as per current app
}) => {
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>(defaultColorScheme);
  const [isSystemTheme, setIsSystemTheme] = useState(false);
  
  // Remove accessibility dependency to avoid circular dependency

  // Initialize theme from storage or system preference
  useEffect(() => {
    const initializeTheme = async () => {
      try {
        const storedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        
        if (storedTheme === 'system') {
          setIsSystemTheme(true);
          const systemScheme = Appearance.getColorScheme();
          setColorSchemeState(systemScheme === 'light' ? 'light' : 'dark');
        } else if (storedTheme === 'light' || storedTheme === 'dark') {
          setIsSystemTheme(false);
          setColorSchemeState(storedTheme);
        }
      } catch (error) {
        console.warn('Failed to load theme preference:', error);
      }
    };

    initializeTheme();
  }, []);

  // Listen to system theme changes when using system theme
  useEffect(() => {
    if (!isSystemTheme) return;

    const subscription = Appearance.addChangeListener(({ colorScheme: systemScheme }) => {
      setColorSchemeState(systemScheme === 'light' ? 'light' : 'dark');
    });

    return () => subscription.remove();
  }, [isSystemTheme]);

  // Set color scheme with persistence
  const setColorScheme = async (scheme: ColorScheme | 'system') => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, scheme);
      
      if (scheme === 'system') {
        setIsSystemTheme(true);
        const systemScheme = Appearance.getColorScheme();
        setColorSchemeState(systemScheme === 'light' ? 'light' : 'dark');
      } else {
        setIsSystemTheme(false);
        setColorSchemeState(scheme);
      }
    } catch (error) {
      console.warn('Failed to save theme preference:', error);
      // Still update the state even if storage fails
      if (scheme !== 'system') {
        setIsSystemTheme(false);
        setColorSchemeState(scheme);
      }
    }
  };

  // Toggle between light and dark (disable system mode)
  const toggleTheme = () => {
    const newScheme = colorScheme === 'light' ? 'dark' : 'light';
    setColorScheme(newScheme);
  };

  // Get current theme object and extend with legacy settingsStyles for backward compatibility
  const baseTheme = getTheme(colorScheme);
  
  // Create settingsStyles directly using current theme
  const settingsStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: baseTheme.colors.background,
    },
    section: {
       backgroundColor: baseTheme.colors.surfaceContainer,
       marginVertical: baseTheme.spacing.xs,
       borderRadius: baseTheme.radius.md,
     },
    sectionHeader: {
      padding: baseTheme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: baseTheme.colors.outline,
    },
    sectionHeaderText: {
      ...baseTheme.typography.titleMedium,
      color: baseTheme.colors.onSurface,
    },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: baseTheme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: baseTheme.colors.outline,
    },
    itemText: {
      ...baseTheme.typography.bodyLarge,
      color: baseTheme.colors.onSurface,
      flex: 1,
    },
    itemDescription: {
      ...baseTheme.typography.bodyMedium,
      color: baseTheme.colors.onSurfaceVariant,
      marginTop: baseTheme.spacing.xs,
    },
  });
  
  // Aliases de espaçamento para compatibilidade (ex.: theme.spacing.l)
  const spacingWithAliases = { ...baseTheme.spacing, s: baseTheme.spacing.sm, m: baseTheme.spacing.md, l: baseTheme.spacing.lg, xl: baseTheme.spacing.xl, xxl: baseTheme.spacing['2xl'] };
  const theme: any = {
    ...baseTheme,
    spacing: spacingWithAliases,
    settingsStyles,
  };
  const isDark = colorScheme === 'dark';

  // Create accessibility-aware typography (simplified for now)
  const accessibleTypography = theme.typography;

  const contextValue: ThemeContextType = {
    theme,
    colorScheme,
    isDark,
    setColorScheme,
    toggleTheme,
    accessibleTypography,
    textScale: 1.0, // Default scale
    fontWeight: 'normal', // Default weight
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

// ============================================================================
// Hook
// ============================================================================

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  return context;
};

// ============================================================================
// Utility Hooks
// ============================================================================

/**
 * Hook to get theme colors directly
 */
export const useThemeColors = () => {
  const { theme } = useTheme();
  return theme.colors;
};

/**
 * Hook to get theme spacing directly
 */
export const useThemeSpacing = () => {
  const { theme } = useTheme();
  return theme.spacing;
};

/**
 * Hook to get theme typography directly
 */
export const useThemeTypography = () => {
  const { theme } = useTheme();
  return theme.typography;
};

/**
 * Hook to create theme-aware styles
 * 
 * Usage:
 * const styles = useThemedStyles((theme) => ({
 *   container: {
 *     backgroundColor: theme.colors.background,
 *     padding: theme.spacing.md,
 *   }
 * }));
 */
export const useThemedStyles = <T extends Record<string, any>>(
  createStyles: (theme: Theme) => T
): T => {
  const { theme } = useTheme();
  return React.useMemo(() => createStyles(theme), [theme, createStyles]);
};

/**
 * Hook to create accessibility-aware text styles
 * 
 * Usage:
 * const textStyles = useAccessibleTextStyles();
 * const styles = {
 *   title: textStyles.createTextStyle(theme.typography.titleLarge),
 *   body: textStyles.createTextStyle(theme.typography.bodyMedium),
 * };
 */
export const useAccessibleTextStyles = () => {
  const { accessibleTypography, textScale, fontWeight } = useTheme();
  
  return {
    accessibleTypography,
    textScale,
    fontWeight,
    createTextStyle: (baseStyle: any) => ({
      ...baseStyle,
      fontSize: baseStyle.fontSize ? baseStyle.fontSize * textScale : undefined,
      fontWeight: fontWeight === 'bold' ? 'bold' : baseStyle.fontWeight,
    }),
  };
};

// ============================================================================
// Export
// ============================================================================

export default ThemeProvider;
