/**
 * ============================================================================
 * Chip Component
 * ============================================================================
 *
 * Universal chip component for tags, filters, and selections.
 * Supports different variants, sizes, and interactive states.
 *
 */

import React from 'react';
import { Pressable, Text, View, StyleSheet, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../Theme';

// ============================================================================
// Types
// ============================================================================

type ChipVariant = 'filled' | 'outlined' | 'elevated';
type ChipSize = 'sm' | 'md' | 'lg';

interface ChipProps {
  /** Chip label */
  label: string;
  /** Chip variant */
  variant?: ChipVariant;
  /** Chip size */
  size?: ChipSize;
  /** Whether chip is selected */
  selected?: boolean;
  /** Whether chip is disabled */
  disabled?: boolean;
  /** Whether chip is pressable */
  pressable?: boolean;
  /** Called when chip is pressed */
  onPress?: () => void;
  /** Called when delete is pressed */
  onDelete?: () => void;
  /** Left icon component */
  leftIcon?: React.ReactNode;
  /** Right icon component (overridden if onDelete is provided) */
  rightIcon?: React.ReactNode;
  /** Container style */
  style?: StyleProp<ViewStyle>;
  /** Text style */
  textStyle?: StyleProp<TextStyle>;
  /** Accessibility label */
  accessibilityLabel?: string;
  /** Test ID for testing */
  testID?: string;
}

// ============================================================================
// Component
// ============================================================================

const Chip: React.FC<ChipProps> = ({
  label,
  variant = 'filled',
  size = 'md',
  selected = false,
  disabled = false,
  pressable = true,
  onPress,
  onDelete,
  leftIcon,
  rightIcon,
  style,
  textStyle,
  accessibilityLabel,
  testID,
}) => {
  const { theme } = useTheme();

  const getChipStyles = (pressed: boolean = false) => {
    const styles: ViewStyle[] = [chipStyles.chip];

    // Size styles
    switch (size) {
      case 'sm':
        styles.push({
          paddingHorizontal: theme.spacing.sm,
          paddingVertical: theme.spacing.xs,
          borderRadius: theme.radius.sm,
        });
        break;
      case 'md':
        styles.push({
          paddingHorizontal: theme.spacing.md,
          paddingVertical: theme.spacing.sm,
          borderRadius: theme.radius.md,
        });
        break;
      case 'lg':
        styles.push({
          paddingHorizontal: theme.spacing.lg,
          paddingVertical: theme.spacing.md,
          borderRadius: theme.radius.lg,
        });
        break;
    }

    // Variant styles
    if (selected) {
      switch (variant) {
        case 'filled':
          styles.push({
            backgroundColor: theme.colors.primary,
          });
          break;
        case 'outlined':
          styles.push({
            backgroundColor: theme.colors.secondaryContainer,
            borderWidth: 1,
            borderColor: theme.colors.primary,
          });
          break;
        case 'elevated':
          styles.push({
            backgroundColor: theme.colors.secondaryContainer,
            ...theme.shadows.sm,
          });
          break;
      }
    } else {
      switch (variant) {
        case 'filled':
          styles.push({
            backgroundColor: theme.colors.surfaceContainer,
          });
          break;
        case 'outlined':
          styles.push({
            backgroundColor: 'transparent',
            borderWidth: 1,
            borderColor: theme.colors.outline,
          });
          break;
        case 'elevated':
          styles.push({
            backgroundColor: theme.colors.surface,
            ...theme.shadows.sm,
          });
          break;
      }
    }

    // Interactive states
    if (pressed && !disabled) {
      styles.push({
        opacity: 0.8,
      });
    }

    if (disabled) {
      styles.push({
        opacity: 0.5,
      });
    }

    return styles;
  };

  const getTextStyles = () => {
    const styles: TextStyle[] = [
      size === 'sm' ? theme.typography.labelSmall :
      size === 'md' ? theme.typography.labelMedium :
      theme.typography.labelLarge
    ];

    if (selected) {
      styles.push({
        color: variant === 'filled' ? theme.colors.onPrimary : theme.colors.primary,
        fontWeight: '600',
      });
    } else {
      styles.push({
        color: theme.colors.onSurface,
      });
    }

    return styles;
  };

  const renderDeleteIcon = () => {
    if (!onDelete) return null;
    
    return (
      <Pressable
        onPress={onDelete}
        style={[
          chipStyles.deleteButton,
          { marginLeft: theme.spacing.xs }
        ]}
        hitSlop={8}
      >
        <Text style={{
          color: selected && variant === 'filled' ? theme.colors.onPrimary : theme.colors.onSurfaceVariant,
          fontSize: size === 'sm' ? 14 : 16,
        }}>
          ×
        </Text>
      </Pressable>
    );
  };

  const ChipComponent = pressable ? Pressable : View;
  const chipProps = pressable
    ? {
        onPress: disabled ? undefined : onPress,
        disabled,
      }
    : {};

  return (
    <ChipComponent
      {...chipProps}
      style={({ pressed }: any) => [
        ...getChipStyles(pressed),
        style,
      ]}
      accessibilityLabel={accessibilityLabel || label}
      accessibilityRole={pressable ? 'button' : undefined}
      testID={testID}
    >
      <View style={chipStyles.content}>
        {leftIcon && (
          <View style={[chipStyles.leftIcon, { marginRight: theme.spacing.xs }]}>
            {leftIcon}
          </View>
        )}
        
        <Text style={[...getTextStyles(), textStyle]} numberOfLines={1}>
          {label}
        </Text>
        
        {onDelete ? renderDeleteIcon() : rightIcon && (
          <View style={[chipStyles.rightIcon, { marginLeft: theme.spacing.xs }]}>
            {rightIcon}
          </View>
        )}
      </View>
    </ChipComponent>
  );
};

// ============================================================================
// Styles
// ============================================================================

const chipStyles = StyleSheet.create({
  chip: {
    alignSelf: 'flex-start',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leftIcon: {
    // Margin applied in component
  },
  rightIcon: {
    // Margin applied in component
  },
  deleteButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 16,
    height: 16,
  },
});

export default Chip;
