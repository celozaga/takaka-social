import { Platform } from 'react-native';

const colors = {
  primary: '#FFFFFF',
  onPrimary: '#000000',
  background: '#000000',
  surface: '#000000',
  surfaceContainer: '#1C1C1E',
  surfaceContainerHigh: '#2C2C2E',
  surfaceContainerHighest: '#3A3A3A',
  onSurface: '#FFFFFF',
  onSurfaceVariant: '#8E8E93',
  outline: '#2C2C2E',
  error: '#FF453A',
  pink: '#FFFFFF', // A custom accent color
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
};

export const theme = {
  colors,
  shape,
  spacing,
  typography,
};