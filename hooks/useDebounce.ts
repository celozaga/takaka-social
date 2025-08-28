import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { debounce } from 'lodash';

/**
 * Hook for debouncing values with configurable delay
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook for debouncing callbacks with automatic cleanup
 */
export const useDebouncedCallback = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  deps: React.DependencyList = []
): T => {
  const callbackRef = useRef(callback);
  
  // Update callback ref when dependencies change
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback, ...deps]);

  const debouncedCallback = useMemo(
    () => debounce((...args: Parameters<T>) => {
      return callbackRef.current(...args);
    }, delay),
    [delay]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      debouncedCallback.cancel();
    };
  }, [debouncedCallback]);

  return debouncedCallback as unknown as T;
};

/**
 * Hook for search functionality with debouncing and loading states
 */
export const useDebouncedSearch = <T>(
  searchFunction: (query: string) => Promise<T[]>,
  delay: number = 300
) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const debouncedQuery = useDebounce(query, delay);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();
    
    setIsLoading(true);
    setError(null);

    try {
      const searchResults = await searchFunction(searchQuery);
      
      // Only update if this request wasn't aborted
      if (!abortControllerRef.current?.signal.aborted) {
        setResults(searchResults);
      }
    } catch (err) {
      if (!abortControllerRef.current?.signal.aborted) {
        setError(err instanceof Error ? err.message : 'Search failed');
        setResults([]);
      }
    } finally {
      if (!abortControllerRef.current?.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, [searchFunction]);

  // Trigger search when debounced query changes
  useEffect(() => {
    performSearch(debouncedQuery);
  }, [debouncedQuery, performSearch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const clearSearch = useCallback(() => {
    setQuery('');
    setResults([]);
    setError(null);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  return {
    query,
    setQuery,
    results,
    isLoading,
    error,
    clearSearch,
  };
};

/**
 * Hook for debouncing API actions (like, follow, etc.)
 */
export const useDebouncedAction = <T extends (...args: any[]) => Promise<any>>(
  action: T,
  delay: number = 500
) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pendingActionsRef = useRef(new Map<string, any>());

  const debouncedAction = useDebouncedCallback(
    async (...args: Parameters<T>) => {
      const actionKey = JSON.stringify(args);
      
      // If this exact action is already pending, return the existing promise
      if (pendingActionsRef.current.has(actionKey)) {
        return pendingActionsRef.current.get(actionKey);
      }

      setIsLoading(true);
      setError(null);

      const actionPromise = action(...args)
        .then((result) => {
          setIsLoading(false);
          pendingActionsRef.current.delete(actionKey);
          return result;
        })
        .catch((err) => {
          setIsLoading(false);
          setError(err instanceof Error ? err.message : 'Action failed');
          pendingActionsRef.current.delete(actionKey);
          throw err;
        });

      pendingActionsRef.current.set(actionKey, actionPromise);
      return actionPromise;
    },
    delay,
    [action]
  );

  return {
    execute: debouncedAction,
    isLoading,
    error,
    clearError: () => setError(null),
  };
};

/**
 * Hook for throttling scroll events
 */
export const useThrottledScroll = (
  callback: (event: any) => void,
  delay: number = 100
) => {
  const throttledCallback = useMemo(
    () => debounce(callback, delay, { leading: true, trailing: false }),
    [callback, delay]
  );

  useEffect(() => {
    return () => {
      throttledCallback.cancel();
    };
  }, [throttledCallback]);

  return throttledCallback;
};
