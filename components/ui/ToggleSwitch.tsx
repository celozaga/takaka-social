
import React from 'react';
import { Switch, Platform } from 'react-native';

const ToggleSwitch: React.FC<{
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}> = ({ checked, onChange, disabled }) => {
  return (
    <Switch
      trackColor={{ false: '#2b2d2e', true: '#A8C7FA' }} // surface-3, primary
      thumbColor={Platform.OS === 'ios' ? undefined : (checked ? '#A8C7FA' : '#C3C6CF')}
      ios_backgroundColor="#2b2d2e"
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
