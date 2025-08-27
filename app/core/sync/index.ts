// ============================================================================
// Sync Core Module - Barrel Export
// ============================================================================
// 
// This module provides all data synchronization functionality including:
// - Data synchronization managers
// - Sync strategies and conflict resolution
// - Offline sync capabilities
// - Data persistence
//

// ============================================================================
// MANAGERS
// ============================================================================

// Sync Managers
export {
  PreferencesSync,
  ReadStateSync,
  OfflineSync,
  DataPersistence,
  syncManagers,
} from './managers';

// ============================================================================
// HOOKS
// ============================================================================

// Sync Hooks
export {
  useSync,
  useOfflineSync,
  usePersistence,
  useReadState,
  usePreferencesSync,
  useBatchSync,
  syncHooks,
} from './hooks';

// ============================================================================
// TYPES
// ============================================================================

export type {
  SyncResult,
  SyncOptions,
  ConflictResolution,
  SyncState,
  UseSyncReturn,
  UseOfflineSyncReturn,
  UsePersistenceReturn,
} from './managers';

export type {
  SyncState as HookSyncState,
  UseSyncReturn as HookUseSyncReturn,
  UseOfflineSyncReturn as HookUseOfflineSyncReturn,
  UsePersistenceReturn as HookUsePersistenceReturn,
} from './hooks';

// ============================================================================
// UTILITIES
// ============================================================================

// Sync utilities
export const syncUtils = {
  // Create sync manager instances
  createSyncManagers: (apiClient: any) => ({
    preferences: PreferencesSync.getInstance(apiClient),
    readState: ReadStateSync.getInstance(apiClient),
    offline: OfflineSync.getInstance(apiClient),
    persistence: DataPersistence.getInstance(),
  }),

  // Sync status helpers
  isSyncInProgress: (syncState: SyncState): boolean => {
    return syncState.isLoading;
  },

  hasSyncError: (syncState: SyncState): boolean => {
    return syncState.error !== null;
  },

  getLastSyncTime: (syncState: SyncState): Date | null => {
    return syncState.lastSyncTime ? new Date(syncState.lastSyncTime) : null;
  },

  // Conflict resolution strategies
  conflictStrategies: {
    useLocal: (local: any, remote: any) => local,
    useRemote: (local: any, remote: any) => remote,
    useNewest: (local: any, remote: any) => {
      const localTime = local.lastModified || 0;
      const remoteTime = remote.lastModified || 0;
      return localTime > remoteTime ? local : remote;
    },
    merge: (local: any, remote: any) => ({
      ...local,
      ...remote,
      lastModified: Math.max(local.lastModified || 0, remote.lastModified || 0),
    }),
  },

  // Retry logic
  withRetry: async <T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> => {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (attempt === maxRetries) {
          throw lastError;
        }
        
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt)));
      }
    }
    
    throw lastError!;
  },

  // Debounce utility for sync operations
  createDebouncer: (delay: number = 1000) => {
    let timeoutId: NodeJS.Timeout | null = null;
    
    return (callback: () => void) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      timeoutId = setTimeout(callback, delay);
    };
  },

  // Batch operations
  batchOperations: async <T>(
    operations: (() => Promise<T>)[],
    batchSize: number = 5
  ): Promise<T[]> => {
    const results: T[] = [];
    
    for (let i = 0; i < operations.length; i += batchSize) {
      const batch = operations.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch.map(op => op()));
      results.push(...batchResults);
    }
    
    return results;
  },
};

// ============================================================================
// CONSTANTS
// ============================================================================

export const SYNC_CONSTANTS = {
  DEFAULT_RETRY_COUNT: 3,
  DEFAULT_RETRY_DELAY: 1000,
  DEFAULT_DEBOUNCE_DELAY: 2000,
  DEFAULT_BATCH_SIZE: 5,
  DEFAULT_CACHE_TTL: 24 * 60 * 60 * 1000, // 24 hours
  SYNC_INTERVALS: {
    PREFERENCES: 5 * 60 * 1000, // 5 minutes
    READ_STATE: 30 * 1000, // 30 seconds
    OFFLINE_QUEUE: 10 * 1000, // 10 seconds
  },
};

// ============================================================================
// DEFAULT EXPORTS
// ============================================================================

export default {
  managers: syncManagers,
  hooks: syncHooks,
  utils: syncUtils,
  constants: SYNC_CONSTANTS,
};