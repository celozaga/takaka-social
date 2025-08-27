// ============================================================================
// Notifications Module - Utility Functions
// ============================================================================
//
// This file contains utility functions for notification-related operations,
// including formatting, filtering, grouping, and template processing.
//

import { 
  NotificationData, 
  NotificationGroup, 
  NotificationFilters, 
  NotificationSort,
  NotificationType,
  NotificationPriority,
  NotificationStatus,
  NotificationPreferences,
  NotificationTemplate,
  PushNotificationPayload,
  NotificationMetrics
} from '../types';
import { ProfileData } from '../../profile/types';
import { PostData } from '../../post/types';

// ============================================================================
// Notification Formatting Utilities
// ============================================================================

export const notificationFormatters = {
  /**
   * Format notification title based on type and data
   */
  formatTitle: (notification: NotificationData): string => {
    const actorName = notification.actor.displayName || notification.actor.handle;
    
    switch (notification.type) {
      case 'like':
        return `${actorName} liked your post`;
      case 'repost':
        return `${actorName} reposted your post`;
      case 'follow':
        return `${actorName} started following you`;
      case 'mention':
        return `${actorName} mentioned you`;
      case 'reply':
        return `${actorName} replied to your post`;
      case 'quote':
        return `${actorName} quoted your post`;
      case 'feed_generator_like':
        return `${actorName} liked your feed`;
      case 'starter_pack_joined':
        return `${actorName} joined using your starter pack`;
      case 'label_created':
        return `New label created: ${notification.title}`;
      case 'moderation_action':
        return `Moderation action: ${notification.title}`;
      case 'system_announcement':
        return notification.title || 'System announcement';
      default:
        return notification.title || 'New notification';
    }
  },

  /**
   * Format notification message
   */
  formatMessage: (notification: NotificationData): string => {
    if (notification.message) {
      return notification.message;
    }

    const actorName = notification.actor.displayName || notification.actor.handle;
    const postText = notification.post?.record?.text;
    const truncatedText = postText ? (postText.length > 50 ? postText.slice(0, 50) + '...' : postText) : '';

    switch (notification.type) {
      case 'like':
        return truncatedText ? `"${truncatedText}"` : 'Your post was liked';
      case 'repost':
        return truncatedText ? `"${truncatedText}"` : 'Your post was reposted';
      case 'follow':
        return `@${notification.actor.handle} is now following you`;
      case 'mention':
        return truncatedText || 'You were mentioned in a post';
      case 'reply':
        return truncatedText || 'Someone replied to your post';
      case 'quote':
        return truncatedText || 'Your post was quoted';
      default:
        return notification.message || 'You have a new notification';
    }
  },

  /**
   * Format relative time
   */
  formatTime: (timestamp: string): string => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return time.toLocaleDateString();
  },

  /**
   * Format notification count
   */
  formatCount: (count: number): string => {
    if (count === 0) return '';
    if (count < 1000) return count.toString();
    if (count < 1000000) return `${(count / 1000).toFixed(1)}K`;
    return `${(count / 1000000).toFixed(1)}M`;
  },

  /**
   * Format priority label
   */
  formatPriority: (priority: NotificationPriority): string => {
    const labels = {
      low: 'Low',
      normal: 'Normal',
      high: 'High',
      urgent: 'Urgent',
    };
    return labels[priority];
  },

  /**
   * Format type label
   */
  formatType: (type: NotificationType): string => {
    const labels = {
      like: 'Like',
      repost: 'Repost',
      follow: 'Follow',
      mention: 'Mention',
      reply: 'Reply',
      quote: 'Quote',
      feed_generator_like: 'Feed Like',
      starter_pack_joined: 'Starter Pack',
      label_created: 'Label',
      moderation_action: 'Moderation',
      system_announcement: 'Announcement',
      custom: 'Custom',
    };
    return labels[type];
  },
};

// ============================================================================
// Notification Filtering Utilities
// ============================================================================

