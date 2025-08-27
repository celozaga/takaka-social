// ============================================================================
// Settings Module - Utilities
// ============================================================================
//
// This file contains utility functions for settings management, validation,
// formatting, and data processing.
//

import {
  SettingsCategory,
  SettingsState,
  AppSettings,
  AccountSettings,
  PrivacySettings,
  AccessibilitySettings,
  ModerationSettings,
  FeedSettings,
  SettingsValidationRule,
  SettingsValidationResult,
  SettingsExport,
  SettingsImportResult,
  ThemeMode,
  LanguageCode,
  FontSize,
} from '../types';

// ============================================================================
// Settings Validation
// ============================================================================

export const settingsValidators = {
  /**
   * Validate email format
   */
  validateEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },
  
  /**
   * Validate handle format
   */
  validateHandle: (handle: string): boolean => {
    const handleRegex = /^[a-zA-Z0-9._-]{3,30}$/;
    return handleRegex.test(handle);
  },
  
  /**
   * Validate URL format
   */
  validateUrl: (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },
  
  /**
   * Validate phone number format
   */
  validatePhoneNumber: (phone: string): boolean => {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phone.replace(/[\s()-]/g, ''));
  },
  
  /**
   * Validate password strength
   */
  validatePassword: (password: string): { isValid: boolean; score: number; feedback: string[] } => {
    const feedback: string[] = [];
    let score = 0;
    
    if (password.length >= 8) score += 1;
    else feedback.push('Password must be at least 8 characters long');
    
    if (/[a-z]/.test(password)) score += 1;
    else feedback.push('Password must contain lowercase letters');
    
    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push('Password must contain uppercase letters');
    
    if (/\d/.test(password)) score += 1;
    else feedback.push('Password must contain numbers');
    
    if (/[^\w\s]/.test(password)) score += 1;
    else feedback.push('Password must contain special characters');
    
    return {
      isValid: score >= 4,
      score,
      feedback,
    };
  },
  
  /**
   * Validate settings using rules
   */
  validateWithRules: (data: any, rules: SettingsValidationRule[]): SettingsValidationResult => {
    const errors: Record<string, string> = {};
    
    for (const rule of rules) {
      const value = data[rule.field];
      
      if (rule.required && (value === undefined || value === null || value === '')) {
        errors[rule.field] = `${rule.field} is required`;
        continue;
      }
      
      if (value && typeof value === 'string') {
        if (rule.minLength && value.length < rule.minLength) {
          errors[rule.field] = `${rule.field} must be at least ${rule.minLength} characters`;
          continue;
        }
        
        if (rule.maxLength && value.length > rule.maxLength) {
          errors[rule.field] = `${rule.field} must be no more than ${rule.maxLength} characters`;
          continue;
        }
        
        if (rule.pattern && !rule.pattern.test(value)) {
          errors[rule.field] = `${rule.field} format is invalid`;
          continue;
        }
      }
      
      if (rule.custom) {
        const result = rule.custom(value);
        if (typeof result === 'string') {
          errors[rule.field] = result;
        } else if (!result) {
          errors[rule.field] = `${rule.field} is invalid`;
        }
      }
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  },
};

// ============================================================================
// Settings Formatters
// ============================================================================

export const settingsFormatters = {
  /**
   * Format display name
   */
  formatDisplayName: (name: string): string => {
    return name.trim().replace(/\s+/g, ' ');
  },
  
  /**
   * Format handle
   */
  formatHandle: (handle: string): string => {
    return handle.toLowerCase().replace(/[^a-z0-9._-]/g, '');
  },
  
  /**
   * Format phone number
   */
  formatPhoneNumber: (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    if (cleaned.length === 11 && cleaned[0] === '1') {
      return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
    return phone;
  },
  
  /**
   * Format file size
   */
  formatFileSize: (bytes: number): string => {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  },
  
  /**
   * Format date for settings
   */
  formatSettingsDate: (date: string | Date): string => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  },
  
  /**
   * Format privacy level
   */
  formatPrivacyLevel: (level: string): string => {
    const levels: Record<string, string> = {
      public: 'Public',
      followers: 'Followers Only',
      private: 'Private',
      none: 'Disabled',
    };
    return levels[level] || level;
  },
};

