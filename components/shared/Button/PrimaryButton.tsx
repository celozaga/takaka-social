import React from 'react';
import { Pressable, Text, StyleSheet, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../Theme';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  icon?: React.ReactNode;
}

const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  title,
  onPress,
  disabled = false,
  loading = false,
  style,
  textStyle,
  icon
}) => {
  const { theme } = useTheme();

  const getButtonStyles = (pressed: boolean): any => [
    {
      width: '100%' as const,
      backgroundColor: theme.colors.primary,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      gap: theme.spacing.sm,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
      borderRadius: theme.radius.full,
      opacity: (disabled || loading) ? 0.7 : pressed ? 0.8 : 1,
    },
    style
  ];

  const getTextStyles = () => [
    {
      color: theme.colors.onPrimary,
      ...theme.typography.labelLarge,
    },
    textStyle
  ];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => getButtonStyles(pressed)}
    >
      {icon && <>{icon}</>}
      <Text style={getTextStyles()}>
        {loading ? 'Loading...' : title}
      </Text>
    </Pressable>
  );
};

export default PrimaryButton;
