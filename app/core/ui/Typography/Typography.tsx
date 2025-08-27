/**
 * ============================================================================
 * Typography Component
 * ============================================================================
 *
 * Universal typography component with consistent text styles based on design tokens.
 * Supports all typography variants and semantic colors.
 *
 */

import React, { ReactNode } from 'react';
import { Text, TextProps, StyleProp, TextStyle } from 'react-native';
import { useTheme } from '../Theme';

// ============================================================================
// Types
// ============================================================================

type TypographyVariant = 
  | 'displayLarge' | 'displayMedium' | 'displaySmall'
  | 'headlineLarge' | 'headlineMedium' | 'headlineSmall'
  | 'titleLarge' | 'titleMedium' | 'titleSmall'
  | 'labelLarge' | 'labelMedium' | 'labelSmall'
  | 'bodyLarge' | 'bodyMedium' | 'bodySmall'
  | 'caption';

type TypographyColor = 
  | 'primary' | 'onPrimary' | 'secondary' | 'onSecondary'
  | 'surface' | 'onSurface' | 'onSurfaceVariant'
  | 'background' | 'onBackground'
  | 'error' | 'onError' | 'warning' | 'success' | 'info'
  | 'disabled' | 'inherit';

interface TypographyProps extends Omit<TextProps, 'style'> {
  /** Text content */
  children: ReactNode;
  /** Typography variant */
  variant?: TypographyVariant;
  /** Text color */
  color?: TypographyColor;
  /** Text alignment */
  align?: 'left' | 'center' | 'right' | 'justify';
  /** Whether text should be selectable */
  selectable?: boolean;
  /** Custom style */
  style?: StyleProp<TextStyle>;
  /** Test ID for testing */
  testID?: string;
}

// ============================================================================
// Component
// ============================================================================

const Typography: React.FC<TypographyProps> = ({
  children,
  variant = 'bodyMedium',
  color = 'onSurface',
  align = 'left',
  selectable = false,
  style,
  testID,
  ...textProps
}) => {
  const { theme } = useTheme();

  const getTextColor = (): string => {
    switch (color) {
      case 'primary':
        return theme.colors.primary;
      case 'onPrimary':
        return theme.colors.onPrimary;
      case 'secondary':
        return theme.colors.secondary;
      case 'onSecondary':
        return theme.colors.onSecondary;
      case 'surface':
        return theme.colors.surface;
      case 'onSurface':
        return theme.colors.onSurface;
      case 'onSurfaceVariant':
        return theme.colors.onSurfaceVariant;
      case 'background':
        return theme.colors.background;
      case 'onBackground':
        return theme.colors.onBackground;
      case 'error':
        return theme.colors.error;
      case 'onError':
        return theme.colors.onError;
      case 'warning':
        return theme.colors.warning;
      case 'success':
        return theme.colors.success;
      case 'info':
        return theme.colors.info;
      case 'disabled':
        return theme.colors.disabled;
      case 'inherit':
        return 'inherit';
      default:
        return theme.colors.onSurface;
    }
  };

  const getTextStyles = (): TextStyle => {
    const variantStyle = theme.typography[variant];
    const textColor = getTextColor();

    return {
      ...variantStyle,
      color: textColor,
      textAlign: align,
    };
  };

  return (
    <Text
      {...textProps}
      style={[getTextStyles(), style]}
      selectable={selectable}
      testID={testID}
    >
      {children}
    </Text>
  );
};

export default Typography;
