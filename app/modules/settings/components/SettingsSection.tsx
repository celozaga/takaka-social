// ============================================================================
// Settings Module - SettingsSection Component
// ============================================================================
//
// A component for grouping related settings items with a header and optional
// footer, providing consistent section styling and layout.
//

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../../core/ui/theme';

// ============================================================================
// Types
// ============================================================================

export interface SettingsSectionProps {
  /**
   * Section title
   */
  title?: string;
  
  /**
   * Section description or footer text
   */
  description?: string;
  
  /**
   * Children components (usually SettingsItem components)
   */
  children: React.ReactNode;
  
  /**
   * Whether to show a separator at the bottom
   */
  showSeparator?: boolean;
  
  /**
   * Custom header content
   */
  headerContent?: React.ReactNode;
  
  /**
   * Custom footer content
   */
  footerContent?: React.ReactNode;
  
  /**
   * Section spacing variant
   */
  spacing?: 'compact' | 'normal' | 'loose';
  
  /**
   * Test ID for testing
   */
  testID?: string;
}

// ============================================================================
// Component
// ============================================================================

export function SettingsSection({
  title,
  description,
  children,
  showSeparator = true,
  headerContent,
  footerContent,
  spacing = 'normal',
  testID,
}: SettingsSectionProps) {
  const theme = useTheme();
  
  // ============================================================================
  // Styles
  // ============================================================================
  
  const getSpacingValues = () => {
    switch (spacing) {
      case 'compact':
        return {
          sectionMargin: 16,
          headerMargin: 8,
          footerMargin: 8,
        };
      case 'loose':
        return {
          sectionMargin: 32,
          headerMargin: 16,
          footerMargin: 16,
        };
      default: // normal
        return {
          sectionMargin: 24,
          headerMargin: 12,
          footerMargin: 12,
        };
    }
  };
  
  const spacingValues = getSpacingValues();
  
  const styles = StyleSheet.create({
    container: {
      marginBottom: spacingValues.sectionMargin,
    },
    
    header: {
      paddingHorizontal: 16,
      marginBottom: spacingValues.headerMargin,
    },
    
    title: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 4,
    },
    
    content: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      overflow: 'hidden',
      marginHorizontal: 16,
      
      // Shadow for elevation
      shadowColor: theme.colors.shadow,
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    
    footer: {
      paddingHorizontal: 16,
      marginTop: spacingValues.footerMargin,
    },
    
    description: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      lineHeight: 18,
    },
    
    separator: {
      height: 1,
      backgroundColor: theme.colors.border,
      marginHorizontal: 16,
      marginTop: spacingValues.sectionMargin,
    },
  });
  
  // ============================================================================
  // Render
  // ============================================================================
  
  return (
    <View style={styles.container} testID={testID}>
      {/* Header */}
      {(title || headerContent) && (
        <View style={styles.header}>
          {title && (
            <Text style={styles.title} accessibilityRole="header">
              {title}
            </Text>
          )}
          {headerContent}
        </View>
      )}
      
      {/* Content */}
      <View style={styles.content}>
        {children}
      </View>
      
      {/* Footer */}
      {(description || footerContent) && (
        <View style={styles.footer}>
          {description && (
            <Text style={styles.description}>
              {description}
            </Text>
          )}
          {footerContent}
        </View>
      )}
      
      {/* Separator */}
      {showSeparator && <View style={styles.separator} />}
    </View>
  );
}

export default SettingsSection;