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
import { Tooltip, TooltipContentKey } from '../Tooltip';

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
  /** Tooltip content key for help text */
  tooltipKey?: TooltipContentKey;
  /** Custom tooltip content (overrides tooltipKey) */
  tooltipContent?: string;
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
  tooltipKey,
  tooltipContent,
}) => {
  const { theme } = useTheme();

  const switchElement = (
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

  // Wrap with tooltip if tooltip content is provided
  if (tooltipKey || tooltipContent) {
    return (
      <Tooltip 
        contentKey={tooltipKey} 
        content={tooltipContent}
        position="left"
      >
        {switchElement}
      </Tooltip>
    );
  }

  return switchElement;
};

export default SwitchComponent;
