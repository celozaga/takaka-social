// ============================================================================
// Settings Module - useAccountSettings Hook
// ============================================================================
//
// This hook provides specialized functionality for managing account settings,
// including profile information, contact details, and account preferences.
//

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  AccountSettings,
  UseAccountSettingsReturn,
  ProfileSettings,
  ContactSettings,
  AccountPreferences,
} from '../types';
import { settingsUtils, settingsValidators } from '../utils';
import { defaultApiClient } from '../../../core/api';

// ============================================================================
// Types
// ============================================================================

interface UseAccountSettingsOptions {
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
   * Enable real-time validation
   * @default true
   */
  enableValidation?: boolean;
  
  /**
   * Validate handle availability in real-time
   * @default true
   */
  validateHandleAvailability?: boolean;
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_OPTIONS: Required<UseAccountSettingsOptions> = {
  autoSave: true,
  saveDelay: 2000,
  enableCache: true,
  enableValidation: true,
  validateHandleAvailability: true,
};

const CACHE_KEY = 'settings_account';

// ============================================================================
// Main Hook
// ============================================================================

export function useAccountSettings(options: UseAccountSettingsOptions = {}): UseAccountSettingsReturn {
  const config = { ...DEFAULT_OPTIONS, ...options };
  
  // ============================================================================
  // State Management
  // ============================================================================
  
  const [settings, setSettings] = useState<AccountSettings>(
    settingsUtils.getDefaultSettings('account') as AccountSettings
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [errors, setErrors] = useState<Record<string, Error>>({});
  const [validationState, setValidationState] = useState<Record<string, boolean>>({});
  const [handleAvailability, setHandleAvailability] = useState<{
    isChecking: boolean;
    isAvailable: boolean | null;
    lastChecked: string;
  }>({ isChecking: false, isAvailable: null, lastChecked: '' });
  
  // ============================================================================
  // Refs
  // ============================================================================
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const handleCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // ============================================================================
  // Cache Management
  // ============================================================================
  
  const loadFromCache = useCallback((): AccountSettings | null => {
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
      console.warn('Failed to load account settings from cache:', error);
      return null;
    }
  }, [config.enableCache]);
  
  const saveToCache = useCallback((accountSettings: AccountSettings): void => {
    if (!config.enableCache) return;
    
    try {
      const cacheData = {
        settings: accountSettings,
        timestamp: Date.now(),
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Failed to save account settings to cache:', error);
    }
  }, [config.enableCache]);
  
  // ============================================================================
  // Validation Functions
  // ============================================================================
  
  const validateField = useCallback((field: string, value: any): boolean => {
    if (!config.enableValidation) return true;
    
    try {
      switch (field) {
        case 'profile.displayName':
          return value && value.length >= 1 && value.length <= 50;
          
        case 'profile.handle':
          return settingsValidators.validateHandle(value);
          
        case 'profile.bio':
          return !value || value.length <= 300;
          
        case 'contact.email':
          return settingsValidators.validateEmail(value);
          
        case 'contact.phone':
          return !value || settingsValidators.validatePhone(value);
          
        case 'contact.website':
          return !value || settingsValidators.validateUrl(value);
          
        default:
          return true;
      }
    } catch (error) {
      console.error(`Validation error for field ${field}:`, error);
      return false;
    }
  }, [config.enableValidation]);
  
  const checkHandleAvailability = useCallback(async (handle: string): Promise<boolean> => {
    if (!config.validateHandleAvailability || !handle) return true;
    
    try {
      setHandleAvailability(prev => ({ ...prev, isChecking: true }));
      
      const response = await defaultApiClient.get(`/account/handle/check`, {
        params: { handle },
      });
      
      const isAvailable = response.data.available;
      
      setHandleAvailability({
        isChecking: false,
        isAvailable,
        lastChecked: handle,
      });
      
      return isAvailable;
      
    } catch (error) {
      console.error('Failed to check handle availability:', error);
      setHandleAvailability(prev => ({ ...prev, isChecking: false }));
      return false;
    }
  }, [config.validateHandleAvailability]);
  
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
        setIsLoading(false);
        return;
      }
      
      // Load from API
      const response = await defaultApiClient.get('/settings/account', {
        signal: abortControllerRef.current.signal,
      });
      
      const accountSettings = settingsUtils.mergeSettings(
        settingsUtils.getDefaultSettings('account'),
        response.data
      ) as AccountSettings;
      
      setSettings(accountSettings);
      saveToCache(accountSettings);
      
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('Failed to load account settings:', err);
        setErrors({ load: err as Error });
        
        // Fallback to cached data if available
        const cachedSettings = loadFromCache();
        if (cachedSettings) {
          setSettings(cachedSettings);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [loadFromCache, saveToCache]);
  
  const saveSettings = useCallback(async (): Promise<void> => {
    try {
      setIsSaving(true);
      setErrors(prev => ({ ...prev, save: undefined }));
      
      // Validate all fields before saving
      if (config.enableValidation) {
        const validationErrors: Record<string, Error> = {};
        
        if (!validateField('profile.displayName', settings.profile.displayName)) {
          validationErrors['profile.displayName'] = new Error('Display name is required and must be 1-50 characters');
        }
        
        if (!validateField('profile.handle', settings.profile.handle)) {
          validationErrors['profile.handle'] = new Error('Handle must be 3-30 characters and contain only letters, numbers, dots, underscores, and hyphens');
        }
        
        if (!validateField('contact.email', settings.contact.email)) {
          validationErrors['contact.email'] = new Error('Please enter a valid email address');
        }
        
        if (Object.keys(validationErrors).length > 0) {
          setErrors(validationErrors);
          throw new Error('Validation failed');
        }
      }
      
      await defaultApiClient.put('/settings/account', settings);
      saveToCache(settings);
      setHasUnsavedChanges(false);
      
    } catch (err) {
      console.error('Failed to save account settings:', err);
      setErrors(prev => ({ ...prev, save: err as Error }));
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [settings, config.enableValidation, validateField, saveToCache]);
  
  // ============================================================================
  // Update Functions
  // ============================================================================
  
  const updateProfile = useCallback((updates: Partial<ProfileSettings>): void => {
    setSettings(prev => ({
      ...prev,
      profile: { ...prev.profile, ...updates },
    }));
    setHasUnsavedChanges(true);
    
    // Validate updated fields
    Object.entries(updates).forEach(([key, value]) => {
      const fieldPath = `profile.${key}`;
      const isValid = validateField(fieldPath, value);
      setValidationState(prev => ({ ...prev, [fieldPath]: isValid }));
      
      // Check handle availability with debounce
      if (key === 'handle' && config.validateHandleAvailability) {
        if (handleCheckTimeoutRef.current) {
          clearTimeout(handleCheckTimeoutRef.current);
        }
        
        handleCheckTimeoutRef.current = setTimeout(() => {
          checkHandleAvailability(value as string);
        }, 1000);
      }
    });
    
    // Auto-save with debounce
    if (config.autoSave) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      saveTimeoutRef.current = setTimeout(() => {
        saveSettings().catch(console.error);
      }, config.saveDelay);
    }
  }, [config.autoSave, config.saveDelay, config.validateHandleAvailability, validateField, checkHandleAvailability, saveSettings]);
  
  const updateContact = useCallback((updates: Partial<ContactSettings>): void => {
    setSettings(prev => ({
      ...prev,
      contact: { ...prev.contact, ...updates },
    }));
    setHasUnsavedChanges(true);
    
    // Validate updated fields
    Object.entries(updates).forEach(([key, value]) => {
      const fieldPath = `contact.${key}`;
      const isValid = validateField(fieldPath, value);
      setValidationState(prev => ({ ...prev, [fieldPath]: isValid }));
    });
    
    // Auto-save with debounce
    if (config.autoSave) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      saveTimeoutRef.current = setTimeout(() => {
        saveSettings().catch(console.error);
      }, config.saveDelay);
    }
  }, [config.autoSave, config.saveDelay, validateField, saveSettings]);
  
  const updatePreferences = useCallback((updates: Partial<AccountPreferences>): void => {
    setSettings(prev => ({
      ...prev,
      preferences: { ...prev.preferences, ...updates },
    }));
    setHasUnsavedChanges(true);
    
    // Auto-save with debounce
    if (config.autoSave) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      saveTimeoutRef.current = setTimeout(() => {
        saveSettings().catch(console.error);
      }, config.saveDelay);
    }
  }, [config.autoSave, config.saveDelay, saveSettings]);
  
