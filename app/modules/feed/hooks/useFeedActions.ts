// ============================================================================
// useFeedActions Hook
// ============================================================================
//
// Hook for managing feed actions like pinning, reordering, and preferences
//

import { useState, useCallback } from 'react';
import { defaultApiClient } from '../../../core/api';
import { SavedFeed } from '../types';
import { helpers } from '../../../core/utils';

export interface UseFeedActionsReturn {
  isLoading: boolean;
  error: string | null;
  pinFeed: (feedId: string) => Promise<void>;
  unpinFeed: (feedId: string) => Promise<void>;
  reorderFeeds: (feedIds: string[]) => Promise<void>;
  toggleFeedPin: (feedId: string) => Promise<void>;
  updateFeedDisplayName: (feedId: string, displayName: string) => Promise<void>;
  clearError: () => void;
}

export function useFeedActions(): UseFeedActionsReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper to get current preferences
  const getCurrentPreferences = useCallback(async () => {
    const response = await defaultApiClient.request({
      method: 'GET',
      url: '/xrpc/app.bsky.actor.getPreferences',
    });
    
    return response.data?.preferences || [];
  }, []);

  // Helper to update preferences
  const updatePreferences = useCallback(async (preferences: any[]) => {
    await defaultApiClient.request({
      method: 'POST',
      url: '/xrpc/app.bsky.actor.putPreferences',
      data: { preferences },
    });
  }, []);

  // Pin a feed
  const pinFeed = useCallback(async (feedId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const preferences = await getCurrentPreferences();
      const savedFeedsPrefs = preferences.find(
        (pref: any) => pref.$type === 'app.bsky.actor.defs#savedFeedsPref'
      );
      
      if (savedFeedsPrefs) {
        // Check if feed exists in saved feeds
        const feedExists = savedFeedsPrefs.saved.some(
          (feed: SavedFeed) => feed.id === feedId
        );
        
        if (feedExists && !savedFeedsPrefs.pinned.includes(feedId)) {
          savedFeedsPrefs.pinned.push(feedId);
          await updatePreferences(preferences);
        }
      }
    } catch (err) {
      console.error('Failed to pin feed:', err);
      setError('Failed to pin feed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [getCurrentPreferences, updatePreferences]);

  // Unpin a feed
  const unpinFeed = useCallback(async (feedId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const preferences = await getCurrentPreferences();
      const savedFeedsPrefs = preferences.find(
        (pref: any) => pref.$type === 'app.bsky.actor.defs#savedFeedsPref'
      );
      
      if (savedFeedsPrefs) {
        savedFeedsPrefs.pinned = savedFeedsPrefs.pinned.filter(
          (id: string) => id !== feedId
        );
        await updatePreferences(preferences);
      }
    } catch (err) {
      console.error('Failed to unpin feed:', err);
      setError('Failed to unpin feed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [getCurrentPreferences, updatePreferences]);

  // Reorder feeds (for pinned feeds)
  const reorderFeeds = useCallback(async (feedIds: string[]) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const preferences = await getCurrentPreferences();
      const savedFeedsPrefs = preferences.find(
        (pref: any) => pref.$type === 'app.bsky.actor.defs#savedFeedsPref'
      );
      
      if (savedFeedsPrefs) {
        // Validate that all feedIds exist in saved feeds
        const validFeedIds = feedIds.filter(id => 
          savedFeedsPrefs.saved.some((feed: SavedFeed) => feed.id === id)
        );
        
        savedFeedsPrefs.pinned = validFeedIds;
        await updatePreferences(preferences);
      }
    } catch (err) {
      console.error('Failed to reorder feeds:', err);
      setError('Failed to reorder feeds');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [getCurrentPreferences, updatePreferences]);

  // Toggle feed pin status
  const toggleFeedPin = useCallback(async (feedId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const preferences = await getCurrentPreferences();
      const savedFeedsPrefs = preferences.find(
        (pref: any) => pref.$type === 'app.bsky.actor.defs#savedFeedsPref'
      );
      
      if (savedFeedsPrefs) {
        const isPinned = savedFeedsPrefs.pinned.includes(feedId);
        
        if (isPinned) {
          // Unpin the feed
          savedFeedsPrefs.pinned = savedFeedsPrefs.pinned.filter(
            (id: string) => id !== feedId
          );
        } else {
          // Pin the feed (check if it exists in saved feeds first)
          const feedExists = savedFeedsPrefs.saved.some(
            (feed: SavedFeed) => feed.id === feedId
          );
          
          if (feedExists) {
            savedFeedsPrefs.pinned.push(feedId);
          }
        }
        
        await updatePreferences(preferences);
      }
    } catch (err) {
      console.error('Failed to toggle feed pin:', err);
      setError('Failed to toggle feed pin');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [getCurrentPreferences, updatePreferences]);

  // Update feed display name
  const updateFeedDisplayName = useCallback(async (
    feedId: string,
    displayName: string
  ) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const preferences = await getCurrentPreferences();
      const savedFeedsPrefs = preferences.find(
        (pref: any) => pref.$type === 'app.bsky.actor.defs#savedFeedsPref'
      );
      
      if (savedFeedsPrefs) {
        const feedIndex = savedFeedsPrefs.saved.findIndex(
          (feed: SavedFeed) => feed.id === feedId
        );
        
        if (feedIndex !== -1) {
          savedFeedsPrefs.saved[feedIndex] = {
            ...savedFeedsPrefs.saved[feedIndex],
            displayName: displayName.trim() || undefined,
          };
          
          await updatePreferences(preferences);
        }
      }
    } catch (err) {
      console.error('Failed to update feed display name:', err);
      setError('Failed to update feed display name');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [getCurrentPreferences, updatePreferences]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isLoading,
    error,
    pinFeed,
    unpinFeed,
    reorderFeeds,
    toggleFeedPin,
    updateFeedDisplayName,
    clearError,
  };
}