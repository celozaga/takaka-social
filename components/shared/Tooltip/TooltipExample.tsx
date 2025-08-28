/**
 * ============================================================================
 * Tooltip Usage Examples
 * ============================================================================
 *
 * This file demonstrates various ways to use the centralized tooltip system.
 * These examples can be used as reference for implementing tooltips
 * throughout the application.
 *
 */

import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Tooltip, useTooltip } from './index';
import { TooltipContentKey, useTooltipContent } from './TooltipContent';
import { useTheme } from '../Theme/ThemeProvider';

// ============================================================================
// Example 1: Basic Tooltip with Predefined Content
// ============================================================================

export const BasicTooltipExample: React.FC = () => {
  const { theme } = useTheme();
  
  return (
    <View style={{ padding: theme.spacing.md }}>
      <Tooltip
        contentKey="post.like"
        position="top"
      >
        <Pressable
          style={{
            backgroundColor: theme.colors.primary,
            padding: theme.spacing.sm,
            borderRadius: theme.radius.md,
          }}
        >
          <Text style={{ color: theme.colors.onPrimary }}>❤️ Like</Text>
        </Pressable>
      </Tooltip>
    </View>
  );
};

// ============================================================================
// Example 2: Tooltip with Custom Content
// ============================================================================

export const CustomTooltipExample: React.FC = () => {
  const { theme } = useTheme();
  
  return (
    <View style={{ padding: theme.spacing.md }}>
      <Tooltip
        content="This is a custom tooltip message that overrides the predefined content."
        position="bottom"
      >
        <Pressable
          style={{
            backgroundColor: theme.colors.secondary,
            padding: theme.spacing.sm,
            borderRadius: theme.radius.md,
          }}
        >
          <Text style={{ color: theme.colors.onSecondary }}>ℹ️ Info</Text>
        </Pressable>
      </Tooltip>
    </View>
  );
};

// ============================================================================
// Example 3: Using the useTooltip Hook for Advanced Control
// ============================================================================

export const AdvancedTooltipExample: React.FC = () => {
  const { theme } = useTheme();
  const { getTooltipContent } = useTooltipContent();
  const { isVisible, show, hide, triggerProps } = useTooltip({
    showDelay: 300,
    hideDelay: 100,
  });
  
  return (
    <View style={{ padding: theme.spacing.md }}>
      <Pressable
        {...triggerProps}
        style={{
          backgroundColor: theme.colors.surface,
          padding: theme.spacing.md,
          borderRadius: theme.radius.lg,
          borderWidth: 1,
          borderColor: theme.colors.outline,
        }}
      >
        <Text style={{ color: theme.colors.onSurface }}>
          🎯 Advanced Tooltip Control
        </Text>
      </Pressable>
      
      {isVisible && (
        <Tooltip
          content={getTooltipContent('general.help')}
          position="right"
        >
          <View />
        </Tooltip>
      )}
    </View>
  );
};

// ============================================================================
// Example 4: Multiple Tooltips with Different Positions
// ============================================================================

export const MultipleTooltipsExample: React.FC = () => {
  const { theme } = useTheme();
  
  const tooltipData: Array<{
    key: TooltipContentKey;
    position: 'top' | 'bottom' | 'left' | 'right';
    label: string;
  }> = [
    { key: 'nav.home', position: 'top', label: '🏠 Home' },
    { key: 'nav.search', position: 'right', label: '🔍 Search' },
    { key: 'nav.notifications', position: 'bottom', label: '🔔 Notifications' },
    { key: 'nav.profile', position: 'left', label: '👤 Profile' },
  ];
  
  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing.md,
        padding: theme.spacing.lg,
      }}
    >
      {tooltipData.map((item, index) => (
        <Tooltip
          key={index}
          contentKey={item.key}
          position={item.position}
        >
          <Pressable
            style={{
              backgroundColor: theme.colors.primaryContainer,
              padding: theme.spacing.sm,
              borderRadius: theme.radius.sm,
              minWidth: 80,
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                color: theme.colors.onPrimaryContainer,
                fontSize: 12,
              }}
            >
              {item.label}
            </Text>
          </Pressable>
        </Tooltip>
      ))}
    </View>
  );
};

// ============================================================================
// Example 5: Form Field with Tooltip
// ============================================================================

export const FormTooltipExample: React.FC = () => {
  const { theme } = useTheme();
  
  return (
    <View style={{ padding: theme.spacing.md }}>
      <View style={{ marginBottom: theme.spacing.sm }}>
        <Text
          style={{
            color: theme.colors.onSurface,
            fontWeight: '600',
            marginBottom: theme.spacing.xs,
          }}
        >
          Email Address
          <Tooltip
            contentKey="form.required"
            position="top"
          >
            <Text style={{ color: theme.colors.error }}> *</Text>
          </Tooltip>
        </Text>
        
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: theme.colors.outline,
            borderRadius: theme.radius.md,
            paddingHorizontal: theme.spacing.sm,
          }}
        >
          <Text
            style={{
              flex: 1,
              padding: theme.spacing.sm,
              color: theme.colors.onSurface,
            }}
          >
            user@example.com
          </Text>
          
          <Tooltip
            contentKey="form.clear"
            position="left"
          >
            <Pressable
              style={{
                padding: theme.spacing.xs,
                borderRadius: theme.radius.full,
              }}
            >
              <Text style={{ color: theme.colors.outline }}>✕</Text>
            </Pressable>
          </Tooltip>
        </View>
      </View>
    </View>
  );
};

// ============================================================================
// Combined Examples Component
// ============================================================================

export const TooltipExamples: React.FC = () => {
  const { theme } = useTheme();
  
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.colors.background,
        padding: theme.spacing.md,
      }}
    >
      <Text
        style={{
          fontSize: 24,
          fontWeight: 'bold',
          color: theme.colors.onBackground,
          marginBottom: theme.spacing.lg,
          textAlign: 'center',
        }}
      >
        Tooltip System Examples
      </Text>
      
      <BasicTooltipExample />
      <CustomTooltipExample />
      <AdvancedTooltipExample />
      <MultipleTooltipsExample />
      <FormTooltipExample />
    </View>
  );
};

export default TooltipExamples;