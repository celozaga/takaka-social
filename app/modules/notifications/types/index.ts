// ============================================================================
// Notifications Module - Type Definitions
// ============================================================================
//
// This file contains all TypeScript type definitions for the notifications module,
// including notification data structures, preferences, and hook return types.
//

import { ProfileData } from '../../profile/types';
import { PostData } from '../../post/types';

// ============================================================================
// Core Notification Types
// ============================================================================

/**
 * Types of notifications supported by the system
 */
export type NotificationType = 
  | 'like'
  | 'repost'
  | 'follow'
  | 'mention'
  | 'reply'
  | 'quote'
  | 'feed_generator_like'
  | 'starter_pack_joined'
  | 'label_created'
  | 'moderation_action'
  | 'system_announcement'
  | 'custom';

/**
 * Notification priority levels
 */
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

/**
 * Notification delivery methods
 */
export type NotificationDeliveryMethod = 'push' | 'email' | 'in_app' | 'sms';

/**
 * Notification read status
 */
export type NotificationStatus = 'unread' | 'read' | 'archived' | 'deleted';

/**
 * Core notification data structure
 */
export interface NotificationData {
  /** Unique identifier for the notification */
  id: string;
  
  /** Type of notification */
  type: NotificationType;
  
  /** Priority level */
  priority: NotificationPriority;
  
  /** Current status */
  status: NotificationStatus;
  
  /** Title of the notification */
  title: string;
  
  /** Main message content */
  message: string;
  
  /** Optional detailed description */
  description?: string;
  
  /** Profile that triggered the notification */
  actor: ProfileData;
  
  /** Related post (if applicable) */
  post?: PostData;
  
  /** Additional metadata */
  metadata?: Record<string, any>;
  
  /** Timestamp when notification was created */
  createdAt: string;
  
  /** Timestamp when notification was read */
  readAt?: string;
  
  /** Timestamp when notification expires */
  expiresAt?: string;
  
  /** Action buttons/links */
  actions?: NotificationAction[];
  
  /** Grouping key for similar notifications */
  groupKey?: string;
  
  /** Number of similar notifications grouped */
  groupCount?: number;
  
  /** Rich media attachments */
  attachments?: NotificationAttachment[];
}

/**
 * Notification action button
 */
export interface NotificationAction {
  /** Unique identifier */
  id: string;
  
  /** Display label */
  label: string;
  
  /** Action type */
  type: 'primary' | 'secondary' | 'destructive';
  
  /** URL to navigate to */
  url?: string;
  
  /** Custom action handler */
  handler?: string;
  
  /** Icon name */
  icon?: string;
}

/**
 * Notification attachment
 */
export interface NotificationAttachment {
  /** Attachment type */
  type: 'image' | 'video' | 'audio' | 'document';
  
  /** File URL */
  url: string;
  
  /** Alt text or description */
  alt?: string;
  
  /** Thumbnail URL */
  thumbnail?: string;
}

// ============================================================================
// Notification Preferences
// ============================================================================

/**
 * User notification preferences
 */
export interface NotificationPreferences {
  /** Global notification settings */
  global: {
    /** Enable all notifications */
    enabled: boolean;
    
    /** Quiet hours */
    quietHours: {
      enabled: boolean;
      startTime: string; // HH:mm format
      endTime: string; // HH:mm format
      timezone: string;
    };
    
    /** Delivery methods */
    deliveryMethods: NotificationDeliveryMethod[];
  };
  
  /** Per-type notification settings */
  types: Record<NotificationType, {
    enabled: boolean;
    priority: NotificationPriority;
    deliveryMethods: NotificationDeliveryMethod[];
    grouping: boolean;
    sound: boolean;
  }>;
  
  /** Push notification settings */
  push: {
    enabled: boolean;
    sound: boolean;
    vibration: boolean;
    badge: boolean;
    showPreview: boolean;
  };
  
  /** Email notification settings */
  email: {
    enabled: boolean;
    frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
    digest: boolean;
  };
  
  /** Privacy settings */
  privacy: {
    showSenderInfo: boolean;
    showContentPreview: boolean;
    allowFromFollowersOnly: boolean;
  };
}

// ============================================================================
// Notification Grouping and Filtering
// ============================================================================

/**
 * Notification group
 */
export interface NotificationGroup {
  /** Group identifier */
  key: string;
  
  /** Group type */
  type: NotificationType;
  
  /** Representative notification */
  representative: NotificationData;
  
  /** All notifications in group */
  notifications: NotificationData[];
  
