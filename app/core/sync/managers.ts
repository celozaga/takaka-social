// ============================================================================
// Sync Managers - Data Synchronization Management
// ============================================================================
//
// This module provides managers for different types of data synchronization
// including preferences, read state, offline sync, and data persistence.
//

import { AsyncStorage } from '@react-native-async-storage/async-storage';
import { ApiClient } from '../api/client';
import { AppBskyActorDefs, AppBskyFeedDefs } from '@atproto/api';

// ============================================================================
// TYPES
// ============================================================================

export interface SyncResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

export interface SyncOptions {
  force?: boolean;
  timeout?: number;
  retries?: number;
}

export interface ConflictResolution {
  strategy: 'local' | 'remote' | 'merge' | 'manual';
  resolver?: (local: any, remote: any) => any;
}

// ============================================================================
// PREFERENCES SYNC MANAGER
// ============================================================================

export class PreferencesSync {
  private static instance: PreferencesSync;
  private apiClient: ApiClient;
  private syncInProgress = false;
  private lastSyncTime = 0;

  private constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
  }

  static getInstance(apiClient: ApiClient): PreferencesSync {
    if (!PreferencesSync.instance) {
      PreferencesSync.instance = new PreferencesSync(apiClient);
    }
    return PreferencesSync.instance;
  }

  async syncPreferences(options: SyncOptions = {}): Promise<SyncResult> {
    if (this.syncInProgress && !options.force) {
      return {
        success: false,
        error: 'Sync already in progress',
        timestamp: Date.now(),
      };
    }

    this.syncInProgress = true;

    try {
      // Get local preferences
      const localPrefs = await this.getLocalPreferences();
      
      // Get remote preferences
      const remotePrefs = await this.getRemotePreferences();

      // Resolve conflicts
      const mergedPrefs = this.mergePreferences(localPrefs, remotePrefs);

      // Save merged preferences locally
      await this.saveLocalPreferences(mergedPrefs);

      // Upload to remote if needed
      if (this.hasLocalChanges(localPrefs, mergedPrefs)) {
        await this.uploadPreferences(mergedPrefs);
      }

      this.lastSyncTime = Date.now();

      return {
        success: true,
        data: mergedPrefs,
        timestamp: this.lastSyncTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now(),
      };
    } finally {
      this.syncInProgress = false;
    }
  }

  private async getLocalPreferences(): Promise<any> {
    try {
      const stored = await AsyncStorage.getItem('user_preferences');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }

  private async getRemotePreferences(): Promise<any> {
    try {
      const response = await this.apiClient.getPreferences();
      return response.preferences || {};
    } catch {
      return {};
    }
  }

  private mergePreferences(local: any, remote: any): any {
    // Simple merge strategy - remote takes precedence for conflicts
    return {
      ...local,
      ...remote,
      lastModified: Math.max(local.lastModified || 0, remote.lastModified || 0),
    };
  }

  private hasLocalChanges(original: any, merged: any): boolean {
    return JSON.stringify(original) !== JSON.stringify(merged);
  }

  private async saveLocalPreferences(preferences: any): Promise<void> {
    await AsyncStorage.setItem('user_preferences', JSON.stringify(preferences));
  }

  private async uploadPreferences(preferences: any): Promise<void> {
    await this.apiClient.putPreferences({ preferences });
  }
}

// ============================================================================
// READ STATE SYNC MANAGER
// ============================================================================

export class ReadStateSync {
  private static instance: ReadStateSync;
  private apiClient: ApiClient;
  private readStates = new Map<string, boolean>();
  private pendingUpdates = new Set<string>();

  private constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
    this.loadReadStates();
  }

  static getInstance(apiClient: ApiClient): ReadStateSync {
    if (!ReadStateSync.instance) {
      ReadStateSync.instance = new ReadStateSync(apiClient);
    }
    return ReadStateSync.instance;
  }

  async markAsRead(postUri: string): Promise<void> {
    this.readStates.set(postUri, true);
    this.pendingUpdates.add(postUri);
    await this.saveReadStates();
    
    // Debounced sync
    this.debouncedSync();
  }

  async markAsUnread(postUri: string): Promise<void> {
    this.readStates.set(postUri, false);
    this.pendingUpdates.add(postUri);
    await this.saveReadStates();
    
    this.debouncedSync();
  }

  isRead(postUri: string): boolean {
    return this.readStates.get(postUri) || false;
  }

  private syncTimeout?: NodeJS.Timeout;

  private debouncedSync(): void {
    if (this.syncTimeout) {
      clearTimeout(this.syncTimeout);
    }
    
    this.syncTimeout = setTimeout(() => {
      this.syncReadStates();
    }, 2000); // 2 second debounce
  }

  private async syncReadStates(): Promise<void> {
    if (this.pendingUpdates.size === 0) return;

    try {
      const updates = Array.from(this.pendingUpdates).map(uri => ({
        uri,
        read: this.readStates.get(uri) || false,
      }));

      // In a real implementation, this would sync with the server
      // For now, we just clear pending updates
      this.pendingUpdates.clear();
    } catch (error) {
      console.error('Failed to sync read states:', error);
    }
  }

  private async loadReadStates(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('read_states');
      if (stored) {
        const data = JSON.parse(stored);
        this.readStates = new Map(Object.entries(data));
      }
    } catch (error) {
      console.error('Failed to load read states:', error);
    }
  }

  private async saveReadStates(): Promise<void> {
    try {
      const data = Object.fromEntries(this.readStates);
      await AsyncStorage.setItem('read_states', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save read states:', error);
    }
  }
}

// ============================================================================
// OFFLINE SYNC MANAGER
// ============================================================================

