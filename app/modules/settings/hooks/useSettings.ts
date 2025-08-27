// ============================================================================
// Settings Module - useSettings Hook
// ============================================================================
//
// This hook provides comprehensive settings management functionality,
// including loading, saving, updating, and validating user settings
// across all categories.
//

import { useState, useEffect, useCallback, useRef, useReducer } from 'react';
import {
  SettingsState,
  SettingsCategory,
  SettingsAction,
  UseSettingsReturn,
  AppSettings,
  AccountSettings,
  PrivacySettings,
  AccessibilitySettings,
  ModerationSettings,
  FeedSettings,
} from '../types';
import { settingsUtils, settingsValidators } from '../utils';
import { defaultApiClient } from '../../../core/api';

// ============================================================================
// Types
// ============================================================================

interface UseSettingsOptions {
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
   * Cache duration in milliseconds
   * @default 600000 (10 minutes)
   */
  cacheDuration?: number;
  
  /**
   * Categories to load initially
   * @default ['app', 'account']
   */
  initialCategories?: SettingsCategory[];
  
  /**
   * Enable validation before saving
   * @default true
   */
  enableValidation?: boolean;
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_OPTIONS: Required<UseSettingsOptions> = {
  autoSave: true,
  saveDelay: 2000,
  enableCache: true,
  cacheDuration: 600000,
  initialCategories: ['app', 'account'],
  enableValidation: true,
};

const CACHE_KEY_PREFIX = 'settings';

// ============================================================================
// Settings Reducer
// ============================================================================

function settingsReducer(state: SettingsState, action: SettingsAction): SettingsState {
  switch (action.type) {
    case 'LOAD_SETTINGS_START':
      return {
        ...state,
        isLoading: true,
        errors: {},
      };
      
    case 'LOAD_SETTINGS_SUCCESS':
      return {
        ...state,
        ...action.payload,
        isLoading: false,
        errors: {},
      };
      
    case 'LOAD_SETTINGS_ERROR':
      return {
        ...state,
        isLoading: false,
        errors: {
          ...state.errors,
          load: action.payload,
        },
      };
      
    case 'UPDATE_SETTINGS':
      const updatedSettings = {
        ...state,
        [action.category]: settingsUtils.mergeSettings(
          state[action.category] || settingsUtils.getDefaultSettings(action.category),
          action.payload
        ),
        hasUnsavedChanges: true,
        errors: {
          ...state.errors,
          [action.category]: undefined,
        },
      };
      
      return updatedSettings;
      
    case 'SAVE_SETTINGS_START':
      return {
        ...state,
        isSaving: true,
        errors: {
          ...state.errors,
          save: undefined,
        },
      };
      
    case 'SAVE_SETTINGS_SUCCESS':
      return {
        ...state,
        isSaving: false,
        hasUnsavedChanges: false,
        lastSaved: new Date().toISOString(),
        errors: {
          ...state.errors,
          save: undefined,
        },
      };
      
    case 'SAVE_SETTINGS_ERROR':
      return {
        ...state,
        isSaving: false,
        errors: {
          ...state.errors,
          save: action.payload,
        },
      };
      
    case 'RESET_SETTINGS':
      if (action.category) {
        return {
          ...state,
          [action.category]: settingsUtils.getDefaultSettings(action.category),
          hasUnsavedChanges: true,
        };
      } else {
        return {
          ...state,
          app: settingsUtils.getDefaultSettings('app'),
          account: settingsUtils.getDefaultSettings('account'),
          privacy: settingsUtils.getDefaultSettings('privacy'),
          accessibility: settingsUtils.getDefaultSettings('accessibility'),
          moderation: settingsUtils.getDefaultSettings('moderation'),
          feed: settingsUtils.getDefaultSettings('feed'),
          hasUnsavedChanges: true,
        };
      }
      
    case 'CLEAR_ERRORS':
      return {
        ...state,
        errors: {},
      };
      
    default:
      return state;
  }
}

// ============================================================================
// Initial State
// ============================================================================

const getInitialState = (): SettingsState => ({
  app: settingsUtils.getDefaultSettings('app'),
  account: settingsUtils.getDefaultSettings('account'),
  privacy: settingsUtils.getDefaultSettings('privacy'),
  accessibility: settingsUtils.getDefaultSettings('accessibility'),
  moderation: settingsUtils.getDefaultSettings('moderation'),
  feed: settingsUtils.getDefaultSettings('feed'),
  isLoading: false,
  isSaving: false,
  lastSaved: '',
  hasUnsavedChanges: false,
  errors: {},
});

// ============================================================================
// Main Hook
// ============================================================================

export function useSettings(options: UseSettingsOptions = {}): UseSettingsReturn {
  const config = { ...DEFAULT_OPTIONS, ...options };
  
  // ============================================================================
  // State Management
  // ============================================================================
  
  const [state, dispatch] = useReducer(settingsReducer, getInitialState());
  const [loadedCategories, setLoadedCategories] = useState<Set<SettingsCategory>>(new Set());
  
  // ============================================================================
  // Refs
  // ============================================================================
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initialLoadRef = useRef(false);
  
  // ============================================================================
  // Cache Management
  // ============================================================================
  
  const getCacheKey = useCallback((category: SettingsCategory): string => {
    return settingsUtils.getCacheKey(category);
  }, []);
  
  const loadFromCache = useCallback((category: SettingsCategory): any | null => {
    if (!config.enableCache) return null;
    
    try {
      const cached = localStorage.getItem(getCacheKey(category));
      if (!cached) return null;
      
      const data = JSON.parse(cached);
      const age = Date.now() - (data.timestamp || 0);
      
      if (age > config.cacheDuration) {
        localStorage.removeItem(getCacheKey(category));
        return null;
      }
      
      return data.settings;
    } catch (error) {
      console.warn(`Failed to load ${category} settings from cache:`, error);
      return null;
    }
  }, [config.enableCache, config.cacheDuration, getCacheKey]);
  
  const saveToCache = useCallback((category: SettingsCategory, settings: any): void => {
    if (!config.enableCache) return;
    
    try {
      const cacheData = {
        settings,
        timestamp: Date.now(),
      };
      localStorage.setItem(getCacheKey(category), JSON.stringify(cacheData));
    } catch (error) {
      console.warn(`Failed to save ${category} settings to cache:`, error);
    }
  }, [config.enableCache, getCacheKey]);
  
  // ============================================================================
  // API Functions
  // ============================================================================
  
  const loadSettings = useCallback(async (categories?: SettingsCategory[]): Promise<void> => {
    const categoriesToLoad = categories || config.initialCategories;
    
    try {
      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      abortControllerRef.current = new AbortController();
      
      dispatch({ type: 'LOAD_SETTINGS_START' });
      
      const settingsData: Partial<SettingsState> = {};
      
      // Load each category
      for (const category of categoriesToLoad) {
        try {
          // Try cache first
          const cachedSettings = loadFromCache(category);
          if (cachedSettings && !initialLoadRef.current) {
            settingsData[category] = cachedSettings;
            setLoadedCategories(prev => new Set([...prev, category]));
            continue;
          }
          
          // Load from API
          const response = await defaultApiClient.get(`/settings/${category}`, {
            signal: abortControllerRef.current.signal,
          });
          
          const categorySettings = settingsUtils.mergeSettings(
            settingsUtils.getDefaultSettings(category),
            response.data
          );
          
          settingsData[category] = categorySettings;
          saveToCache(category, categorySettings);
          setLoadedCategories(prev => new Set([...prev, category]));
          
        } catch (err) {
          if (err instanceof Error && err.name !== 'AbortError') {
            console.error(`Failed to load ${category} settings:`, err);
            
            // Fallback to cached data if available
            const cachedSettings = loadFromCache(category);
            if (cachedSettings) {
              settingsData[category] = cachedSettings;
              setLoadedCategories(prev => new Set([...prev, category]));
            }
          }
        }
      }
      
      dispatch({ type: 'LOAD_SETTINGS_SUCCESS', payload: settingsData });
      
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('Failed to load settings:', err);
        dispatch({ type: 'LOAD_SETTINGS_ERROR', payload: err });
      }
    } finally {
      initialLoadRef.current = true;
    }
  }, [config.initialCategories, loadFromCache, saveToCache]);
  
