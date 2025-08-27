// ============================================================================
// Settings Module - SettingsItem Component
// ============================================================================
//
// A reusable component for displaying individual settings items
// with consistent styling and interaction patterns.
//

import React from 'react';
import { View, Text, TouchableOpacity, Switch, StyleSheet } from 'react-native';
import { useTheme } from '../../../core/ui/theme';
import { Icon } from '../../../core/ui/components';

// ============================================================================
// Types
// ============================================================================

export interface SettingsItemProps {
  /**
   * The title of the settings item
   */
  title: string;
  
  /**
   * Optional description or subtitle
   */
  description?: string;
  
  /**
   * Icon to display on the left
   */
  icon?: string;
  
  /**
   * Type of settings item
   */
  type?: 'navigation' | 'toggle' | 'action' | 'info';
  
  /**
   * Value for toggle type
   */
  value?: boolean;
  
  /**
   * Callback for when the item is pressed
   */
  onPress?: () => void;
  
  /**
   * Callback for toggle changes
   */
  onToggle?: (value: boolean) => void;
  
  /**
   * Whether the item is disabled
   */
  disabled?: boolean;
  
  /**
   * Whether to show a loading state
   */
  loading?: boolean;
  
  /**
   * Badge text to display on the right
   */
  badge?: string;
  
  /**
   * Badge color
   */
  badgeColor?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  
  /**
   * Whether this is a destructive action
   */
  destructive?: boolean;
  
  /**
   * Custom right content
   */
  rightContent?: React.ReactNode;
  
  /**
   * Test ID for testing
   */
  testID?: string;
}

// ============================================================================
// Component
// ============================================================================

