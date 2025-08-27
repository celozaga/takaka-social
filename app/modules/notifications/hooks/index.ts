// ============================================================================
// Notifications Module - Hooks Index
// ============================================================================
//
// This file centralizes all notification-related hooks exports for easy
// importing and better organization.
//

// ============================================================================
// Hook Exports
// ============================================================================

export { useNotifications, type UseNotificationsOptions, type UseNotificationsReturn } from './useNotifications';
export { useUnreadCount, type UseUnreadCountReturn } from './useUnreadCount';
export { usePushNotifications, type UsePushNotificationsOptions, type UsePushNotificationsReturn } from './usePushNotifications';
export { useNotificationPreferences, type UseNotificationPreferencesReturn } from './useNotificationPreferences';

// ============================================================================
// Re-export Common Types
// ============================================================================

export type {
  NotificationData,
  NotificationType,
  NotificationPriority,
  NotificationStatus,
  NotificationPreferences,
  NotificationFilters,
  NotificationSort,
  PushNotificationPayload,
  PushSubscription,
} from '../types';

// ============================================================================
// Hook Configuration Types
// ============================================================================

export interface NotificationHooksConfig {
  /**
   * Default auto-refresh interval for notifications
   * @default 30000 (30 seconds)
   */
  defaultRefreshInterval?: number;
  
  /**
   * Default cache duration for notifications
   * @default 300000 (5 minutes)
   */
  defaultCacheDuration?: number;
  
  /**
   * Default page size for notification pagination
   * @default 20
   */
  defaultPageSize?: number;
  
  /**
   * Enable real-time updates via EventSource
   * @default true
   */
  enableRealTimeUpdates?: boolean;
  
  /**
   * VAPID public key for push notifications
   */
  vapidPublicKey?: string;
  
  /**
   * Service worker path for push notifications
   * @default '/sw.js'
   */
  serviceWorkerPath?: string;
}

// ============================================================================
// Default Configuration
// ============================================================================

export const DEFAULT_NOTIFICATION_HOOKS_CONFIG: Required<NotificationHooksConfig> = {
  defaultRefreshInterval: 30000,
  defaultCacheDuration: 300000,
  defaultPageSize: 20,
  enableRealTimeUpdates: true,
  vapidPublicKey: '',
  serviceWorkerPath: '/sw.js',
};

// ============================================================================
// Hook Utilities
// ============================================================================

/**
 * Utility function to create notification hooks with shared configuration
 */
export function createNotificationHooks(config: NotificationHooksConfig = {}) {
  const mergedConfig = { ...DEFAULT_NOTIFICATION_HOOKS_CONFIG, ...config };
  
  return {
    useNotifications: (options: UseNotificationsOptions = {}) => {
      return useNotifications({
        refreshInterval: mergedConfig.defaultRefreshInterval,
        cacheDuration: mergedConfig.defaultCacheDuration,
        pageSize: mergedConfig.defaultPageSize,
        enableRealTime: mergedConfig.enableRealTimeUpdates,
        ...options,
      });
    },
    
    useUnreadCount: () => {
      return useUnreadCount({
        refreshInterval: mergedConfig.defaultRefreshInterval,
        cacheDuration: mergedConfig.defaultCacheDuration,
        enableRealTime: mergedConfig.enableRealTimeUpdates,
      });
    },
    
    usePushNotifications: (options: UsePushNotificationsOptions = {}) => {
      return usePushNotifications({
        vapidPublicKey: mergedConfig.vapidPublicKey,
        serviceWorkerPath: mergedConfig.serviceWorkerPath,
        ...options,
      });
    },
    
    useNotificationPreferences: () => {
      return useNotificationPreferences({
        cacheDuration: mergedConfig.defaultCacheDuration,
      });
    },
  };
}

// ============================================================================
// Hook Composition Utilities
// ============================================================================

/**
 * Combined hook that provides all notification functionality
 */
export function useNotificationSystem(config: NotificationHooksConfig = {}) {
  const hooks = createNotificationHooks(config);
  
  const notifications = hooks.useNotifications();
  const unreadCount = hooks.useUnreadCount();
  const pushNotifications = hooks.usePushNotifications();
  const preferences = hooks.useNotificationPreferences();
  
  return {
    notifications,
    unreadCount,
    pushNotifications,
    preferences,
    
    // Combined utilities
    isLoading: notifications.isLoading || unreadCount.isLoading || preferences.isLoading,
    hasError: !!(notifications.error || unreadCount.error || preferences.error),
    errors: {
      notifications: notifications.error,
      unreadCount: unreadCount.error,
      preferences: preferences.error,
    },
    
    // Combined actions
    refresh: async () => {
      await Promise.all([
        notifications.refresh(),
        unreadCount.refresh(),
        preferences.loadPreferences(),
      ]);
    },
    
    // Utility methods
    markAllAsRead: async () => {
      await notifications.markAllAsRead();
      unreadCount.reset();
    },
  };
}

// ============================================================================
// Export Types for Hook Composition
// ============================================================================

export type NotificationSystemReturn = ReturnType<typeof useNotificationSystem>;
export type NotificationHooksReturn = ReturnType<typeof createNotificationHooks>;