  const saveSettings = useCallback(async (category?: SettingsCategory): Promise<void> => {
    try {
      dispatch({ type: 'SAVE_SETTINGS_START' });
      
      if (category) {
        // Save specific category
        const categorySettings = state[category];
        
        if (config.enableValidation) {
          const isValid = validateSettings(category);
          if (!isValid) {
            throw new Error(`Invalid ${category} settings`);
          }
        }
        
        await defaultApiClient.put(`/settings/${category}`, categorySettings);
        saveToCache(category, categorySettings);
        
      } else {
        // Save all categories
        const savePromises = Array.from(loadedCategories).map(async (cat) => {
          const categorySettings = state[cat];
          
          if (config.enableValidation) {
            const isValid = validateSettings(cat);
            if (!isValid) {
              throw new Error(`Invalid ${cat} settings`);
            }
          }
          
          await defaultApiClient.put(`/settings/${cat}`, categorySettings);
          saveToCache(cat, categorySettings);
        });
        
        await Promise.all(savePromises);
      }
      
      dispatch({ type: 'SAVE_SETTINGS_SUCCESS' });
      
    } catch (err) {
      console.error('Failed to save settings:', err);
      dispatch({ type: 'SAVE_SETTINGS_ERROR', payload: err as Error });
      throw err;
    }
  }, [state, loadedCategories, config.enableValidation, saveToCache]);
  