export function SettingsItem({
  title,
  description,
  icon,
  type = 'navigation',
  value,
  onPress,
  onToggle,
  disabled = false,
  loading = false,
  badge,
  badgeColor = 'primary',
  destructive = false,
  rightContent,
  testID,
}: SettingsItemProps) {
  const theme = useTheme();
  
  // ============================================================================
  // Handlers
  // ============================================================================
  
  const handlePress = () => {
    if (disabled || loading) return;
    
    if (type === 'toggle' && onToggle) {
      onToggle(!value);
    } else if (onPress) {
      onPress();
    }
  };
  
  // ============================================================================
  // Styles
  // ============================================================================
  
  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border,
      minHeight: 56,
    },
    
    containerDisabled: {
      opacity: 0.5,
    },
    
    containerDestructive: {
      backgroundColor: theme.colors.errorSurface,
    },
    
    iconContainer: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.colors.primarySurface,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    
    iconContainerDestructive: {
      backgroundColor: theme.colors.errorSurface,
    },
    
    content: {
      flex: 1,
      justifyContent: 'center',
    },
    
    title: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.colors.text,
      marginBottom: description ? 2 : 0,
    },
    
    titleDestructive: {
      color: theme.colors.error,
    },
    
    description: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      lineHeight: 18,
    },
    
    rightContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginLeft: 12,
    },
    
    badge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      marginRight: 8,
    },
    
    badgeText: {
      fontSize: 12,
      fontWeight: '600',
    },
    
    chevron: {
      marginLeft: 4,
    },
    
    switch: {
      transform: [{ scale: 0.9 }],
    },
  });
  
  // ============================================================================
  // Badge Styles
  // ============================================================================
  
  const getBadgeStyles = () => {
    const baseStyle = styles.badge;
    const textStyle = styles.badgeText;
    
    switch (badgeColor) {
      case 'primary':
        return {
          badge: [baseStyle, { backgroundColor: theme.colors.primary }],
          text: [textStyle, { color: theme.colors.onPrimary }],
        };
      case 'secondary':
        return {
          badge: [baseStyle, { backgroundColor: theme.colors.secondary }],
          text: [textStyle, { color: theme.colors.onSecondary }],
        };
      case 'success':
        return {
          badge: [baseStyle, { backgroundColor: theme.colors.success }],
          text: [textStyle, { color: theme.colors.onSuccess }],
        };
      case 'warning':
        return {
          badge: [baseStyle, { backgroundColor: theme.colors.warning }],
          text: [textStyle, { color: theme.colors.onWarning }],
        };
      case 'error':
        return {
          badge: [baseStyle, { backgroundColor: theme.colors.error }],
          text: [textStyle, { color: theme.colors.onError }],
        };
      default:
        return {
          badge: [baseStyle, { backgroundColor: theme.colors.surfaceVariant }],
          text: [textStyle, { color: theme.colors.onSurfaceVariant }],
        };
    }
  };
  
  const badgeStyles = getBadgeStyles();
  
  // ============================================================================
  // Render Right Content
  // ============================================================================
  
  const renderRightContent = () => {
    if (rightContent) {
      return rightContent;
    }
    
    const content = [];
    
    // Badge
    if (badge) {
      content.push(
        <View key="badge" style={badgeStyles.badge}>
          <Text style={badgeStyles.text}>{badge}</Text>
        </View>
      );
    }
    
    // Type-specific content
    switch (type) {
      case 'toggle':
        content.push(
          <Switch
            key="switch"
            value={value || false}
            onValueChange={onToggle}
            disabled={disabled || loading}
            style={styles.switch}
            trackColor={{
              false: theme.colors.surfaceVariant,
              true: theme.colors.primary,
            }}
            thumbColor={theme.colors.surface}
            testID={testID ? `${testID}-switch` : undefined}
          />
        );
        break;
        
      case 'navigation':
        content.push(
          <Icon
            key="chevron"
            name="chevron-right"
            size={20}
            color={theme.colors.textSecondary}
            style={styles.chevron}
          />
        );
        break;
        
      case 'action':
        if (!badge) {
          content.push(
            <Icon
              key="action"
              name="external-link"
              size={20}
              color={destructive ? theme.colors.error : theme.colors.textSecondary}
              style={styles.chevron}
            />
          );
        }
        break;
        
      case 'info':
        // No additional content for info type
        break;
    }
    
    return content.length > 0 ? content : null;
  };
  
  // ============================================================================
  // Render
  // ============================================================================
  
  const containerStyle = [
    styles.container,
    disabled && styles.containerDisabled,
    destructive && styles.containerDestructive,
  ];
  
  const titleStyle = [
    styles.title,
    destructive && styles.titleDestructive,
  ];
  
  const iconContainerStyle = [
    styles.iconContainer,
    destructive && styles.iconContainerDestructive,
  ];
  
  const Component = (type === 'info' || disabled) ? View : TouchableOpacity;
  
  return (
    <Component
      style={containerStyle}
      onPress={handlePress}
      disabled={disabled || loading}
      testID={testID}
      accessibilityRole={type === 'toggle' ? 'switch' : 'button'}
      accessibilityState={{
        disabled: disabled || loading,
        checked: type === 'toggle' ? value : undefined,
      }}
      accessibilityLabel={title}
      accessibilityHint={description}
    >
      {/* Icon */}
      {icon && (
        <View style={iconContainerStyle}>
          <Icon
            name={icon}
            size={18}
            color={destructive ? theme.colors.error : theme.colors.primary}
          />
        </View>
      )}
      
      {/* Content */}
      <View style={styles.content}>
        <Text style={titleStyle}>{title}</Text>
        {description && (
          <Text style={styles.description}>{description}</Text>
        )}
      </View>
      
      {/* Right Content */}
      <View style={styles.rightContainer}>
        {renderRightContent()}
      </View>
      
      {/* Loading Indicator */}
      {loading && (
        <View style={styles.rightContainer}>
          <Icon
            name="loader"
            size={20}
            color={theme.colors.textSecondary}
            style={{ marginLeft: 8 }}
          />
        </View>
      )}
    </Component>
  );
}

export default SettingsItem;