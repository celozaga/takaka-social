// ============================================================================
// Search Module - useSearchHistory Hook
// ============================================================================
//
// This hook manages search history functionality including storing,
// retrieving, and managing search history entries.
//

import { useState, useEffect, useCallback } from 'react';
import { 
  SearchHistoryEntry, 
  SearchHistory, 
  UseSearchHistoryReturn 
} from '../types';
import { searchUtils } from '../utils';

const STORAGE_KEY = 'takaka_search_history';
const MAX_HISTORY_ENTRIES = 100;

/**
 * Hook for managing search history
 */
export function useSearchHistory(): UseSearchHistoryReturn {
  const [history, setHistory] = useState<SearchHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Load history from localStorage
   */
  const loadHistory = useCallback(() => {
    try {
      setIsLoading(true);
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setHistory(parsed);
        }
      }
    } catch (error) {
      console.error('Failed to load search history:', error);
      setHistory([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Save history to localStorage
   */
  const saveHistory = useCallback((newHistory: SearchHistoryEntry[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
    } catch (error) {
      console.error('Failed to save search history:', error);
    }
  }, []);

  /**
   * Add entry to history
   */
  const addEntry = useCallback((entry: Omit<SearchHistoryEntry, 'id' | 'timestamp'>) => {
    setHistory(prevHistory => {
      const newHistory = searchUtils.history.addEntry(prevHistory, entry);
      // Limit history size
      const limitedHistory = newHistory.slice(0, MAX_HISTORY_ENTRIES);
      saveHistory(limitedHistory);
      return limitedHistory;
    });
  }, [saveHistory]);

  /**
   * Remove entry from history
   */
  const removeEntry = useCallback((id: string) => {
    setHistory(prevHistory => {
      const newHistory = searchUtils.history.removeEntry(prevHistory, id);
      saveHistory(newHistory);
      return newHistory;
    });
  }, [saveHistory]);

  /**
   * Clear all history
   */
  const clearHistory = useCallback(() => {
    setHistory([]);
    saveHistory([]);
  }, [saveHistory]);

  /**
   * Get recent queries
   */
  const getRecentQueries = useCallback((limit = 10): string[] => {
    return searchUtils.history.getRecentQueries(history, limit);
  }, [history]);

  /**
   * Get popular queries
   */
  const getPopularQueries = useCallback((limit = 10): string[] => {
    return searchUtils.history.getPopularQueries(history, limit);
  }, [history]);

  /**
   * Search within history
   */
  const searchHistory = useCallback((query: string): SearchHistoryEntry[] => {
    if (!query.trim()) return history;
    
    const lowerQuery = query.toLowerCase();
    return history.filter(entry => 
      entry.query.toLowerCase().includes(lowerQuery)
    );
  }, [history]);

  /**
   * Get history statistics
   */
  const getStats = useCallback(() => {
    const totalSearches = history.length;
    const uniqueQueries = new Set(history.map(entry => entry.query)).size;
    const averageResults = history.length > 0 
      ? history.reduce((sum, entry) => sum + entry.resultCount, 0) / history.length
      : 0;
    
    // Get most searched query
    const queryCount = new Map<string, number>();
    history.forEach(entry => {
      const count = queryCount.get(entry.query) || 0;
      queryCount.set(entry.query, count + 1);
    });
    
    const mostSearched = Array.from(queryCount.entries())
      .sort((a, b) => b[1] - a[1])[0];
    
    // Get search types distribution
    const typeCount = new Map<string, number>();
    history.forEach(entry => {
      const count = typeCount.get(entry.type) || 0;
      typeCount.set(entry.type, count + 1);
    });
    
    return {
      totalSearches,
      uniqueQueries,
      averageResults: Math.round(averageResults * 100) / 100,
      mostSearchedQuery: mostSearched ? mostSearched[0] : null,
      mostSearchedCount: mostSearched ? mostSearched[1] : 0,
      typeDistribution: Object.fromEntries(typeCount),
    };
  }, [history]);

  /**
   * Export history
   */
  const exportHistory = useCallback((): string => {
    return searchUtils.history.exportHistory(history);
  }, [history]);

  /**
   * Import history
   */
  const importHistory = useCallback((jsonData: string): boolean => {
    try {
      const importedHistory = searchUtils.history.importHistory(jsonData);
      if (importedHistory.length > 0) {
        // Merge with existing history, removing duplicates
        const mergedHistory = [...importedHistory];
        history.forEach(entry => {
          if (!mergedHistory.some(imported => 
            imported.query === entry.query && 
            imported.timestamp === entry.timestamp
          )) {
            mergedHistory.push(entry);
          }
        });
        
        // Sort by timestamp (newest first) and limit
        const sortedHistory = mergedHistory
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, MAX_HISTORY_ENTRIES);
        
        setHistory(sortedHistory);
        saveHistory(sortedHistory);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to import search history:', error);
      return false;
    }
  }, [history, saveHistory]);

  /**
   * Handle search executed event
   */
  const handleSearchExecuted = useCallback((event: CustomEvent) => {
    const { query, type, resultCount, filters } = event.detail;
    addEntry({
      query,
      type,
      resultCount,
      filters,
    });
  }, [addEntry]);

  // Load history on mount
  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Listen for search executed events
  useEffect(() => {
    window.addEventListener('searchExecuted', handleSearchExecuted as EventListener);
    return () => {
      window.removeEventListener('searchExecuted', handleSearchExecuted as EventListener);
    };
  }, [handleSearchExecuted]);

  return {
    // State
    history,
    isLoading,
    
    // Actions
    addEntry,
    removeEntry,
    clearHistory,
    searchHistory,
    exportHistory,
    importHistory,
    
    // Computed values
    recentQueries: getRecentQueries(),
    popularQueries: getPopularQueries(),
    stats: getStats(),
    isEmpty: history.length === 0,
    
    // Utility functions
    getRecentQueries,
    getPopularQueries,
  };
}

export default useSearchHistory;