// ============================================================================
// Settings Utilities
// ============================================================================

export const settingsUtils = {
  /**
   * Get default settings for a category
   */
  getDefaultSettings: (category: SettingsCategory): any => {
    const defaults = {
      app: {
        version: '1.0.0',
        buildNumber: '1',
        lastUpdated: new Date().toISOString(),
        appearance: {
          theme: 'system' as ThemeMode,
          accentColor: '#1DA1F2',
          fontSize: 'medium' as FontSize,
          fontFamily: 'system',
          highContrast: false,
          reduceMotion: false,
          animationLevel: 'normal' as const,
        },
        localization: {
          language: 'en' as LanguageCode,
          region: 'US',
          dateFormat: 'MM/DD/YYYY',
          timeFormat: '12h' as const,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        performance: {
          enableAnalytics: true,
          enableCrashReporting: true,
          enablePerformanceMonitoring: false,
          cacheSize: 100,
          autoDownloadMedia: true,
          dataUsageOptimization: false,
        },
        developer: {
          enableDebugMode: false,
          showPerformanceMetrics: false,
          enableExperimentalFeatures: false,
          logLevel: 'error' as const,
        },
      } as AppSettings,
      
      account: {
        profile: {
          displayName: '',
          handle: '',
          bio: '',
          avatar: '',
          banner: '',
          website: '',
          location: '',
        },
        contact: {
          email: '',
          emailVerified: false,
          phoneNumber: '',
          phoneVerified: false,
        },
        security: {
          twoFactorEnabled: false,
          backupCodes: [],
          trustedDevices: [],
          loginHistory: [],
          passwordLastChanged: new Date().toISOString(),
        },
        preferences: {
          profileVisibility: 'public' as const,
          allowDirectMessages: 'followers' as const,
          allowMentions: 'everyone' as const,
          allowTagging: true,
          showOnlineStatus: true,
          indexable: true,
        },
      } as AccountSettings,
      
      privacy: {
        content: {
          defaultPostVisibility: 'public' as const,
          allowReposts: true,
          allowQuotes: true,
          allowReplies: 'everyone' as const,
          hideRepliesFromUnfollowed: false,
          requireApprovalForTags: false,
        },
        discovery: {
          discoverableByEmail: false,
          discoverableByPhone: false,
          showInSuggestions: true,
          allowSearchIndexing: true,
          showInDirectory: true,
        },
        data: {
          allowDataCollection: true,
          allowPersonalization: true,
          allowThirdPartyAnalytics: false,
          allowAdvertisingData: false,
          dataRetentionPeriod: 365,
        },
        integrations: {
          allowThirdPartyApps: true,
          connectedApps: [],
          dataSharing: [],
        },
      } as PrivacySettings,
      
      accessibility: {
        visual: {
          highContrast: false,
          largeText: false,
          boldText: false,
          reduceTransparency: false,
          increaseButtonSize: false,
          showButtonShapes: false,
          colorBlindnessSupport: 'none' as const,
        },
        motor: {
          reduceMotion: false,
          stickyKeys: false,
          slowKeys: false,
          bounceKeys: false,
          mouseKeys: false,
          clickAssistance: false,
          gestureAlternatives: false,
        },
        cognitive: {
          simplifiedInterface: false,
          reducedAnimations: false,
          extendedTimeouts: false,
          confirmationDialogs: true,
          readingAssistance: false,
          focusIndicators: true,
        },
        screenReader: {
          enabled: false,
          verbosity: 'normal' as const,
          announceNotifications: true,
          announceNavigation: true,
          announceContent: true,
          customLabels: {},
        },
      } as AccessibilitySettings,
      
      moderation: {
        contentFiltering: {
          hideAdultContent: true,
          hideViolentContent: true,
          hideSensitiveContent: false,
          customContentWarnings: [],
          autoHideReportedContent: true,
        },
        userModeration: {
          blockedUsers: [],
          mutedUsers: [],
          mutedKeywords: [],
          mutedHashtags: [],
          temporaryMutes: [],
        },
        automation: {
          autoBlockSpam: true,
          autoMuteNewAccounts: false,
          requireFollowerApproval: false,
          limitInteractionsFromNewAccounts: false,
          filterLowQualityReplies: true,
        },
        safety: {
          enableSafetyMode: false,
          autoReportSuspiciousActivity: false,
          shareBlockLists: false,
          participateInCommunityModeration: false,
        },
      } as ModerationSettings,
      
      feed: {
        algorithm: {
          showRecommendations: true,
          showTrendingTopics: true,
          showPromotedContent: false,
          personalizeContent: true,
          diversityBoost: 0.3,
          recencyWeight: 0.4,
          engagementWeight: 0.6,
        },
        content: {
          showReposts: true,
          showQuotes: true,
          showReplies: true,
          showLikedPosts: false,
          hideSeenPosts: false,
          groupSimilarPosts: true,
        },
        media: {
          autoPlayVideos: false,
          autoPlayGifs: true,
          showSensitiveMedia: false,
          downloadQuality: 'medium' as const,
          preloadImages: true,
        },
        customFeeds: [],
      } as FeedSettings,
    };
    
    return defaults[category];
  },
  
  /**
   * Deep merge settings objects
   */
  mergeSettings: <T>(target: T, source: Partial<T>): T => {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] !== undefined) {
        if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
          result[key] = settingsUtils.mergeSettings(result[key] || {}, source[key] as any);
        } else {
          result[key] = source[key] as any;
        }
      }
    }
    
    return result;
  },
  
  /**
   * Compare settings for changes
   */
  hasChanges: (original: any, current: any): boolean => {
    return JSON.stringify(original) !== JSON.stringify(current);
  },
  
  /**
   * Get changed fields between settings
   */
  getChangedFields: (original: any, current: any, prefix = ''): string[] => {
    const changes: string[] = [];
    
    for (const key in current) {
      const fieldPath = prefix ? `${prefix}.${key}` : key;
      
      if (typeof current[key] === 'object' && current[key] !== null && !Array.isArray(current[key])) {
        changes.push(...settingsUtils.getChangedFields(original[key] || {}, current[key], fieldPath));
      } else if (original[key] !== current[key]) {
        changes.push(fieldPath);
      }
    }
    
    return changes;
  },
  
  /**
   * Sanitize settings data
   */
  sanitizeSettings: <T>(settings: T): T => {
    const sanitized = JSON.parse(JSON.stringify(settings));
    
    // Remove sensitive data
    const removeSensitiveData = (obj: any): any => {
      for (const key in obj) {
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          removeSensitiveData(obj[key]);
        } else if (key.toLowerCase().includes('password') || key.toLowerCase().includes('token')) {
          delete obj[key];
        }
      }
      return obj;
    };
    
    return removeSensitiveData(sanitized);
  },
  
  /**
   * Generate settings cache key
   */
  getCacheKey: (category: SettingsCategory, userId?: string): string => {
    return `settings:${category}${userId ? `:${userId}` : ''}`;
  },
  
  /**
   * Check if cache is valid
   */
  isCacheValid: (timestamp: number, maxAge: number): boolean => {
    return Date.now() - timestamp < maxAge;
  },
};

