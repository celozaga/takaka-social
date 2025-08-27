// ============================================================================
// Search Module - useTrending Hook
// ============================================================================
//
// This hook manages trending topics functionality including fetching,
// caching, and filtering trending data.
//

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  TrendingTopic, 
  TrendingData, 
  TrendingCategory, 
  TrendingTimeframe, 
  UseTrendingReturn 
} from '../types';
import { searchUtils } from '../utils';
import { defaultApiClient } from '../../../core/api';

const CACHE_KEY = 'takaka_trending_cache';
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

/**
 * Hook for managing trending topics
 */
export function useTrending(): UseTrendingReturn {
  const [data, setData] = useState<TrendingData>({
    topics: [],
    categories: [],
    lastUpdated: null,
    timeframe: '24h',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<TrendingCategory | 'all'>('all');
  const [timeframe, setTimeframe] = useState<TrendingTimeframe>('24h');

  const abortControllerRef = useRef<AbortController | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Load trending data from cache
   */
  const loadFromCache = useCallback((): TrendingData | null => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;
      
      const cacheData = JSON.parse(cached);
      const isExpired = Date.now() - cacheData.timestamp > CACHE_DURATION;
      
      if (isExpired) {
        localStorage.removeItem(CACHE_KEY);
        return null;
      }
      
      return cacheData.data;
    } catch (error) {
      console.error('Failed to load trending cache:', error);
      return null;
    }
  }, []);

  /**
   * Save trending data to cache
   */
  const saveToCache = useCallback((trendingData: TrendingData) => {
    try {
      const cacheData = {
        data: trendingData,
        timestamp: Date.now(),
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Failed to save trending cache:', error);
    }
  }, []);

  /**
   * Fetch trending topics from API
   */
  const fetchTrending = useCallback(async (forceRefresh = false): Promise<void> => {
    // Check cache first if not forcing refresh
    if (!forceRefresh) {
      const cachedData = loadFromCache();
      if (cachedData) {
        setData(cachedData);
        return;
      }
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      setIsLoading(true);
      setError(null);

      const response = await defaultApiClient.getTrending({
        timeframe,
        limit: 50,
      }, {
        signal: abortControllerRef.current.signal,
      });

      const trendingData: TrendingData = {
        topics: response.data.topics || [],
        categories: response.data.categories || [],
        lastUpdated: new Date().toISOString(),
        timeframe,
      };

      setData(trendingData);
      saveToCache(trendingData);

    } catch (error: any) {
      if (error.name === 'AbortError') {
        return;
      }

      console.error('Failed to fetch trending topics:', error);
      setError(error.message || 'Failed to load trending topics');
    } finally {
      setIsLoading(false);
    }
  }, [timeframe, loadFromCache, saveToCache]);

  /**
   * Refresh trending data
   */
  const refresh = useCallback(() => {
    fetchTrending(true);
  }, [fetchTrending]);

  /**
   * Get filtered topics by category
   */
  const getFilteredTopics = useCallback((): TrendingTopic[] => {
    if (selectedCategory === 'all') {
      return data.topics;
    }
    return searchUtils.trending.filterByCategory(data.topics, selectedCategory);
  }, [data.topics, selectedCategory]);

  /**
   * Get topics sorted by growth
   */
  const getTopicsByGrowth = useCallback((): TrendingTopic[] => {
    const filtered = getFilteredTopics();
    return searchUtils.trending.sortByGrowth(filtered);
  }, [getFilteredTopics]);

  /**
   * Get topics sorted by count
   */
  const getTopicsByCount = useCallback((): TrendingTopic[] => {
    const filtered = getFilteredTopics();
    return searchUtils.trending.sortByCount(filtered);
  }, [getFilteredTopics]);

  /**
   * Get top trending topics
   */
  const getTopTrending = useCallback((limit = 10): TrendingTopic[] => {
    return getTopicsByGrowth().slice(0, limit);
  }, [getTopicsByGrowth]);

  /**
   * Search trending topics
   */
  const searchTopics = useCallback((query: string): TrendingTopic[] => {
    if (!query.trim()) return getFilteredTopics();
    
    const lowerQuery = query.toLowerCase();
    return getFilteredTopics().filter(topic => 
      topic.name.toLowerCase().includes(lowerQuery) ||
      topic.description?.toLowerCase().includes(lowerQuery)
    );
  }, [getFilteredTopics]);

  /**
   * Get trending statistics
   */
  const getStats = useCallback(() => {
    const topics = data.topics;
    if (topics.length === 0) {
      return {
        totalTopics: 0,
        averageGrowth: 0,
        topGrowth: 0,
        categoriesCount: 0,
        mostActiveCategory: null,
      };
    }

    const totalGrowth = topics.reduce((sum, topic) => sum + topic.growth, 0);
    const averageGrowth = totalGrowth / topics.length;
    const topGrowth = Math.max(...topics.map(topic => topic.growth));
    
    // Count topics by category
    const categoryCount = new Map<string, number>();
    topics.forEach(topic => {
      const count = categoryCount.get(topic.category) || 0;
      categoryCount.set(topic.category, count + 1);
    });
    
    const mostActiveCategory = Array.from(categoryCount.entries())
      .sort((a, b) => b[1] - a[1])[0];

    return {
      totalTopics: topics.length,
      averageGrowth: Math.round(averageGrowth * 100) / 100,
      topGrowth: Math.round(topGrowth * 100) / 100,
      categoriesCount: data.categories.length,
      mostActiveCategory: mostActiveCategory ? mostActiveCategory[0] : null,
    };
  }, [data]);

  /**
   * Update timeframe and refetch
   */
  const updateTimeframe = useCallback((newTimeframe: TrendingTimeframe) => {
    setTimeframe(newTimeframe);
    // Data will be refetched due to useEffect dependency
  }, []);

  /**
   * Check if data needs refresh
   */
  const needsRefresh = useCallback((): boolean => {
    if (!data.lastUpdated) return true;
    
    const lastUpdate = new Date(data.lastUpdated).getTime();
    const now = Date.now();
    return now - lastUpdate > CACHE_DURATION;
  }, [data.lastUpdated]);

  // Initial load and timeframe changes
  useEffect(() => {
    fetchTrending();
  }, [fetchTrending]);

  // Auto-refresh interval
  useEffect(() => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }

    refreshIntervalRef.current = setInterval(() => {
      if (needsRefresh()) {
        fetchTrending(true);
      }
    }, REFRESH_INTERVAL);

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [fetchTrending, needsRefresh]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  return {
    // State
    data,
    isLoading,
    error,
    selectedCategory,
    timeframe,
    
    // Actions
    refresh,
    setSelectedCategory,
    updateTimeframe,
    searchTopics,
    
    // Computed values
    topics: getFilteredTopics(),
    topicsByGrowth: getTopicsByGrowth(),
    topicsByCount: getTopicsByCount(),
    topTrending: getTopTrending(),
    stats: getStats(),
    hasData: data.topics.length > 0,
    needsRefresh: needsRefresh(),
    
    // Utility functions
    getTopTrending,
    getFilteredTopics,
    getTopicsByGrowth,
    getTopicsByCount,
  };
}

export default useTrending;