  const resetToDefaults = useCallback((): void => {
    const defaultSettings = settingsUtils.getDefaultSettings('account') as AccountSettings;
    setSettings(defaultSettings);
    setHasUnsavedChanges(true);
    setValidationState({});
    setHandleAvailability({ isChecking: false, isAvailable: null, lastChecked: '' });
    
    if (config.autoSave) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      saveTimeoutRef.current = setTimeout(() => {
        saveSettings().catch(console.error);
      }, config.saveDelay);
    }
  }, [config.autoSave, config.saveDelay, saveSettings]);
  
  const clearErrors = useCallback((): void => {
    setErrors({});
  }, []);
  
  // ============================================================================
  // Utility Functions
  // ============================================================================
  
  const hasChanges = useCallback((): boolean => {
    const defaultSettings = settingsUtils.getDefaultSettings('account') as AccountSettings;
    return settingsUtils.hasChanges(defaultSettings, settings);
  }, [settings]);
  
  const isFieldValid = useCallback((field: string): boolean => {
    return validationState[field] !== false;
  }, [validationState]);
  
  const getFieldError = useCallback((field: string): string | null => {
    const error = errors[field];
    return error ? error.message : null;
  }, [errors]);
  
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
      if (handleCheckTimeoutRef.current) {
        clearTimeout(handleCheckTimeoutRef.current);
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
    
    // Validation
    validationState,
    handleAvailability,
    
    // Actions
    loadSettings,
    saveSettings,
    updateProfile,
    updateContact,
    updatePreferences,
    resetToDefaults,
    clearErrors,
    
    // Utilities
    hasChanges,
    isFieldValid,
    getFieldError,
    checkHandleAvailability,
  };
}

export default useAccountSettings;