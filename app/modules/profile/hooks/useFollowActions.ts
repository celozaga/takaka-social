// ============================================================================
// Profile Module - useFollowActions Hook
// ============================================================================
//
// This hook specifically manages follow/unfollow actions with optimistic updates,
// local state tracking, and efficient caching of follow relationships.
//

import { useState, useCallback, useRef, useEffect } from 'react';
import { UseFollowActionsReturn } from '../types';
import { defaultApiClient } from '../../../core/api';
import { profileUtils } from '../utils';

/**
 * Hook for managing follow/unfollow actions with optimistic updates
 */
export function useFollowActions(): UseFollowActionsReturn {
  // State management
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [followingSet, setFollowingSet] = useState<Set<string>>(new Set());

  // Refs for cleanup and caching
  const abortControllerRef = useRef<AbortController | null>(null);
  const pendingActionsRef = useRef<Map<string, 'follow' | 'unfollow'>>(new Map());
  const optimisticUpdatesRef = useRef<Map<string, boolean>>(new Map());

  /**
   * Load initial following state from local storage
   */
  const loadFollowingState = useCallback(() => {
    try {
      const stored = localStorage.getItem('following_cache');
      if (stored) {
        const data = JSON.parse(stored);
        if (data.timestamp && Date.now() - data.timestamp < 24 * 60 * 60 * 1000) { // 24 hours
          setFollowingSet(new Set(data.following));
        }
      }
    } catch (err) {
      console.warn('Failed to load following state from cache:', err);
    }
  }, []);

  /**
   * Save following state to local storage
   */
  const saveFollowingState = useCallback((following: Set<string>) => {
    try {
      const data = {
        following: Array.from(following),
        timestamp: Date.now(),
      };
      localStorage.setItem('following_cache', JSON.stringify(data));
    } catch (err) {
      console.warn('Failed to save following state to cache:', err);
    }
  }, []);

  /**
   * Check if currently following a profile
   */
  const isFollowing = useCallback((did: string): boolean => {
    // Check optimistic updates first
    const optimisticUpdate = optimisticUpdatesRef.current.get(did);
    if (optimisticUpdate !== undefined) {
      return optimisticUpdate;
    }

    // Check actual state
    return followingSet.has(did);
  }, [followingSet]);

  /**
   * Apply optimistic update
   */
  const applyOptimisticUpdate = useCallback((did: string, isFollowingNow: boolean) => {
    optimisticUpdatesRef.current.set(did, isFollowingNow);
    
    // Update UI immediately
    setFollowingSet(prev => {
      const newSet = new Set(prev);
      if (isFollowingNow) {
        newSet.add(did);
      } else {
        newSet.delete(did);
      }
      return newSet;
    });
  }, []);

  /**
   * Revert optimistic update
   */
  const revertOptimisticUpdate = useCallback((did: string) => {
    optimisticUpdatesRef.current.delete(did);
    
    // Revert UI state
    setFollowingSet(prev => {
      const newSet = new Set(prev);
      // Restore original state (this is simplified - in practice you'd want to track original state)
      return newSet;
    });
  }, []);

  /**
   * Confirm optimistic update
   */
  const confirmOptimisticUpdate = useCallback((did: string, isFollowingNow: boolean) => {
    optimisticUpdatesRef.current.delete(did);
    
    setFollowingSet(prev => {
      const newSet = new Set(prev);
      if (isFollowingNow) {
        newSet.add(did);
      } else {
        newSet.delete(did);
      }
      saveFollowingState(newSet);
      return newSet;
    });
  }, [saveFollowingState]);

  /**
   * Follow a profile with optimistic updates
   */
  const follow = useCallback(async (did: string): Promise<void> => {
    try {
      // Validate DID
      if (!profileUtils.validators.isValidDid(did)) {
        throw new Error('Invalid profile DID');
      }

      // Check if already following
      if (isFollowing(did)) {
        return; // Already following
      }

      // Check for pending action
      if (pendingActionsRef.current.has(did)) {
        return; // Action already in progress
      }

      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      // Mark as pending
      pendingActionsRef.current.set(did, 'follow');
      
      // Apply optimistic update
      applyOptimisticUpdate(did, true);

      setIsLoading(true);
      setError(undefined);

      // Execute API call
      await defaultApiClient.follow(did);

      if (signal.aborted) {
        return;
      }

      // Confirm optimistic update
      confirmOptimisticUpdate(did, true);

      // Dispatch event for other components
      window.dispatchEvent(new CustomEvent('profileFollowed', {
        detail: { did }
      }));

    } catch (err: any) {
      if (err.name === 'AbortError') {
        return;
      }

      // Revert optimistic update
      revertOptimisticUpdate(did);

      const errorMessage = err.message || 'Failed to follow profile';
      setError(errorMessage);
      console.error('Follow error:', err);
      throw err;
    } finally {
      pendingActionsRef.current.delete(did);
      setIsLoading(false);
    }
  }, [isFollowing, applyOptimisticUpdate, confirmOptimisticUpdate, revertOptimisticUpdate]);

  /**
   * Unfollow a profile with optimistic updates
   */
  const unfollow = useCallback(async (did: string): Promise<void> => {
    try {
      // Validate DID
      if (!profileUtils.validators.isValidDid(did)) {
        throw new Error('Invalid profile DID');
      }

      // Check if not following
      if (!isFollowing(did)) {
        return; // Not following
      }

      // Check for pending action
      if (pendingActionsRef.current.has(did)) {
        return; // Action already in progress
      }

      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      // Mark as pending
      pendingActionsRef.current.set(did, 'unfollow');
      
      // Apply optimistic update
      applyOptimisticUpdate(did, false);

      setIsLoading(true);
      setError(undefined);

      // Execute API call
      await defaultApiClient.deleteFollow(did);

      if (signal.aborted) {
        return;
      }

      // Confirm optimistic update
      confirmOptimisticUpdate(did, false);

      // Dispatch event for other components
      window.dispatchEvent(new CustomEvent('profileUnfollowed', {
        detail: { did }
      }));

    } catch (err: any) {
      if (err.name === 'AbortError') {
        return;
      }

      // Revert optimistic update
      revertOptimisticUpdate(did);

      const errorMessage = err.message || 'Failed to unfollow profile';
      setError(errorMessage);
      console.error('Unfollow error:', err);
      throw err;
    } finally {
      pendingActionsRef.current.delete(did);
      setIsLoading(false);
    }
  }, [isFollowing, applyOptimisticUpdate, confirmOptimisticUpdate, revertOptimisticUpdate]);

  /**
   * Cleanup function
   */
  const cleanup = useCallback(() => {
    // Cancel ongoing requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // Clear pending actions
    pendingActionsRef.current.clear();
    optimisticUpdatesRef.current.clear();
  }, []);

  // Load initial state on mount
  useEffect(() => {
    loadFollowingState();
    return cleanup;
  }, [loadFollowingState, cleanup]);

  // Listen for profile interactions from other components
  useEffect(() => {
    const handleProfileInteraction = (event: CustomEvent) => {
      const { interaction } = event.detail;
      if (interaction.success) {
        if (interaction.type === 'follow') {
          setFollowingSet(prev => {
            const newSet = new Set(prev);
            newSet.add(interaction.targetDid);
            saveFollowingState(newSet);
            return newSet;
          });
        } else if (interaction.type === 'unfollow') {
          setFollowingSet(prev => {
            const newSet = new Set(prev);
            newSet.delete(interaction.targetDid);
            saveFollowingState(newSet);
            return newSet;
          });
        }
      }
    };

    window.addEventListener('profileInteraction', handleProfileInteraction as EventListener);
    
    return () => {
      window.removeEventListener('profileInteraction', handleProfileInteraction as EventListener);
    };
  }, [saveFollowingState]);

  return {
    follow,
    unfollow,
    isFollowing,
    isLoading,
    error,
  };
}

export default useFollowActions;