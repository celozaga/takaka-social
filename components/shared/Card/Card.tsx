/**
 * ============================================================================
 * Card Component
 * ============================================================================
 *
 * Universal card component with consistent styling and interactive states.
 * Supports different elevations, padding, and press interactions.
 *
 */

import React, { ReactNode } from 'react';
import { Pressable, View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '../Theme';

// ============================================================================
// Types
// ============================================================================

type CardVariant = 'elevated' | 'filled' | 'outlined';
type CardPadding = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface CardProps {
  /** Card content */
  children: ReactNode;
  /** Card variant */
  variant?: CardVariant;
  /** Card padding */
  padding?: CardPadding;
  /** Whether card is pressable */
  pressable?: boolean;
  /** Called when card is pressed */
  onPress?: () => void;
  /** Whether card is disabled */
  disabled?: boolean;
  /** Custom style */
  style?: StyleProp<ViewStyle>;
  /** Accessibility label */
  accessibilityLabel?: string;
  /** Test ID for testing */
  testID?: string;
}

// ============================================================================
// Component
// ============================================================================

const Card: React.FC<CardProps> = ({
  children,
  variant = 'filled',
  padding = 'md',
  pressable = false,
  onPress,
  disabled = false,
  style,
  accessibilityLabel,
  testID,
}) => {
  const { theme } = useTheme();

  const getCardStyles = (pressed: boolean = false): any[] => {
    const baseStyles: any[] = [styles.card];

    // Add padding
    if (padding !== 'none') {
      baseStyles.push({
        padding: theme.spacing[padding as keyof typeof theme.spacing],
      });
    }

    // Add variant styles
    switch (variant) {
      case 'elevated':
        baseStyles.push({
          backgroundColor: theme.colors.surface,
          ...theme.shadows.md,
        });
        break;
      case 'filled':
        baseStyles.push({
          backgroundColor: theme.colors.surfaceContainer,
        });
        break;
      case 'outlined':
        baseStyles.push({
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: theme.colors.outline,
        });
        break;
    }

    // Add interactive styles
    if (pressable && pressed && !disabled) {
      baseStyles.push({
        backgroundColor: theme.colors.surfaceContainerHigh,
      });
    }

    if (disabled) {
      baseStyles.push({
        opacity: 0.5,
      });
    }

    return baseStyles;
  };

  const CardComponent = pressable ? Pressable : View;

  const cardProps = pressable
    ? {
        onPress: disabled ? undefined : onPress,
        disabled,
        accessibilityRole: (Platform.OS === 'web' && style && (style as any).accessibilityRole === undefined) ? undefined : 'button' as const,
      }
    : {};

  return (
    <CardComponent
      {...cardProps}
      style={({ pressed }: any) => [
        ...getCardStyles(pressed),
        style,
      ]}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
    >
      {children}
    </CardComponent>
  );
};

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    overflow: 'hidden',
  },
});

export default Card;
