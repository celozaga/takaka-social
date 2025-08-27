/**
 * ============================================================================
 * TopAppBar Component
 * ============================================================================
 *
 * Universal app bar component with leading action, title, and trailing actions.
 * Uses design tokens from the theme system for consistent styling.
 *
 */

import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useTheme } from '../Theme';

// ============================================================================
// Types
// ============================================================================

interface TopAppBarProps {
  /** Title displayed in the center */
  title: string;
  /** Leading action (usually back button) */
  leading?: React.ReactNode;
  /** Trailing actions */
  actions?: React.ReactNode;
  /** Custom style */
  style?: any;
  /** Test ID for testing */
  testID?: string;
}

// ============================================================================
// Component
// ============================================================================

const TopAppBar: React.FC<TopAppBarProps> = ({ 
  title, 
  leading, 
  actions,
  style,
  testID
}) => {
  const { theme } = useTheme();

  const styles = createStyles(theme);

  return (
    <View style={[styles.container, style]} testID={testID}>
      <View style={styles.sideContainer}>
        {leading}
      </View>
      <View style={styles.titleContainer}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      </View>
      <View style={[styles.sideContainer, styles.actionsContainer]}>
        {actions}
      </View>
    </View>
  );
};

// ============================================================================
// Styles
// ============================================================================

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: theme.sizes.appBarHeight || 56,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.surface,
  },
  sideContainer: {
    minWidth: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.sm,
  },
  title: {
    ...theme.typography.headlineSmall,
    color: theme.colors.onSurface,
    fontWeight: '600',
    textAlign: 'center',
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
});

export default TopAppBar;