  /** Total count */
  count: number;
  
  /** Latest notification timestamp */
  latestAt: string;
  
  /** Group read status */
  isRead: boolean;
}

/**
 * Notification filters
 */
export interface NotificationFilters {
  /** Filter by types */
  types?: NotificationType[];
  
  /** Filter by status */
  status?: NotificationStatus[];
  
  /** Filter by priority */
  priority?: NotificationPriority[];
  
  /** Filter by date range */
  dateRange?: {
    start: string;
    end: string;
  };
  
  /** Filter by actor */
  actorDid?: string;
  
  /** Search query */
  query?: string;
  
  /** Show grouped notifications */
  grouped?: boolean;
}

/**
 * Notification sort options
 */
export type NotificationSortBy = 'createdAt' | 'priority' | 'type' | 'status';
export type NotificationSortOrder = 'asc' | 'desc';

export interface NotificationSort {
  by: NotificationSortBy;
  order: NotificationSortOrder;
}

// ============================================================================
// Push Notification Types
// ============================================================================

/**
 * Push notification payload
 */
export interface PushNotificationPayload {
  /** Notification title */
  title: string;
  
  /** Notification body */
  body: string;
  
  /** Icon URL */
  icon?: string;
  
  /** Badge count */
  badge?: number;
  
  /** Sound file */
  sound?: string;
  
  /** Custom data */
  data?: Record<string, any>;
  
  /** Action buttons */
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  
  /** Notification tag for grouping */
  tag?: string;
  
  /** Require interaction */
  requireInteraction?: boolean;
  
  /** Silent notification */
  silent?: boolean;
}

/**
 * Push subscription data
 */
export interface PushSubscription {
  /** Subscription endpoint */
  endpoint: string;
  
  /** Subscription keys */
  keys: {
    p256dh: string;
    auth: string;
  };
  
  /** Device information */
  device?: {
    type: 'desktop' | 'mobile' | 'tablet';
    os: string;
    browser: string;
  };
  
  /** Subscription metadata */
  metadata?: {
    userAgent: string;
    createdAt: string;
    lastUsed: string;
  };
}

// ============================================================================
// Analytics and Metrics
// ============================================================================

/**
 * Notification analytics data
 */
export interface NotificationAnalytics {
  /** Total notifications sent */
  totalSent: number;
  
  /** Total notifications read */
  totalRead: number;
  
  /** Read rate percentage */
  readRate: number;
  
  /** Average time to read */
  averageTimeToRead: number;
  
  /** Breakdown by type */
  byType: Record<NotificationType, {
    sent: number;
    read: number;
    readRate: number;
  }>;
  
  /** Breakdown by delivery method */
  byDeliveryMethod: Record<NotificationDeliveryMethod, {
    sent: number;
    delivered: number;
    deliveryRate: number;
  }>;
  
  /** Time period */
  period: {
    start: string;
    end: string;
  };
}

/**
 * Notification metrics
 */
export interface NotificationMetrics {
  /** Unread count */
  unreadCount: number;
  
  /** Unread count by type */
  unreadByType: Record<NotificationType, number>;
  
  /** Unread count by priority */
  unreadByPriority: Record<NotificationPriority, number>;
  
  /** Last notification timestamp */
  lastNotificationAt?: string;
  
  /** Last read timestamp */
  lastReadAt?: string;
}

// ============================================================================
// State Management Types
// ============================================================================

/**
 * Notification state
 */
export interface NotificationState {
  /** All notifications */
  notifications: NotificationData[];
  
  /** Grouped notifications */
  groups: NotificationGroup[];
  
  /** Current filters */
  filters: NotificationFilters;
  
  /** Current sort */
  sort: NotificationSort;
  
  /** Loading state */
  isLoading: boolean;
  
  /** Error state */
  error: string | null;
  
  /** Pagination cursor */
  cursor?: string;
  
  /** Has more notifications */
  hasMore: boolean;
  
  /** Metrics */
  metrics: NotificationMetrics;
  
  /** Last sync timestamp */
  lastSyncAt?: string;
}

/**
 * Notification actions
 */
