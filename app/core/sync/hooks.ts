// ============================================================================
// Sync Hooks - React Hooks for Data Synchronization
// ============================================================================
//
// This module provides React hooks for managing data synchronization,
// including sync state, offline capabilities, and data persistence.
//

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  PreferencesSync, 
  ReadStateSync, 
  OfflineSync, 
  DataPersistence,
  SyncResult,
  SyncOptions 
} from './managers';
import { ApiClient } from '../api/client';

// ============================================================================
// TYPES
// ============================================================================

export interface SyncState {
  isLoading: boolean;
  lastSyncTime: number | null;
  error: string | null;
  hasChanges: boolean;
}

export interface UseSyncReturn {
  syncState: SyncState;
  sync: (options?: SyncOptions) => Promise<SyncResult>;
  clearError: () => void;
  reset: () => void;
}

export interface UseOfflineSyncReturn {
  isOnline: boolean;
  queueSize: number;
  queueAction: (action: any) => Promise<void>;
  processQueue: () => Promise<void>;
  clearQueue: () => Promise<void>;
}

export interface UsePersistenceReturn<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  set: (value: T, ttl?: number) => Promise<void>;
  remove: () => Promise<void>;
  refresh: () => Promise<void>;
}

// ============================================================================
// SYNC HOOK
// ============================================================================

export function useSync(apiClient: ApiClient): UseSyncReturn {
  const [syncState, setSyncState] = useState<SyncState>({
    isLoading: false,
    lastSyncTime: null,
    error: null,
    hasChanges: false,
  });

  const preferencesSync = useRef(PreferencesSync.getInstance(apiClient));
  const readStateSync = useRef(ReadStateSync.getInstance(apiClient));

  const sync = useCallback(async (options: SyncOptions = {}): Promise<SyncResult> => {
    setSyncState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Sync preferences
      const prefsResult = await preferencesSync.current.syncPreferences(options);
      
      if (!prefsResult.success) {
        throw new Error(prefsResult.error || 'Preferences sync failed');
      }

      setSyncState(prev => ({
        ...prev,
        isLoading: false,
        lastSyncTime: Date.now(),
        hasChanges: false,
      }));

      return prefsResult;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sync failed';
      
      setSyncState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));

      return {
        success: false,
        error: errorMessage,
        timestamp: Date.now(),
      };
    }
  }, []);

  const clearError = useCallback(() => {
    setSyncState(prev => ({ ...prev, error: null }));
  }, []);

  const reset = useCallback(() => {
    setSyncState({
      isLoading: false,
      lastSyncTime: null,
      error: null,
      hasChanges: false,
    });
  }, []);

  // Auto-sync on mount
  useEffect(() => {
    sync({ force: false });
  }, [sync]);

  return {
    syncState,
    sync,
    clearError,
    reset,
  };
}

// ============================================================================
// OFFLINE SYNC HOOK
// ============================================================================

export function useOfflineSync(apiClient: ApiClient): UseOfflineSyncReturn {
  const [isOnline, setIsOnline] = useState(true);
  const [queueSize, setQueueSize] = useState(0);
  
  const offlineSync = useRef(OfflineSync.getInstance(apiClient));

  const queueAction = useCallback(async (action: any): Promise<void> => {
    await offlineSync.current.queueAction(action);
    setQueueSize(prev => prev + 1);
  }, []);

  const processQueue = useCallback(async (): Promise<void> => {
    await offlineSync.current.processQueue();
    setQueueSize(0);
  }, []);

  const clearQueue = useCallback(async (): Promise<void> => {
    // In a real implementation, this would clear the queue
    setQueueSize(0);
  }, []);

  // Network status listener
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      processQueue();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    // In a real implementation, this would listen to actual network events
    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, [processQueue]);

  return {
    isOnline,
    queueSize,
    queueAction,
    processQueue,
    clearQueue,
  };
}

// ============================================================================
// PERSISTENCE HOOK
// ============================================================================

