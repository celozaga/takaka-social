// ============================================================================
// Profile Module - useProfileActions Hook
// ============================================================================
//
// This hook manages profile-related actions such as following, blocking,
// muting, and reporting profiles. It provides optimistic updates and
// error handling for all profile interactions.
//

import { useState, useCallback, useRef } from 'react';
import { UseProfileActionsReturn, ProfileInteraction, ProfileInteractionType } from '../types';
import { defaultApiClient } from '../../../core/api';
import { profileUtils } from '../utils';

/**
 * Hook for managing profile actions and interactions
 */
export function useProfileActions(): UseProfileActionsReturn {
  // State management
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  // Refs for tracking interactions
  const abortControllerRef = useRef<AbortController | null>(null);
  const interactionHistoryRef = useRef<ProfileInteraction[]>([]);

  /**
   * Generic function to handle profile interactions
   */
  const handleInteraction = useCallback(async (
    type: ProfileInteractionType,
    targetDid: string,
    apiCall: () => Promise<any>,
    additionalData?: any
  ): Promise<void> => {
    try {
      // Validate DID
      if (!profileUtils.validators.isValidDid(targetDid)) {
        throw new Error('Invalid profile DID');
      }

      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      setIsLoading(true);
      setError(undefined);

      // Execute API call
      await apiCall();

      if (signal.aborted) {
        return;
      }

      // Record successful interaction
      const interaction: ProfileInteraction = {
        type,
        targetDid,
        timestamp: new Date().toISOString(),
        success: true,
      };

      interactionHistoryRef.current.push(interaction);

      // Keep only last 100 interactions
      if (interactionHistoryRef.current.length > 100) {
        interactionHistoryRef.current = interactionHistoryRef.current.slice(-100);
      }

      // Dispatch custom event for other components to listen
      window.dispatchEvent(new CustomEvent('profileInteraction', {
        detail: { interaction, additionalData }
      }));

    } catch (err: any) {
      if (err.name === 'AbortError') {
        return;
      }

      const errorMessage = err.message || `Failed to ${type} profile`;
      setError(errorMessage);

      // Record failed interaction
      const interaction: ProfileInteraction = {
        type,
        targetDid,
        timestamp: new Date().toISOString(),
        success: false,
        error: errorMessage,
      };

      interactionHistoryRef.current.push(interaction);
      
      console.error(`Profile ${type} error:`, err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Follow a profile
   */
  const follow = useCallback(async (did: string): Promise<void> => {
    await handleInteraction(
      'follow',
      did,
      () => defaultApiClient.follow(did)
    );
  }, [handleInteraction]);

  /**
   * Unfollow a profile
   */
  const unfollow = useCallback(async (did: string): Promise<void> => {
    await handleInteraction(
      'unfollow',
      did,
      () => defaultApiClient.deleteFollow(did)
    );
  }, [handleInteraction]);

  /**
   * Block a profile
   */
  const block = useCallback(async (did: string): Promise<void> => {
    await handleInteraction(
      'block',
      did,
      () => defaultApiClient.block(did)
    );
  }, [handleInteraction]);

  /**
   * Unblock a profile
   */
  const unblock = useCallback(async (did: string): Promise<void> => {
    await handleInteraction(
      'unblock',
      did,
      () => defaultApiClient.deleteBlock(did)
    );
  }, [handleInteraction]);

  /**
   * Mute a profile
   */
  const mute = useCallback(async (did: string): Promise<void> => {
    await handleInteraction(
      'mute',
      did,
      () => defaultApiClient.mute(did)
    );
  }, [handleInteraction]);

  /**
   * Unmute a profile
   */
  const unmute = useCallback(async (did: string): Promise<void> => {
    await handleInteraction(
      'unmute',
      did,
      () => defaultApiClient.deleteMute(did)
    );
  }, [handleInteraction]);

  /**
   * Report a profile
   */
  const report = useCallback(async (did: string, reason: string): Promise<void> => {
    if (!reason.trim()) {
      throw new Error('Report reason is required');
    }

    await handleInteraction(
      'report',
      did,
      () => defaultApiClient.createReport({
        reasonType: 'com.atproto.moderation.defs#reasonOther',
        reason: reason.trim(),
        subject: {
          $type: 'com.atproto.admin.defs#repoRef',
          did,
        },
      }),
      { reason }
    );
  }, [handleInteraction]);

  return {
    follow,
    unfollow,
    block,
    unblock,
    mute,
    unmute,
    report,
    isLoading,
    error,
  };
}

export default useProfileActions;