// ============================================================================
// Settings Export/Import
// ============================================================================

export const settingsExportImport = {
  /**
   * Export settings to JSON
   */
  exportSettings: (settings: Partial<SettingsState>, metadata: any): SettingsExport => {
    return {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      settings: settingsUtils.sanitizeSettings(settings),
      metadata,
    };
  },
  
  /**
   * Import settings from JSON
   */
  importSettings: (exportData: SettingsExport, currentSettings: SettingsState): SettingsImportResult => {
    const result: SettingsImportResult = {
      success: false,
      imported: [],
      skipped: [],
      errors: {},
    };
    
    try {
      // Validate export format
      if (!exportData.version || !exportData.settings) {
        throw new Error('Invalid export format');
      }
      
      // Import each category
      const categories: SettingsCategory[] = ['app', 'account', 'privacy', 'accessibility', 'moderation', 'feed'];
      
      for (const category of categories) {
        try {
          if (exportData.settings[category]) {
            // Validate imported settings
            const defaultSettings = settingsUtils.getDefaultSettings(category);
            const importedSettings = settingsUtils.mergeSettings(defaultSettings, exportData.settings[category]);
            
            // Apply imported settings
            currentSettings[category] = importedSettings;
            result.imported.push(category);
          } else {
            result.skipped.push(category);
          }
        } catch (error) {
          result.errors[category] = error instanceof Error ? error.message : 'Import failed';
          result.skipped.push(category);
        }
      }
      
      result.success = result.imported.length > 0;
    } catch (error) {
      result.errors.general = error instanceof Error ? error.message : 'Import failed';
    }
    
    return result;
  },
  
  /**
   * Validate export data
   */
  validateExportData: (data: any): boolean => {
    return (
      data &&
      typeof data === 'object' &&
      data.version &&
      data.settings &&
      typeof data.settings === 'object'
    );
  },
};

