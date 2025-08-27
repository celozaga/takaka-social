// ============================================================================
// Notifications Module - useUnreadCount Hook
// ============================================================================
//
// This hook manages the unread notification count with real-time updates,
// optimized for performance and minimal re-renders.
//

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  NotificationType,
  NotificationPriority,
  UseUnreadCountReturn
} from '../types';
import { defaultApiClient } from '../../../core/api';
import { notificationUtils } from '../utils';

// ============================================================================
// Types
// ============================================================================

interface UnreadCountData {
  total: number;
  byType: Record<NotificationType, number>;
  byPriority: Record<NotificationPriority, number>;
  highPriority: number;
  lastUpdated: string;
}

interface UseUnreadCountOptions {
  /**
   * Auto refresh interval in milliseconds
   * @default 30000 (30 seconds)
   */
  refreshInterval?: number;
  
  /**
   * Enable real-time updates via WebSocket/SSE
   * @default true
   */
  enableRealTime?: boolean;
  
  /**
   * Enable local caching
   * @default true
   */
  enableCache?: boolean;
  
  /**
   * Cache duration in milliseconds
   * @default 60000 (1 minute)
   */
  cacheDuration?: number;
  
  /**
   * Include specific notification types only
   */
  includeTypes?: NotificationType[];
  
  /**
   * Exclude specific notification types
   */
  excludeTypes?: NotificationType[];
  
  /**
   * Minimum priority level to include
   */
  minPriority?: NotificationPriority;
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_OPTIONS: Required<UseUnreadCountOptions> = {
  refreshInterval: 30000,
  enableRealTime: true,
  enableCache: true,
  cacheDuration: 60000,
  includeTypes: [],
  excludeTypes: [],
  minPriority: 'low',
};

const CACHE_KEY = 'notifications:unread-count';

// ============================================================================
// Main Hook
// ============================================================================

export function useUnreadCount(options: UseUnreadCountOptions = {}): UseUnreadCountReturn {
  const config = { ...DEFAULT_OPTIONS, ...options };
  
  // ============================================================================
  // State Management
  // ============================================================================
  
  const [unreadCount, setUnreadCount] = useState<UnreadCountData>({
    total: 0,
    byType: {} as Record<NotificationType, number>,
    byPriority: {} as Record<NotificationPriority, number>,
    highPriority: 0,
    lastUpdated: new Date().toISOString(),
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // ============================================================================
  // Refs and Controllers
  // ============================================================================
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const lastFetchRef = useRef<number>(0);
  
  // ============================================================================
  // Cache Management
  // ============================================================================
  
  const loadFromCache = useCallback((): UnreadCountData | null => {
    if (!config.enableCache) return null;
    
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;
      
      const data = JSON.parse(cached);
      const age = Date.now() - new Date(data.lastUpdated).getTime();
      
      if (age > config.cacheDuration) {
        localStorage.removeItem(CACHE_KEY);
        return null;
      }
      
      return data;
    } catch (error) {
      console.warn('Failed to load unread count from cache:', error);
      return null;
    }
  }, [config.enableCache, config.cacheDuration]);
  
  const saveToCache = useCallback((data: UnreadCountData): void => {
    if (!config.enableCache) return;
    
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save unread count to cache:', error);
    }
  }, [config.enableCache]);
  
  // ============================================================================
  // API Functions
  // ============================================================================
  
  const fetchUnreadCount = useCallback(async (force = false): Promise<void> => {
    const now = Date.now();
    
    // Throttle requests (minimum 5 seconds between calls)
    if (!force && now - lastFetchRef.current < 5000) {
      return;
    }
    
    try {
      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      abortControllerRef.current = new AbortController();
      
      setIsLoading(true);
      setError(null);
      lastFetchRef.current = now;
      
      // Try cache first if not forcing
      if (!force) {
        const cachedData = loadFromCache();
        if (cachedData) {
          setUnreadCount(cachedData);
          setIsLoading(false);
          return;
        }
      }
      
      // Prepare request parameters
      const params: any = {};
      
      if (config.includeTypes.length > 0) {
        params.includeTypes = config.includeTypes;
      }
      
      if (config.excludeTypes.length > 0) {
        params.excludeTypes = config.excludeTypes;
      }
      
      if (config.minPriority !== 'low') {
        params.minPriority = config.minPriority;
      }
      
      // Make API request
      const response = await defaultApiClient.get('/notifications/unread-count', {
        params,
        signal: abortControllerRef.current.signal,
      });
      
      const data: UnreadCountData = {
        total: response.data.total || 0,
        byType: response.data.byType || {},
        byPriority: response.data.byPriority || {},
        highPriority: response.data.highPriority || 0,
        lastUpdated: new Date().toISOString(),
      };
      
      setUnreadCount(data);
      saveToCache(data);
      
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('Failed to fetch unread count:', err);
        setError(err);
      }
    } finally {
      setIsLoading(false);
    }
  }, [config.includeTypes, config.excludeTypes, config.minPriority, loadFromCache, saveToCache]);
  
  // ============================================================================
  // Real-time Updates
  // ============================================================================
  