export class OfflineSync {
  private static instance: OfflineSync;
  private apiClient: ApiClient;
  private offlineQueue: any[] = [];
  private isOnline = true;

  private constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
    this.loadOfflineQueue();
    this.setupNetworkListener();
  }

  static getInstance(apiClient: ApiClient): OfflineSync {
    if (!OfflineSync.instance) {
      OfflineSync.instance = new OfflineSync(apiClient);
    }
    return OfflineSync.instance;
  }

  async queueAction(action: any): Promise<void> {
    this.offlineQueue.push({
      ...action,
      timestamp: Date.now(),
      id: this.generateId(),
    });
    
    await this.saveOfflineQueue();
    
    if (this.isOnline) {
      this.processQueue();
    }
  }

  async processQueue(): Promise<void> {
    if (!this.isOnline || this.offlineQueue.length === 0) return;

    const queue = [...this.offlineQueue];
    this.offlineQueue = [];

    for (const action of queue) {
      try {
        await this.executeAction(action);
      } catch (error) {
        // Re-queue failed actions
        this.offlineQueue.push(action);
        console.error('Failed to execute queued action:', error);
      }
    }

    await this.saveOfflineQueue();
  }

  private async executeAction(action: any): Promise<void> {
    switch (action.type) {
      case 'like':
        await this.apiClient.like(action.uri, action.cid);
        break;
      case 'unlike':
        await this.apiClient.deleteLike(action.likeUri);
        break;
      case 'repost':
        await this.apiClient.repost(action.uri, action.cid);
        break;
      case 'unrepost':
        await this.apiClient.deleteRepost(action.repostUri);
        break;
      case 'follow':
        await this.apiClient.follow(action.did);
        break;
      case 'unfollow':
        await this.apiClient.deleteFollow(action.followUri);
        break;
      default:
        console.warn('Unknown action type:', action.type);
    }
  }

  private setupNetworkListener(): void {
    // In a real implementation, this would listen to network state changes
    // For now, we assume online
    this.isOnline = true;
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private async loadOfflineQueue(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('offline_queue');
      if (stored) {
        this.offlineQueue = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load offline queue:', error);
    }
  }

  private async saveOfflineQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem('offline_queue', JSON.stringify(this.offlineQueue));
    } catch (error) {
      console.error('Failed to save offline queue:', error);
    }
  }
}

// ============================================================================
// DATA PERSISTENCE MANAGER
// ============================================================================

export class DataPersistence {
  private static instance: DataPersistence;
  private cache = new Map<string, any>();
  private cacheExpiry = new Map<string, number>();

  private constructor() {
    this.loadCache();
  }

  static getInstance(): DataPersistence {
    if (!DataPersistence.instance) {
      DataPersistence.instance = new DataPersistence();
    }
    return DataPersistence.instance;
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    this.cache.set(key, value);
    
    if (ttl) {
      this.cacheExpiry.set(key, Date.now() + ttl);
    }
    
    await this.persistToStorage(key, value, ttl);
  }

  async get(key: string): Promise<any> {
    // Check if expired
    const expiry = this.cacheExpiry.get(key);
    if (expiry && Date.now() > expiry) {
      this.cache.delete(key);
      this.cacheExpiry.delete(key);
      await AsyncStorage.removeItem(`cache_${key}`);
      return null;
    }

    // Return from memory cache
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }

    // Load from storage
    try {
      const stored = await AsyncStorage.getItem(`cache_${key}`);
      if (stored) {
        const data = JSON.parse(stored);
        this.cache.set(key, data.value);
        if (data.expiry) {
          this.cacheExpiry.set(key, data.expiry);
        }
        return data.value;
      }
    } catch (error) {
      console.error('Failed to load from cache:', error);
    }

    return null;
  }

  async remove(key: string): Promise<void> {
    this.cache.delete(key);
    this.cacheExpiry.delete(key);
    await AsyncStorage.removeItem(`cache_${key}`);
  }

  async clear(): Promise<void> {
    const keys = Array.from(this.cache.keys());
    this.cache.clear();
    this.cacheExpiry.clear();
    
    // Remove from storage
    const storageKeys = keys.map(key => `cache_${key}`);
    await AsyncStorage.multiRemove(storageKeys);
  }

  private async persistToStorage(key: string, value: any, ttl?: number): Promise<void> {
    try {
      const data = {
        value,
        expiry: ttl ? Date.now() + ttl : null,
        timestamp: Date.now(),
      };
      
      await AsyncStorage.setItem(`cache_${key}`, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to persist to storage:', error);
    }
  }

  private async loadCache(): Promise<void> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const cacheKeys = allKeys.filter(key => key.startsWith('cache_'));
      
      if (cacheKeys.length === 0) return;
      
      const items = await AsyncStorage.multiGet(cacheKeys);
      
      for (const [storageKey, value] of items) {
        if (!value) continue;
        
        try {
          const data = JSON.parse(value);
          const key = storageKey.replace('cache_', '');
          
          // Check if expired
          if (data.expiry && Date.now() > data.expiry) {
            await AsyncStorage.removeItem(storageKey);
            continue;
          }
          
          this.cache.set(key, data.value);
          if (data.expiry) {
            this.cacheExpiry.set(key, data.expiry);
          }
        } catch (error) {
          console.error('Failed to parse cached item:', error);
          await AsyncStorage.removeItem(storageKey);
        }
      }
    } catch (error) {
      console.error('Failed to load cache:', error);
    }
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const syncManagers = {
  preferences: PreferencesSync,
  readState: ReadStateSync,
  offline: OfflineSync,
  persistence: DataPersistence,
};

export default syncManagers;