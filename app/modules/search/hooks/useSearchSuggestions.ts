// ============================================================================
// Search Module - useSearchSuggestions Hook
// ============================================================================
//
// This hook manages search suggestions functionality including generating
// suggestions based on query, history, and trending topics.
//

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  SearchSuggestion, 
  SearchHistoryEntry, 
  TrendingTopic, 
  UseSearchSuggestionsReturn 
} from '../types';
import { searchUtils } from '../utils';
import { defaultApiClient } from '../../../core/api';

const DEBOUNCE_MS = 200;
const MAX_SUGGESTIONS = 10;
const CACHE_KEY = 'takaka_search_suggestions';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

/**
 * Hook for managing search suggestions
 */
export function useSearchSuggestions(): UseSearchSuggestionsReturn {
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const cacheRef = useRef<Map<string, { suggestions: SearchSuggestion[]; timestamp: number }>>(new Map());

  /**
   * Load suggestions from cache
   */
  const loadFromCache = useCallback((cacheKey: string): SearchSuggestion[] | null => {
    const cached = cacheRef.current.get(cacheKey);
    if (!cached) return null;
    
    const isExpired = Date.now() - cached.timestamp > CACHE_DURATION;
    if (isExpired) {
      cacheRef.current.delete(cacheKey);
      return null;
    }
    
    return cached.suggestions;
  }, []);

  /**
   * Save suggestions to cache
   */
  const saveToCache = useCallback((cacheKey: string, suggestions: SearchSuggestion[]) => {
    cacheRef.current.set(cacheKey, {
      suggestions,
      timestamp: Date.now(),
    });
    
    // Limit cache size
    if (cacheRef.current.size > 100) {
      const oldestKey = cacheRef.current.keys().next().value;
      cacheRef.current.delete(oldestKey);
    }
  }, []);

  /**
   * Generate local suggestions from history and trending
   */
  const generateLocalSuggestions = useCallback((searchQuery: string): SearchSuggestion[] => {
    const suggestions: SearchSuggestion[] = [];
    
    // Get search history from localStorage
    try {
      const historyData = localStorage.getItem('takaka_search_history');
      if (historyData) {
        const history: SearchHistoryEntry[] = JSON.parse(historyData);
        const historySuggestions = searchUtils.query.generateSuggestions(searchQuery, history);
        suggestions.push(...historySuggestions);
      }
    } catch (error) {
      console.error('Failed to load search history for suggestions:', error);
    }

    // Add hashtag suggestions
    if (searchQuery.startsWith('#')) {
      const hashtag = searchQuery.slice(1);
      if (hashtag.length > 0) {
        suggestions.push({
          text: `#${hashtag}`,
          type: 'hashtag',
          icon: 'hashtag',
          description: `Search for #${hashtag}`,
        });
      }
    }

    // Add profile suggestions
    if (searchQuery.startsWith('@')) {
      const handle = searchQuery.slice(1);
      if (handle.length > 0) {
        suggestions.push({
          text: `@${handle}`,
          type: 'profile',
          icon: 'user',
          description: `Search for @${handle}`,
        });
      }
    }

    // Add quoted search suggestion
    if (searchQuery.length > 2 && !searchQuery.startsWith('"')) {
      suggestions.push({
        text: `"${searchQuery}"`,
        type: 'exact',
        icon: 'quote',
        description: `Search for exact phrase "${searchQuery}"`,
      });
    }

    return suggestions.slice(0, MAX_SUGGESTIONS);
  }, []);

  /**
   * Fetch suggestions from API
   */
  const fetchSuggestions = useCallback(async (searchQuery: string): Promise<void> => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    // Check cache first
    const cacheKey = `suggestions:${searchQuery.toLowerCase()}`;
    const cached = loadFromCache(cacheKey);
    if (cached) {
      setSuggestions(cached);
      return;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      setIsLoading(true);

      // Start with local suggestions
      const localSuggestions = generateLocalSuggestions(searchQuery);
      setSuggestions(localSuggestions);

      // Fetch remote suggestions
      const response = await defaultApiClient.getSearchSuggestions({
        query: searchQuery,
        limit: MAX_SUGGESTIONS,
      }, {
        signal: abortControllerRef.current.signal,
      });

      const remoteSuggestions: SearchSuggestion[] = response.data.suggestions || [];
      
      // Merge local and remote suggestions, removing duplicates
      const allSuggestions = [...localSuggestions];
      remoteSuggestions.forEach(remote => {
        if (!allSuggestions.some(local => local.text === remote.text)) {
          allSuggestions.push(remote);
        }
      });

      const finalSuggestions = allSuggestions.slice(0, MAX_SUGGESTIONS);
      setSuggestions(finalSuggestions);
      saveToCache(cacheKey, finalSuggestions);

    } catch (error: any) {
      if (error.name === 'AbortError') {
        return;
      }

      console.error('Failed to fetch search suggestions:', error);
      // Keep local suggestions on error
      const localSuggestions = generateLocalSuggestions(searchQuery);
      setSuggestions(localSuggestions);
    } finally {
      setIsLoading(false);
    }
  }, [loadFromCache, saveToCache, generateLocalSuggestions]);

  /**
   * Debounced suggestion fetching
   */
  const debouncedFetch = useCallback((searchQuery: string) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      fetchSuggestions(searchQuery);
    }, DEBOUNCE_MS);
  }, [fetchSuggestions]);

  /**
   * Update query and fetch suggestions
   */
  const updateQuery = useCallback((newQuery: string) => {
    setQuery(newQuery);
    setSelectedIndex(-1);
    
    if (newQuery.trim().length === 0) {
      setSuggestions([]);
      return;
    }

    debouncedFetch(newQuery);
  }, [debouncedFetch]);

  /**
   * Select suggestion by index
   */
  const selectSuggestion = useCallback((index: number) => {
    if (index >= 0 && index < suggestions.length) {
      setSelectedIndex(index);
    }
  }, [suggestions.length]);

  /**
   * Get selected suggestion
   */
  const getSelectedSuggestion = useCallback((): SearchSuggestion | null => {
    if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
      return suggestions[selectedIndex];
    }
    return null;
  }, [selectedIndex, suggestions]);

  /**
   * Navigate suggestions with keyboard
   */
  const navigateUp = useCallback(() => {
    setSelectedIndex(prev => {
      if (prev <= 0) return suggestions.length - 1;
      return prev - 1;
    });
  }, [suggestions.length]);

  const navigateDown = useCallback(() => {
    setSelectedIndex(prev => {
      if (prev >= suggestions.length - 1) return 0;
      return prev + 1;
    });
  }, [suggestions.length]);

  /**
   * Clear suggestions
   */
  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
    setSelectedIndex(-1);
    
    // Cancel any pending requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Clear debounce timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
  }, []);

  /**
   * Get suggestions by type
   */
  const getSuggestionsByType = useCallback((type: SearchSuggestion['type']): SearchSuggestion[] => {
    return suggestions.filter(suggestion => suggestion.type === type);
  }, [suggestions]);

  /**
   * Add custom suggestion
   */
  const addCustomSuggestion = useCallback((suggestion: SearchSuggestion) => {
    setSuggestions(prev => {
      // Check if suggestion already exists
      if (prev.some(s => s.text === suggestion.text)) {
        return prev;
      }
      
      // Add at the beginning and limit total
      return [suggestion, ...prev].slice(0, MAX_SUGGESTIONS);
    });
  }, []);

  /**
   * Get trending suggestions
   */
  const getTrendingSuggestions = useCallback((): SearchSuggestion[] => {
    try {
      const trendingData = localStorage.getItem('takaka_trending_cache');
      if (trendingData) {
        const cached = JSON.parse(trendingData);
        const topics: TrendingTopic[] = cached.data?.topics || [];
        
        return topics.slice(0, 5).map(topic => ({
          text: topic.name,
          type: 'trending' as const,
          icon: 'trending',
          description: `Trending: ${searchUtils.trending.formatCount(topic.count)} posts`,
          count: topic.count,
        }));
      }
    } catch (error) {
      console.error('Failed to load trending suggestions:', error);
    }
    
    return [];
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  return {
    // State
    suggestions,
    isLoading,
    query,
    selectedIndex,
    
    // Actions
    updateQuery,
    selectSuggestion,
    navigateUp,
    navigateDown,
    clearSuggestions,
    addCustomSuggestion,
    
    // Computed values
    selectedSuggestion: getSelectedSuggestion(),
    hasSuggestions: suggestions.length > 0,
    trendingSuggestions: getTrendingSuggestions(),
    
    // Utility functions
    getSuggestionsByType,
    getSelectedSuggestion,
  };
}

export default useSearchSuggestions;