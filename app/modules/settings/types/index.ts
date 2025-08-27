// ============================================================================
// Settings Module - Types
// ============================================================================
//
// This file defines all types and interfaces used throughout the settings
// module, including app preferences, account settings, privacy settings,
// and accessibility configurations.
//

// ============================================================================
// Core Settings Types
// ============================================================================

export type SettingsCategory = 
  | 'account'
  | 'privacy'
  | 'accessibility'
  | 'notifications'
  | 'moderation'
  | 'advanced'
  | 'appearance'
  | 'language'
  | 'feed';

export type ThemeMode = 'light' | 'dark' | 'system';
export type LanguageCode = 'en' | 'pt' | 'es' | 'fr' | 'de' | 'ja' | 'ko' | 'zh';
export type FontSize = 'small' | 'medium' | 'large' | 'extra-large';
export type AnimationLevel = 'none' | 'reduced' | 'normal' | 'enhanced';

// ============================================================================
// App Settings
// ============================================================================

export interface AppSettings {
  /**
   * App version and metadata
   */
  version: string;
  buildNumber: string;
  lastUpdated: string;
  
  /**
   * Theme and appearance settings
   */
  appearance: {
    theme: ThemeMode;
    accentColor: string;
    fontSize: FontSize;
    fontFamily: string;
    highContrast: boolean;
    reduceMotion: boolean;
    animationLevel: AnimationLevel;
  };
  
  /**
   * Language and localization
   */
  localization: {
    language: LanguageCode;
    region: string;
    dateFormat: string;
    timeFormat: '12h' | '24h';
    timezone: string;
  };
  
  /**
   * Performance and data settings
   */
  performance: {
    enableAnalytics: boolean;
    enableCrashReporting: boolean;
    enablePerformanceMonitoring: boolean;
    cacheSize: number;
    autoDownloadMedia: boolean;
    dataUsageOptimization: boolean;
  };
  
  /**
   * Developer settings
   */
  developer: {
    enableDebugMode: boolean;
    showPerformanceMetrics: boolean;
    enableExperimentalFeatures: boolean;
    logLevel: 'error' | 'warn' | 'info' | 'debug';
  };
}

// ============================================================================
// Account Settings
// ============================================================================

export interface AccountSettings {
  /**
   * Basic account information
   */
  profile: {
    displayName: string;
    handle: string;
    bio: string;
    avatar: string;
    banner: string;
    website: string;
    location: string;
  };
  
  /**
   * Contact information
   */
  contact: {
    email: string;
    emailVerified: boolean;
    phoneNumber?: string;
    phoneVerified: boolean;
  };
  
  /**
   * Security settings
   */
  security: {
    twoFactorEnabled: boolean;
    backupCodes: string[];
    trustedDevices: TrustedDevice[];
    loginHistory: LoginHistoryEntry[];
    passwordLastChanged: string;
  };
  
  /**
   * Account preferences
   */
  preferences: {
    profileVisibility: 'public' | 'followers' | 'private';
    allowDirectMessages: 'everyone' | 'followers' | 'none';
    allowMentions: 'everyone' | 'followers' | 'none';
    allowTagging: boolean;
    showOnlineStatus: boolean;
    indexable: boolean;
  };
}

export interface TrustedDevice {
  id: string;
  name: string;
  type: 'mobile' | 'desktop' | 'tablet';
  os: string;
  browser?: string;
  lastUsed: string;
  location?: string;
  current: boolean;
}

export interface LoginHistoryEntry {
  id: string;
  timestamp: string;
  ipAddress: string;
  location?: string;
  device: string;
  success: boolean;
  method: 'password' | '2fa' | 'oauth';
}

// ============================================================================
// Privacy Settings
// ============================================================================

export interface PrivacySettings {
  /**
   * Content visibility
   */
  content: {
    defaultPostVisibility: 'public' | 'followers' | 'private';
    allowReposts: boolean;
    allowQuotes: boolean;
    allowReplies: 'everyone' | 'followers' | 'mentions';
    hideRepliesFromUnfollowed: boolean;
    requireApprovalForTags: boolean;
  };
  
  /**
   * Discovery and search
   */
  discovery: {
    discoverableByEmail: boolean;
    discoverableByPhone: boolean;
    showInSuggestions: boolean;
    allowSearchIndexing: boolean;
    showInDirectory: boolean;
  };
  
  /**
   * Data and analytics
   */
  data: {
    allowDataCollection: boolean;
    allowPersonalization: boolean;
    allowThirdPartyAnalytics: boolean;
    allowAdvertisingData: boolean;
    dataRetentionPeriod: number;
  };
  
  /**
   * External integrations
   */
  integrations: {
    allowThirdPartyApps: boolean;
    connectedApps: ConnectedApp[];
    dataSharing: DataSharingPreference[];
  };
}

export interface ConnectedApp {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  connectedAt: string;
  lastUsed: string;
  website: string;
  iconUrl: string;
}