export type NotificationAction_State = 
  | { type: 'SET_NOTIFICATIONS'; payload: NotificationData[] }
  | { type: 'ADD_NOTIFICATION'; payload: NotificationData }
  | { type: 'UPDATE_NOTIFICATION'; payload: { id: string; updates: Partial<NotificationData> } }
  | { type: 'REMOVE_NOTIFICATION'; payload: string }
  | { type: 'MARK_AS_READ'; payload: string | string[] }
  | { type: 'MARK_ALL_AS_READ' }
  | { type: 'SET_FILTERS'; payload: NotificationFilters }
  | { type: 'SET_SORT'; payload: NotificationSort }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'UPDATE_METRICS'; payload: Partial<NotificationMetrics> }
  | { type: 'RESET_STATE' };

// ============================================================================
// Hook Return Types
// ============================================================================

/**
 * useNotifications hook options
 */
export interface UseNotificationsOptions {
  /** Auto-fetch on mount */
  autoFetch?: boolean;
  
  /** Polling interval in milliseconds */
  pollingInterval?: number;
  
  /** Initial filters */
  initialFilters?: NotificationFilters;
  
  /** Initial sort */
  initialSort?: NotificationSort;
  
  /** Enable grouping */
  enableGrouping?: boolean;
  
  /** Page size for pagination */
  pageSize?: number;
}

/**
 * useNotifications hook return type
 */
export interface UseNotificationsReturn {
  // State
  notifications: NotificationData[];
  groups: NotificationGroup[];
  isLoading: boolean;
  error: string | null;
  metrics: NotificationMetrics;
  filters: NotificationFilters;
  sort: NotificationSort;
  hasMore: boolean;
  
  // Actions
  fetchNotifications: (refresh?: boolean) => Promise<void>;
  loadMore: () => Promise<void>;
  markAsRead: (id: string | string[]) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  archiveNotification: (id: string) => Promise<void>;
  setFilters: (filters: NotificationFilters) => void;
  setSort: (sort: NotificationSort) => void;
  refresh: () => Promise<void>;
  
  // Computed values
  unreadCount: number;
  hasUnread: boolean;
  filteredNotifications: NotificationData[];
}

/**
 * useUnreadCount hook return type
 */
export interface UseUnreadCountReturn {
  // State
  count: number;
  countByType: Record<NotificationType, number>;
  countByPriority: Record<NotificationPriority, number>;
  isLoading: boolean;
  
  // Actions
  refresh: () => Promise<void>;
  
  // Computed values
  hasUnread: boolean;
  highPriorityCount: number;
}

/**
 * usePushNotifications hook return type
 */
export interface UsePushNotificationsReturn {
  // State
  isSupported: boolean;
  isSubscribed: boolean;
  subscription: PushSubscription | null;
  permission: NotificationPermission;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  requestPermission: () => Promise<boolean>;
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
  testNotification: () => Promise<void>;
  
  // Computed values
  canSubscribe: boolean;
  needsPermission: boolean;
}

/**
 * useNotificationPreferences hook return type
 */
export interface UseNotificationPreferencesReturn {
  // State
  preferences: NotificationPreferences;
  isLoading: boolean;
  error: string | null;
  hasChanges: boolean;
  
  // Actions
  updatePreferences: (updates: Partial<NotificationPreferences>) => void;
  savePreferences: () => Promise<void>;
  resetPreferences: () => void;
  exportPreferences: () => string;
  importPreferences: (data: string) => boolean;
  
  // Computed values
  enabledTypes: NotificationType[];
  disabledTypes: NotificationType[];
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Notification template
 */
export interface NotificationTemplate {
  /** Template identifier */
  id: string;
  
  /** Template name */
  name: string;
  
  /** Notification type */
  type: NotificationType;
  
  /** Title template */
  titleTemplate: string;
  
  /** Message template */
  messageTemplate: string;
  
  /** Template variables */
  variables: string[];
  
  /** Default values */
  defaults?: Record<string, any>;
}

/**
 * Notification queue item
 */
export interface NotificationQueueItem {
  /** Queue item ID */
  id: string;
  
  /** Notification data */
  notification: Omit<NotificationData, 'id' | 'createdAt'>;
  
  /** Scheduled delivery time */
  scheduledAt?: string;
  
  /** Retry count */
  retryCount: number;
  
  /** Max retries */
  maxRetries: number;
  
  /** Queue priority */
  priority: number;
}

// ============================================================================
// Re-exports for convenience
// ============================================================================

export type {
  // Core types
  NotificationData as Notification,
  NotificationPreferences as Preferences,
  NotificationGroup as Group,
  NotificationFilters as Filters,
  
  // Hook types
  UseNotificationsReturn as NotificationsHook,
  UseUnreadCountReturn as UnreadCountHook,
  UsePushNotificationsReturn as PushNotificationsHook,
};