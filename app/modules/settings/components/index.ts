// ============================================================================
// Settings Module - Components Index
// ============================================================================
//
// Centralized exports for all settings components, providing a clean
// interface for importing components from the settings module.
//

// ============================================================================
// Core Components
// ============================================================================

export { SettingsScreen } from './SettingsScreen';
export type { SettingsScreenProps } from './SettingsScreen';

export { SettingsSection } from './SettingsSection';
export type { SettingsSectionProps } from './SettingsSection';

export { SettingsItem } from './SettingsItem';
export type { SettingsItemProps } from './SettingsItem';

// ============================================================================
// Component Utilities
// ============================================================================

import React from 'react';
import { SettingsScreenProps } from './SettingsScreen';
import { SettingsSectionProps } from './SettingsSection';
import { SettingsItemProps } from './SettingsItem';

/**
 * Configuration for creating settings components
 */
export interface SettingsComponentsConfig {
  /**
   * Default theme variant
   */
  theme?: 'light' | 'dark' | 'auto';
  
  /**
   * Default spacing for sections
   */
  defaultSpacing?: 'compact' | 'normal' | 'loose';
  
  /**
   * Whether to show separators by default
   */
  showSeparators?: boolean;
  
  /**
   * Default search placeholder
   */
  searchPlaceholder?: string;
  
  /**
   * Animation preferences
   */
  animations?: {
    enabled: boolean;
    duration: number;
  };
}

/**
 * Factory function to create settings components with shared configuration
 */
export function createSettingsComponents(config: SettingsComponentsConfig = {}) {
  const {
    defaultSpacing = 'normal',
    showSeparators = true,
    searchPlaceholder = 'Search settings...',
    animations = { enabled: true, duration: 200 },
  } = config;
  
  return {
    /**
     * Pre-configured SettingsScreen component
     */
    Screen: (props: Partial<SettingsScreenProps>) => {
      const defaultProps: Partial<SettingsScreenProps> = {
        searchPlaceholder,
        ...props,
      };
      
      return React.createElement('SettingsScreen', defaultProps);
    },
    
    /**
     * Pre-configured SettingsSection component
     */
    Section: (props: Partial<SettingsSectionProps>) => {
      const defaultProps: Partial<SettingsSectionProps> = {
        spacing: defaultSpacing,
        showSeparator: showSeparators,
        ...props,
      };
      
      return React.createElement('SettingsSection', defaultProps);
    },
    
    /**
     * Pre-configured SettingsItem component
     */
    Item: (props: SettingsItemProps) => {
      return React.createElement('SettingsItem', props);
    },
  };
}

/**
 * Utility functions for settings components
 */
export const settingsComponentUtils = {
  /**
   * Create a settings item with navigation
   */
  createNavigationItem: (title: string, onPress: () => void, options: Partial<SettingsItemProps> = {}): SettingsItemProps => ({
    title,
    type: 'navigation',
    onPress,
    ...options,
  }),
  
  /**
   * Create a settings item with toggle
   */
  createToggleItem: (title: string, value: boolean, onToggle: (value: boolean) => void, options: Partial<SettingsItemProps> = {}): SettingsItemProps => ({
    title,
    type: 'toggle',
    value,
    onToggle,
    ...options,
  }),
  
  /**
   * Create a settings item for actions
   */
  createActionItem: (title: string, onPress: () => void, options: Partial<SettingsItemProps> = {}): SettingsItemProps => ({
    title,
    type: 'action',
    onPress,
    ...options,
  }),
  
  /**
   * Create an informational settings item
   */
  createInfoItem: (title: string, description?: string, options: Partial<SettingsItemProps> = {}): SettingsItemProps => ({
    title,
    description,
    type: 'info',
    ...options,
  }),
  
  /**
   * Group settings items by category
   */
  groupItemsByCategory: (items: (SettingsItemProps & { category?: string })[]) => {
    const grouped: Record<string, SettingsItemProps[]> = {};
    
    items.forEach(item => {
      const category = item.category || 'General';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(item);
    });
    
    return grouped;
  },
  
  /**
   * Filter settings items by search query
   */
  filterItemsBySearch: (items: SettingsItemProps[], query: string): SettingsItemProps[] => {
    if (!query.trim()) return items;
    
    const searchTerm = query.toLowerCase();
    return items.filter(item => 
      item.title.toLowerCase().includes(searchTerm) ||
      (item.description && item.description.toLowerCase().includes(searchTerm))
    );
  },
  
  /**
   * Sort settings items by title
   */
  sortItemsByTitle: (items: SettingsItemProps[]): SettingsItemProps[] => {
    return [...items].sort((a, b) => a.title.localeCompare(b.title));
  },
  
  /**
   * Get items with unsaved changes
   */
  getUnsavedItems: (items: (SettingsItemProps & { hasUnsavedChanges?: boolean })[]): SettingsItemProps[] => {
    return items.filter(item => item.hasUnsavedChanges);
  },
};

/**
 * Constants for settings components
 */
export const SETTINGS_COMPONENTS_CONFIG = {
  /**
   * Default component configuration
   */
  defaults: {
    spacing: 'normal' as const,
    showSeparators: true,
    searchPlaceholder: 'Search settings...',
    animations: {
      enabled: true,
      duration: 200,
    },
  },
  
  /**
   * Available component variants
   */
  variants: {
    spacing: ['compact', 'normal', 'loose'] as const,
    itemTypes: ['navigation', 'toggle', 'action', 'info'] as const,
    badgeColors: ['primary', 'secondary', 'success', 'warning', 'error'] as const,
  },
  
  /**
   * Component accessibility labels
   */
  accessibility: {
    backButton: 'Go back',
    saveButton: 'Save changes',
    searchInput: 'Search settings',
    toggleSwitch: 'Toggle setting',
    navigationItem: 'Navigate to setting',
    actionItem: 'Perform action',
  },
  
  /**
   * Test IDs for components
   */
  testIds: {
    screen: 'settings-screen',
    section: 'settings-section',
    item: 'settings-item',
    backButton: 'settings-back-button',
    saveButton: 'settings-save-button',
    searchInput: 'settings-search-input',
  },
} as const;