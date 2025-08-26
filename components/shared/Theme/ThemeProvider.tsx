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
import { Appearance, ColorSchemeName } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightTheme, darkTheme, getTheme, ColorScheme, Theme } from '@/src/design/tokens';

// ============================================================================
// Types
// ============================================================================

interface ThemeContextType {
  theme: Theme;
  colorScheme: ColorScheme;
  isDark: boolean;
  setColorScheme: (scheme: ColorScheme | 'system') => void;
  toggleTheme: () => void;
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

  // Get current theme object
  const theme = getTheme(colorScheme);
  const isDark = colorScheme === 'dark';

  const contextValue: ThemeContextType = {
    theme,
    colorScheme,
    isDark,
    setColorScheme,
    toggleTheme,
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

// ============================================================================
// Export
// ============================================================================

export default ThemeProvider;
