// ============================================================================
// Search Module - useSearch Hook
// ============================================================================
//
// This hook manages search functionality including query execution,
// result caching, history management, and state handling.
//

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  SearchQuery, 
  SearchResult, 
  SearchState, 
  UseSearchOptions, 
  UseSearchReturn 
} from '../types';
import { searchUtils } from '../utils';
import { defaultApiClient } from '../../../core/api';

/**
 * Hook for managing search functionality
 */
export function useSearch(options: UseSearchOptions = {}): UseSearchReturn {
  const {
    initialQuery,
    autoSearch = false,
    cacheResults = true,
    saveToHistory = true,
    debounceMs = 300,
    maxResults = 50,
  } = options;

  // State management
  const [state, setState] = useState<SearchState>({
    query: initialQuery || { term: '', type: 'all', limit: maxResults },
    results: {
      profiles: [],
      posts: [],
      feeds: [],
      hashtags: [],
      hasMore: false,
    },
    isLoading: false,
    error: null,
    hasSearched: false,
  });

  // Refs for cleanup and debouncing
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchCountRef = useRef(0);

  /**
   * Execute search with the current query
   */
  const executeSearch = useCallback(async (query: SearchQuery, append = false): Promise<void> => {
    // Validate query
    const validation = searchUtils.query.validateQuery(query);
    if (!validation.valid) {
      setState(prev => ({
        ...prev,
        error: validation.errors.join(', '),
        isLoading: false,
      }));
      return;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();
    const currentSearchId = ++searchCountRef.current;

    try {
      // Check cache first
      let cachedResult: SearchResult | null = null;
      if (cacheResults && !append) {
        const cacheKey = searchUtils.cache.generateKey(query);
        cachedResult = searchUtils.cache.getResult(cacheKey);
      }

      if (cachedResult) {
        setState(prev => ({
          ...prev,
          results: cachedResult!,
          isLoading: false,
          error: null,
          hasSearched: true,
        }));
        return;
      }

      // Set loading state
      setState(prev => ({
        ...prev,
        isLoading: true,
        error: null,
        ...(append ? {} : { hasSearched: true }),
      }));

      // Execute search
      const startTime = Date.now();
      const response = await defaultApiClient.search({
        ...query,
        cursor: append ? state.results.cursor : undefined,
      }, {
        signal: abortControllerRef.current.signal,
      });

      // Check if this is still the latest search
      if (currentSearchId !== searchCountRef.current) {
        return; // Ignore outdated results
      }

      const searchTime = Date.now() - startTime;
      const newResults: SearchResult = {
        ...response.data,
        searchTime,
      };

      // Update state
      setState(prev => {
        const finalResults = append 
          ? searchUtils.results.mergeResults(prev.results, newResults)
          : newResults;

        return {
          ...prev,
          results: finalResults,
          isLoading: false,
          error: null,
          hasSearched: true,
        };
      });

      // Cache results
      if (cacheResults && !append) {
        const cacheKey = searchUtils.cache.generateKey(query);
        searchUtils.cache.storeResult(cacheKey, newResults);
      }

      // Save to history
      if (saveToHistory && !append && query.term.trim()) {
        const historyEntry = {
          query: query.term,
          type: query.type || 'all',
          resultCount: searchUtils.results.getTotalCount(newResults),
          filters: query.filters,
        };

        // Emit custom event for history management
        window.dispatchEvent(new CustomEvent('searchExecuted', {
          detail: historyEntry,
        }));
      }

    } catch (error: any) {
      // Ignore abort errors
      if (error.name === 'AbortError') {
        return;
      }

      // Check if this is still the latest search
      if (currentSearchId !== searchCountRef.current) {
        return;
      }

      console.error('Search failed:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Search failed',
      }));
    }
  }, [cacheResults, saveToHistory, state.results]);

  /**
   * Debounced search function
   */
  const debouncedSearch = useCallback((query: SearchQuery) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      executeSearch(query);
    }, debounceMs);
  }, [executeSearch, debounceMs]);

  /**
   * Update search query
   */
  const setQuery = useCallback((newQuery: Partial<SearchQuery>) => {
    setState(prev => {
      const updatedQuery = { ...prev.query, ...newQuery };
      
      // Auto-search if enabled and query has content
      if (autoSearch && updatedQuery.term.trim()) {
        debouncedSearch(updatedQuery);
      }
      
      return {
        ...prev,
        query: updatedQuery,
      };
    });
  }, [autoSearch, debouncedSearch]);

  /**
   * Perform immediate search
   */
  const search = useCallback((queryOverride?: Partial<SearchQuery>) => {
    const finalQuery = queryOverride 
      ? { ...state.query, ...queryOverride }
      : state.query;
    
    executeSearch(finalQuery);
  }, [state.query, executeSearch]);

  /**
   * Load more results (pagination)
   */
  const loadMore = useCallback(() => {
    if (state.results.hasMore && !state.isLoading) {
      executeSearch(state.query, true);
    }
  }, [state.query, state.results.hasMore, state.isLoading, executeSearch]);

  /**
   * Clear search results
   */
  const clearResults = useCallback(() => {
    // Cancel any pending requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Clear debounce timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    setState(prev => ({
      ...prev,
      results: {
        profiles: [],
        posts: [],
        feeds: [],
        hashtags: [],
        hasMore: false,
      },
      isLoading: false,
      error: null,
      hasSearched: false,
    }));
  }, []);

  /**
   * Reset search state
   */
  const reset = useCallback(() => {
    clearResults();
    setState(prev => ({
      ...prev,
      query: initialQuery || { term: '', type: 'all', limit: maxResults },
    }));
  }, [clearResults, initialQuery, maxResults]);

  /**
   * Retry last search
   */
  const retry = useCallback(() => {
    if (state.hasSearched) {
      executeSearch(state.query);
    }
  }, [state.hasSearched, state.query, executeSearch]);

  // Auto-search on mount if enabled and query has content
  useEffect(() => {
    if (autoSearch && initialQuery?.term?.trim()) {
      executeSearch(initialQuery);
    }
  }, []); // Only run on mount

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

  // Clear expired cache periodically
  useEffect(() => {
    if (cacheResults) {
      const interval = setInterval(() => {
        searchUtils.cache.clearExpired();
      }, 5 * 60 * 1000); // Every 5 minutes

      return () => clearInterval(interval);
    }
  }, [cacheResults]);

  return {
    // State
    query: state.query,
    results: state.results,
    isLoading: state.isLoading,
    error: state.error,
    hasSearched: state.hasSearched,
    
    // Actions
    setQuery,
    search,
    loadMore,
    clearResults,
    reset,
    retry,
    
    // Computed values
    hasResults: searchUtils.results.getTotalCount(state.results) > 0,
    canLoadMore: state.results.hasMore && !state.isLoading,
    totalCount: searchUtils.results.getTotalCount(state.results),
  };
}

export default useSearch;