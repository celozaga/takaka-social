// ============================================================================
// Notifications Module
// ============================================================================
//
// This module handles all notification-related functionality including
// displaying notifications, managing notification preferences, and handling
// push notifications.
//

// ============================================================================
// Component Exports
// ============================================================================

export { NotificationsScreen } from './NotificationsScreen';
export { NotificationItem } from './NotificationItem';
// TODO: Create these components
// export { NotificationBadge } from './components/NotificationBadge';
// export { NotificationSettings } from './components/NotificationSettings';

// ============================================================================
// Hook Exports
// ============================================================================

export * from './hooks';

// ============================================================================
// Type Exports
// ============================================================================

export * from './types';

// ============================================================================
// Utility Exports
// ============================================================================

export * from './utils';

// ============================================================================
// Module Configuration
// ============================================================================

export const NOTIFICATIONS_MODULE_CONFIG = {
  name: 'notifications',
  version: '1.0.0',
  description: 'Comprehensive notification management system',
  
  features: [
    'Real-time notifications',
    'Push notification support',
    'Notification preferences',
    'Unread count tracking',
    'Notification filtering and sorting',
    'Quiet hours support',
    'Notification grouping',
    'Muted keywords and actors',
    'Notification analytics',
    'Offline notification caching',
  ],
  
  dependencies: {
    core: ['api', 'state', 'utils'],
    external: ['react', 'react-native'],
  },
  
  components: [
    'NotificationsScreen',
    'NotificationItem',
    'NotificationBadge',
    'NotificationSettings',
    'NotificationList',
    'NotificationFilters',
    'QuietHoursSettings',
    'PushNotificationSettings',
  ],
  
  hooks: [
    'useNotifications',
    'useUnreadCount',
    'usePushNotifications',
    'useNotificationPreferences',
    'useNotificationSystem',
  ],
  
  utils: [
    'notificationFormatters',
    'notificationFilters',
    'notificationSorters',
    'notificationGroupers',
    'notificationTemplates',
    'pushNotificationUtils',
    'notificationMetrics',
    'notificationCache',
  ],
  
  types: [
    'NotificationData',
    'NotificationType',
    'NotificationPriority',
    'NotificationStatus',
    'NotificationPreferences',
    'NotificationFilters',
    'NotificationSort',
    'PushNotificationPayload',
    'PushSubscription',
    'NotificationAnalytics',
    'NotificationMetrics',
  ],
} as const;