export const notificationFilters = {
  /**
   * Filter notifications by criteria
   */
  filterNotifications: (notifications: NotificationData[], filters: NotificationFilters): NotificationData[] => {
    return notifications.filter(notification => {
      // Filter by types
      if (filters.types && filters.types.length > 0) {
        if (!filters.types.includes(notification.type)) return false;
      }

      // Filter by status
      if (filters.status && filters.status.length > 0) {
        if (!filters.status.includes(notification.status)) return false;
      }

      // Filter by priority
      if (filters.priority && filters.priority.length > 0) {
        if (!filters.priority.includes(notification.priority)) return false;
      }

      // Filter by date range
      if (filters.dateRange) {
        const notificationDate = new Date(notification.createdAt);
        const startDate = new Date(filters.dateRange.start);
        const endDate = new Date(filters.dateRange.end);
        if (notificationDate < startDate || notificationDate > endDate) return false;
      }

      // Filter by actor
      if (filters.actorDid) {
        if (notification.actor.did !== filters.actorDid) return false;
      }

      // Filter by search query
      if (filters.query) {
        const query = filters.query.toLowerCase();
        const searchableText = [
          notification.title,
          notification.message,
          notification.description,
          notification.actor.displayName,
          notification.actor.handle,
          notification.post?.record?.text,
        ].filter(Boolean).join(' ').toLowerCase();
        
        if (!searchableText.includes(query)) return false;
      }

      return true;
    });
  },

  /**
   * Filter by unread status
   */
  filterUnread: (notifications: NotificationData[]): NotificationData[] => {
    return notifications.filter(notification => notification.status === 'unread');
  },

  /**
   * Filter by priority
   */
  filterByPriority: (notifications: NotificationData[], priority: NotificationPriority): NotificationData[] => {
    return notifications.filter(notification => notification.priority === priority);
  },

  /**
   * Filter by type
   */
  filterByType: (notifications: NotificationData[], type: NotificationType): NotificationData[] => {
    return notifications.filter(notification => notification.type === type);
  },

  /**
   * Filter recent notifications
   */
  filterRecent: (notifications: NotificationData[], hours = 24): NotificationData[] => {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return notifications.filter(notification => new Date(notification.createdAt) > cutoff);
  },
};

// ============================================================================
// Notification Sorting Utilities
// ============================================================================

