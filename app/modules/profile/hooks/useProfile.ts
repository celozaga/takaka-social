// ============================================================================
// Profile Module - useProfile Hook
// ============================================================================
//
// This hook manages profile data fetching, caching, and state management.
// It provides functionality to fetch profile information, handle loading states,
// and manage profile updates.
//

import { useState, useEffect, useCallback, useRef } from 'react';
import { ProfileData, UseProfileOptions, UseProfileReturn, ProfilePreferences } from '../types';
import { profileUtils } from '../utils';
import { defaultApiClient } from '../../../core/api';

/**
 * Hook for managing profile data and operations
 */
export function useProfile(options: UseProfileOptions = {}): UseProfileReturn {
  const {
    did,
    autoRefresh = false,
    refreshInterval = 5 * 60 * 1000, // 5 minutes
    includeAnalytics = false,
  } = options;

  // State management
  const [profile, setProfile] = useState<ProfileData | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  // Refs for cleanup and caching
  const abortControllerRef = useRef<AbortController | null>(null);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const cacheRef = useRef<Map<string, { data: ProfileData; timestamp: number }>>(new Map());

  /**
   * Fetch profile data from API
   */
  const fetchProfile = useCallback(async (targetDid: string): Promise<ProfileData | undefined> => {
    try {
      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      // Check cache first
      const cacheKey = profileUtils.cache.generateKey(targetDid, includeAnalytics);
      const cached = cacheRef.current.get(cacheKey);
      
      if (cached && !profileUtils.cache.isExpired(cached.timestamp)) {
        return cached.data;
      }

      setIsLoading(true);
      setError(undefined);

      // Fetch from API
      const response = await defaultApiClient.getProfile({
        actor: targetDid,
      }, { signal });

      if (signal.aborted) {
        return undefined;
      }

      const profileData: ProfileData = {
        did: response.data.did,
        handle: response.data.handle,
        displayName: response.data.displayName,
        description: response.data.description,
        avatar: response.data.avatar,
        banner: response.data.banner,
        followersCount: response.data.followersCount || 0,
        followsCount: response.data.followsCount || 0,
        postsCount: response.data.postsCount || 0,
        indexedAt: response.data.indexedAt,
        createdAt: response.data.createdAt,
        labels: response.data.labels,
        viewer: profileUtils.parsers.parseViewerState(response.data.viewer),
        associated: response.data.associated,
        joinedViaStarterPack: response.data.joinedViaStarterPack,
      };

      // Cache the result
      cacheRef.current.set(cacheKey, {
        data: profileData,
        timestamp: Date.now(),
      });

      return profileData;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return undefined;
      }
      
      const errorMessage = err.message || 'Failed to fetch profile';
      setError(errorMessage);
      console.error('Profile fetch error:', err);
      return undefined;
    } finally {
      setIsLoading(false);
    }
  }, [includeAnalytics]);

  /**
   * Refresh profile data
   */
  const refresh = useCallback(async (): Promise<void> => {
    if (!did) {
      setError('No profile DID provided');
      return;
    }

    const profileData = await fetchProfile(did);
    if (profileData) {
      setProfile(profileData);
    }
  }, [did, fetchProfile]);

  /**
   * Update profile preferences
   */
  const updateProfile = useCallback(async (preferences: ProfilePreferences): Promise<void> => {
    if (!profile) {
      throw new Error('No profile loaded');
    }

    try {
      setIsLoading(true);
      setError(undefined);

      // Validate preferences
      const validation = profileUtils.validators.validatePreferences(preferences);
      if (!validation.valid) {
        throw new Error(validation.errors.join(', '));
      }

      // Prepare update data
      const updateData: any = {
        displayName: preferences.displayName,
        description: preferences.description,
      };

      // Handle avatar upload
      if (preferences.avatar instanceof Blob) {
        const avatarResponse = await defaultApiClient.uploadBlob(preferences.avatar, {
          encoding: 'image/jpeg',
        });
        updateData.avatar = avatarResponse.data.blob;
      } else if (typeof preferences.avatar === 'string') {
        updateData.avatar = preferences.avatar;
      }

      // Handle banner upload
      if (preferences.banner instanceof Blob) {
        const bannerResponse = await defaultApiClient.uploadBlob(preferences.banner, {
          encoding: 'image/jpeg',
        });
        updateData.banner = bannerResponse.data.blob;
      } else if (typeof preferences.banner === 'string') {
        updateData.banner = preferences.banner;
      }

      // Update profile
      await defaultApiClient.upsertProfile(updateData);

      // Refresh profile data
      await refresh();
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update profile';
      setError(errorMessage);
      console.error('Profile update error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [profile, refresh]);

  /**
   * Setup auto-refresh
   */
  const setupAutoRefresh = useCallback(() => {
    if (!autoRefresh || !did) return;

    const scheduleRefresh = () => {
      refreshTimeoutRef.current = setTimeout(async () => {
        await refresh();
        scheduleRefresh(); // Schedule next refresh
      }, refreshInterval);
    };

    scheduleRefresh();
  }, [autoRefresh, did, refresh, refreshInterval]);

  /**
   * Cleanup function
   */
  const cleanup = useCallback(() => {
    // Cancel ongoing requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // Clear refresh timeout
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }
  }, []);

  // Effect for initial load and DID changes
  useEffect(() => {
    if (did) {
      refresh();
    } else {
      setProfile(undefined);
      setError(undefined);
    }

    return cleanup;
  }, [did, refresh, cleanup]);

  // Effect for auto-refresh setup
  useEffect(() => {
    setupAutoRefresh();
    
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [setupAutoRefresh]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    profile,
    isLoading,
    error,
    refresh,
    updateProfile,
  };
}

export default useProfile;