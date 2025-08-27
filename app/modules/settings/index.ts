// ============================================================================
// Settings Module
// ============================================================================
//
// This module handles all user settings and preferences functionality,
// including account settings, privacy controls, accessibility options,
// and application preferences.
//

// ============================================================================
// Module Exports
// ============================================================================

// Components
export * from './components';

// Hooks
export * from './hooks';

// Types
export * from './types';

// Utilities
export * from './utils';

// ============================================================================
// Module Configuration
// ============================================================================

export const SETTINGS_MODULE_CONFIG = {
  /**
   * Module metadata
   */
  name: 'settings',
  version: '1.0.0',
  description: 'User settings and preferences management',
  
  /**
   * Module features
   */
  features: [
    'account-settings',
    'privacy-settings',
    'accessibility-settings',
    'notification-preferences',
    'theme-customization',
    'language-selection',
    'data-management',
    'security-controls',
  ],
  
  /**
   * Module dependencies
   */
  dependencies: [
    'core/ui',
    'core/api',
    'core/state',
    'core/utils',
  ],
  
  /**
   * Available components
   */
  components: [
    'SettingsScreen',
    'SettingsSection',
    'SettingsItem',
  ],
  
  /**
   * Available hooks
   */
  hooks: [
    'useSettings',
    'useAccountSettings',
    'usePrivacySettings',
    'useAccessibilitySettings',
    'useSettingsSystem',
  ],
  
  /**
   * Available utilities
   */
  utilities: [
    'settingsValidators',
    'settingsFormatters',
    'settingsUtils',
    'settingsExportImport',
    'settingsSearch',
    'settingsAnalytics',
  ],
  
  /**
   * Available types
   */
  types: [
    'AppSettings',
    'AccountSettings',
    'PrivacySettings',
    'AccessibilitySettings',
    'ModerationSettings',
    'FeedSettings',
    'SettingsState',
    'SettingsAction',
  ],
} as const;