  // ============================================================================
  // Settings Update Functions
  // ============================================================================
  
  const updateSettings = useCallback(<T>(category: SettingsCategory, updates: Partial<T>): void => {
    dispatch({
      type: 'UPDATE_SETTINGS',
      category,
      payload: updates,
    });
    
    // Auto-save with debounce
    if (config.autoSave) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      saveTimeoutRef.current = setTimeout(() => {
        saveSettings(category).catch(console.error);
      }, config.saveDelay);
    }
  }, [config.autoSave, config.saveDelay, saveSettings]);
  
  const resetSettings = useCallback((category?: SettingsCategory): void => {
    dispatch({ type: 'RESET_SETTINGS', category });
    
    if (config.autoSave) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      saveTimeoutRef.current = setTimeout(() => {
        saveSettings(category).catch(console.error);
      }, config.saveDelay);
    }
  }, [config.autoSave, config.saveDelay, saveSettings]);
  
  const clearErrors = useCallback((): void => {
    dispatch({ type: 'CLEAR_ERRORS' });
  }, []);
  
  // ============================================================================
  // Utility Functions
  // ============================================================================
  
  const getSettings = useCallback(<T>(category: SettingsCategory): T => {
    return state[category] as T;
  }, [state]);
  
  const hasChanges = useCallback((category?: SettingsCategory): boolean => {
    if (category) {
      const defaultSettings = settingsUtils.getDefaultSettings(category);
      return settingsUtils.hasChanges(defaultSettings, state[category]);
    }
    return state.hasUnsavedChanges;
  }, [state]);
  
  const validateSettings = useCallback((category: SettingsCategory): boolean => {
    const categorySettings = state[category];
    
    // Basic validation rules for each category
    const validationRules = {
      account: [
        { field: 'profile.displayName', required: true, maxLength: 50 },
        { field: 'profile.handle', required: true, pattern: /^[a-zA-Z0-9._-]{3,30}$/ },
        { field: 'contact.email', required: true, custom: settingsValidators.validateEmail },
      ],
      privacy: [
        { field: 'data.dataRetentionPeriod', required: true, custom: (value: number) => value > 0 },
      ],
      // Add more validation rules as needed
    };
    
    const rules = validationRules[category as keyof typeof validationRules] || [];
    const result = settingsValidators.validateWithRules(categorySettings, rules);
    
    return result.isValid;
  }, [state]);
  
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
    settings: state,
    isLoading: state.isLoading,
    isSaving: state.isSaving,
    hasUnsavedChanges: state.hasUnsavedChanges,
    errors: state.errors,
    
    // Actions
    loadSettings,
    saveSettings,
    updateSettings,
    resetSettings,
    clearErrors,
    
    // Utilities
    getSettings,
    hasChanges,
    validateSettings,
  };
}

export default useSettings;