// ============================================================================
// Settings Search and Filtering
// ============================================================================

export const settingsSearch = {
  /**
   * Search settings by keyword
   */
  searchSettings: (settings: SettingsState, query: string): any[] => {
    const results: any[] = [];
    const searchTerm = query.toLowerCase();
    
    const searchObject = (obj: any, path: string[] = []): void => {
      for (const key in obj) {
        const currentPath = [...path, key];
        const value = obj[key];
        
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          searchObject(value, currentPath);
        } else {
          const keyMatch = key.toLowerCase().includes(searchTerm);
          const valueMatch = String(value).toLowerCase().includes(searchTerm);
          
          if (keyMatch || valueMatch) {
            results.push({
              path: currentPath.join('.'),
              key,
              value,
              category: path[0],
            });
          }
        }
      }
    };
    
    searchObject(settings);
    return results;
  },
  
  /**
   * Filter settings by category
   */
  filterByCategory: (settings: SettingsState, categories: SettingsCategory[]): Partial<SettingsState> => {
    const filtered: Partial<SettingsState> = {};
    
    for (const category of categories) {
      if (settings[category]) {
        filtered[category] = settings[category];
      }
    }
    
    return filtered;
  },
  
  /**
   * Get settings suggestions
   */
  getSettingsSuggestions: (query: string): string[] => {
    const suggestions = [
      'theme', 'dark mode', 'notifications', 'privacy', 'security',
      'accessibility', 'language', 'font size', 'email', 'password',
      'two factor', 'blocked users', 'muted words', 'feed algorithm',
      'auto play', 'data usage', 'analytics', 'location', 'profile',
    ];
    
    return suggestions.filter(suggestion => 
      suggestion.toLowerCase().includes(query.toLowerCase())
    );
  },
};

// ============================================================================
// Settings Analytics
// ============================================================================

export const settingsAnalytics = {
  /**
   * Get settings usage statistics
   */
  getUsageStats: (settings: SettingsState): Record<string, any> => {
    return {
      totalSettings: Object.keys(settings).length,
      modifiedSettings: Object.keys(settings).filter(key => 
        settingsUtils.hasChanges(
          settingsUtils.getDefaultSettings(key as SettingsCategory),
          settings[key as SettingsCategory]
        )
      ).length,
      lastModified: settings.lastSaved,
      categories: {
        app: Object.keys(settings.app || {}).length,
        account: Object.keys(settings.account || {}).length,
        privacy: Object.keys(settings.privacy || {}).length,
        accessibility: Object.keys(settings.accessibility || {}).length,
        moderation: Object.keys(settings.moderation || {}).length,
        feed: Object.keys(settings.feed || {}).length,
      },
    };
  },
  
  /**
   * Track settings changes
   */
  trackChange: (category: SettingsCategory, field: string, oldValue: any, newValue: any): void => {
    // This would integrate with analytics service
    console.log('Settings change tracked:', {
      category,
      field,
      oldValue,
      newValue,
      timestamp: new Date().toISOString(),
    });
  },
};

// ============================================================================
// Export All Utilities
// ============================================================================

export default {
  validators: settingsValidators,
  formatters: settingsFormatters,
  utils: settingsUtils,
  exportImport: settingsExportImport,
  search: settingsSearch,
  analytics: settingsAnalytics,
};