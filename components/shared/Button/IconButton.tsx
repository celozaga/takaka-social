import React from 'react';
import { Pressable, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { theme } from '@/lib/theme';

interface IconButtonProps {
  icon: React.ReactNode;
  onPress: () => void;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  variant?: 'default' | 'primary' | 'secondary' | 'ghost';
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

const IconButton: React.FC<IconButtonProps> = ({
  icon,
  onPress,
  disabled = false,
  size = 'medium',
  variant = 'default',
  style,
  accessibilityLabel
}) => {
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { padding: theme.spacing.xs };
      case 'large':
        return { padding: theme.spacing.m };
      default:
        return { padding: theme.spacing.s };
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return { backgroundColor: theme.colors.primary };
      case 'secondary':
        return { backgroundColor: theme.colors.surfaceContainerHigh };
      case 'ghost':
        return { backgroundColor: 'transparent' };
      default:
        return { backgroundColor: 'transparent' };
    }
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        getSizeStyles(),
        getVariantStyles(),
        disabled && styles.buttonDisabled,
        pressed && !disabled && styles.buttonPressed,
        style
      ]}
      accessibilityLabel={accessibilityLabel}
    >
      {icon}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderRadius: theme.shape.full,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonPressed: {
    backgroundColor: theme.colors.surfaceContainerHigh,
  },
});

export default IconButton;
