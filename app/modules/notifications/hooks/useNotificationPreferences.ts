// ============================================================================
// Notifications Module - useNotificationPreferences Hook
// ============================================================================
//
// This hook manages user notification preferences, including settings for
// different notification types, delivery methods, and scheduling.
//

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  NotificationPreferences,
  NotificationType,
  NotificationPriority,
  NotificationDeliveryMethod,
  UseNotificationPreferencesReturn
} from '../types';
import { defaultApiClient } from '../../../core/api';

// ============================================================================
// Types
// ============================================================================

interface UseNotificationPreferencesOptions {
  /**
   * Auto-save preferences on change
   * @default true
   */
  autoSave?: boolean;
  
  /**
   * Debounce delay for auto-save in milliseconds
   * @default 1000
   */
  saveDelay?: number;
  
  /**
   * Enable local caching
   * @default true
   */
  enableCache?: boolean;
  
  /**
   * Cache duration in milliseconds
   * @default 300000 (5 minutes)
   */
  cacheDuration?: number;
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_OPTIONS: Required<UseNotificationPreferencesOptions> = {
  autoSave: true,
  saveDelay: 1000,
  enableCache: true,
  cacheDuration: 300000,
};

const DEFAULT_PREFERENCES: NotificationPreferences = {
  enabled: true,
  deliveryMethods: ['push', 'in_app'],
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '08:00',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  },
  typeSettings: {
    like: {
      enabled: true,
      priority: 'low',
      deliveryMethods: ['in_app'],
      grouping: true,
      sound: false,
    },
    repost: {
      enabled: true,
      priority: 'low',
      deliveryMethods: ['in_app'],
      grouping: true,
      sound: false,
    },
    follow: {
      enabled: true,
      priority: 'normal',
      deliveryMethods: ['push', 'in_app'],
      grouping: false,
      sound: true,
    },
    mention: {
      enabled: true,
      priority: 'high',
      deliveryMethods: ['push', 'in_app', 'email'],
      grouping: false,
      sound: true,
    },
    reply: {
      enabled: true,
      priority: 'high',
      deliveryMethods: ['push', 'in_app', 'email'],
      grouping: false,
      sound: true,
    },
    quote: {
      enabled: true,
      priority: 'normal',
      deliveryMethods: ['push', 'in_app'],
      grouping: false,
      sound: true,
    },
    feed_generator_like: {
      enabled: true,
      priority: 'low',
      deliveryMethods: ['in_app'],
      grouping: true,
      sound: false,
    },
    starter_pack_joined: {
      enabled: true,
      priority: 'normal',
      deliveryMethods: ['in_app'],
      grouping: true,
      sound: false,
    },
    label_created: {
      enabled: false,
      priority: 'low',
      deliveryMethods: ['in_app'],
      grouping: true,
      sound: false,
    },
    moderation_action: {
      enabled: true,
      priority: 'urgent',
      deliveryMethods: ['push', 'in_app', 'email'],
      grouping: false,
      sound: true,
    },
    system_announcement: {
      enabled: true,
      priority: 'high',
      deliveryMethods: ['push', 'in_app', 'email'],
      grouping: false,
      sound: true,
    },
    custom: {
      enabled: true,
      priority: 'normal',
      deliveryMethods: ['in_app'],
      grouping: false,
      sound: false,
    },
  },
  frequency: {
    immediate: ['mention', 'reply', 'moderation_action'],
    batched: ['like', 'repost', 'feed_generator_like'],
    daily: [],
    weekly: [],
  },
  filters: {
    mutedKeywords: [],
    mutedActors: [],
    minimumFollowerCount: 0,
    requireMutualFollow: false,
    blockUnverifiedAccounts: false,
  },
};

const CACHE_KEY = 'notifications:preferences';

// ============================================================================
// Main Hook
// ============================================================================

