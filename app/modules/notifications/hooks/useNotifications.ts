// ============================================================================
// Notifications Module - useNotifications Hook
// ============================================================================
//
// This hook manages notification data, including fetching, caching, filtering,
// and real-time updates for the notifications system.
//

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  NotificationData, 
  NotificationFilters, 
  NotificationSort,
  UseNotificationsOptions,
  UseNotificationsReturn,
  NotificationGroup,
  NotificationMetrics
} from '../types';
import { notificationUtils } from '../utils';
import { defaultApiClient } from '../../../core/api';

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_OPTIONS: UseNotificationsOptions = {
  limit: 50,
  autoRefresh: true,
  refreshInterval: 30000, // 30 seconds
  enableGrouping: true,
  enableCache: true,
  filters: {},
  sort: { by: 'createdAt', order: 'desc' },
};

// ============================================================================
// Main Hook
// ============================================================================

export function useNotifications(options: UseNotificationsOptions = {}): UseNotificationsReturn {
  const config = { ...DEFAULT_OPTIONS, ...options };
  
  // ============================================================================
  // State Management
  // ============================================================================
  
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [groups, setGroups] = useState<NotificationGroup[]>([]);
  const [metrics, setMetrics] = useState<NotificationMetrics>({
    unreadCount: 0,
    unreadByType: {},
    unreadByPriority: {},
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string | undefined>();
  
  // ============================================================================
  // Refs and Controllers
  // ============================================================================
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const cacheKeyRef = useRef<string>('');
  
  // ============================================================================
  // Cache Management
  // ============================================================================
  
  const getCacheKey = useCallback(() => {
    return notificationUtils.cache.generateKey('current-user', config.filters);
  }, [config.filters]);
  
  const loadFromCache = useCallback(() => {
    if (!config.enableCache) return null;
    
    const cacheKey = getCacheKey();
    return notificationUtils.cache.retrieve(cacheKey);
  }, [config.enableCache, getCacheKey]);
  
  const saveToCache = useCallback((data: NotificationData[]) => {
    if (!config.enableCache) return;
    
    const cacheKey = getCacheKey();
    notificationUtils.cache.store(cacheKey, data);
  }, [config.enableCache, getCacheKey]);
  
  // ============================================================================
  // API Functions
  // ============================================================================
  
  const fetchNotifications = useCallback(async (
    isRefresh = false,
    loadMore = false
  ): Promise<void> => {
    try {
      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      abortControllerRef.current = new AbortController();
      
      if (isRefresh) {
        setIsRefreshing(true);
        setError(null);
      } else if (!loadMore) {
        setIsLoading(true);
        setError(null);
        
        // Try to load from cache first
        const cachedData = loadFromCache();
        if (cachedData && cachedData.length > 0) {
          setNotifications(cachedData);
        }
      }
      
      // Prepare request parameters
      const params = {
        limit: config.limit,
        cursor: loadMore ? cursor : undefined,
        ...config.filters,
      };
      
      // Make API request
      const response = await defaultApiClient.get('/notifications', {
        params,
        signal: abortControllerRef.current.signal,
      });
      
      const newNotifications = response.data.notifications || [];
      const newCursor = response.data.cursor;
      
      // Update notifications
      if (loadMore && cursor) {
        setNotifications(prev => {
          const combined = [...prev, ...newNotifications];
          saveToCache(combined);
          return combined;
        });
      } else {
        setNotifications(newNotifications);
        saveToCache(newNotifications);
      }
      
      // Update pagination
      setCursor(newCursor);
      setHasMore(!!newCursor && newNotifications.length === config.limit);
      
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('Failed to fetch notifications:', err);
        setError(err);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [config.limit, config.filters, cursor, loadFromCache, saveToCache]);
  
  // ============================================================================
  // Notification Actions
  // ============================================================================
  
  const markAsRead = useCallback(async (notificationIds: string[]): Promise<void> => {
    try {
      // Optimistic update
      setNotifications(prev => 
        prev.map(notification => 
          notificationIds.includes(notification.id)
            ? { ...notification, status: 'read', readAt: new Date().toISOString() }
            : notification
        )
      );
      
      // API call
      await defaultApiClient.post('/notifications/mark-read', {
        notificationIds,
      });
      
    } catch (err) {
      console.error('Failed to mark notifications as read:', err);
      // Revert optimistic update
      await fetchNotifications(true);
      throw err;
    }
  }, [fetchNotifications]);
  
  const markAsUnread = useCallback(async (notificationIds: string[]): Promise<void> => {
    try {
      // Optimistic update
      setNotifications(prev => 
        prev.map(notification => 
          notificationIds.includes(notification.id)
            ? { ...notification, status: 'unread', readAt: undefined }
            : notification
        )
      );
      
      // API call
      await defaultApiClient.post('/notifications/mark-unread', {
        notificationIds,
      });
      
    } catch (err) {
      console.error('Failed to mark notifications as unread:', err);
      // Revert optimistic update
      await fetchNotifications(true);
      throw err;
    }
  }, [fetchNotifications]);
  
  const markAllAsRead = useCallback(async (): Promise<void> => {
    try {
      const unreadIds = notifications
        .filter(n => n.status === 'unread')
        .map(n => n.id);
      
      if (unreadIds.length === 0) return;
      
      await markAsRead(unreadIds);
      
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
      throw err;
    }
  }, [notifications, markAsRead]);
  
  const archiveNotifications = useCallback(async (notificationIds: string[]): Promise<void> => {
    try {
      // Optimistic update
      setNotifications(prev => 
        prev.map(notification => 
          notificationIds.includes(notification.id)
            ? { ...notification, status: 'archived' }
            : notification
        )
      );
      
      // API call
      await defaultApiClient.post('/notifications/archive', {
        notificationIds,
      });
      
    } catch (err) {
      console.error('Failed to archive notifications:', err);
      // Revert optimistic update
      await fetchNotifications(true);
      throw err;
    }
  }, [fetchNotifications]);
  
  const deleteNotifications = useCallback(async (notificationIds: string[]): Promise<void> => {
    try {
      // Optimistic update
      setNotifications(prev => 
        prev.filter(notification => !notificationIds.includes(notification.id))
      );
      
      // API call
      await defaultApiClient.delete('/notifications', {
        data: { notificationIds },
      });
      
    } catch (err) {
      console.error('Failed to delete notifications:', err);
      // Revert optimistic update
      await fetchNotifications(true);
      throw err;
    }
  }, [fetchNotifications]);
  
  // ============================================================================
  // Data Processing
  // ============================================================================
  
  const processedNotifications = useCallback(() => {
    let processed = [...notifications];
    
    // Apply filters
    if (config.filters && Object.keys(config.filters).length > 0) {
      processed = notificationUtils.filters.filterNotifications(processed, config.filters);
    }
    
    // Apply sorting
    if (config.sort) {
      processed = notificationUtils.sorters.sortNotifications(processed, config.sort);
    }
    
    return processed;
  }, [notifications, config.filters, config.sort]);
  
  // ============================================================================
  // Effects
  // ============================================================================
  
  // Initial load
  useEffect(() => {
    fetchNotifications();
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);
  
  // Auto refresh
  useEffect(() => {
    if (!config.autoRefresh || !config.refreshInterval) return;
    
    refreshIntervalRef.current = setInterval(() => {
      fetchNotifications(true);
    }, config.refreshInterval);
    
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [config.autoRefresh, config.refreshInterval, fetchNotifications]);
  
  // Update groups when notifications change
  useEffect(() => {
    if (config.enableGrouping) {
      const processed = processedNotifications();
      const grouped = notificationUtils.groupers.groupNotifications(processed);
      setGroups(grouped);
    }
  }, [notifications, config.enableGrouping, processedNotifications]);
  
  // Update metrics when notifications change
  useEffect(() => {
    const newMetrics = notificationUtils.metrics.calculateMetrics(notifications);
    setMetrics(newMetrics);
  }, [notifications]);
  
  // Clear cache when filters change
  useEffect(() => {
    const newCacheKey = getCacheKey();
    if (cacheKeyRef.current && cacheKeyRef.current !== newCacheKey) {
      fetchNotifications();
    }
    cacheKeyRef.current = newCacheKey;
  }, [getCacheKey, fetchNotifications]);
  
  // ============================================================================
  // Utility Functions
  // ============================================================================
  
  const refresh = useCallback(() => {
    setCursor(undefined);
    setHasMore(true);
    fetchNotifications(true);
  }, [fetchNotifications]);
  
  const loadMore = useCallback(() => {
    if (!isLoading && !isRefreshing && hasMore && cursor) {
      fetchNotifications(false, true);
    }
  }, [isLoading, isRefreshing, hasMore, cursor, fetchNotifications]);
  
  const getNotificationById = useCallback((id: string): NotificationData | undefined => {
    return notifications.find(notification => notification.id === id);
  }, [notifications]);
  
  const getUnreadCount = useCallback((): number => {
    return metrics.unreadCount;
  }, [metrics.unreadCount]);
  
  const getUnreadByType = useCallback((type: string): number => {
    return metrics.unreadByType[type] || 0;
  }, [metrics.unreadByType]);
  
  // ============================================================================
  // Return Hook Interface
  // ============================================================================
  
  return {
    // Data
    notifications: processedNotifications(),
    groups: config.enableGrouping ? groups : [],
    metrics,
    
    // State
    isLoading,
    isRefreshing,
    error,
    hasMore,
    
    // Actions
    refresh,
    loadMore,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    archiveNotifications,
    deleteNotifications,
    
    // Utilities
    getNotificationById,
    getUnreadCount,
    getUnreadByType,
  };
}

export default useNotifications;