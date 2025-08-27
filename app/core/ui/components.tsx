// ============================================================================
// UI Components - Base Components
// ============================================================================
//
// Universal, reusable UI components following Material 3 design principles
// These components are the building blocks for all UI elements in the app
//

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../state';

// ============================================================================
// TYPES
// ============================================================================

export interface BaseComponentProps {
  style?: ViewStyle | TextStyle;
  testID?: string;
}

export interface ButtonProps extends BaseComponentProps {
  title: string;
  onPress: () => void;
  variant?: 'filled' | 'outlined' | 'text';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export interface CardProps extends BaseComponentProps {
  children: React.ReactNode;
  variant?: 'elevated' | 'filled' | 'outlined';
  padding?: 'none' | 'small' | 'medium' | 'large';
  onPress?: () => void;
}

export interface AvatarProps extends BaseComponentProps {
  uri?: string;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  fallback?: string;
  onPress?: () => void;
}

export interface TypographyProps extends BaseComponentProps {
  children: React.ReactNode;
  variant?: 'display' | 'headline' | 'title' | 'body' | 'label';
  size?: 'small' | 'medium' | 'large';
  weight?: 'regular' | 'medium' | 'bold';
  color?: 'primary' | 'secondary' | 'tertiary' | 'error' | 'surface';
  align?: 'left' | 'center' | 'right';
  numberOfLines?: number;
}

// ============================================================================
// BUTTON COMPONENT
// ============================================================================

export function Button({
  title,
  onPress,
  variant = 'filled',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  fullWidth = false,
  style,
  testID,
}: ButtonProps) {
  const { theme } = useTheme();

  const buttonStyles = StyleSheet.create({
    base: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: theme.shape.corner.full,
      paddingHorizontal: size === 'small' ? 16 : size === 'large' ? 32 : 24,
      paddingVertical: size === 'small' ? 8 : size === 'large' ? 16 : 12,
      minHeight: size === 'small' ? 32 : size === 'large' ? 56 : 40,
      width: fullWidth ? '100%' : 'auto',
      opacity: disabled || loading ? 0.6 : 1,
    },
    filled: {
      backgroundColor: theme.colors.primary,
    },
    outlined: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: theme.colors.outline,
    },
    text: {
      backgroundColor: 'transparent',
    },
  });

  const textStyles = StyleSheet.create({
    base: {
      fontSize: size === 'small' ? 14 : size === 'large' ? 18 : 16,
      fontWeight: '500',
      marginLeft: icon ? 8 : 0,
    },
    filled: {
      color: theme.colors.onPrimary,
    },
    outlined: {
      color: theme.colors.primary,
    },
    text: {
      color: theme.colors.primary,
    },
  });

  return (
    <TouchableOpacity
      style={[buttonStyles.base, buttonStyles[variant], style]}
      onPress={onPress}
      disabled={disabled || loading}
      testID={testID}
      activeOpacity={0.8}
    >
      {icon}
      <Text style={[textStyles.base, textStyles[variant]]}>
        {loading ? 'Loading...' : title}
      </Text>
    </TouchableOpacity>
  );
}

// ============================================================================
// CARD COMPONENT
// ============================================================================

export function Card({
  children,
  variant = 'elevated',
  padding = 'medium',
  onPress,
  style,
  testID,
}: CardProps) {
  const { theme } = useTheme();

  const cardStyles = StyleSheet.create({
    base: {
      borderRadius: theme.shape.corner.medium,
      padding: padding === 'none' ? 0 : padding === 'small' ? 8 : padding === 'large' ? 24 : 16,
    },
    elevated: {
      backgroundColor: theme.colors.surface,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    filled: {
      backgroundColor: theme.colors.surfaceVariant,
    },
    outlined: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.outline,
    },
  });

  const Component = onPress ? TouchableOpacity : View;

  return (
    <Component
      style={[cardStyles.base, cardStyles[variant], style]}
      onPress={onPress}
      testID={testID}
      activeOpacity={onPress ? 0.8 : 1}
    >
      {children}
    </Component>
  );
}

// ============================================================================
// AVATAR COMPONENT
// ============================================================================

export function Avatar({
  uri,
  size = 'medium',
  fallback,
  onPress,
  style,
  testID,
}: AvatarProps) {
  const { theme } = useTheme();

  const sizeMap = {
    small: 32,
    medium: 40,
    large: 56,
    xlarge: 80,
  };

  const avatarSize = sizeMap[size];

  const avatarStyles = StyleSheet.create({
    container: {
      width: avatarSize,
      height: avatarSize,
      borderRadius: avatarSize / 2,
      backgroundColor: theme.colors.surfaceVariant,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    image: {
      width: '100%',
      height: '100%',
    },
    fallback: {
      fontSize: avatarSize * 0.4,
      fontWeight: '500',
      color: theme.colors.onSurfaceVariant,
    },
  });

  const Component = onPress ? TouchableOpacity : View;

  return (
    <Component
      style={[avatarStyles.container, style]}
      onPress={onPress}
      testID={testID}
      activeOpacity={onPress ? 0.8 : 1}
    >
      {uri ? (
        <img
          src={uri}
          style={avatarStyles.image}
          alt={fallback || 'Avatar'}
          onError={(e) => {
            // Hide image on error, show fallback
            e.currentTarget.style.display = 'none';
          }}
        />
      ) : (
        <Text style={avatarStyles.fallback}>
          {fallback ? fallback.charAt(0).toUpperCase() : '?'}
        </Text>
      )}
    </Component>
  );
}

// ============================================================================
// TYPOGRAPHY COMPONENT
// ============================================================================

export function Typography({
  children,
  variant = 'body',
  size = 'medium',
  weight = 'regular',
  color = 'surface',
  align = 'left',
  numberOfLines,
  style,
  testID,
}: TypographyProps) {
  const { theme } = useTheme();

  const getVariantStyles = () => {
    const variants = {
      display: { fontSize: 57, lineHeight: 64 },
      headline: { fontSize: 32, lineHeight: 40 },
      title: { fontSize: 22, lineHeight: 28 },
      body: { fontSize: 16, lineHeight: 24 },
      label: { fontSize: 14, lineHeight: 20 },
    };

    const sizeMultiplier = {
      small: 0.875,
      medium: 1,
      large: 1.125,
    };

    const base = variants[variant];
    const multiplier = sizeMultiplier[size];

    return {
      fontSize: base.fontSize * multiplier,
      lineHeight: base.lineHeight * multiplier,
    };
  };

  const getColorValue = () => {
    const colorMap = {
      primary: theme.colors.primary,
      secondary: theme.colors.secondary,
      tertiary: theme.colors.tertiary,
      error: theme.colors.error,
      surface: theme.colors.onSurface,
    };
    return colorMap[color];
  };

  const getWeight = () => {
    const weightMap = {
      regular: '400',
      medium: '500',
      bold: '700',
    };
    return weightMap[weight];
  };

  const textStyles = {
    ...getVariantStyles(),
    fontWeight: getWeight(),
    color: getColorValue(),
    textAlign: align,
  };

  return (
    <Text
      style={[textStyles, style]}
      numberOfLines={numberOfLines}
      testID={testID}
    >
      {children}
    </Text>
  );
}

// ============================================================================
// COMPONENT EXPORTS
// ============================================================================

export const UIComponents = {
  Button,
  Card,
  Avatar,
  Typography,
};

export default UIComponents;