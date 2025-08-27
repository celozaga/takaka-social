/**
 * ============================================================================
 * SettingsDivider Component
 * ============================================================================
 *
 * Universal divider component for settings screens with consistent styling.
 * Uses design tokens from the theme system.
 *
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../Theme';

// ============================================================================
// Types
// ============================================================================

interface SettingsDividerProps {
  /** Custom style */
  style?: any;
  /** Test ID for testing */
  testID?: string;
}

// ============================================================================
// Component
// ============================================================================

const SettingsDivider: React.FC<SettingsDividerProps> = ({ 
  style,
  testID 
}) => {
  const { theme } = useTheme();

  const styles = createStyles(theme);

  return (
    <View style={[styles.divider, style]} testID={testID} />
  );
};

// ============================================================================
// Styles
// ============================================================================

const createStyles = (theme: any) => StyleSheet.create({
  divider: {
    height: 1,
    backgroundColor: theme.colors.outline,
    marginVertical: theme.spacing.xs,
  },
});

export default SettingsDivider;
