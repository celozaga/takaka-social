import { Platform } from 'react-native';

const colors = {
  primary: '#5662F6',
  onPrimary: '#FFFFFF',
  background: '#000000',
  surface: '#222222',
  surfaceContainer: '#222222',
  surfaceContainerHigh: '#333333',
  surfaceContainerHighest: '#444444',
  onSurface: '#E5E5E5',
  onSurfaceVariant: '#A0A0A0',
  outline: '#333333',
  error: '#F2B8B5',
  pink: '#ec4899', // A custom accent color
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