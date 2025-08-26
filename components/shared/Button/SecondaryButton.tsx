import React from 'react';
import { Pressable, Text, StyleSheet, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '@/components/shared';

interface SecondaryButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  icon?: React.ReactNode;
}

const SecondaryButton: React.FC<SecondaryButtonProps> = ({
  title,
  onPress,
  disabled = false,
  loading = false,
  style,
  textStyle,
  icon
}) => {
  const { theme } = useTheme();
  
  const styles = createStyles(theme);
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        (disabled || loading) && styles.buttonDisabled,
        pressed && !disabled && !loading && styles.buttonPressed,
        style
      ]}
    >
      {icon && <>{icon}</>}
      <Text style={[styles.buttonText, textStyle]}>
        {loading ? 'Carregando...' : title}
      </Text>
    </Pressable>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  button: {
    width: '100%',
    backgroundColor: theme.colors.surfaceContainerHigh,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.outline,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonPressed: {
    backgroundColor: theme.colors.surfaceContainerHighest,
  },
  buttonText: {
    color: theme.colors.onSurface,
    fontWeight: '600',
    fontSize: 16,
  },
});

export default SecondaryButton;