  const setupRealTimeUpdates = useCallback(() => {
    if (!config.enableRealTime) return;
    
    try {
      // Close existing connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      
      // Create new EventSource connection
      const eventSource = new EventSource('/api/notifications/unread-count/stream');
      eventSourceRef.current = eventSource;
      
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          const newUnreadCount: UnreadCountData = {
            total: data.total || 0,
            byType: data.byType || {},
            byPriority: data.byPriority || {},
            highPriority: data.highPriority || 0,
            lastUpdated: new Date().toISOString(),
          };
          
          setUnreadCount(newUnreadCount);
          saveToCache(newUnreadCount);
        } catch (error) {
          console.warn('Failed to parse real-time unread count update:', error);
        }
      };
      
      eventSource.onerror = (error) => {
        console.warn('Real-time unread count connection error:', error);
        
        // Retry connection after 5 seconds
        setTimeout(() => {
          if (eventSourceRef.current?.readyState === EventSource.CLOSED) {
            setupRealTimeUpdates();
          }
        }, 5000);
      };
      
    } catch (error) {
      console.warn('Failed to setup real-time unread count updates:', error);
    }
  }, [config.enableRealTime, saveToCache]);
  
  // ============================================================================
  // Count Update Functions
  // ============================================================================
  
  const incrementCount = useCallback((type: NotificationType, priority: NotificationPriority = 'normal'): void => {
    setUnreadCount(prev => {
      const newCount = {
        ...prev,
        total: prev.total + 1,
        byType: {
          ...prev.byType,
          [type]: (prev.byType[type] || 0) + 1,
        },
        byPriority: {
          ...prev.byPriority,
          [priority]: (prev.byPriority[priority] || 0) + 1,
        },
        highPriority: (priority === 'high' || priority === 'urgent') 
          ? prev.highPriority + 1 
          : prev.highPriority,
        lastUpdated: new Date().toISOString(),
      };
      
      saveToCache(newCount);
      return newCount;
    });
  }, [saveToCache]);
  
  const decrementCount = useCallback((type: NotificationType, priority: NotificationPriority = 'normal'): void => {
    setUnreadCount(prev => {
      const newCount = {
        ...prev,
        total: Math.max(0, prev.total - 1),
        byType: {
          ...prev.byType,
          [type]: Math.max(0, (prev.byType[type] || 0) - 1),
        },
        byPriority: {
          ...prev.byPriority,
          [priority]: Math.max(0, (prev.byPriority[priority] || 0) - 1),
        },
        highPriority: (priority === 'high' || priority === 'urgent') 
          ? Math.max(0, prev.highPriority - 1)
          : prev.highPriority,
        lastUpdated: new Date().toISOString(),
      };
      
      saveToCache(newCount);
      return newCount;
    });
  }, [saveToCache]);
  
  const resetCount = useCallback((): void => {
    const newCount: UnreadCountData = {
      total: 0,
      byType: {} as Record<NotificationType, number>,
      byPriority: {} as Record<NotificationPriority, number>,
      highPriority: 0,
      lastUpdated: new Date().toISOString(),
    };
    
    setUnreadCount(newCount);
    saveToCache(newCount);
  }, [saveToCache]);
  
  // ============================================================================
  // Effects
  // ============================================================================
  
  // Initial load
  useEffect(() => {
    fetchUnreadCount();
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchUnreadCount]);
  
  // Setup real-time updates
  useEffect(() => {
    setupRealTimeUpdates();
    
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [setupRealTimeUpdates]);
  
  // Auto refresh
  useEffect(() => {
    if (!config.refreshInterval) return;
    
    refreshIntervalRef.current = setInterval(() => {
      fetchUnreadCount(true);
    }, config.refreshInterval);
    
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [config.refreshInterval, fetchUnreadCount]);
  
  // ============================================================================
  // Utility Functions
  // ============================================================================
  
  const refresh = useCallback(() => {
    fetchUnreadCount(true);
  }, [fetchUnreadCount]);
  
  const getCountByType = useCallback((type: NotificationType): number => {
    return unreadCount.byType[type] || 0;
  }, [unreadCount.byType]);
  
  const getCountByPriority = useCallback((priority: NotificationPriority): number => {
    return unreadCount.byPriority[priority] || 0;
  }, [unreadCount.byPriority]);
  
  const hasUnread = useCallback((): boolean => {
    return unreadCount.total > 0;
  }, [unreadCount.total]);
  
  const hasHighPriority = useCallback((): boolean => {
    return unreadCount.highPriority > 0;
  }, [unreadCount.highPriority]);
  
  const getFormattedCount = useCallback((): string => {
    return notificationUtils.formatters.formatCount(unreadCount.total);
  }, [unreadCount.total]);
  
  // ============================================================================
  // Return Hook Interface
  // ============================================================================
  
  return {
    // Count data
    total: unreadCount.total,
    byType: unreadCount.byType,
    byPriority: unreadCount.byPriority,
    highPriority: unreadCount.highPriority,
    lastUpdated: unreadCount.lastUpdated,
    
    // State
    isLoading,
    error,
    
    // Actions
    refresh,
    incrementCount,
    decrementCount,
    resetCount,
    
    // Utilities
    getCountByType,
    getCountByPriority,
    hasUnread,
    hasHighPriority,
    getFormattedCount,
  };
}

export default useUnreadCount;