export const notificationSorters = {
  /**
   * Sort notifications
   */
  sortNotifications: (notifications: NotificationData[], sort: NotificationSort): NotificationData[] => {
    const sorted = [...notifications].sort((a, b) => {
      let comparison = 0;

      switch (sort.by) {
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'priority':
          const priorityOrder = { urgent: 4, high: 3, normal: 2, low: 1 };
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
        case 'status':
          const statusOrder = { unread: 4, read: 3, archived: 2, deleted: 1 };
          comparison = statusOrder[a.status] - statusOrder[b.status];
          break;
        default:
          comparison = 0;
      }

      return sort.order === 'desc' ? -comparison : comparison;
    });

    return sorted;
  },

  /**
   * Sort by priority then date
   */
  sortByPriorityAndDate: (notifications: NotificationData[]): NotificationData[] => {
    return [...notifications].sort((a, b) => {
      const priorityOrder = { urgent: 4, high: 3, normal: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  },

  /**
   * Sort unread first
   */
  sortUnreadFirst: (notifications: NotificationData[]): NotificationData[] => {
    return [...notifications].sort((a, b) => {
      if (a.status === 'unread' && b.status !== 'unread') return -1;
      if (a.status !== 'unread' && b.status === 'unread') return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  },
};

// ============================================================================
// Notification Grouping Utilities
// ============================================================================

export const notificationGroupers = {
  /**
   * Group notifications by key
   */
  groupNotifications: (notifications: NotificationData[]): NotificationGroup[] => {
    const groups = new Map<string, NotificationData[]>();

    notifications.forEach(notification => {
      const key = notification.groupKey || `${notification.type}_${notification.actor.did}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(notification);
    });

    return Array.from(groups.entries()).map(([key, groupNotifications]) => {
      const representative = groupNotifications[0];
      const latestNotification = groupNotifications.reduce((latest, current) => 
        new Date(current.createdAt) > new Date(latest.createdAt) ? current : latest
      );

      return {
        key,
        type: representative.type,
        representative: latestNotification,
        notifications: groupNotifications,
        count: groupNotifications.length,
        latestAt: latestNotification.createdAt,
        isRead: groupNotifications.every(n => n.status === 'read'),
      };
    }).sort((a, b) => new Date(b.latestAt).getTime() - new Date(a.latestAt).getTime());
  },

  /**
   * Group by type
   */
  groupByType: (notifications: NotificationData[]): Record<NotificationType, NotificationData[]> => {
    const groups: Record<string, NotificationData[]> = {};
    
    notifications.forEach(notification => {
      if (!groups[notification.type]) {
        groups[notification.type] = [];
      }
      groups[notification.type].push(notification);
    });

    return groups as Record<NotificationType, NotificationData[]>;
  },

  /**
   * Group by actor
   */
  groupByActor: (notifications: NotificationData[]): Record<string, NotificationData[]> => {
    const groups: Record<string, NotificationData[]> = {};
    
    notifications.forEach(notification => {
      const actorDid = notification.actor.did;
      if (!groups[actorDid]) {
        groups[actorDid] = [];
      }
      groups[actorDid].push(notification);
    });

    return groups;
  },

  /**
   * Group by date
   */
  groupByDate: (notifications: NotificationData[]): Record<string, NotificationData[]> => {
    const groups: Record<string, NotificationData[]> = {};
    
    notifications.forEach(notification => {
      const date = new Date(notification.createdAt).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(notification);
    });

    return groups;
  },
};

// ============================================================================
// Notification Template Utilities
// ============================================================================

export const notificationTemplates = {
  /**
   * Process notification template
   */
  processTemplate: (template: NotificationTemplate, variables: Record<string, any>): { title: string; message: string } => {
    let title = template.titleTemplate;
    let message = template.messageTemplate;

    // Replace variables in templates
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      title = title.replace(new RegExp(placeholder, 'g'), String(value));
      message = message.replace(new RegExp(placeholder, 'g'), String(value));
    });

    // Replace with defaults if variables are missing
    if (template.defaults) {
      Object.entries(template.defaults).forEach(([key, value]) => {
        const placeholder = `{{${key}}}`;
        title = title.replace(new RegExp(placeholder, 'g'), String(value));
        message = message.replace(new RegExp(placeholder, 'g'), String(value));
      });
    }

    return { title, message };
  },

  /**
   * Get default templates
   */
  getDefaultTemplates: (): NotificationTemplate[] => {
    return [
      {
        id: 'like',
        name: 'Post Liked',
        type: 'like',
        titleTemplate: '{{actorName}} liked your post',
        messageTemplate: '"{{postText}}"',
        variables: ['actorName', 'postText'],
      },
      {
        id: 'follow',
        name: 'New Follower',
        type: 'follow',
        titleTemplate: '{{actorName}} started following you',
        messageTemplate: '@{{actorHandle}} is now following you',
        variables: ['actorName', 'actorHandle'],
      },
      {
        id: 'mention',
        name: 'Mentioned',
        type: 'mention',
        titleTemplate: '{{actorName}} mentioned you',
        messageTemplate: '"{{postText}}"',
        variables: ['actorName', 'postText'],
      },
      {
        id: 'reply',
        name: 'Reply',
        type: 'reply',
        titleTemplate: '{{actorName}} replied to your post',
        messageTemplate: '"{{replyText}}"',
        variables: ['actorName', 'replyText'],
      },
    ];
  },
};

// ============================================================================
// Push Notification Utilities
// ============================================================================

export const pushNotificationUtils = {
  /**
   * Create push notification payload
   */
  createPayload: (notification: NotificationData): PushNotificationPayload => {
    return {
      title: notificationFormatters.formatTitle(notification),
      body: notificationFormatters.formatMessage(notification),
      icon: notification.actor.avatar || '/icons/notification-icon.png',
      badge: 1,
      tag: notification.groupKey || notification.type,
      data: {
        notificationId: notification.id,
        type: notification.type,
        actorDid: notification.actor.did,
        postUri: notification.post?.uri,
      },
      actions: notification.actions?.map(action => ({
        action: action.id,
        title: action.label,
        icon: action.icon,
      })) || [],
      requireInteraction: notification.priority === 'urgent',
      silent: notification.priority === 'low',
    };
  },

  /**
   * Check if push notifications are supported
   */
  isSupported: (): boolean => {
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  },

  /**
   * Get notification permission status
   */
  getPermissionStatus: (): NotificationPermission => {
    return Notification.permission;
  },

  /**
   * Request notification permission
   */
  requestPermission: async (): Promise<NotificationPermission> => {
    if (!pushNotificationUtils.isSupported()) {
      throw new Error('Push notifications are not supported');
    }

    return await Notification.requestPermission();
  },
};

// ============================================================================
// Notification Metrics Utilities
// ============================================================================

export const notificationMetrics = {
  /**
   * Calculate metrics from notifications
   */
  calculateMetrics: (notifications: NotificationData[]): NotificationMetrics => {
    const unreadNotifications = notifications.filter(n => n.status === 'unread');
    
    const unreadByType: Record<string, number> = {};
    const unreadByPriority: Record<string, number> = {};
    
    unreadNotifications.forEach(notification => {
      unreadByType[notification.type] = (unreadByType[notification.type] || 0) + 1;
      unreadByPriority[notification.priority] = (unreadByPriority[notification.priority] || 0) + 1;
    });

    const lastNotification = notifications
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    
    const lastReadNotification = notifications
      .filter(n => n.readAt)
      .sort((a, b) => new Date(b.readAt!).getTime() - new Date(a.readAt!).getTime())[0];

    return {
      unreadCount: unreadNotifications.length,
      unreadByType: unreadByType as Record<NotificationType, number>,
      unreadByPriority: unreadByPriority as Record<NotificationPriority, number>,
      lastNotificationAt: lastNotification?.createdAt,
      lastReadAt: lastReadNotification?.readAt,
    };
  },

  /**
   * Get high priority unread count
   */
  getHighPriorityCount: (notifications: NotificationData[]): number => {
    return notifications.filter(n => 
      n.status === 'unread' && (n.priority === 'high' || n.priority === 'urgent')
    ).length;
  },

  /**
   * Get unread count by type
   */
  getUnreadCountByType: (notifications: NotificationData[], type: NotificationType): number => {
    return notifications.filter(n => n.status === 'unread' && n.type === type).length;
  },
};

// ============================================================================
// Notification Cache Utilities
// ============================================================================

export const notificationCache = {
  /**
   * Generate cache key
   */
  generateKey: (userId: string, filters?: NotificationFilters): string => {
    const filterKey = filters ? btoa(JSON.stringify(filters)) : 'all';
    return `notifications:${userId}:${filterKey}`;
  },

  /**
   * Check if cache is expired
   */
  isExpired: (timestamp: number, maxAge = 2 * 60 * 1000): boolean => {
    return Date.now() - timestamp > maxAge;
  },

  /**
   * Store notifications in cache
   */
  store: (key: string, notifications: NotificationData[]): void => {
    try {
      const cacheData = {
        notifications,
        timestamp: Date.now(),
      };
      localStorage.setItem(key, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Failed to cache notifications:', error);
    }
  },

  /**
   * Retrieve notifications from cache
   */
  retrieve: (key: string): NotificationData[] | null => {
    try {
      const cached = localStorage.getItem(key);
      if (!cached) return null;
      
      const cacheData = JSON.parse(cached);
      if (notificationCache.isExpired(cacheData.timestamp)) {
        localStorage.removeItem(key);
        return null;
      }
      
      return cacheData.notifications;
    } catch (error) {
      console.warn('Failed to retrieve cached notifications:', error);
      return null;
    }
  },

  /**
   * Clear expired cache entries
   */
  clearExpired: (): void => {
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith('notifications:'));
      keys.forEach(key => {
        const cached = localStorage.getItem(key);
        if (cached) {
          const cacheData = JSON.parse(cached);
          if (notificationCache.isExpired(cacheData.timestamp)) {
            localStorage.removeItem(key);
          }
        }
      });
    } catch (error) {
      console.warn('Failed to clear expired notification cache:', error);
    }
  },
};

// ============================================================================
// Main Export
// ============================================================================

export const notificationUtils = {
  formatters: notificationFormatters,
  filters: notificationFilters,
  sorters: notificationSorters,
  groupers: notificationGroupers,
  templates: notificationTemplates,
  push: pushNotificationUtils,
  metrics: notificationMetrics,
  cache: notificationCache,
};

export default notificationUtils;