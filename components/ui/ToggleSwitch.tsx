import React from 'react';
import { Switch, Platform } from 'react-native';
import { theme } from '@/lib/theme';

const ToggleSwitch: React.FC<{
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}> = ({ checked, onChange, disabled }) => {
  return (
    <Switch
      trackColor={{ false: theme.colors.surfaceContainerHigh, true: theme.colors.primary }}
      thumbColor={Platform.OS === 'ios' ? undefined : (checked ? theme.colors.primary : theme.colors.onSurfaceVariant)}
      ios_backgroundColor={theme.colors.surfaceContainerHigh}
      onValueChange={onChange}
      value={checked}
      disabled={disabled}
      style={Platform.OS === 'web' ? {
        cursor: disabled ? 'not-allowed' : 'pointer'
      } as any : {}}
    />
  );
};

export default ToggleSwitch;