export interface DataSharingPreference {
  service: string;
  enabled: boolean;
  dataTypes: string[];
  purpose: string;
}

// ============================================================================
// Accessibility Settings
// ============================================================================

export interface AccessibilitySettings {
  /**
   * Visual accessibility
   */
  visual: {
    highContrast: boolean;
    largeText: boolean;
    boldText: boolean;
    reduceTransparency: boolean;
    increaseButtonSize: boolean;
    showButtonShapes: boolean;
    colorBlindnessSupport: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
  };
  
  /**
   * Motor accessibility
   */
  motor: {
    reduceMotion: boolean;
    stickyKeys: boolean;
    slowKeys: boolean;
    bounceKeys: boolean;
    mouseKeys: boolean;
    clickAssistance: boolean;
    gestureAlternatives: boolean;
  };
  
  /**
   * Cognitive accessibility
   */
  cognitive: {
    simplifiedInterface: boolean;
    reducedAnimations: boolean;
    extendedTimeouts: boolean;
    confirmationDialogs: boolean;
    readingAssistance: boolean;
    focusIndicators: boolean;
  };
  
  /**
   * Screen reader support
   */
  screenReader: {
    enabled: boolean;
    verbosity: 'minimal' | 'normal' | 'verbose';
    announceNotifications: boolean;
    announceNavigation: boolean;
    announceContent: boolean;
    customLabels: Record<string, string>;
  };
}

// ============================================================================
// Moderation Settings
// ============================================================================

export interface ModerationSettings {
  /**
   * Content filtering
   */
  contentFiltering: {
    hideAdultContent: boolean;
    hideViolentContent: boolean;
    hideSensitiveContent: boolean;
    customContentWarnings: string[];
    autoHideReportedContent: boolean;
  };
  
  /**
   * User blocking and muting
   */
  userModeration: {
    blockedUsers: string[];
    mutedUsers: string[];
    mutedKeywords: string[];
    mutedHashtags: string[];
    temporaryMutes: TemporaryMute[];
  };
  
  /**
   * Automated moderation
   */
  automation: {
    autoBlockSpam: boolean;
    autoMuteNewAccounts: boolean;
    requireFollowerApproval: boolean;
    limitInteractionsFromNewAccounts: boolean;
    filterLowQualityReplies: boolean;
  };
  
  /**
   * Reporting and safety
   */
  safety: {
    enableSafetyMode: boolean;
    autoReportSuspiciousActivity: boolean;
    shareBlockLists: boolean;
    participateInCommunityModeration: boolean;
  };
}

export interface TemporaryMute {
  userId: string;
  reason: string;
  expiresAt: string;
  createdAt: string;
}

// ============================================================================
// Feed Settings
// ============================================================================

export interface FeedSettings {
  /**
   * Feed algorithm preferences
   */
  algorithm: {
    showRecommendations: boolean;
    showTrendingTopics: boolean;
    showPromotedContent: boolean;
    personalizeContent: boolean;
    diversityBoost: number;
    recencyWeight: number;
    engagementWeight: number;
  };
  
  /**
   * Content preferences
   */
  content: {
    showReposts: boolean;
    showQuotes: boolean;
    showReplies: boolean;
    showLikedPosts: boolean;
    hideSeenPosts: boolean;
    groupSimilarPosts: boolean;
  };
  
  /**
   * Media preferences
   */
  media: {
    autoPlayVideos: boolean;
    autoPlayGifs: boolean;
    showSensitiveMedia: boolean;
    downloadQuality: 'low' | 'medium' | 'high' | 'original';
    preloadImages: boolean;
  };
  
  /**
   * Custom feeds
   */
  customFeeds: CustomFeed[];
}

export interface CustomFeed {
  id: string;
  name: string;
  description: string;
  query: string;
  filters: FeedFilter[];
  sortBy: 'recent' | 'popular' | 'engagement';
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FeedFilter {
  type: 'keyword' | 'hashtag' | 'user' | 'language' | 'media';
  value: string;
  include: boolean;
}

// ============================================================================
// Settings State Management
// ============================================================================

export interface SettingsState {
  app: AppSettings;
  account: AccountSettings;
  privacy: PrivacySettings;
  accessibility: AccessibilitySettings;
  moderation: ModerationSettings;
  feed: FeedSettings;
  
  // State metadata
  isLoading: boolean;
  isSaving: boolean;
  lastSaved: string;
  hasUnsavedChanges: boolean;
  errors: Record<string, Error>;
}

// ============================================================================
// Settings Actions
// ============================================================================

export type SettingsAction = 
  | { type: 'LOAD_SETTINGS_START' }
  | { type: 'LOAD_SETTINGS_SUCCESS'; payload: Partial<SettingsState> }
  | { type: 'LOAD_SETTINGS_ERROR'; payload: Error }
  | { type: 'UPDATE_SETTINGS'; category: SettingsCategory; payload: any }
  | { type: 'SAVE_SETTINGS_START' }
  | { type: 'SAVE_SETTINGS_SUCCESS' }
  | { type: 'SAVE_SETTINGS_ERROR'; payload: Error }
  | { type: 'RESET_SETTINGS'; category?: SettingsCategory }
  | { type: 'CLEAR_ERRORS' };

// ============================================================================
// Hook Return Types
// ============================================================================

export interface UseSettingsReturn {
  // State
  settings: SettingsState;
  isLoading: boolean;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  errors: Record<string, Error>;
  
