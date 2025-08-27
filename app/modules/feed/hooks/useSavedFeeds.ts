// ============================================================================
// useSavedFeeds Hook
// ============================================================================
//
// Hook for managing saved feeds functionality
//

import { useState, useEffect, useCallback } from 'react';
import { defaultApiClient } from '../../../core/api';
import { SavedFeed, FeedPreferences } from '../types';
import { helpers } from '../../../core/utils';

export interface UseSavedFeedsReturn {
  savedFeeds: SavedFeed[];
  isLoading: boolean;
  error: string | null;
  saveFeed: (feedUri: string, displayName?: string) => Promise<void>;
  unsaveFeed: (feedUri: string) => Promise<void>;
  isFeedSaved: (feedUri: string) => boolean;
  refreshSavedFeeds: () => Promise<void>;
  updateFeedPreferences: (feedUri: string, preferences: Partial<FeedPreferences>) => Promise<void>;
}

export function useSavedFeeds(): UseSavedFeedsReturn {
  const [savedFeeds, setSavedFeeds] = useState<SavedFeed[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load saved feeds from API
  const loadSavedFeeds = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await defaultApiClient.request({
        method: 'GET',
        url: '/xrpc/app.bsky.actor.getPreferences',
      });
      
      // Extract saved feeds from preferences
      const preferences = response.data?.preferences || [];
      const savedFeedsPrefs = preferences.filter(
        (pref: any) => pref.$type === 'app.bsky.actor.defs#savedFeedsPref'
      );
      
      if (savedFeedsPrefs.length > 0) {
        const feeds = savedFeedsPrefs[0].saved || [];
        setSavedFeeds(feeds);
      } else {
        setSavedFeeds([]);
      }
    } catch (err) {
      console.error('Failed to load saved feeds:', err);
      setError('Failed to load saved feeds');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save a feed
  const saveFeed = useCallback(async (feedUri: string, displayName?: string) => {
    try {
      setError(null);
      
      // Get current preferences
      const response = await defaultApiClient.request({
        method: 'GET',
        url: '/xrpc/app.bsky.actor.getPreferences',
      });
      
      const preferences = response.data?.preferences || [];
      let savedFeedsPrefs = preferences.find(
        (pref: any) => pref.$type === 'app.bsky.actor.defs#savedFeedsPref'
      );
      
      if (!savedFeedsPrefs) {
        savedFeedsPrefs = {
          $type: 'app.bsky.actor.defs#savedFeedsPref',
          saved: [],
          pinned: [],
        };
        preferences.push(savedFeedsPrefs);
      }
      
      // Add new feed if not already saved
      const existingIndex = savedFeedsPrefs.saved.findIndex(
        (feed: SavedFeed) => feed.value === feedUri
      );
      
      if (existingIndex === -1) {
        const newFeed: SavedFeed = {
          type: 'feed',
          value: feedUri,
          id: helpers.string.randomString(16),
          ...(displayName && { displayName }),
        };
        
        savedFeedsPrefs.saved.push(newFeed);
        
        // Update preferences
        await defaultApiClient.request({
          method: 'POST',
          url: '/xrpc/app.bsky.actor.putPreferences',
          data: { preferences },
        });
        
        // Update local state
        setSavedFeeds(prev => [...prev, newFeed]);
      }
    } catch (err) {
      console.error('Failed to save feed:', err);
      setError('Failed to save feed');
      throw err;
    }
  }, []);

  // Unsave a feed
  const unsaveFeed = useCallback(async (feedUri: string) => {
    try {
      setError(null);
      
      // Get current preferences
      const response = await defaultApiClient.request({
        method: 'GET',
        url: '/xrpc/app.bsky.actor.getPreferences',
      });
      
      const preferences = response.data?.preferences || [];
      const savedFeedsPrefs = preferences.find(
        (pref: any) => pref.$type === 'app.bsky.actor.defs#savedFeedsPref'
      );
      
      if (savedFeedsPrefs) {
        // Remove feed from saved list
        savedFeedsPrefs.saved = savedFeedsPrefs.saved.filter(
          (feed: SavedFeed) => feed.value !== feedUri
        );
        
        // Also remove from pinned if present
        savedFeedsPrefs.pinned = savedFeedsPrefs.pinned.filter(
          (feedId: string) => {
            const feed = savedFeedsPrefs.saved.find((f: SavedFeed) => f.id === feedId);
            return feed?.value !== feedUri;
          }
        );
        
        // Update preferences
        await defaultApiClient.request({
          method: 'POST',
          url: '/xrpc/app.bsky.actor.putPreferences',
          data: { preferences },
        });
        
        // Update local state
        setSavedFeeds(prev => prev.filter(feed => feed.value !== feedUri));
      }
    } catch (err) {
      console.error('Failed to unsave feed:', err);
      setError('Failed to unsave feed');
      throw err;
    }
  }, []);

  // Check if a feed is saved
  const isFeedSaved = useCallback((feedUri: string): boolean => {
    return savedFeeds.some(feed => feed.value === feedUri);
  }, [savedFeeds]);

  // Refresh saved feeds
  const refreshSavedFeeds = useCallback(async () => {
    await loadSavedFeeds();
  }, [loadSavedFeeds]);

  // Update feed preferences
  const updateFeedPreferences = useCallback(async (
    feedUri: string,
    preferences: Partial<FeedPreferences>
  ) => {
    try {
      setError(null);
      
      // Update local state optimistically
      setSavedFeeds(prev => 
        prev.map(feed => 
          feed.value === feedUri 
            ? { ...feed, ...preferences }
            : feed
        )
      );
      
      // Here you would typically update the preferences on the server
      // This depends on how feed preferences are stored in your backend
      
    } catch (err) {
      console.error('Failed to update feed preferences:', err);
      setError('Failed to update feed preferences');
      // Revert optimistic update
      await loadSavedFeeds();
      throw err;
    }
  }, [loadSavedFeeds]);

  // Load saved feeds on mount
  useEffect(() => {
    loadSavedFeeds();
  }, [loadSavedFeeds]);

  return {
    savedFeeds,
    isLoading,
    error,
    saveFeed,
    unsaveFeed,
    isFeedSaved,
    refreshSavedFeeds,
    updateFeedPreferences,
  };
}