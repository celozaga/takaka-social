import { Platform, TextStyle } from 'react-native';

// ============================================================================
// Unified Theme for Takaka (MD3-style with legacy support)
// ============================================================================

const colors = {
  primary: '#A8C7FA',
  onPrimary: '#003258',
  primaryContainer: '#D1E4FF',
  onPrimaryContainer: '#001D35',
  
  error: '#F2B8B5',
  onError: '#601410',

  background: '#111314',
  onBackground: '#E2E2E6',
  
  surface: '#111314', 
  onSurface: '#E2E2E6',
  
  surfaceVariant: '#43474E',
  onSurfaceVariant: '#C3C6CF',
  
  outline: '#2b2d2e',

  surfaceContainer: '#1E2021',
  surfaceContainerHigh: '#2b2d2e',
  surfaceContainerHighest: '#393c3e',

  pink: '#ec4899', // For likes
};

const typography: Record<string, TextStyle> = {
    titleLarge: { fontSize: 22, fontWeight: '700' },
    titleMedium: { fontSize: 18, fontWeight: '700' },
    titleSmall: { fontSize: 14, fontWeight: '600', lineHeight: 20 },
    bodyLarge: { fontSize: 16, fontWeight: '400', lineHeight: 24 },
    bodyMedium: { fontSize: 14, fontWeight: '400', lineHeight: 20 },
    bodySmall: { fontSize: 12, fontWeight: '400', lineHeight: 16 },
    labelLarge: { fontSize: 14, fontWeight: '600' },
    labelMedium: { fontSize: 12, fontWeight: '600', lineHeight: 16 },
    labelSmall: { fontSize: 11, fontWeight: '600', lineHeight: 16 },
};

const shape = {
    extraSmall: 4,
    small: 8,
    medium: 12,
    large: 16,
    extraLarge: 28,
    full: 9999,
};

const spacing = {
    xxs: 4,
    xs: 8,
    s: 12, // alias for sm
    sm: 12,
    m: 16, // alias for md
    md: 16,
    l: 20, // alias for lg
    lg: 20,
    xl: 24,
    xxl: 32,
};

const theme = {
  colors,
  typography,
  shape,
  spacing,
  
  // Legacy support
  color: {
    bg: colors.background,
    card: colors.surfaceContainer,
    line: "rgba(255,255,255,0.06)",
    textPrimary: colors.onSurface,
    textSecondary: colors.onSurfaceVariant,
    textTertiary: "#7E7E88",
    accent: colors.pink,
    brand: colors.primary,
    badge: colors.surfaceContainerHigh,
    link: colors.primary,
    inputBg: colors.surfaceContainerHigh,
  },
  radius: { 
      xs: 6, sm: 10, md: 14, lg: 20, xl: 28, 
      pill: shape.full 
  },
  font: { 
      title: typography.titleLarge.fontSize as number, 
      body: typography.bodyMedium.fontSize as number, 
      small: typography.bodySmall.fontSize as number, 
      tiny: typography.labelSmall.fontSize as number,
  },
  shadow: { 
    card: Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
      android: { elevation: 2 },
      web: { boxShadow: "0 1px 2px rgba(0,0,0,0.1)" },
    }),
  },
};

export default theme;