  // Actions
  loadSettings: () => Promise<void>;
  saveSettings: (category?: SettingsCategory) => Promise<void>;
  updateSettings: <T>(category: SettingsCategory, updates: Partial<T>) => void;
  resetSettings: (category?: SettingsCategory) => void;
  clearErrors: () => void;
  
  // Utilities
  getSettings: <T>(category: SettingsCategory) => T;
  hasChanges: (category?: SettingsCategory) => boolean;
  validateSettings: (category: SettingsCategory) => boolean;
}

export interface UseAccountSettingsReturn {
  // State
  settings: AccountSettings;
  isLoading: boolean;
  isSaving: boolean;
  error: Error | null;
  
  // Actions
  updateProfile: (updates: Partial<AccountSettings['profile']>) => Promise<void>;
  updateContact: (updates: Partial<AccountSettings['contact']>) => Promise<void>;
  updateSecurity: (updates: Partial<AccountSettings['security']>) => Promise<void>;
  updatePreferences: (updates: Partial<AccountSettings['preferences']>) => Promise<void>;
  
  // Security actions
  enableTwoFactor: () => Promise<void>;
  disableTwoFactor: () => Promise<void>;
  generateBackupCodes: () => Promise<string[]>;
  removeTrustedDevice: (deviceId: string) => Promise<void>;
  
  // Utilities
  validateEmail: (email: string) => boolean;
  validateHandle: (handle: string) => Promise<boolean>;
}

export interface UsePrivacySettingsReturn {
  // State
  settings: PrivacySettings;
  isLoading: boolean;
  isSaving: boolean;
  error: Error | null;
  
  // Actions
  updateContentSettings: (updates: Partial<PrivacySettings['content']>) => Promise<void>;
  updateDiscoverySettings: (updates: Partial<PrivacySettings['discovery']>) => Promise<void>;
  updateDataSettings: (updates: Partial<PrivacySettings['data']>) => Promise<void>;
  
  // App management
  connectApp: (appId: string, permissions: string[]) => Promise<void>;
  disconnectApp: (appId: string) => Promise<void>;
  updateAppPermissions: (appId: string, permissions: string[]) => Promise<void>;
  
  // Data management
  exportData: () => Promise<Blob>;
  deleteData: (dataTypes: string[]) => Promise<void>;
}

export interface UseAccessibilitySettingsReturn {
  // State
  settings: AccessibilitySettings;
  isLoading: boolean;
  isSaving: boolean;
  error: Error | null;
  
  // Actions
  updateVisualSettings: (updates: Partial<AccessibilitySettings['visual']>) => Promise<void>;
  updateMotorSettings: (updates: Partial<AccessibilitySettings['motor']>) => Promise<void>;
  updateCognitiveSettings: (updates: Partial<AccessibilitySettings['cognitive']>) => Promise<void>;
  updateScreenReaderSettings: (updates: Partial<AccessibilitySettings['screenReader']>) => Promise<void>;
  
  // Utilities
  applySystemSettings: () => Promise<void>;
  resetToDefaults: () => Promise<void>;
}

// ============================================================================
// Settings Validation
// ============================================================================

export interface SettingsValidationRule {
  field: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean | string;
}

export interface SettingsValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

// ============================================================================
// Settings Export/Import
// ============================================================================

export interface SettingsExport {
  version: string;
  exportedAt: string;
  settings: Partial<SettingsState>;
  metadata: {
    appVersion: string;
    platform: string;
    userId: string;
  };
}

export interface SettingsImportResult {
  success: boolean;
  imported: SettingsCategory[];
  skipped: SettingsCategory[];
  errors: Record<SettingsCategory, string>;
}

// ============================================================================
// Re-exports for Convenience
// ============================================================================

export type {
  // Core types
  SettingsCategory,
  ThemeMode,
  LanguageCode,
  FontSize,
  AnimationLevel,
  
  // Settings interfaces
  AppSettings,
  AccountSettings,
  PrivacySettings,
  AccessibilitySettings,
  ModerationSettings,
  FeedSettings,
  
  // State management
  SettingsState,
  SettingsAction,
  
  // Hook returns
  UseSettingsReturn,
  UseAccountSettingsReturn,
  UsePrivacySettingsReturn,
  UseAccessibilitySettingsReturn,
  
  // Utilities
  SettingsValidationRule,
  SettingsValidationResult,
  SettingsExport,
  SettingsImportResult,
};