import { Platform } from 'react-native';

const colors = {
  primary: '#A8C7FA',
  onPrimary: '#003258',
  background: '#111314',
  surface: '#1E2021',
  surfaceContainer: '#1E2021',
  surfaceContainerHigh: '#2b2d2e',
  surfaceContainerHighest: '#3c3f41',
  onSurface: '#E2E2E6',
  onSurfaceVariant: '#C3C6CF',
  outline: '#2b2d2e',
  error: '#F2B8B5',
  pink: '#ec4899',
  // Below are colors for the new PostScreen, mapped from the above
  textPrimary: '#E2E2E6', // onSurface
  textSecondary: '#C3C6CF', // onSurfaceVariant
  textTertiary: '#C3C6CF', // onSurfaceVariant
  accent: '#ec4899', // pink
  brand: '#A8C7FA', // primary
  line: '#2b2d2e', // outline
  card: '#1E2021', // surface
  badge: '#2b2d2e', // surfaceContainerHigh
  inputBg: '#2b2d2e', // surfaceContainerHigh
};

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
  // For PostScreen mapping
  font: {
    title: 18,
    body: 15,
    small: 13,
    tiny: 11,
  },
};

export const theme = {
  colors,
  shape,
  spacing,
  typography,
  // For PostScreen backwards compatibility
  color: colors,
  radius: shape,
  font: typography.font,
};
