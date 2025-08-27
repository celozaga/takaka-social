// ============================================================================
// Settings Module - Hooks Index
// ============================================================================
//
// This file centralizes all settings-related hooks and provides
// convenient access to the complete settings management system.
//

// ============================================================================
// Hook Exports
// ============================================================================

export { useSettings, default as useSettingsDefault } from './useSettings';
export { useAccountSettings, default as useAccountSettingsDefault } from './useAccountSettings';
export { usePrivacySettings, default as usePrivacySettingsDefault } from './usePrivacySettings';
export { useAccessibilitySettings, default as useAccessibilitySettingsDefault } from './useAccessibilitySettings';

// ============================================================================
// Type Re-exports
// ============================================================================

export type {
  UseSettingsReturn,
  UseAccountSettingsReturn,
  UsePrivacySettingsReturn,
  UseAccessibilitySettingsReturn,
} from '../types';

// ============================================================================
// Hook Configuration
// ============================================================================

export interface SettingsHooksConfig {
  /**
   * Global auto-save setting for all hooks
   * @default true
   */
  autoSave?: boolean;
  
  /**
   * Global save delay for all hooks
   * @default 2000
   */
  saveDelay?: number;
  
  /**
   * Global cache setting for all hooks
   * @default true
   */
  enableCache?: boolean;
  
  /**
   * Enable validation across all hooks
   * @default true
   */
  enableValidation?: boolean;
  
  /**
   * Apply accessibility settings to DOM
   * @default true
   */
  applyAccessibilityToDom?: boolean;
  
  /**
   * Enable privacy warnings
   * @default true
   */
  showPrivacyWarnings?: boolean;
  
  /**
   * Enable accessibility testing mode
   * @default false
   */
  accessibilityTestingMode?: boolean;
}

// ============================================================================
// Composite Hook
// ============================================================================

/**
 * Composite hook that provides access to all settings hooks
 * with shared configuration
 */
export function useSettingsSystem(config: SettingsHooksConfig = {}) {
  const {
    autoSave = true,
    saveDelay = 2000,
    enableCache = true,
    enableValidation = true,
    applyAccessibilityToDom = true,
    showPrivacyWarnings = true,
    accessibilityTestingMode = false,
  } = config;
  
  // Base configuration for all hooks
  const baseConfig = {
    autoSave,
    saveDelay,
    enableCache,
  };
  
  // Initialize all hooks with shared configuration
  const settings = useSettings({
    ...baseConfig,
    enableValidation,
  });
  
  const account = useAccountSettings({
    ...baseConfig,
    enableValidation,
  });
  
  const privacy = usePrivacySettings({
    ...baseConfig,
    showWarnings: showPrivacyWarnings,
  });
  
  const accessibility = useAccessibilitySettings({
    ...baseConfig,
    applyToDom: applyAccessibilityToDom,
    testingMode: accessibilityTestingMode,
  });
  
  return {
    settings,
    account,
    privacy,
    accessibility,
    
    // Global state
    isLoading: settings.isLoading || account.isLoading || privacy.isLoading || accessibility.isLoading,
    isSaving: settings.isSaving || account.isSaving || privacy.isSaving || accessibility.isSaving,
    hasUnsavedChanges: settings.hasUnsavedChanges || account.hasUnsavedChanges || privacy.hasUnsavedChanges || accessibility.hasUnsavedChanges,
    
    // Global actions
    saveAll: async () => {
      const promises = [];
      
      if (settings.hasUnsavedChanges) {
        promises.push(settings.saveSettings());
      }
      
      if (account.hasUnsavedChanges) {
        promises.push(account.saveSettings());
      }
      
      if (privacy.hasUnsavedChanges) {
        promises.push(privacy.saveSettings());
      }
      
      if (accessibility.hasUnsavedChanges) {
        promises.push(accessibility.saveSettings());
      }
      
      await Promise.all(promises);
    },
    
    loadAll: async () => {
      await Promise.all([
        settings.loadSettings(),
        account.loadSettings(),
        privacy.loadSettings(),
        accessibility.loadSettings(),
      ]);
    },
    
    resetAll: () => {
      settings.resetSettings();
      account.resetToDefaults();
      privacy.resetToDefaults();
      accessibility.resetToDefaults();
    },
    
    clearAllErrors: () => {
      settings.clearErrors();
      account.clearErrors();
      privacy.clearErrors();
      accessibility.clearErrors();
    },
  };
}

// ============================================================================
// Hook Factory Functions
// ============================================================================

/**
 * Factory function to create settings hooks with shared configuration
 */
export function createSettingsHooks(config: SettingsHooksConfig) {
  return {
    useSettings: (options = {}) => useSettings({ ...config, ...options }),
    useAccountSettings: (options = {}) => useAccountSettings({ ...config, ...options }),
    usePrivacySettings: (options = {}) => usePrivacySettings({ 
      ...config, 
      showWarnings: config.showPrivacyWarnings,
      ...options 
    }),
    useAccessibilitySettings: (options = {}) => useAccessibilitySettings({ 
      ...config, 
      applyToDom: config.applyAccessibilityToDom,
      testingMode: config.accessibilityTestingMode,
      ...options 
    }),
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get all settings categories that have unsaved changes
 */
export function getUnsavedCategories(hooks: {
  settings: UseSettingsReturn;
  account: UseAccountSettingsReturn;
  privacy: UsePrivacySettingsReturn;
  accessibility: UseAccessibilitySettingsReturn;
}): string[] {
  const unsaved: string[] = [];
  
  if (hooks.settings.hasUnsavedChanges) unsaved.push('general');
  if (hooks.account.hasUnsavedChanges) unsaved.push('account');
  if (hooks.privacy.hasUnsavedChanges) unsaved.push('privacy');
  if (hooks.accessibility.hasUnsavedChanges) unsaved.push('accessibility');
  
  return unsaved;
}

/**
 * Get all errors across all settings hooks
 */
export function getAllErrors(hooks: {
  settings: UseSettingsReturn;
  account: UseAccountSettingsReturn;
  privacy: UsePrivacySettingsReturn;
  accessibility: UseAccessibilitySettingsReturn;
}): Record<string, Record<string, Error>> {
  return {
    general: hooks.settings.errors,
    account: hooks.account.errors,
    privacy: hooks.privacy.errors,
    accessibility: hooks.accessibility.errors,
  };
}

/**
 * Check if any settings hook has errors
 */
export function hasAnyErrors(hooks: {
  settings: UseSettingsReturn;
  account: UseAccountSettingsReturn;
  privacy: UsePrivacySettingsReturn;
  accessibility: UseAccessibilitySettingsReturn;
}): boolean {
  return (
    Object.keys(hooks.settings.errors).length > 0 ||
    Object.keys(hooks.account.errors).length > 0 ||
    Object.keys(hooks.privacy.errors).length > 0 ||
    Object.keys(hooks.accessibility.errors).length > 0
  );
}

// ============================================================================
// Default Export
// ============================================================================

export default {
  useSettings,
  useAccountSettings,
  usePrivacySettings,
  useAccessibilitySettings,
  useSettingsSystem,
  createSettingsHooks,
  getUnsavedCategories,
  getAllErrors,
  hasAnyErrors,
};