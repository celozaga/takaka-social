// ============================================================================
// Takaka Social - Notifications Components
// ============================================================================

// Components
export { default as NotificationsScreen } from './NotificationsScreen';
export { default as NotificationItem } from './NotificationItem';

// Component Props Types
export type {
  NotificationsScreenProps,
  NotificationItemProps,
} from './types';

// ============================================================================
// Configuration and Utilities
// ============================================================================

/**
 * Configuration interface for notifications components
 */
export interface NotificationsComponentsConfig {
  // Display settings
  maxNotificationsPerPage: number;
  autoRefreshInterval: number;
  showUnreadBadge: boolean;
  
  // Interaction settings
  enableMarkAsRead: boolean;
  enableBulkActions: boolean;
  enableNotificationActions: boolean;
  
  // Styling
  theme: 'light' | 'dark' | 'auto';
  compactMode: boolean;
  showAvatars: boolean;
  showTimestamps: boolean;
  
  // Accessibility
  announceNewNotifications: boolean;
  highContrastMode: boolean;
}

/**
 * Factory function to create pre-configured notification components
 */
export function createNotificationsComponents(config: Partial<NotificationsComponentsConfig>) {
  const defaultConfig: NotificationsComponentsConfig = {
    maxNotificationsPerPage: 20,
    autoRefreshInterval: 30000,
    showUnreadBadge: true,
    enableMarkAsRead: true,
    enableBulkActions: true,
    enableNotificationActions: true,
    theme: 'auto',
    compactMode: false,
    showAvatars: true,
    showTimestamps: true,
    announceNewNotifications: true,
    highContrastMode: false,
  };
  
  const mergedConfig = { ...defaultConfig, ...config };
  
  return {
    config: mergedConfig,
    NotificationsScreen: (props: any) => <NotificationsScreen {...props} config={mergedConfig} />,
    NotificationItem: (props: any) => <NotificationItem {...props} config={mergedConfig} />,
  };
}

/**
 * Utility functions for notifications components
 */
export const notificationsComponentUtils = {
  /**
   * Format notification time for display
   */
  formatNotificationTime: (timestamp: string | Date): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'agora';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    
    return date.toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'short'
    });
  },
  
  /**
   * Get notification type icon
   */
  getNotificationIcon: (type: string): string => {
    const iconMap: Record<string, string> = {
      like: '❤️',
      repost: '🔄',
      follow: '👤',
      mention: '@',
      reply: '💬',
      quote: '"',
      message: '✉️',
      system: 'ℹ️',
    };
    return iconMap[type] || 'ℹ️';
  },
  
  /**
   * Get notification priority level
   */
  getNotificationPriority: (type: string): 'high' | 'medium' | 'low' => {
    const priorityMap: Record<string, 'high' | 'medium' | 'low'> = {
      message: 'high',
      mention: 'high',
      reply: 'medium',
      follow: 'medium',
      like: 'low',
      repost: 'low',
      quote: 'medium',
      system: 'high',
    };
    return priorityMap[type] || 'low';
  },
  
  /**
   * Generate notification summary text
   */
  generateNotificationSummary: (notification: any): string => {
    const { type, actor, post } = notification;
    const actorName = actor?.displayName || actor?.handle || 'Alguém';
    
    switch (type) {
      case 'like':
        return `${actorName} curtiu sua publicação`;
      case 'repost':
        return `${actorName} repostou sua publicação`;
      case 'follow':
        return `${actorName} começou a seguir você`;
      case 'mention':
        return `${actorName} mencionou você`;
      case 'reply':
        return `${actorName} respondeu sua publicação`;
      case 'quote':
        return `${actorName} citou sua publicação`;
      case 'message':
        return `Nova mensagem de ${actorName}`;
      default:
        return 'Nova notificação';
    }
  },
  
  /**
   * Group notifications by type and time
   */
  groupNotifications: (notifications: any[]): Record<string, any[]> => {
    const groups: Record<string, any[]> = {
      today: [],
      yesterday: [],
      thisWeek: [],
      older: [],
    };
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    notifications.forEach(notification => {
      const notificationDate = new Date(notification.createdAt);
      
      if (notificationDate >= today) {
        groups.today.push(notification);
      } else if (notificationDate >= yesterday) {
        groups.yesterday.push(notification);
      } else if (notificationDate >= thisWeek) {
        groups.thisWeek.push(notification);
      } else {
        groups.older.push(notification);
      }
    });
    
    return groups;
  },
  
  /**
   * Filter notifications by type
   */
  filterNotificationsByType: (notifications: any[], types: string[]): any[] => {
    return notifications.filter(notification => types.includes(notification.type));
  },
  
  /**
   * Get unread notifications count
   */
  getUnreadCount: (notifications: any[]): number => {
    return notifications.filter(notification => !notification.isRead).length;
  },
};

/**
 * Default configuration for notifications components
 */
export const NOTIFICATIONS_COMPONENTS_CONFIG: NotificationsComponentsConfig = {
  maxNotificationsPerPage: 20,
  autoRefreshInterval: 30000,
  showUnreadBadge: true,
  enableMarkAsRead: true,
  enableBulkActions: true,
  enableNotificationActions: true,
  theme: 'auto',
  compactMode: false,
  showAvatars: true,
  showTimestamps: true,
  announceNewNotifications: true,
  highContrastMode: false,
};

/**
 * Notification types available in the system
 */
export const NOTIFICATION_TYPES = {
  LIKE: 'like',
  REPOST: 'repost',
  FOLLOW: 'follow',
  MENTION: 'mention',
  REPLY: 'reply',
  QUOTE: 'quote',
  MESSAGE: 'message',
  SYSTEM: 'system',
} as const;

/**
 * Accessibility labels for notifications components
 */
export const NOTIFICATIONS_A11Y_LABELS = {
  notificationsScreen: 'Tela de notificações',
  notificationItem: 'Item de notificação',
  markAsRead: 'Marcar como lida',
  markAsUnread: 'Marcar como não lida',
  deleteNotification: 'Excluir notificação',
  viewProfile: 'Ver perfil',
  viewPost: 'Ver publicação',
  refreshNotifications: 'Atualizar notificações',
  filterNotifications: 'Filtrar notificações',
  unreadBadge: 'Notificações não lidas',
} as const;