export function useNotificationPreferences(options: UseNotificationPreferencesOptions = {}): UseNotificationPreferencesReturn {
  const config = { ...DEFAULT_OPTIONS, ...options };
  
  // ============================================================================
  // State Management
  // ============================================================================
  
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // ============================================================================
  // Refs
  // ============================================================================
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initialLoadRef = useRef(false);
  
  // ============================================================================
  // Cache Management
  // ============================================================================
  
  const loadFromCache = useCallback((): NotificationPreferences | null => {
    if (!config.enableCache) return null;
    
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;
      
      const data = JSON.parse(cached);
      const age = Date.now() - (data.timestamp || 0);
      
      if (age > config.cacheDuration) {
        localStorage.removeItem(CACHE_KEY);
        return null;
      }
      
      return data.preferences;
    } catch (error) {
      console.warn('Failed to load preferences from cache:', error);
      return null;
    }
  }, [config.enableCache, config.cacheDuration]);
  
  const saveToCache = useCallback((prefs: NotificationPreferences): void => {
    if (!config.enableCache) return;
    
    try {
      const cacheData = {
        preferences: prefs,
        timestamp: Date.now(),
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Failed to save preferences to cache:', error);
    }
  }, [config.enableCache]);
  
  // ============================================================================
  // API Functions
  // ============================================================================
  
  const loadPreferences = useCallback(async (): Promise<void> => {
    try {
      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      abortControllerRef.current = new AbortController();
      
      setIsLoading(true);
      setError(null);
      
      // Try cache first
      const cachedPrefs = loadFromCache();
      if (cachedPrefs && !initialLoadRef.current) {
        setPreferences(cachedPrefs);
        setIsLoading(false);
        return;
      }
      
      // Load from API
      const response = await defaultApiClient.get('/notifications/preferences', {
        signal: abortControllerRef.current.signal,
      });
      
      const loadedPreferences = {
        ...DEFAULT_PREFERENCES,
        ...response.data,
      };
      
      setPreferences(loadedPreferences);
      saveToCache(loadedPreferences);
      setHasUnsavedChanges(false);
      
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('Failed to load notification preferences:', err);
        setError(err);
        
        // Fallback to cached data if available
        const cachedPrefs = loadFromCache();
        if (cachedPrefs) {
          setPreferences(cachedPrefs);
        }
      }
    } finally {
      setIsLoading(false);
      initialLoadRef.current = true;
    }
  }, [loadFromCache, saveToCache]);
  
  const savePreferences = useCallback(async (prefs?: NotificationPreferences): Promise<void> => {
    const prefsToSave = prefs || preferences;
    
    try {
      setIsSaving(true);
      setError(null);
      
      await defaultApiClient.put('/notifications/preferences', prefsToSave);
      
      saveToCache(prefsToSave);
      setHasUnsavedChanges(false);
      
    } catch (err) {
      console.error('Failed to save notification preferences:', err);
      setError(err as Error);
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [preferences, saveToCache]);
  
  // ============================================================================
  // Preference Update Functions
  // ============================================================================
  
  const updatePreferences = useCallback((updates: Partial<NotificationPreferences>): void => {
    setPreferences(prev => {
      const newPrefs = { ...prev, ...updates };
      setHasUnsavedChanges(true);
      
      // Auto-save with debounce
      if (config.autoSave) {
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }
        
        saveTimeoutRef.current = setTimeout(() => {
          savePreferences(newPrefs);
        }, config.saveDelay);
      }
      
      return newPrefs;
    });
  }, [config.autoSave, config.saveDelay, savePreferences]);
  
  const updateTypeSettings = useCallback((type: NotificationType, settings: Partial<NotificationPreferences['typeSettings'][NotificationType]>): void => {
    updatePreferences({
      typeSettings: {
        ...preferences.typeSettings,
        [type]: {
          ...preferences.typeSettings[type],
          ...settings,
        },
      },
    });
  }, [preferences.typeSettings, updatePreferences]);
  
  const toggleNotificationType = useCallback((type: NotificationType): void => {
    const currentSettings = preferences.typeSettings[type];
    updateTypeSettings(type, {
      enabled: !currentSettings.enabled,
    });
  }, [preferences.typeSettings, updateTypeSettings]);
  
  const updateDeliveryMethods = useCallback((methods: NotificationDeliveryMethod[]): void => {
    updatePreferences({ deliveryMethods: methods });
  }, [updatePreferences]);
  
  const updateQuietHours = useCallback((quietHours: Partial<NotificationPreferences['quietHours']>): void => {
    updatePreferences({
      quietHours: {
        ...preferences.quietHours,
        ...quietHours,
      },
    });
  }, [preferences.quietHours, updatePreferences]);
  
  const updateFilters = useCallback((filters: Partial<NotificationPreferences['filters']>): void => {
    updatePreferences({
      filters: {
        ...preferences.filters,
        ...filters,
      },
    });
  }, [preferences.filters, updatePreferences]);
  
  const addMutedKeyword = useCallback((keyword: string): void => {
    if (!preferences.filters.mutedKeywords.includes(keyword)) {
      updateFilters({
        mutedKeywords: [...preferences.filters.mutedKeywords, keyword],
      });
    }
  }, [preferences.filters.mutedKeywords, updateFilters]);
  
  const removeMutedKeyword = useCallback((keyword: string): void => {
    updateFilters({
      mutedKeywords: preferences.filters.mutedKeywords.filter(k => k !== keyword),
    });
  }, [preferences.filters.mutedKeywords, updateFilters]);
  
  const addMutedActor = useCallback((actorDid: string): void => {
    if (!preferences.filters.mutedActors.includes(actorDid)) {
      updateFilters({
        mutedActors: [...preferences.filters.mutedActors, actorDid],
      });
    }
  }, [preferences.filters.mutedActors, updateFilters]);
  
  const removeMutedActor = useCallback((actorDid: string): void => {
    updateFilters({
      mutedActors: preferences.filters.mutedActors.filter(did => did !== actorDid),
    });
  }, [preferences.filters.mutedActors, updateFilters]);
  
  // ============================================================================
  // Utility Functions
  // ============================================================================
  
  const resetToDefaults = useCallback((): void => {
    setPreferences(DEFAULT_PREFERENCES);
    setHasUnsavedChanges(true);
    
    if (config.autoSave) {
      savePreferences(DEFAULT_PREFERENCES);
    }
  }, [config.autoSave, savePreferences]);
  
  const isTypeEnabled = useCallback((type: NotificationType): boolean => {
    return preferences.enabled && preferences.typeSettings[type]?.enabled;
  }, [preferences.enabled, preferences.typeSettings]);
  
  const getTypeSettings = useCallback((type: NotificationType) => {
    return preferences.typeSettings[type];
  }, [preferences.typeSettings]);
  
  const isInQuietHours = useCallback((): boolean => {
    if (!preferences.quietHours.enabled) return false;
    
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
    
    const { start, end } = preferences.quietHours;
    
    // Handle overnight quiet hours (e.g., 22:00 to 08:00)
    if (start > end) {
      return currentTime >= start || currentTime <= end;
    }
    
    // Handle same-day quiet hours (e.g., 12:00 to 14:00)
    return currentTime >= start && currentTime <= end;
  }, [preferences.quietHours]);
  
  const shouldReceiveNotification = useCallback((type: NotificationType, method: NotificationDeliveryMethod): boolean => {
    if (!preferences.enabled) return false;
    if (!isTypeEnabled(type)) return false;
    if (isInQuietHours() && method === 'push') return false;
    
    const typeSettings = preferences.typeSettings[type];
    return typeSettings.deliveryMethods.includes(method);
  }, [preferences.enabled, isTypeEnabled, isInQuietHours, preferences.typeSettings]);
  
  // ============================================================================
  // Effects
  // ============================================================================
  
  // Initial load
  useEffect(() => {
    loadPreferences();
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [loadPreferences]);
  
  // ============================================================================
  // Return Hook Interface
  // ============================================================================
  
  return {
    // Data
    preferences,
    
    // State
    isLoading,
    isSaving,
    error,
    hasUnsavedChanges,
    
    // Actions
    loadPreferences,
    savePreferences,
    updatePreferences,
    updateTypeSettings,
    toggleNotificationType,
    updateDeliveryMethods,
    updateQuietHours,
    updateFilters,
    addMutedKeyword,
    removeMutedKeyword,
    addMutedActor,
    removeMutedActor,
    resetToDefaults,
    
    // Utilities
    isTypeEnabled,
    getTypeSettings,
    isInQuietHours,
    shouldReceiveNotification,
  };
}

export default useNotificationPreferences;