export function usePersistence<T>(key: string): UsePersistenceReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const persistence = useRef(DataPersistence.getInstance());

  const set = useCallback(async (value: T, ttl?: number): Promise<void> => {
    try {
      await persistence.current.set(key, value, ttl);
      setData(value);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save data';
      setError(errorMessage);
    }
  }, [key]);

  const remove = useCallback(async (): Promise<void> => {
    try {
      await persistence.current.remove(key);
      setData(null);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove data';
      setError(errorMessage);
    }
  }, [key]);

  const refresh = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const value = await persistence.current.get(key);
      setData(value);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load data';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [key]);

  // Load data on mount and key change
  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    data,
    isLoading,
    error,
    set,
    remove,
    refresh,
  };
}

// ============================================================================
// READ STATE HOOK
// ============================================================================

export function useReadState(apiClient: ApiClient) {
  const readStateSync = useRef(ReadStateSync.getInstance(apiClient));

  const markAsRead = useCallback(async (postUri: string): Promise<void> => {
    await readStateSync.current.markAsRead(postUri);
  }, []);

  const markAsUnread = useCallback(async (postUri: string): Promise<void> => {
    await readStateSync.current.markAsUnread(postUri);
  }, []);

  const isRead = useCallback((postUri: string): boolean => {
    return readStateSync.current.isRead(postUri);
  }, []);

  return {
    markAsRead,
    markAsUnread,
    isRead,
  };
}

// ============================================================================
// PREFERENCES SYNC HOOK
// ============================================================================

export function usePreferencesSync(apiClient: ApiClient) {
  const [preferences, setPreferences] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const preferencesSync = useRef(PreferencesSync.getInstance(apiClient));

  const syncPreferences = useCallback(async (options: SyncOptions = {}): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await preferencesSync.current.syncPreferences(options);
      
      if (result.success) {
        setPreferences(result.data);
      } else {
        setError(result.error || 'Sync failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sync failed';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto-sync on mount
  useEffect(() => {
    syncPreferences();
  }, [syncPreferences]);

  return {
    preferences,
    isLoading,
    error,
    syncPreferences,
  };
}

// ============================================================================
// BATCH SYNC HOOK
// ============================================================================

export function useBatchSync(apiClient: ApiClient) {
  const [syncStates, setSyncStates] = useState<Record<string, SyncState>>({});
  const [isGlobalSync, setIsGlobalSync] = useState(false);

  const preferencesSync = useRef(PreferencesSync.getInstance(apiClient));
  const offlineSync = useRef(OfflineSync.getInstance(apiClient));

  const syncAll = useCallback(async (options: SyncOptions = {}): Promise<void> => {
    setIsGlobalSync(true);
    
    const syncTasks = [
      {
        name: 'preferences',
        task: () => preferencesSync.current.syncPreferences(options),
      },
      {
        name: 'offline',
        task: () => offlineSync.current.processQueue(),
      },
    ];

    for (const { name, task } of syncTasks) {
      setSyncStates(prev => ({
        ...prev,
        [name]: { ...prev[name], isLoading: true, error: null },
      }));

      try {
        const result = await task();
        
        setSyncStates(prev => ({
          ...prev,
          [name]: {
            isLoading: false,
            lastSyncTime: Date.now(),
            error: null,
            hasChanges: false,
          },
        }));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Sync failed';
        
        setSyncStates(prev => ({
          ...prev,
          [name]: {
            ...prev[name],
            isLoading: false,
            error: errorMessage,
          },
        }));
      }
    }
    
    setIsGlobalSync(false);
  }, []);

  const getSyncState = useCallback((name: string): SyncState => {
    return syncStates[name] || {
      isLoading: false,
      lastSyncTime: null,
      error: null,
      hasChanges: false,
    };
  }, [syncStates]);

  return {
    syncStates,
    isGlobalSync,
    syncAll,
    getSyncState,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export const syncHooks = {
  useSync,
  useOfflineSync,
  usePersistence,
  useReadState,
  usePreferencesSync,
  useBatchSync,
};

export default syncHooks;