/**
 * ============================================================================
 * Switch Component
 * ============================================================================
 *
 * Universal switch component using the new design system.
 * Cross-platform toggle switch with consistent styling.
 *
 */

import React from 'react';
import { Switch, Platform } from 'react-native';
import { useTheme } from '../Theme';

// ============================================================================
// Types
// ============================================================================

interface SwitchProps {
  /** Whether the switch is checked */
  checked: boolean;
  /** Called when switch value changes */
  onChange: (checked: boolean) => void;
  /** Whether the switch is disabled */
  disabled?: boolean;
  /** Accessibility label */
  accessibilityLabel?: string;
  /** Test ID for testing */
  testID?: string;
}

// ============================================================================
// Component
// ============================================================================

const SwitchComponent: React.FC<SwitchProps> = ({
  checked,
  onChange,
  disabled = false,
  accessibilityLabel,
  testID,
}) => {
  const { theme } = useTheme();

  return (
    <Switch
      trackColor={{ 
        false: theme.colors.surfaceContainerHigh, 
        true: theme.colors.primary 
      }}
      thumbColor={
        Platform.OS === 'ios' 
          ? undefined 
          : (checked ? theme.colors.onPrimary : theme.colors.onSurfaceVariant)
      }
      ios_backgroundColor={theme.colors.surfaceContainerHigh}
      onValueChange={onChange}
      value={checked}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      style={Platform.OS === 'web' ? {
        cursor: disabled ? 'not-allowed' : 'pointer'
      } as any : {}}
    />
  );
};

export default SwitchComponent;
