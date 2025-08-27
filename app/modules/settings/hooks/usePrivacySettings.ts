// ============================================================================
// Settings Module - usePrivacySettings Hook
// ============================================================================
//
// This hook provides specialized functionality for managing privacy settings,
// including visibility controls, data management, and security preferences.
//

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  PrivacySettings,
  UsePrivacySettingsReturn,
  VisibilitySettings,
  DataSettings,
  SecuritySettings,
  PrivacyLevel,
} from '../types';
import { settingsUtils, settingsValidators } from '../utils';
import { defaultApiClient } from '../../../core/api';

// ============================================================================
// Types
// ============================================================================

interface UsePrivacySettingsOptions {
  /**
   * Auto-save settings on change
   * @default true
   */
  autoSave?: boolean;
  
  /**
   * Debounce delay for auto-save in milliseconds
   * @default 2000
   */
  saveDelay?: number;
  
  /**
   * Enable local caching
   * @default true
   */
  enableCache?: boolean;
  
  /**
   * Enable privacy level presets
   * @default true
   */
  enablePresets?: boolean;
  
  /**
   * Show privacy impact warnings
   * @default true
   */
  showWarnings?: boolean;
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_OPTIONS: Required<UsePrivacySettingsOptions> = {
  autoSave: true,
  saveDelay: 2000,
  enableCache: true,
  enablePresets: true,
  showWarnings: true,
};

const CACHE_KEY = 'settings_privacy';

// ============================================================================
// Privacy Presets
// ============================================================================

const PRIVACY_PRESETS: Record<PrivacyLevel, Partial<PrivacySettings>> = {
  public: {
    visibility: {
      profile: 'public',
      posts: 'public',
      followers: 'public',
      following: 'public',
      likes: 'public',
      activity: 'public',
    },
    data: {
      allowAnalytics: true,
      allowPersonalization: true,
      allowThirdPartyIntegration: true,
      dataRetentionPeriod: 365 * 2, // 2 years
    },
    security: {
      requireTwoFactor: false,
      allowPasswordReset: true,
      sessionTimeout: 30 * 24 * 60, // 30 days
    },
  },
  friends: {
    visibility: {
      profile: 'followers',
      posts: 'followers',
      followers: 'followers',
      following: 'followers',
      likes: 'followers',
      activity: 'private',
    },
    data: {
      allowAnalytics: true,
      allowPersonalization: true,
      allowThirdPartyIntegration: false,
      dataRetentionPeriod: 365, // 1 year
    },
    security: {
      requireTwoFactor: false,
      allowPasswordReset: true,
      sessionTimeout: 7 * 24 * 60, // 7 days
    },
  },
  private: {
    visibility: {
      profile: 'private',
      posts: 'private',
      followers: 'private',
      following: 'private',
      likes: 'private',
      activity: 'private',
    },
    data: {
      allowAnalytics: false,
      allowPersonalization: false,
      allowThirdPartyIntegration: false,
      dataRetentionPeriod: 90, // 3 months
    },
    security: {
      requireTwoFactor: true,
      allowPasswordReset: false,
      sessionTimeout: 24 * 60, // 1 day
    },
  },
};

// ============================================================================
// Main Hook
// ============================================================================

export function usePrivacySettings(options: UsePrivacySettingsOptions = {}): UsePrivacySettingsReturn {
  const config = { ...DEFAULT_OPTIONS, ...options };
  
  // ============================================================================
  // State Management
  // ============================================================================
  
  const [settings, setSettings] = useState<PrivacySettings>(
    settingsUtils.getDefaultSettings('privacy') as PrivacySettings
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [errors, setErrors] = useState<Record<string, Error>>({});
  const [warnings, setWarnings] = useState<string[]>([]);
  const [currentPreset, setCurrentPreset] = useState<PrivacyLevel | 'custom'>('custom');
  
  // ============================================================================
  // Refs
  // ============================================================================
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // ============================================================================
  // Cache Management
  // ============================================================================
  
  const loadFromCache = useCallback((): PrivacySettings | null => {
    if (!config.enableCache) return null;
    
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;
      
      const data = JSON.parse(cached);
      const age = Date.now() - (data.timestamp || 0);
      
      if (age > 600000) { // 10 minutes
        localStorage.removeItem(CACHE_KEY);
        return null;
      }
      
      return data.settings;
    } catch (error) {
      console.warn('Failed to load privacy settings from cache:', error);
      return null;
    }
  }, [config.enableCache]);
  
  const saveToCache = useCallback((privacySettings: PrivacySettings): void => {
    if (!config.enableCache) return;
    
    try {
      const cacheData = {
        settings: privacySettings,
        timestamp: Date.now(),
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Failed to save privacy settings to cache:', error);
    }
  }, [config.enableCache]);
  
  // ============================================================================
  // Privacy Analysis
  // ============================================================================
  
  const analyzePrivacyLevel = useCallback((privacySettings: PrivacySettings): PrivacyLevel | 'custom' => {
    if (!config.enablePresets) return 'custom';
    
    // Check if settings match any preset
    for (const [level, preset] of Object.entries(PRIVACY_PRESETS)) {
      const matches = Object.entries(preset).every(([category, categorySettings]) => {
        if (typeof categorySettings === 'object' && categorySettings !== null) {
          return Object.entries(categorySettings).every(([key, value]) => {
            const currentValue = (privacySettings as any)[category]?.[key];
            return currentValue === value;
          });
        }
        return true;
      });
      
      if (matches) {
        return level as PrivacyLevel;
      }
    }
    
    return 'custom';
  }, [config.enablePresets]);
  
  const generateWarnings = useCallback((privacySettings: PrivacySettings): string[] => {
    if (!config.showWarnings) return [];
    
    const warnings: string[] = [];
    
    // Check for potentially risky settings
    if (privacySettings.visibility.profile === 'public' && privacySettings.visibility.activity === 'public') {
      warnings.push('Your profile and activity are both public, which may expose detailed information about your behavior.');
    }
    
    if (privacySettings.data.allowThirdPartyIntegration && privacySettings.data.allowAnalytics) {
      warnings.push('Allowing both third-party integration and analytics may result in extensive data sharing.');
    }
    
    if (!privacySettings.security.requireTwoFactor && privacySettings.security.sessionTimeout > 7 * 24 * 60) {
      warnings.push('Long session timeouts without two-factor authentication may pose security risks.');
    }
    
    if (privacySettings.data.dataRetentionPeriod > 365 * 2) {
      warnings.push('Extended data retention periods may conflict with privacy regulations in some regions.');
    }
    
    return warnings;
  }, [config.showWarnings]);
  
  // ============================================================================
  // API Functions
  // ============================================================================
  
  const loadSettings = useCallback(async (): Promise<void> => {
    try {
      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      abortControllerRef.current = new AbortController();
      
      setIsLoading(true);
      setErrors({});
      
      // Try cache first
      const cachedSettings = loadFromCache();
      if (cachedSettings) {
        setSettings(cachedSettings);
        setCurrentPreset(analyzePrivacyLevel(cachedSettings));
        setWarnings(generateWarnings(cachedSettings));
        setIsLoading(false);
        return;
      }
      
      // Load from API
      const response = await defaultApiClient.get('/settings/privacy', {
        signal: abortControllerRef.current.signal,
      });
      
      const privacySettings = settingsUtils.mergeSettings(
        settingsUtils.getDefaultSettings('privacy'),
        response.data
      ) as PrivacySettings;
      
      setSettings(privacySettings);
      setCurrentPreset(analyzePrivacyLevel(privacySettings));
      setWarnings(generateWarnings(privacySettings));
      saveToCache(privacySettings);
      
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('Failed to load privacy settings:', err);
        setErrors({ load: err as Error });
        
        // Fallback to cached data if available
        const cachedSettings = loadFromCache();
        if (cachedSettings) {
          setSettings(cachedSettings);
          setCurrentPreset(analyzePrivacyLevel(cachedSettings));
          setWarnings(generateWarnings(cachedSettings));
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [loadFromCache, saveToCache, analyzePrivacyLevel, generateWarnings]);
  
  const saveSettings = useCallback(async (): Promise<void> => {
    try {
      setIsSaving(true);
      setErrors(prev => ({ ...prev, save: undefined }));
      
      await defaultApiClient.put('/settings/privacy', settings);
      saveToCache(settings);
      setHasUnsavedChanges(false);
      
    } catch (err) {
      console.error('Failed to save privacy settings:', err);
      setErrors(prev => ({ ...prev, save: err as Error }));
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [settings, saveToCache]);
  
  // ============================================================================
  // Update Functions
  // ============================================================================
  
  const updateVisibility = useCallback((updates: Partial<VisibilitySettings>): void => {
    const newSettings = {
      ...settings,
      visibility: { ...settings.visibility, ...updates },
    };
    
    setSettings(newSettings);
    setHasUnsavedChanges(true);
    setCurrentPreset(analyzePrivacyLevel(newSettings));
    setWarnings(generateWarnings(newSettings));
    
    // Auto-save with debounce
    if (config.autoSave) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      saveTimeoutRef.current = setTimeout(() => {
        saveSettings().catch(console.error);
      }, config.saveDelay);
    }
  }, [settings, config.autoSave, config.saveDelay, analyzePrivacyLevel, generateWarnings, saveSettings]);
  
  const updateData = useCallback((updates: Partial<DataSettings>): void => {
    const newSettings = {
      ...settings,
      data: { ...settings.data, ...updates },
    };
    
    setSettings(newSettings);
    setHasUnsavedChanges(true);
    setCurrentPreset(analyzePrivacyLevel(newSettings));
    setWarnings(generateWarnings(newSettings));
    
    // Auto-save with debounce
    if (config.autoSave) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      saveTimeoutRef.current = setTimeout(() => {
        saveSettings().catch(console.error);
      }, config.saveDelay);
    }
  }, [settings, config.autoSave, config.saveDelay, analyzePrivacyLevel, generateWarnings, saveSettings]);
  
  const updateSecurity = useCallback((updates: Partial<SecuritySettings>): void => {
    const newSettings = {
      ...settings,
      security: { ...settings.security, ...updates },
    };
    
    setSettings(newSettings);
    setHasUnsavedChanges(true);
    setCurrentPreset(analyzePrivacyLevel(newSettings));
    setWarnings(generateWarnings(newSettings));
    
    // Auto-save with debounce
    if (config.autoSave) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      saveTimeoutRef.current = setTimeout(() => {
        saveSettings().catch(console.error);
      }, config.saveDelay);
    }
  }, [settings, config.autoSave, config.saveDelay, analyzePrivacyLevel, generateWarnings, saveSettings]);
  
  const applyPreset = useCallback((preset: PrivacyLevel): void => {
    if (!config.enablePresets) return;
    
    const presetSettings = PRIVACY_PRESETS[preset];
    const newSettings = settingsUtils.mergeSettings(settings, presetSettings) as PrivacySettings;
    
    setSettings(newSettings);
    setHasUnsavedChanges(true);
    setCurrentPreset(preset);
    setWarnings(generateWarnings(newSettings));
    
    // Auto-save with debounce
    if (config.autoSave) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      saveTimeoutRef.current = setTimeout(() => {
        saveSettings().catch(console.error);
      }, config.saveDelay);
    }
  }, [settings, config.enablePresets, config.autoSave, config.saveDelay, generateWarnings, saveSettings]);
  
  const resetToDefaults = useCallback((): void => {
    const defaultSettings = settingsUtils.getDefaultSettings('privacy') as PrivacySettings;
    setSettings(defaultSettings);
    setHasUnsavedChanges(true);
    setCurrentPreset(analyzePrivacyLevel(defaultSettings));
    setWarnings(generateWarnings(defaultSettings));
    
    if (config.autoSave) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      saveTimeoutRef.current = setTimeout(() => {
        saveSettings().catch(console.error);
      }, config.saveDelay);
    }
  }, [config.autoSave, config.saveDelay, analyzePrivacyLevel, generateWarnings, saveSettings]);
  
  const clearErrors = useCallback((): void => {
    setErrors({});
  }, []);
  
  const dismissWarnings = useCallback((): void => {
    setWarnings([]);
  }, []);
  
  // ============================================================================
  // Utility Functions
  // ============================================================================
  
  const hasChanges = useCallback((): boolean => {
    const defaultSettings = settingsUtils.getDefaultSettings('privacy') as PrivacySettings;
    return settingsUtils.hasChanges(defaultSettings, settings);
  }, [settings]);
  
  const getPrivacyScore = useCallback((): number => {
    // Calculate privacy score based on settings (0-100)
    let score = 0;
    
    // Visibility settings (40 points)
    const visibilityValues = Object.values(settings.visibility);
    const privateCount = visibilityValues.filter(v => v === 'private').length;
    const followersCount = visibilityValues.filter(v => v === 'followers').length;
    score += (privateCount * 8) + (followersCount * 4);
    
    // Data settings (30 points)
    if (!settings.data.allowAnalytics) score += 10;
    if (!settings.data.allowPersonalization) score += 5;
    if (!settings.data.allowThirdPartyIntegration) score += 10;
    if (settings.data.dataRetentionPeriod <= 90) score += 5;
    
    // Security settings (30 points)
    if (settings.security.requireTwoFactor) score += 15;
    if (!settings.security.allowPasswordReset) score += 5;
    if (settings.security.sessionTimeout <= 24 * 60) score += 10;
    
    return Math.min(100, score);
  }, [settings]);
  
  const getAvailablePresets = useCallback((): PrivacyLevel[] => {
    return config.enablePresets ? Object.keys(PRIVACY_PRESETS) as PrivacyLevel[] : [];
  }, [config.enablePresets]);
  
  // ============================================================================
  // Effects
  // ============================================================================
  
  // Initial load
  useEffect(() => {
    loadSettings();
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [loadSettings]);
  
  // ============================================================================
  // Return Hook Interface
  // ============================================================================
  
  return {
    // State
    settings,
    isLoading,
    isSaving,
    hasUnsavedChanges,
    errors,
    warnings,
    currentPreset,
    
    // Actions
    loadSettings,
    saveSettings,
    updateVisibility,
    updateData,
    updateSecurity,
    applyPreset,
    resetToDefaults,
    clearErrors,
    dismissWarnings,
    
    // Utilities
    hasChanges,
    getPrivacyScore,
    getAvailablePresets,
  };
}

export default usePrivacySettings;