/**
 * ============================================================================
 * Input Component
 * ============================================================================
 *
 * Universal input component with consistent styling and states.
 * Supports different sizes, variants, and validation states.
 *
 */

import React, { forwardRef } from 'react';
import { 
  TextInput, 
  View, 
  Text, 
  StyleSheet, 
  TextInputProps, 
  StyleProp, 
  ViewStyle, 
  TextStyle 
} from 'react-native';
import { useTheme } from '../Theme';

// ============================================================================
// Types
// ============================================================================

type InputVariant = 'filled' | 'outlined';
type InputSize = 'sm' | 'md' | 'lg';
type InputState = 'default' | 'error' | 'success' | 'disabled';

interface InputProps extends Omit<TextInputProps, 'style'> {
  /** Input variant */
  variant?: InputVariant;
  /** Input size */
  size?: InputSize;
  /** Input state */
  state?: InputState;
  /** Input label */
  label?: string;
  /** Helper text */
  helperText?: string;
  /** Error text (overrides helperText when state is 'error') */
  errorText?: string;
  /** Left icon component */
  leftIcon?: React.ReactNode;
  /** Right icon component */
  rightIcon?: React.ReactNode;
  /** Container style */
  containerStyle?: StyleProp<ViewStyle>;
  /** Input style */
  inputStyle?: StyleProp<TextStyle>;
  /** Test ID for testing */
  testID?: string;
}

// ============================================================================
// Component
// ============================================================================

const Input = forwardRef<TextInput, InputProps>(({
  variant = 'filled',
  size = 'md',
  state = 'default',
  label,
  helperText,
  errorText,
  leftIcon,
  rightIcon,
  containerStyle,
  inputStyle,
  testID,
  ...textInputProps
}, ref) => {
  const { theme } = useTheme();

  const isDisabled = state === 'disabled' || textInputProps.editable === false;
  const hasError = state === 'error';
  const hasSuccess = state === 'success';

  const getContainerStyles = () => {
    const styles: ViewStyle[] = [inputStyles.container];

    // Size styles
    switch (size) {
      case 'sm':
        styles.push({ height: theme.sizes.inputSm });
        break;
      case 'md':
        styles.push({ height: theme.sizes.inputMd });
        break;
      case 'lg':
        styles.push({ height: theme.sizes.inputLg });
        break;
    }

    // Variant styles
    switch (variant) {
      case 'filled':
        styles.push({
          backgroundColor: theme.colors.surfaceContainer,
          borderRadius: theme.radius.md,
        });
        break;
      case 'outlined':
        styles.push({
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: theme.colors.outline,
          borderRadius: theme.radius.md,
        });
        break;
    }

    // State styles
    if (hasError) {
      styles.push({
        borderColor: theme.colors.error,
        borderWidth: variant === 'filled' ? 1 : 2,
      });
    } else if (hasSuccess) {
      styles.push({
        borderColor: theme.colors.success,
        borderWidth: variant === 'filled' ? 1 : 2,
      });
    }

    if (isDisabled) {
      styles.push({
        opacity: 0.5,
      });
    }

    return styles;
  };

  const getInputStyles = () => {
    const styles: TextStyle[] = [
      inputStyles.input,
      theme.typography.bodyMedium,
    ];

    styles.push({
      color: isDisabled ? theme.colors.disabled : theme.colors.onSurface,
      paddingHorizontal: theme.spacing.md,
    });

    if (leftIcon) {
      styles.push({
        paddingLeft: theme.spacing.xl + theme.spacing.md,
      });
    }

    if (rightIcon) {
      styles.push({
        paddingRight: theme.spacing.xl + theme.spacing.md,
      });
    }

    return styles;
  };

  const getLabelStyles = () => {
    return [
      inputStyles.label,
      theme.typography.labelMedium,
      {
        color: hasError 
          ? theme.colors.error 
          : theme.colors.onSurfaceVariant,
        marginBottom: theme.spacing.xs,
      },
    ];
  };

  const getHelperTextStyles = () => {
    return [
      inputStyles.helperText,
      theme.typography.bodySmall,
      {
        color: hasError 
          ? theme.colors.error 
          : hasSuccess
          ? theme.colors.success
          : theme.colors.onSurfaceVariant,
        marginTop: theme.spacing.xs,
      },
    ];
  };

  const displayHelperText = hasError && errorText ? errorText : helperText;

  return (
    <View style={containerStyle} testID={testID}>
      {label && (
        <Text style={getLabelStyles()}>
          {label}
        </Text>
      )}
      
      <View style={getContainerStyles()}>
        {leftIcon && (
          <View style={[inputStyles.leftIcon, { left: theme.spacing.md }]}>
            {leftIcon}
          </View>
        )}
        
        <TextInput
          ref={ref}
          {...textInputProps}
          style={[...getInputStyles(), inputStyle]}
          editable={!isDisabled}
          placeholderTextColor={theme.colors.onSurfaceVariant}
        />
        
        {rightIcon && (
          <View style={[inputStyles.rightIcon, { right: theme.spacing.md }]}>
            {rightIcon}
          </View>
        )}
      </View>
      
      {displayHelperText && (
        <Text style={getHelperTextStyles()}>
          {displayHelperText}
        </Text>
      )}
    </View>
  );
});

Input.displayName = 'Input';

// ============================================================================
// Styles
// ============================================================================

const inputStyles = StyleSheet.create({
  container: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: '100%',
  },
  label: {
    fontWeight: '500',
  },
  helperText: {
    // Styles applied in component
  },
  leftIcon: {
    position: 'absolute',
    zIndex: 1,
  },
  rightIcon: {
    position: 'absolute',
    zIndex: 1,
  },
});

export default Input;
