/**
 * ============================================================================
 * Container Component
 * ============================================================================
 *
 * Universal container component for consistent layout and spacing.
 * Provides responsive padding and maximum width constraints.
 *
 */

import React, { ReactNode } from 'react';
import { View, ScrollView, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '../Theme';

// ============================================================================
// Types
// ============================================================================

type ContainerPadding = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
type ContainerMaxWidth = 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';

interface ContainerProps {
  /** Container content */
  children: ReactNode;
  /** Whether to use ScrollView instead of View */
  scrollable?: boolean;
  /** Container padding */
  padding?: ContainerPadding;
  /** Container maximum width */
  maxWidth?: ContainerMaxWidth;
  /** Whether to center the container */
  centered?: boolean;
  /** Custom style */
  style?: StyleProp<ViewStyle>;
  /** ScrollView props (only when scrollable=true) */
  scrollViewProps?: React.ComponentProps<typeof ScrollView>;
  /** Test ID for testing */
  testID?: string;
}

// ============================================================================
// Component
// ============================================================================

const Container: React.FC<ContainerProps> = ({
  children,
  scrollable = false,
  padding = 'md',
  maxWidth = 'none',
  centered = false,
  style,
  scrollViewProps,
  testID,
}) => {
  const { theme } = useTheme();

  const getContainerStyles = () => {
    const styles: ViewStyle = {};

    // Add padding
    if (padding !== 'none') {
      styles.padding = theme.spacing[padding as keyof typeof theme.spacing];
    }

    // Add max width
    if (maxWidth !== 'none' && maxWidth !== 'full') {
      const breakpointKey = maxWidth as keyof typeof theme.breakpoints;
      styles.maxWidth = theme.breakpoints[breakpointKey];
    }

    // Center if requested
    if (centered) {
      styles.alignSelf = 'center';
      styles.width = '100%';
    }

    return styles;
  };

  const containerStyles = [getContainerStyles(), style];

  if (scrollable) {
    return (
      <ScrollView
        {...scrollViewProps}
        style={containerStyles}
        contentContainerStyle={[
          scrollViewProps?.contentContainerStyle,
        ]}
        testID={testID}
      >
        {children}
      </ScrollView>
    );
  }

  return (
    <View style={containerStyles} testID={testID}>
      {children}
    </View>
  );
};

export default Container;
